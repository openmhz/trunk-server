# Speech-to-text for call audio.
#
# Deliberately a separate image from the node services: different language,
# different dependency tooling, and it must be restartable without touching
# ingest or the read API.
FROM python:3.12-slim

# ffmpeg decodes the .m4a trunk-recorder uploads. faster-whisper can do this
# itself through PyAV, but an explicit subprocess is deterministic, gives a
# clean error on corrupt input, and ffmpeg is a known quantity here - the
# backend image already installs it.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Bake the model into the image rather than downloading at runtime. A droplet
# reboot must not depend on huggingface.co being reachable, and a first-boot
# download would mean the first calls after every deploy fail. Costs ~250 MB.
#
# Not a bind-mounted model directory: that recreates the anonymous-volume
# staleness trap documented in CLAUDE.md, where a rebuilt image keeps serving
# the first build's contents.
ARG WHISPER_MODEL=small.en
ENV HF_HOME=/models
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('Systran/faster-whisper-${WHISPER_MODEL}')"

# Once the model is baked in, never reach for the network again. If the model
# name and the baked model ever disagree, fail loudly at startup instead of
# silently downloading a different one.
ENV HF_HUB_OFFLINE=1
ENV WHISPER_MODEL=${WHISPER_MODEL}

COPY app.py ./

EXPOSE 9000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000", "--workers", "1"]
