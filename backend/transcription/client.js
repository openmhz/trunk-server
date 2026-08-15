/**
 * Talking to the whisper service.
 *
 * Uses only what is already installed: Node 22's built-in fetch, FormData and
 * Blob. Adding a HTTP or multipart library would mean regenerating
 * backend/package-lock.json, and npm ci fails the build on any disagreement
 * between the lock and package.json - a real cost for no benefit here.
 *
 * The important thing this module does is classify failures. The worker's retry
 * behaviour depends entirely on knowing whether an error is worth trying again.
 */
const WHISPER_URL = process.env['WHISPER_URL'] ?? 'http://whisper:9000';
// Generous: a 300 s call takes ~96 s of compute on one thread, and it may be
// queued behind another. Well short of leaving a claim to expire at 10 minutes.
const REQUEST_TIMEOUT_MS = parseInt(process.env['TRANSCRIBE_TIMEOUT_MS'] ?? '300000', 10);

/**
 * A failure the worker should give up on, as opposed to one worth retrying.
 * Carried as a flag rather than an error subclass so the worker can branch on
 * it without instanceof checks across module boundaries.
 */
class TranscribeError extends Error {
  constructor(message, { terminal = false, unreachable = false } = {}) {
    super(message);
    this.name = 'TranscribeError';
    // Give up: retrying cannot change the answer.
    this.terminal = terminal;
    // We never got a response at all, so nothing was learned about this
    // particular audio. The worker refunds the attempt for these - otherwise a
    // whisper outage burns through every call's retry budget and marks calls
    // failed for a problem that had nothing to do with them.
    this.unreachable = unreachable;
  }
}

/**
 * @param audio    Buffer of m4a/mp3 bytes
 * @param filename used only so the service sees a sensible extension
 * @param prompt   optional initial_prompt, to prime domain vocabulary
 * @returns the service's JSON result
 * @throws TranscribeError - check .terminal
 */
async function transcribe(audio, filename, prompt) {
  const form = new FormData();
  form.append('file', new Blob([audio]), filename);
  if (prompt) form.append('prompt', prompt);

  let response;
  try {
    response = await fetch(`${WHISPER_URL}/transcribe`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Connection refused, DNS failure, timeout - the service is down or busy,
    // not the audio's fault. Always worth retrying, and it should not count
    // against this call's attempts.
    throw new TranscribeError(`whisper unreachable: ${err.message}`, { terminal: false, unreachable: true });
  }

  if (response.ok) {
    return await response.json();
  }

  const detail = await response.text().catch(() => '');

  // 400 undecodable and 413 too long are properties of this specific audio.
  // Retrying cannot change the answer, so the call is marked failed and left
  // alone rather than burning its attempt budget.
  if (response.status === 400 || response.status === 413) {
    throw new TranscribeError(`whisper rejected the audio (${response.status}): ${detail.slice(0, 200)}`, { terminal: true });
  }

  // 503 busy, 5xx, anything else - transient.
  throw new TranscribeError(`whisper error ${response.status}: ${detail.slice(0, 200)}`, { terminal: false });
}

async function healthy() {
  try {
    const response = await fetch(`${WHISPER_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const body = await response.json();
    return !!body.ok && !!body.warm;
  } catch {
    return false;
  }
}

module.exports = { transcribe, healthy, TranscribeError, WHISPER_URL };
