import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SurahPicker, type Selection } from "@/components/recitation/SurahPicker";
import { Reader } from "@/components/recitation/Reader";
import { MistakePanel, MistakeBadge } from "@/components/recitation/MistakePanel";
import { SessionSummary } from "@/components/recitation/SessionSummary";
import { SourceControls, type AsrSource } from "@/components/recitation/SourceControls";
import { RecitationEngine, type Mistake, type WordStatus } from "@/lib/engine";
import { fetchChapter, sliceRange, surahList } from "@/lib/quran";
import { saveSession } from "@/lib/history";
import { useMicRecorder } from "@/hooks/use-mic-recorder";
import { useAsrSocket } from "@/hooks/use-asr-socket";
import { useBrowserSpeech } from "@/hooks/use-browser-speech";
import { useNavigate } from "react-router";
import {
  History,
  Mic,
  MicOff,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Radio,
  RotateCcw,
  Volume2,
} from "lucide-react";

type Mode = "follow" | "memorize";

interface Props {
  onOpenSummary?: () => void;
}

export default function Recite({ onOpenSummary }: Props = {}) {
  const navigate = useNavigate();
  const [selection, setSelection] = useState<Selection>({ surah: 1 });
  const [verses, setVerses] = useState<import("@/lib/quran").WarshChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<RecitationEngine | null>(null);
  const [tick, setTick] = useState(0);

  const [mode, setMode] = useState<Mode>("follow");
  const [peek, setPeek] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [running, setRunning] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [source, setSource] = useState<AsrSource>("auto");
  const [demoOn, setDemoOn] = useState(false);
  const runningRef = useRef(false);

  // Load chapter data.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchChapter(selection.surah)
      .then((ch) => {
        if (cancelled) return;
        setVerses(ch);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selection.surah]);

  const activeVerses = useMemo(
    () => (verses ? sliceRange(verses, selection.from, selection.to) : []),
    [verses, selection.from, selection.to],
  );

  // (Re)build engine when the verse range changes.
  useEffect(() => {
    if (activeVerses.length === 0) return;
    engineRef.current = new RecitationEngine(activeVerses);
    engineRef.current.reset();
    setTick((t) => t + 1);
  }, [activeVerses]);

  const pushUpdate = useCallback(() => setTick((t) => t + 1), []);

  const handleChunk = useCallback(
    (seq: number, text: string) => {
      const engine = engineRef.current;
      if (!engine || !runningRef.current) return;
      const words = text.split(/\s+/).filter(Boolean);
      engine.mergeChunk(words);
      pushUpdate();
    },
    [pushUpdate],
  );

  const handleBrowserWords = useCallback(
    (words: string[]) => {
      const engine = engineRef.current;
      if (!engine || !runningRef.current) return;
      engine.appendWords(words);
      pushUpdate();
    },
    [pushUpdate],
  );

  const { status: wsStatus, connect, disconnect, sendAudio } = useAsrSocket({
    onChunk: (c) => handleChunk(c.seq, c.text),
  });

  const browserSpeech = useBrowserSpeech(handleBrowserWords);

  const onChunkRef = useRef<(s: Float32Array, seq: number) => void>(sendAudio);
  onChunkRef.current = sendAudio;

  const recorder = useMicRecorder({
    onChunk: (samples, seq) => onChunkRef.current(samples, seq),
  });

  const startSession = async () => {
    if (activeVerses.length === 0) return;
    engineRef.current?.reset();
    setTick((t) => t + 1);
    setSummaryOpen(false);
    runningRef.current = true;
    if (source === "demo") {
      setDemoOn(true);
      setRunning(true);
      return;
    }
    connect();
    await recorder.start();
    browserSpeech.start();
    setRunning(true);
  };

  const stopSession = () => {
    runningRef.current = false;
    setRunning(false);
    setDemoOn(false);
    recorder.stop();
    browserSpeech.stop();
    disconnect();
    // Persist the session locally (localStorage) for the history page.
    const engine = engineRef.current;
    if (engine && engine.totalWords > 0 && (engine.position > 0 || engine.mistakeList.length > 0)) {
      const first = activeVerses[0];
      const last = activeVerses[activeVerses.length - 1];
      saveSession({
        surah: selection.surah,
        surahName: surahList().find((s) => s.number === selection.surah)?.nameFr ?? `Sourate ${selection.surah}`,
        fromAyah: first?.verse ?? 1,
        toAyah: last?.verse ?? first?.verse ?? 1,
        accuracy: engine.accuracy,
        wordsRecited: engine.position,
        totalWords: engine.totalWords,
        mistakes: engine.mistakeList.length,
        durationMs: engine.elapsedMs(),
      });
    }
    setSummaryOpen(true);
  };

  const restart = () => {
    engineRef.current?.reset();
    setTick((t) => t + 1);
    setSummaryOpen(false);
  };

  const engine = engineRef.current;
  const ayahStates: WordStatus[][] = engine ? engine.ayahStates.map((a) => a.words) : [];
  const progress = engine && engine.totalWords > 0 ? (engine.position / engine.totalWords) * 100 : 0;
  const reachedEnd = engine ? engine.position >= engine.totalWords : false;

  // Demo mode: reveal ~2 words per second by simulating perfect recitation.
  useEffect(() => {
    if (!demoOn || !engineRef.current) return;
    const id = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const next = engine.nextExpected;
      if (!next) return;
      engine.appendWords([next]);
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(id);
  }, [demoOn]);

  useEffect(() => {
    if (running && reachedEnd && engine && engine.totalWords > 0) {
      // Auto-stop at the end of the range.
      const t = setTimeout(() => stopSession(), 1200);
      return () => clearTimeout(t);
    }
  }, [running, reachedEnd, engine]);

  const surahAyahCount = verses?.verses.length ?? undefined;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Session de récitation</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {verses ? `Sourate ${selection.surah}` : "Chargement…"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Radio className={`size-3.5 ${wsStatus === "open" ? "text-emerald-500" : "text-muted-foreground"}`} />
              ASR {wsStatus === "open" ? "connecté" : wsStatus === "connecting" ? "…" : "hors ligne"}
            </Badge>
            <MistakeBadge count={engine?.mistakeList.length ?? 0} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("/dashboard")}
            >
              <History className="size-3.5" />
              Historique
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar: picker + controls */}
          <aside className="flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sourate & versets</CardTitle>
                <CardDescription>
                  Texte Warsh — 6 214 ayat, numérotation Nafiʿ.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SurahPicker
                  value={selection}
                  onChange={setSelection}
                  ayahCount={surahAyahCount}
                  loading={loading}
                  disabled={running}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mode</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <SourceControls
                  value={source}
                  onChange={setSource}
                  wsStatus={wsStatus}
                  browserStatus={browserSpeech.status}
                  disabled={running}
                />
                <Separator />
                <div className="flex items-center justify-between">
                  <label htmlFor="mode-mem" className="flex items-center gap-2 text-sm font-medium">
                    {mode === "memorize" ? <EyeOff className="size-4" /> : <BookOpen className="size-4" />}
                    Mémorisation
                  </label>
                  <Switch
                    id="mode-mem"
                    checked={mode === "memorize"}
                    onCheckedChange={(v) => setMode(v ? "memorize" : "follow")}
                    disabled={running}
                  />
                </div>
                {mode === "memorize" && (
                  <Button variant="secondary" className="gap-2" onClick={() => setPeek((p) => !p)} disabled={running}>
                    {peek ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    {peek ? "Masquer" : "Jeter un œil"}
                  </Button>
                )}
                <Separator />
                <Button
                  className="h-12 gap-2 text-base"
                  onClick={running ? stopSession : startSession}
                  disabled={loading || activeVerses.length === 0 || recorder.status === "error"}
                >
                  {running ? (
                    <>
                      <MicOff className="size-5" /> Arrêter
                    </>
                  ) : wsStatus === "connecting" ? (
                    <>
                      <Loader2 className="size-5 animate-spin" /> Connexion ASR…
                    </>
                  ) : (
                    <>
                      <Mic className="size-5" /> Démarrer la récitation
                    </>
                  )}
                </Button>
                {recorder.status === "error" && (
                  <p className="text-xs text-destructive">{recorder.error}</p>
                )}
                {recorder.status === "recording" && (
                  <div className="flex h-6 items-end justify-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="rec-wave w-1.5 rounded-full bg-emerald-500/80"
                        style={{ height: `${8 + recorder.level * 16 + (i % 2) * 4}px`, animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Reader */}
          <section className="flex flex-col gap-6">
            <Card className="border-border/70">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">
                    {activeVerses.length > 0
                      ? `${activeVerses[0].chapter}:${activeVerses[0].verse}–${activeVerses[activeVerses.length - 1].verse}`
                      : "—"}
                  </CardTitle>
                  <CardDescription>
                    {mode === "memorize"
                      ? "Les mots s'affichent à mesure que vous les récitez."
                      : "Suivi en temps réel — vert : récité, rouge : erreur."}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowTranscript((s) => !s)} title="Transcription ASR">
                  <Volume2 className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Progress value={progress} className="h-1.5" />
                {error ? (
                  <p className="py-10 text-center text-sm text-destructive">{error}</p>
                ) : (
                  <Reader
                    verses={activeVerses}
                    ayahStates={ayahStates}
                    cursor={engine?.position}
                    memorize={mode === "memorize"}
                    peek={peek}
                  />
                )}
              </CardContent>
            </Card>

            {showTranscript && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Transcription en direct</CardTitle>
                </CardHeader>
                <CardContent>
                  <p dir="rtl" className="font-arabic min-h-8 text-lg leading-relaxed text-muted-foreground">
                    {engine?.lastHeard.join(" ") || "…"}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Erreurs détectées</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={restart}>
                  <RotateCcw className="size-3.5" /> Réinitialiser
                </Button>
                {onOpenSummary && (
                  <Button variant="outline" size="sm" onClick={onOpenSummary}>
                    Résumé
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <MistakePanel mistakes={(engine?.mistakeList ?? []) as Mistake[]} />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <SessionSummary
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        accuracy={engine?.accuracy ?? 100}
        wordsRecited={engine?.position ?? 0}
        totalWords={engine?.totalWords ?? 0}
        mistakes={(engine?.mistakeList ?? []) as Mistake[]}
        onRestart={restart}
      />
      {/* keep tick referenced for re-render freshness */}
      <span className="hidden">{tick}</span>
    </main>
  );
}
