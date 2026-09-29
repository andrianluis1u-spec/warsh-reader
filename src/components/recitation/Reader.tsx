import type { SurahVerse, WordStatus } from "@/lib/engine";

interface Props {
  verses: SurahVerse[];
  /** Per-ayah word status arrays from the engine. */
  ayahStates: WordStatus[][];
  /** Flat index of the current expected word (cursor highlight in follow mode). */
  cursor?: number;
  memorize?: boolean;
  peek?: boolean;
}

/**
 * Word-level reader. Normalized LTR logic here: statuses come flat-indexed,
 * the visual order is RTL via the container's dir="rtl".
 */
export function Reader({ verses, ayahStates, cursor, memorize, peek }: Props) {
  let flat = 0;
  return (
    <div dir="rtl" className="font-arabic space-y-5 text-2xl leading-[2.3] sm:text-3xl">
      {verses.map((v, vi) => {
        const states = ayahStates[vi] ?? [];
        return (
          <p key={v.verse} className="rounded-xl px-2 py-1">
            {v.text.split(/\s+/).filter(Boolean).map((token, wi) => {
              const idx = flat++;
              const st: WordStatus = states[wi] ?? "pending";
              const isCursor = cursor === idx;
              const hidden = memorize && !peek && st === "pending";
              return (
                <span
                  key={wi}
                  className={
                    "mx-0.5 inline-block rounded-md px-1 transition-colors duration-300 " +
                    (hidden
                      ? "cursor-help select-none bg-secondary text-transparent"
                      : st === "recited"
                        ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                        : st === "wrong"
                          ? "mistake-pulse rounded-md text-red-800 dark:text-red-300"
                          : isCursor
                            ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                            : "text-foreground/90")
                  }
                title={memorize ? "Révélé à la récitation" : undefined}
              >
                {token}
              </span>
              );
            })}
            <span
              className={`mx-1 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                ayahStates[vi]?.some((s) => s !== "pending")
                  ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-border text-muted-foreground"
              }`}
            >
              {v.verse}
            </span>
          </p>
        );
      })}
    </div>
  );
}
