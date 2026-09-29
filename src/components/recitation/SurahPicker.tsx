import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { surahList } from "@/lib/quran";

export interface Selection {
  surah: number;
  from?: number;
  to?: number;
}

interface Props {
  value: Selection;
  onChange: (s: Selection) => void;
  /** Ayah count for the selected surah (Warsh count when known). */
  ayahCount?: number;
  loading?: boolean;
  disabled?: boolean;
}

export function SurahPicker({ value, onChange, ayahCount, loading, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const list = surahList();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.nameFr.toLowerCase().includes(q) ||
        s.nameAr.includes(query.trim()) ||
        String(s.number) === q,
    );
  }, [query, list]);

  const applyRange = () => {
    const from = parseInt(fromText, 10);
    const to = parseInt(toText, 10);
    onChange({
      surah: value.surah,
      from: Number.isFinite(from) && from > 0 ? from : undefined,
      to: Number.isFinite(to) && to > 0 ? to : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une sourate…"
          className="pe-9"
          disabled={disabled}
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-lg border border-border/70">
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">Aucun résultat</p>
        )}
        {filtered.map((s) => {
          const active = s.number === value.surah;
          return (
            <button
              key={s.number}
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange({ surah: s.number, from: undefined, to: undefined });
                setFromText("");
                setToText("");
              }}
              className={`flex w-full items-center justify-between gap-3 border-b border-border/40 px-3 py-2 text-start transition-colors last:border-b-0 hover:bg-accent/60 ${
                active ? "bg-accent" : "bg-card"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.number}
                </span>
                <span className="text-sm font-medium">{s.nameFr}</span>
              </span>
              <span className="font-arabic text-base text-foreground/85">{s.nameAr}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Ayah début
          </label>
          <Input
            inputMode="numeric"
            value={fromText}
            onChange={(e) => setFromText(e.target.value.replace(/\D/g, ""))}
            onBlur={applyRange}
            onKeyDown={(e) => e.key === "Enter" && applyRange()}
            placeholder="1"
            disabled={disabled}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Ayah fin
          </label>
          <Input
            inputMode="numeric"
            value={toText}
            onChange={(e) => setToText(e.target.value.replace(/\D/g, ""))}
            onBlur={applyRange}
            onKeyDown={(e) => e.key === "Enter" && applyRange()}
            placeholder={ayahCount ? String(ayahCount) : "…"}
            disabled={disabled}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={applyRange} disabled={disabled}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "OK"}
        </Button>
      </div>
    </div>
  );
}
