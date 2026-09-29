import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleAlert, CircleCheck, SkipForward, PlusCircle } from "lucide-react";
import type { Mistake } from "@/lib/engine";

const KIND_LABEL: Record<Mistake["kind"], string> = {
  skipped: "Mot sauté",
  extra: "Mot en trop",
  wrong: "Mot erroné",
};

const KIND_ICON = {
  skipped: SkipForward,
  extra: PlusCircle,
  wrong: CircleAlert,
} as const;

const KIND_CLASS: Record<Mistake["kind"], string> = {
  skipped: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  extra: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  wrong: "bg-red-500/15 text-red-800 dark:text-red-300",
};

interface Props {
  mistakes: Mistake[];
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function MistakePanel({ mistakes }: Props) {
  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CircleCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm text-muted-foreground">
          Aucune erreur détectée pour l'instant.
        </p>
      </div>
    );
  }
  return (
    <ScrollArea className="h-56">
      <ul className="space-y-2 pe-3">
        {mistakes.map((m, i) => {
          const Icon = KIND_ICON[m.kind];
          return (
            <li
              key={`${m.wordIndex}-${m.atMs}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className={`rounded-md p-1 ${KIND_CLASS[m.kind]}`}>
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">
                    {KIND_LABEL[m.kind]} · ayah {m.ayah}
                  </span>
                  <span className="font-arabic block truncate text-sm text-muted-foreground">
                    {m.expected ? `${m.expected}${m.heard ? ` — entendu : ${m.heard}` : ""}` : `entendu : ${m.heard ?? "?"}`}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {fmt(m.atMs)}
              </span>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}

export function MistakeBadge({ count }: { count: number }) {
  return (
    <Badge variant={count > 0 ? "destructive" : "secondary"} className="gap-1">
      <CircleAlert className="size-3" />
      {count}
    </Badge>
  );
}
