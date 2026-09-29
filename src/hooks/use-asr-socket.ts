import { useCallback, useEffect, useRef, useState } from "react";

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type TranscriptChunk = {
  seq: number;
  text: string;
};

type Options = {
  url?: string;
  onChunk: (chunk: TranscriptChunk) => void;
  onStatus?: (s: WsStatus) => void;
};

/**
 * WebSocket client for the ASR backend. `sendAudio` ships 16 kHz Float32 PCM;
 * the backend answers with `{ type: "chunk", seq, text }` messages.
 * URL comes from VITE_ASR_WS (e.g. ws://localhost:8000/asr).
 */
export function useAsrSocket({ url, onChunk, onStatus }: Options) {
  const [status, setStatus] = useState<WsStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<Float32Array[]>([]);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  const effectiveUrl =
    url ??
    (import.meta.env.VITE_ASR_WS as string | undefined) ??
    "ws://localhost:8000/asr";

  useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    setStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(effectiveUrl);
    } catch {
      setStatus("error");
      return;
    }
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      setStatus("open");
      // Flush queued audio collected while the socket was opening.
      const q = queueRef.current;
      queueRef.current = [];
      for (const payload of q) ws.send(payload.buffer);
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as {
          type: string;
          seq?: number;
          text?: string;
        };
        if (msg.type === "chunk") {
          onChunkRef.current({ seq: msg.seq ?? 0, text: msg.text ?? "" });
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onerror = () => setStatus("error");
    ws.onclose = () => {
      setStatus((s) => (s === "error" ? s : "closed"));
      wsRef.current = null;
    };
  }, [effectiveUrl]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    queueRef.current = [];
    setStatus("closed");
  }, []);

  const sendAudio = useCallback((samples: Float32Array, seq: number) => {
    // Header: little-endian int32 seq, then float32 samples.
    const header = new DataView(new ArrayBuffer(4));
    header.setInt32(0, seq, true);
    const payload = new Uint8Array(4 + samples.length * 4);
    payload.set(new Uint8Array(header.buffer), 0);
    payload.set(new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength), 4);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    } else {
      queueRef.current.push(samples);
    }
  }, []);

  const sendJson = useCallback((obj: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }, []);

  useEffect(() => () => wsRef.current?.close(), []);

  return { status, connect, disconnect, sendAudio, sendJson };
}
