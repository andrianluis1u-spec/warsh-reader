# ASR backend (FastAPI)

WebSocket service that transcribes recitation audio with the Warsh-fine-tuned
Whisper model [`benhadjermed/tahkik-small-warsh`](https://huggingface.co/benhadjermed/tahkik-small-warsh)
(Apache-2.0).

## Protocol

- **Client → server**: binary frames `[int32 seq (little-endian)] + [float32 mono PCM @ 16 kHz]`
- **Server → client**: JSON `{"type": "ready"}`, then `{"type": "chunk", "seq": N, "text": "…"}` per frame.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

The first connection downloads the model (~250 MB for whisper-small) and warms
up; subsequent chunks transcribe in real time on most machines.

## GPU (optional)

- faster-whisper (default) auto-uses CUDA when available: install with
  `pip install nvidia-cublas-cu12 nvidia-cudnn-cu12==9.*` and set
  `ASR_DEVICE=cuda ASR_COMPUTE_TYPE=float16`.
- Force CPU: `ASR_DEVICE=cpu ASR_COMPUTE_TYPE=int8`.
- The transformers fallback (`ASR_BACKEND=hf`) also auto-detects CUDA.

Environment variables: `ASR_MODEL` (default `benhadjermed/tahkik-small-warsh`),
`ASR_DEVICE` (`auto|cuda|cpu`), `ASR_COMPUTE_TYPE` (`auto|float16|int8|…`).

## Frontend wiring

The frontend connects to `VITE_ASR_WS` (default `ws://localhost:8000/asr`).
For the browser preview (HTTPS), use an `https/ws` proxy or a tunnel that
upgrades `wss://` to this server.
