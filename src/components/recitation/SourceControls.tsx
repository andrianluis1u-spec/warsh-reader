import { Mic, Cpu, FlaskConical } from "lucide-react";

export type AsrSource = "auto" | "demo";

interface Props {
  value: AsrSource;
  onChange: (s: AsrSource) => void;
  wsStatus: string;
  browserStatus: string;
  disabled?: boolean;
}

export function SourceControls({ value, onChange, wsStatus, browserStatus, disabled }: Props) {
  const wsLabel =
    wsStatus === "open"
      ? "connecté"
      : wsStatus === "connecting"
        ? "…"
        : "hors ligne";
  const browserLabel =
    browserStatus === "listening"
      ? "actif"
      : browserStatus === "unsupported"
        ? "non supporté"
        : browserStatus === "error"
          ? "erreur"
          : "prêt";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Source de reconnaissance</p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            {
              id: "auto" as const,
              icon: value === "auto" && wsStatus === "open" ? Cpu : Mic,
              title: "Auto",
              desc:
                wsStatus === "open"
                  ? `Whisper ${wsLabel}`
                  : `Micro navigateur · ${browserLabel}`,
            },
            {
              id: "demo" as const,
              icon: FlaskConical,
              title: "Démo",
              desc: "Sans micro — simulation",
            },
          ]
        ).map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-colors ${
                active
                  ? "border-primary/50 bg-accent"
                  : "border-border/70 bg-card hover:bg-accent/40"
              } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4 text-primary" />
                {opt.title}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">{opt.desc}</span>
            </button>
          );
        })}
      </div>
      {value === "auto" && wsStatus !== "open" && (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Backend Whisper absent — bascule automatique sur la reconnaissance du
          navigateur (Chrome/Edge). Lancez le backend pour la précision maximale.
        </p>
      )}
      {value === "demo" && (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Mode test : les mots s'avancent seuls, environ 2 par seconde, sans micro.
        </p>
      )}
    </div>
  );
}
