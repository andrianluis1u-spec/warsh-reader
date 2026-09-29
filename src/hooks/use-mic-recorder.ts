import { useCallback, useEffect, useRef, useState } from "react";

export interface RecorderStatus {
  idle: "idle";
  recording: "recording";
  error: "error";
}

export type RecorderState = {
  status: RecorderStatus[keyof RecorderStatus] | "error";
  level: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
};

interface Options {
  /** Called with 16 kHz mono Float32 samples for each 2–5 s overlapping chunk. */
  onChunk: (samples: Float32Array, seq: number) => void;
  chunkSeconds?: number;
  overlapSeconds?: number;
}

const TARGET_RATE = 16000;

/**
 * Mic capture via Web Audio API: AudioWorklet-free classic ScriptProcessor
 * fallback path (works everywhere), downsampling to 16 kHz mono, emitting
 * overlapping chunks of `chunkSeconds` with `overlapSeconds` re-sent at the
 * start of the next chunk so Whisper keeps context across cuts.
 */
export function useMicRecorder({ onChunk, chunkSeconds = 4, overlapSeconds = 1.5 }: Options): RecorderState {
  const [status, setStatus] = useState<RecorderState["status"]>("idle");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const bufRef = useRef<Float32Array[]>([]);
  const bufLenRef = useRef(0);
  const chunkSeqRef = useRef(0);
  const tailRef = useRef<Float32Array | null>(null);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  const downsample = useCallback((input: Float32Array, from: number): Float32Array => {
    if (from === TARGET_RATE) return input;
    const ratio = from / TARGET_RATE;
    const outLen = Math.floor(input.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(Math.floor((i + 1) * ratio), input.length);
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j];
      out[i] = sum / Math.max(1, end - start);
    }
    return out;
  }, []);

  const stop = useCallback(() => {
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      void ctxRef.current.close();
    }
    ctxRef.current = null;
    bufRef.current = [];
    bufLenRef.current = 0;
    tailRef.current = null;
    setStatus("idle");
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;

      node.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        // RMS level for the UI meter.
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        setLevel(Math.min(1, Math.sqrt(sum / input.length) * 4));

        const ds = downsample(input, ctx.sampleRate);
        bufRef.current.push(ds);
        bufLenRef.current += ds.length;
        const chunkLen = Math.floor(chunkSeconds * TARGET_RATE);
        if (bufLenRef.current >= chunkLen) {
          const merged = new Float32Array(bufLenRef.current);
          let off = 0;
          for (const part of bufRef.current) {
            merged.set(part, off);
            off += part.length;
          }
          bufRef.current = [];
          bufLenRef.current = 0;

          // Prepend the overlap tail from the previous chunk.
          let payload = merged;
          if (tailRef.current) {
            payload = new Float32Array(tailRef.current.length + merged.length);
            payload.set(tailRef.current, 0);
            payload.set(merged, tailRef.current.length);
          }
          const overlapLen = Math.floor(overlapSeconds * TARGET_RATE);
          tailRef.current = merged.slice(Math.max(0, merged.length - overlapLen));
          onChunkRef.current(payload, ++chunkSeqRef.current);
        }
      };
      source.connect(node);
      // Mute the processing output; we only consume input.
      const sink = ctx.createGain();
      sink.gain.value = 0;
      node.connect(sink);
      sink.connect(ctx.destination);
      setStatus("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accès micro impossible");
      setStatus("error");
    }
  }, [chunkSeconds, downsample, overlapSeconds]);

  useEffect(() => () => stop(), [stop]);

  return { status, level, error, start, stop };
}
