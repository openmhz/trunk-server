"""
Speech-to-text for call audio.

One job: take an audio file, return text. It knows nothing about users, plans,
calls or mongo - the caller owns all of that. There is deliberately no
authentication here, which is why this service must stay on the internal
network with no published port and no nginx vhost.

The hard problem is not accuracy, it is *hallucination*. Whisper's
characteristic failure on non-speech is confident, fluent nonsense - squelch
tails and courtesy tones become "Thank you." or "Subtitles by the Amara.org
community". On a feature people pay for, a wrong transcript is worse than no
transcript, so most of the configuration below exists to make this service
return nothing rather than return garbage.
"""
import asyncio
import logging
import os
import re
import subprocess
import time

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("whisper")

MODEL_NAME = os.environ.get("WHISPER_MODEL", "small.en")
SAMPLE_RATE = 16000
# Bounds the worst case: one absurd upload cannot occupy the model for minutes
# while everything else queues behind it. Well clear of trunk-recorder's own
# 300 s ceiling - a full-length call decodes to ~300.5 s, so a limit of exactly
# 300 rejected the longest legitimate calls.
MAX_SECONDS = float(os.environ.get("WHISPER_MAX_SECONDS", "600"))
# Below this there is nothing to transcribe - trunk-recorder emits sub-second
# files for kerchunks.
MIN_SECONDS = float(os.environ.get("WHISPER_MIN_SECONDS", "0.6"))
# Segments the model is not confident about are dropped rather than shown.
MIN_AVG_LOGPROB = float(os.environ.get("WHISPER_MIN_AVG_LOGPROB", "-1.0"))

# Primes the decoder with the vocabulary of the domain. Ham radio is full of
# terms a general model will otherwise mangle, and this measurably helps on
# short transmissions.
DEFAULT_PROMPT = os.environ.get(
    "WHISPER_PROMPT",
    "Amateur radio repeater traffic. Callsigns, 73, QSL, QSY, QTH, simplex, "
    "monitoring, net control, repeater, standing by.",
)

# Whisper's stock hallucinations on silence. Matched against the *whole*
# transcript only: "thank you" mid-conversation is real speech, but a call whose
# entire content is "Thank you." is a squelch tail every time.
HALLUCINATIONS = {
    "thank you", "thanks for watching", "thanks for watching!",
    "subtitles by the amara.org community", "subtitles by the amara org community",
    "www.youtube.com", "you", "bye", "bye.", "thank you.", "thank you very much",
    "please subscribe", "copyright", "the end", "okay", "oh",
}

app = FastAPI(title="hamrecorder whisper")

model: WhisperModel | None = None
warm = False
# One model, one inference at a time. Two concurrent transcriptions each
# spawning N OpenMP threads is strictly slower than doing them in turn.
inference_lock = asyncio.Semaphore(1)


def available_cpus() -> int:
    """How many cores this container may actually use.

    os.cpu_count() reports the *host's* cores, not the cgroup limit, so on a
    container capped at 1.5 CPUs it returns 6 and we spawn 6 OpenMP threads to
    fight over one and a half cores. That thrashing made a 6-second clip take
    70 seconds. Read the cgroup quota instead and only fall back to the host
    count when there is no limit set.
    """
    override = os.environ.get("WHISPER_THREADS")
    if override:
        return max(1, int(override))
    try:
        with open("/sys/fs/cgroup/cpu.max") as handle:      # cgroup v2
            quota, period = handle.read().split()
            if quota != "max":
                return max(1, int(float(quota) / float(period)))
    except (OSError, ValueError):
        pass
    return max(1, (os.cpu_count() or 2) - 1)


@app.on_event("startup")
def load_model() -> None:
    global model, warm
    threads = available_cpus()
    log.info("loading model=%s int8 threads=%d", MODEL_NAME, threads)
    started = time.monotonic()
    model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8", cpu_threads=threads)
    log.info("model loaded in %.1fs", time.monotonic() - started)

    # First inference is several times slower than the rest. Do it here on
    # silence so a real call never pays for it, and only report healthy after.
    list(model.transcribe(np.zeros(SAMPLE_RATE, dtype=np.float32), beam_size=1)[0])
    warm = True
    log.info("warm")


def decode(audio: bytes) -> np.ndarray:
    """m4a/mp3 bytes -> mono float32 at 16 kHz, via ffmpeg.

    Raises ValueError when the input is not decodable, which the caller turns
    into a terminal (non-retryable) response.
    """
    proc = subprocess.run(
        ["ffmpeg", "-nostdin", "-threads", "1", "-i", "pipe:0",
         "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "pipe:1"],
        input=audio, capture_output=True,
    )
    if proc.returncode != 0 or not proc.stdout:
        tail = proc.stderr.decode("utf-8", "replace").strip().splitlines()[-1:] or [""]
        raise ValueError(tail[0][:200])
    return np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def is_hallucination(text: str) -> bool:
    normalized = re.sub(r"[^a-z0-9. ]", "", text.strip().lower()).strip()
    return normalized in HALLUCINATIONS or normalized.rstrip(".") in HALLUCINATIONS


# Words too common to count as evidence that anything was actually said.
STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "this", "that",
    "we", "you", "i", "on", "at", "for", "with", "so", "up", "out", "here",
}


def _stem(word: str) -> str:
    """Crude suffix strip, enough to tie "standing" to "stand"."""
    for suffix in ("ing", "ed", "s"):
        if len(word) > 4 and word.endswith(suffix):
            return word[: -len(suffix)]
    return word


def _content_words(text: str) -> list[str]:
    return [_stem(w) for w in re.findall(r"[a-z0-9]+", text.lower())]


def is_prompt_echo(text: str, prompt: str) -> bool:
    """Did the model just read the prompt back to us?

    Whisper's other failure on non-speech, and the one that actually bites here:
    given audio with nothing recognisable in it, it emits the initial_prompt
    instead of emitting nothing. Every repeater CW ident came back as
    "Callsigns, 73, QSL, simplex, monitoring, net control, stand by." - which is
    this service's own prompt, not anything anyone said.

    The test is whether the output contains a single content word that is not in
    the prompt. Real speech essentially always does: a callsign, a name, a
    subject. "Welcome to the N6NA repeater system" survives on "welcome" and
    "n6na"; "W6VVR repeater" survives on the callsign. An over consisting only
    of prompt vocabulary is indistinguishable from an echo, and is not worth
    showing either way.
    """
    words = _content_words(text)
    if not words:
        return False
    known = set(_content_words(prompt)) | STOPWORDS
    return not any(word not in known for word in words)


@app.get("/healthz")
def healthz():
    return {"ok": model is not None, "model": MODEL_NAME, "warm": warm}


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    prompt: str | None = Form(None),
    language: str = Form("en"),
):
    if model is None:
        return JSONResponse({"error": "loading"}, status_code=503)

    raw = await file.read()

    try:
        samples = decode(raw)
    except ValueError as err:
        log.warning("undecodable input: %s", err)
        return JSONResponse({"error": "undecodable", "detail": str(err)}, status_code=400)

    duration = len(samples) / SAMPLE_RATE
    if duration > MAX_SECONDS:
        return JSONResponse({"error": "too long", "duration": duration}, status_code=413)
    if duration < MIN_SECONDS:
        # Not a failure - there is genuinely nothing here. Answering 200 with an
        # empty transcript means the caller marks it done rather than retrying.
        return empty_result(duration, 0)

    started = time.monotonic()
    async with inference_lock:
        segments, info = await asyncio.to_thread(run_model, samples, prompt, language)
    compute_ms = int((time.monotonic() - started) * 1000)

    kept = [s for s in segments if s["avgLogprob"] >= MIN_AVG_LOGPROB]
    text = " ".join(s["text"] for s in kept).strip()

    active_prompt = prompt or DEFAULT_PROMPT

    if text and is_hallucination(text):
        log.info("dropped hallucination: %r (%.1fs audio)", text, duration)
        kept, text = [], ""
    elif text and is_prompt_echo(text, active_prompt):
        # Almost always a CW ident: a repeater keying its callsign in morse,
        # which carries no speech for the model to find. Decoding morse is a
        # different problem and not one this service pretends to solve.
        log.info("dropped prompt echo: %r (%.1fs audio)", text, duration)
        kept, text = [], ""

    log.info("%.1fs audio -> %dms, %d segments, %d chars",
             duration, compute_ms, len(kept), len(text))

    return {
        "text": text,
        "segments": kept,
        "language": getattr(info, "language", language),
        "duration": round(duration, 2),
        "noSpeech": text == "",
        "model": MODEL_NAME,
        "engine": "faster-whisper",
        "computeMs": compute_ms,
    }


def run_model(samples, prompt, language):
    segments, info = model.transcribe(
        samples,
        language=language,
        initial_prompt=prompt or DEFAULT_PROMPT,
        beam_size=5,
        # Voice activity detection, the single most important setting here. It
        # removes non-speech before the decoder ever sees it, which is what
        # stops squelch tails becoming sentences.
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 300, "speech_pad_ms": 200},
        # Without this one bad segment poisons the rest: the model conditions on
        # its own previous output and loops, repeating a phrase for the whole
        # clip. Costs a little coherence on long audio; these are seconds long.
        condition_on_previous_text=False,
        no_speech_threshold=0.6,
        log_prob_threshold=-1.0,
        compression_ratio_threshold=2.4,
        # Runaway-decode guards. Without these the decoder can lock into a
        # repetition loop on noise and run to the token limit - one 6.5 second
        # clip took 70 seconds and produced nothing usable. These stop the loop
        # forming rather than waiting for a threshold to reject it afterwards.
        repetition_penalty=1.1,
        no_repeat_ngram_size=3,
    )
    out = [
        {
            "start": round(s.start, 2),
            "end": round(s.end, 2),
            "text": s.text.strip(),
            "avgLogprob": round(s.avg_logprob, 3),
        }
        for s in segments
    ]
    return out, info


def empty_result(duration: float, compute_ms: int):
    return {
        "text": "", "segments": [], "language": "en",
        "duration": round(duration, 2), "noSpeech": True,
        "model": MODEL_NAME, "engine": "faster-whisper", "computeMs": compute_ms,
    }
