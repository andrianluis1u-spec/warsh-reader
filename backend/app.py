"""Tarteel Warsh — ASR backend.

WebSocket ASR service for the Warsh recitation trainer.

Client -> server: binary frames [int32 seq (LE) | float32 PCM mono 16 kHz].
Server -> client: JSON messages {"type": "chunk", "seq": N, "text": "..."}.

Model: benhadjermed/tahkik-small-warsh (Whisper-small fine-tuned on Warsh
recitation, Apache-2.0). Loads via faster-whisper when the repo carries CTranslate2
weights, otherwise falls back to transformers WhisperForConditionalGeneration.

Run:  uvicorn app:app --host 0.0.0.0 --port 8000  (see ../README.md)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import struct
from typing import Optional

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

MODEL_ID = os.environ.get("ASR_MODEL", "benhadjermed/tahkik-small-warsh")
DEVICE = os.environ.get("ASR_DEVICE", "auto")  # auto | cuda | cpu
COMPUTE_TYPE = os.environ.get("ASR_COMPUTE_TYPE", "auto")  # e.g. float16 on GPU
SAMPLE_RATE = 16000

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("warsh-asr")

app = FastAPI(title="Tarteel Warsh ASR", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev convenience; restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Loaded lazily on first connection so `uvicorn app:app` starts instantly.
_asr = None
_asr_lock = asyncio.Lock()


class WhisperHF:
    """transformers fallback (works on CPU and CUDA)."""

    def __init__(self) -> None:
        import torch
        from transformers import WhisperForConditionalGeneration, WhisperProcessor

        self.torch = torch
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = WhisperProcessor.from_pretrained(MODEL_ID)
        self.model = WhisperForConditionalGeneration.from_pretrained(
            MODEL_ID, torch_dtype=dtype
        ).to(device)
        self.model.eval()
        self.device = device
        log.info("transformers Whisper loaded on %s (%s)", device, MODEL_ID)

    def transcribe(self, audio: np.ndarray) -> str:
        import torch

        inputs = self.processor(
            audio, sampling_rate=SAMPLE_RATE, return_tensors="pt"
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        if self.device == "cuda":
            inputs = {k: v.half() if v.dtype.is_floating_point else v for k, v in inputs.items()}
        with torch.no_grad():
            ids = self.model.generate(inputs["input_features"], max_new_tokens=160)
        return self.processor.batch_decode(ids, skip_special_tokens=True)[0].strip()


class WhisperCT2:
    """faster-whisper path — significantly faster on CPU and GPU."""

    def __init__(self) -> None:
        from faster_whisper import WhisperModel

        device = DEVICE
        if device == "auto":
            try:
                import ctranslate2

                device = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
            except Exception:
                device = "cpu"
        compute = COMPUTE_TYPE
        if compute == "auto":
            compute = "float16" if device == "cuda" else "int8"
        self.model = WhisperModel(MODEL_ID, device=device, compute_type=compute)
        log.info("faster-whisper loaded on %s (%s, %s)", device, MODEL_ID, compute)

    def transcribe(self, audio: np.ndarray) -> str:
        segments, _ = self.model.transcribe(
            audio,
            language="ar",
            beam_size=1,
            vad_filter=False,
            without_timestamps=True,
        )
        return " ".join(s.text for s in segments).strip()


def _load_asr():
    global _asr
    with _asr_lock:
        if _asr is not None:
            return _asr
        try:
            _asr = WhisperCT2()
        except Exception as e:  # noqa: BLE001
            log.warning("faster-whisper unavailable (%s); using transformers", e)
            _asr = WhisperHF()
        return _asr


def parse_frame(data: bytes) -> tuple[int, np.ndarray]:
    """[int32 seq LE][float32 little-endian samples]."""
    (seq,) = struct.unpack("<i", data[:4])
    audio = np.frombuffer(data[4:], dtype="<f4").astype(np.float32)
    return seq, audio


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model": MODEL_ID,
        "asr_loaded": _asr is not None,
    }


@app.websocket("/asr")
async def asr(ws: WebSocket) -> None:
    await ws.accept()
    log.info("client connected")
    try:
        asr_engine = await asyncio.get_running_loop().run_in_executor(None, _load_asr)
        await ws.send_json({"type": "ready"})
        while True:
            data = await ws.receive_bytes()
            seq, audio = parse_frame(data)
            if audio.size == 0:
                await ws.send_json({"type": "chunk", "seq": seq, "text": ""})
                continue
            text = await asyncio.get_running_loop().run_in_executor(
                None, asr_engine.transcribe, audio
            )
            await ws.send_json({"type": "chunk", "seq": seq, "text": text})
    except WebSocketDisconnect:
        log.info("client disconnected")
    except Exception as e:  # noqa: BLE001
        log.exception("asr error: %s", e)
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:  # noqa: BLE001
            pass
    finally:
        try:
            await ws.close()
        except Exception:  # noqa: BLE001
            pass
