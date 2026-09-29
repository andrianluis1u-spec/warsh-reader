/**
 * Arabic normalization for matching — keep in sync with backend/app.py.
 *
 * Strips tashkeel and Quranic annotation marks (the Warsh source uses many),
 * then unifies letter variants so fuzzy matching compares consonantal
 * skeletons instead of calligraphic detail.
 */

const DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06EC\u08D3-\u08FF]/g;

export function stripDiacritics(text: string): string {
  return text.replace(DIACRITICS, "");
}

export function normalizeArabic(text: string): string {
  let t = stripDiacritics(text);
  t = t.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, "\u0627");
  t = t.replace(/\u0649/g, "\u064A");
  t = t.replace(/\u0629/g, "\u0647");
  t = t.replace(/\u0640/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

export function normalizeWords(text: string): string[] {
  return normalizeArabic(text)
    .split(" ")
    .filter((w) => w.length > 0);
}

/** Normalized Levenshtein similarity in [0, 1]. */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (la === 0 || lb === 0) return 0;
  const maxLen = Math.max(la, lb);
  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return 1 - prev[lb] / maxLen;
}
