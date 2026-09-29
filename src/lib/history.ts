/**
 * Recitation history persisted in localStorage — replaces the Convex backend
 * for a fully local, login-free app.
 */

export interface StoredSession {
  id: string;
  /** Epoch ms when the session ended. */
  at: number;
  surah: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  accuracy: number;
  wordsRecited: number;
  totalWords: number;
  mistakes: number;
  durationMs: number;
}

const KEY = "tarteel-warsh:sessions";
const MAX_SESSIONS = 100;

function safeParse(raw: string | null): StoredSession[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (s): s is StoredSession =>
        s &&
        typeof s.id === "string" &&
        typeof s.at === "number" &&
        typeof s.accuracy === "number",
    );
  } catch {
    return [];
  }
}

export function loadSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

export function saveSession(s: Omit<StoredSession, "id" | "at"> & { at?: number }): StoredSession {
  const entry: StoredSession = {
    ...s,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: s.at ?? Date.now(),
  };
  const all = [entry, ...loadSessions()].slice(0, MAX_SESSIONS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked — ignore */
  }
  return entry;
}

export function deleteSession(id: string): StoredSession[] {
  const all = loadSessions().filter((s) => s.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return all;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function historyStats(sessions: StoredSession[]) {
  const count = sessions.length;
  const avgAccuracy =
    count === 0
      ? 0
      : Math.round(
          (sessions.reduce((sum, s) => sum + s.accuracy, 0) / count) * 10,
        ) / 10;
  const bestAccuracy =
    count === 0 ? 0 : Math.max(...sessions.map((s) => s.accuracy));
  const wordsRecited = sessions.reduce((sum, s) => sum + s.wordsRecited, 0);
  const totalMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  return { count, avgAccuracy, bestAccuracy, wordsRecited, totalMs };
}

export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec} s`;
  return `${min} min ${String(sec).padStart(2, "0")}`;
}

export function formatDateTime(at: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(at));
}
