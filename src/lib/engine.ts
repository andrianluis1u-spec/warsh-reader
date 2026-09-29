import { normalizeWords, similarity } from "./arabic";

export type WordStatus = "pending" | "recited" | "wrong";
export type MistakeKind = "skipped" | "extra" | "wrong";

export interface AyahState {
  start: number;
  words: WordStatus[];
}

export interface Mistake {
  kind: MistakeKind;
  ayah: number;
  wordIndex: number;
  expected?: string;
  heard?: string;
  score: number;
  atMs: number;
}

export interface SurahVerse {
  chapter: number;
  verse: number;
  text: string;
}

export interface AlignOptions {
  /** Similarity in [0,1] below which a matched word is flagged "wrong". */
  wrongThreshold?: number;
  /** Similarity above which a fuzzy match is accepted. */
  matchThreshold?: number;
  /** Max words the position may be pushed forward per chunk (guards desync). */
  maxAdvance?: number;
}

interface FlatWord {
  ayahIdx: number;
  verse: number;
  indexInAyah: number;
  norm: string;
}

export class RecitationEngine {
  private flat: FlatWord[] = [];
  private state: WordStatus[] = [];
  private ayahs: AyahState[] = [];
  private pos = 0;
  private runningWords: string[] = [];
  private lastHeardWords: string[] = [];
  private mistakes: Mistake[] = [];
  private opts: Required<AlignOptions>;
  private startedAtMs = 0;

  constructor(verses: SurahVerse[], opts: AlignOptions = {}) {
    this.opts = {
      wrongThreshold: 0.72,
      matchThreshold: 0.6,
      maxAdvance: 14,
      ...opts,
    };
    this.setVerses(verses);
  }

  setVerses(verses: SurahVerse[]) {
    this.flat = [];
    this.ayahs = [];
    verses.forEach((v, ayahIdx) => {
      const start = this.flat.length;
      const words = normalizeWords(v.text);
      const st: WordStatus[] = [];
      words.forEach((norm, indexInAyah) => {
        this.flat.push({ ayahIdx, verse: v.verse, indexInAyah, norm });
        st.push("pending");
      });
      this.ayahs.push({ start, words: st });
    });
    this.state = this.flat.map(() => "pending");
    this.pos = 0;
    this.runningWords = [];
    this.mistakes = [];
  }

  reset() {
    this.startedAtMs = Date.now();
    this.state = this.flat.map(() => "pending");
    this.pos = 0;
    this.runningWords = [];
    this.lastHeardWords = [];
    this.mistakes = [];
  }

  get position() {
    return this.pos;
  }
  get totalWords() {
    return this.flat.length;
  }
  get transcript() {
    return this.runningWords;
  }
  get lastHeard() {
    return this.lastHeardWords;
  }
  get mistakeList() {
    return this.mistakes;
  }
  get ayahStates() {
    return this.ayahs;
  }

  get accuracy(): number {
    const done = Math.max(this.pos, 1);
    const wrong = this.mistakes.filter((m) => m.kind !== "skipped").length;
    const skipped = this.mistakes.filter((m) => m.kind === "skipped").length;
    const correct = done - wrong - skipped;
    const denom = done + this.mistakes.filter((m) => m.kind === "extra").length;
    if (denom <= 0) return 100;
    return Math.max(0, Math.round((correct / denom) * 1000) / 10);
  }

  /** Merge a new chunk transcript into the stable running transcript, dropping overlap duplicates. */
  mergeChunk(words: string[]) {
    if (words.length === 0) return;
    const n = this.runningWords.length;
    let bestK = 0;
    if (n > 0) {
      // Find overlap length k (tail of running vs head of new chunk).
      const maxK = Math.min(n, words.length, 40);
      for (let k = maxK; k >= 3; k--) {
        let sim = 0;
        for (let i = 0; i < k; i++) {
          sim += similarity(this.runningWords[n - k + i], words[i]);
        }
        sim /= k;
        if (sim > 0.86) {
          bestK = k;
          break;
        }
      }
      if (bestK === 0) {
        // Fallback: trailing 2-gram containment.
        const tail = this.runningWords.slice(-2);
        for (let k = 2; k >= 1; k--) {
          let ok = true;
          for (let i = 0; i < k; i++) {
            if (similarity(tail[i], words[i]) < 0.7) ok = false;
          }
          if (ok) {
            bestK = k;
            break;
          }
        }
      }
    }
    const fresh = words.slice(bestK);
    this.runningWords.push(...fresh);
    this.lastHeardWords = words;
    this.alignFrom(this.freshStartIdx(fresh.length), fresh);
  }

  private freshStartIdx(freshCount: number): number {
    // Only align the words that are new-ish: last few running words.
    return Math.max(0, this.runningWords.length - freshCount - 2);
  }

  /** Sliding-window alignment of running transcript against expected words. */
  private alignFrom(startIdx: number, _fresh: string[]) {
    const windowEnd = Math.min(this.flat.length, this.pos + this.opts.maxAdvance + 10);
    let i = startIdx;
    while (i < this.runningWords.length) {
      const heard = this.runningWords[i];
      if (this.pos >= windowEnd) break;
      let bestJ = -1;
      let bestScore = 0;
      const maxJ = Math.min(windowEnd, this.pos + this.opts.maxAdvance);
      for (let j = this.pos; j < maxJ; j++) {
        const s = similarity(heard, this.flat[j].norm);
        if (s > bestScore) {
          bestScore = s;
          bestJ = j;
        }
        // Exact match short-circuits.
        if (s === 1) break;
      }
      if (bestJ < 0) {
        i++;
        continue;
      }
      const skipped = bestJ - this.pos;
      if (skipped > 2) {
        // Heuristic: user skipped ahead OR asr noise; record skipped words
        // between current position and the matched word.
        for (let j = this.pos; j < bestJ; j++) {
          this.recordMistake("skipped", j, 0);
          this.state[j] = "pending";
          this.pos = j + 1;
        }
        // Re-evaluate: continue from bestJ.
      } else {
        for (let j = this.pos; j < bestJ; j++) {
          this.recordMistake("skipped", j, 0);
        }
      }
      if (bestScore >= this.opts.matchThreshold) {
        if (bestScore < this.opts.wrongThreshold) {
          this.recordMistake("wrong", bestJ, bestScore, heard);
          this.state[bestJ] = "wrong";
        } else {
          this.state[bestJ] = "recited";
        }
      } else {
        // Extra word — not confidently any expected word nearby.
        this.recordMistake("extra", this.pos, bestScore, heard);
      }
      this.pos = Math.max(this.pos, bestJ + 1);
      i++;
    }
  }

  private recordMistake(
    kind: MistakeKind,
    wordIdx: number,
    score: number,
    heard?: string,
  ) {
    const w = this.flat[wordIdx];
    this.mistakes.push({
      kind,
      ayah: w ? w.verse : 0,
      wordIndex: wordIdx,
      expected: w?.norm,
      heard,
      score,
      atMs: Date.now() - this.startedAtMs,
    });
    if (this.mistakes.length > 500) this.mistakes.shift();
  }

  /** Milliseconds elapsed since session start. */
  elapsedMs() {
    return Date.now() - this.startedAtMs;
  }
}
