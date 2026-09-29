import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  clearHistory,
  deleteSession,
  formatDateTime,
  formatDuration,
  historyStats,
  loadSessions,
  type StoredSession,
} from "@/lib/history";
import {
  ArrowRight,
  BookOpenText,
  Gauge,
  History,
  Mic,
  Timer,
  Trash2,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StoredSession[]>(() => loadSessions());
  const stats = useMemo(() => historyStats(sessions), [sessions]);

  const handleDelete = (id: string) => setSessions(deleteSession(id));
  const handleClearAll = () => {
    clearHistory();
    setSessions([]);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="size-4" />
              Historique local — enregistré dans ce navigateur
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Vos sessions de récitation
            </h1>
          </div>
          <Button onClick={() => navigate("/recite")} className="gap-2 cursor-pointer">
            <Mic className="size-4" />
            Nouvelle récitation
          </Button>
        </header>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpenText, label: "Sessions", value: String(stats.count) },
            { icon: Gauge, label: "Précision moyenne", value: `${stats.avgAccuracy}%` },
            { icon: Trophy, label: "Meilleure précision", value: `${stats.bestAccuracy}%` },
            {
              icon: Timer,
              label: "Temps total",
              value: formatDuration(stats.totalMs),
            },
          ].map((s) => (
            <Card key={s.label} className="border-border/70">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <span>
                  <span className="block text-xl font-bold tabular-nums">{s.value}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Session list */}
        <Card className="border-border/70">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Sessions récentes</CardTitle>
              <CardDescription>
                {sessions.length === 0
                  ? "Aucune session pour l'instant — lancez votre première récitation."
                  : `${sessions.length} session${sessions.length > 1 ? "s" : ""} enregistrée${sessions.length > 1 ? "s" : ""} sur cet appareil.`}
              </CardDescription>
            </div>
            {sessions.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={handleClearAll}>
                <Trash2 className="size-3.5" />
                Tout effacer
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <BookOpenText className="size-10 text-muted-foreground/40" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  Terminez une récitation pour voir ici votre précision, vos
                  erreurs et votre progression.
                </p>
                <Button variant="secondary" className="gap-2" onClick={() => navigate("/recite")}>
                  Commencer
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[420px]">
                <ul className="space-y-2 pe-3">
                  {sessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          Sourate {s.surah} · {s.surahName}
                          <Badge variant="secondary" className="text-[10px]">
                            {s.fromAyah === s.toAyah
                              ? `ayah ${s.fromAyah}`
                              : `${s.fromAyah}–${s.toAyah}`}
                          </Badge>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(s.at)} · {formatDuration(s.durationMs)} ·{" "}
                          {s.wordsRecited}/{s.totalWords} mots · {s.mistakes} erreur
                          {s.mistakes > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-bold tabular-nums ${
                            s.accuracy >= 90
                              ? "text-emerald-600 dark:text-emerald-400"
                              : s.accuracy >= 70
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {s.accuracy}%
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(s.id)}
                          title="Supprimer cette session"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
