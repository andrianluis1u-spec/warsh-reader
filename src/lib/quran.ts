import type { SurahVerse } from "./engine";

/** [french name, arabic name, "M"akki | "D"madani] — index + 1 = surah number. */
const SURAHS: [string, string, "M" | "D"][] = [
  ["Al-Fatiha", "الفاتحة", "M"],
  ["Al-Baqarah", "البقرة", "D"],
  ["Ali 'Imran", "آل عمران", "D"],
  ["An-Nisa", "النساء", "D"],
  ["Al-Ma'idah", "المائدة", "D"],
  ["Al-An'am", "الأنعام", "M"],
  ["Al-A'raf", "الأعراف", "M"],
  ["Al-Anfal", "الأنفال", "D"],
  ["At-Tawbah", "التوبة", "D"],
  ["Yunus", "يونس", "M"],
  ["Hud", "هود", "M"],
  ["Yusuf", "يوسف", "M"],
  ["Ar-Ra'd", "الرعد", "D"],
  ["Ibrahim", "إبراهيم", "M"],
  ["Al-Hijr", "الحجر", "M"],
  ["An-Nahl", "النحل", "M"],
  ["Al-Isra", "الإسراء", "M"],
  ["Al-Kahf", "الكهف", "M"],
  ["Maryam", "مريم", "M"],
  ["Taha", "طه", "M"],
  ["Al-Anbiya", "الأنبياء", "M"],
  ["Al-Hajj", "الحج", "D"],
  ["Al-Mu'minun", "المؤمنون", "M"],
  ["An-Nur", "النور", "D"],
  ["Al-Furqan", "الفرقان", "M"],
  ["Ash-Shu'ara", "الشعراء", "M"],
  ["An-Naml", "النمل", "M"],
  ["Al-Qasas", "القصص", "M"],
  ["Al-'Ankabut", "العنكبوت", "M"],
  ["Ar-Rum", "الروم", "M"],
  ["Luqman", "لقمان", "M"],
  ["As-Sajdah", "السجدة", "M"],
  ["Al-Ahzab", "الأحزاب", "D"],
  ["Saba", "سبأ", "M"],
  ["Fatir", "فاطر", "M"],
  ["Ya-Sin", "يس", "M"],
  ["As-Saffat", "الصافات", "M"],
  ["Sad", "ص", "M"],
  ["Az-Zumar", "الزمر", "M"],
  ["Ghafir", "غافر", "M"],
  ["Fussilat", "فصلت", "M"],
  ["Ash-Shura", "الشورى", "M"],
  ["Az-Zukhruf", "الزخرف", "M"],
  ["Ad-Dukhan", "الدخان", "M"],
  ["Al-Jathiyah", "الجاثية", "M"],
  ["Al-Ahqaf", "الأحقاف", "M"],
  ["Muhammad", "محمد", "D"],
  ["Al-Fath", "الفتح", "D"],
  ["Al-Hujurat", "الحجرات", "D"],
  ["Qaf", "ق", "M"],
  ["Adh-Dhariyat", "الذاريات", "M"],
  ["At-Tur", "الطور", "M"],
  ["An-Najm", "النجم", "M"],
  ["Al-Qamar", "القمر", "M"],
  ["Ar-Rahman", "الرحمن", "D"],
  ["Al-Waqi'ah", "الواقعة", "M"],
  ["Al-Hadid", "الحديد", "D"],
  ["Al-Mujadila", "المجادلة", "D"],
  ["Al-Hashr", "الحشر", "D"],
  ["Al-Mumtahanah", "الممتحنة", "D"],
  ["As-Saff", "الصف", "D"],
  ["Al-Jumu'ah", "الجمعة", "D"],
  ["Al-Munafiqun", "المنافقون", "D"],
  ["At-Taghabun", "التغابن", "D"],
  ["At-Talaq", "الطلاق", "D"],
  ["At-Tahrim", "التحريم", "D"],
  ["Al-Mulk", "الملك", "M"],
  ["Al-Qalam", "القلم", "M"],
  ["Al-Haqqah", "الحاقة", "M"],
  ["Al-Ma'arij", "المعارج", "M"],
  ["Nuh", "نوح", "M"],
  ["Al-Jinn", "الجن", "M"],
  ["Al-Muzzammil", "المزمل", "M"],
  ["Al-Muddaththir", "المدثر", "M"],
  ["Al-Qiyamah", "القيامة", "M"],
  ["Al-Insan", "الإنسان", "D"],
  ["Al-Mursalat", "المرسلات", "M"],
  ["An-Naba", "النبأ", "M"],
  ["An-Nazi'at", "النازعات", "M"],
  ["Abasa", "عبس", "M"],
  ["At-Takwir", "التكوير", "M"],
  ["Al-Infitar", "الانفطار", "M"],
  ["Al-Mutaffifin", "المطففين", "M"],
  ["Al-Inshiqaq", "الانشقاق", "M"],
  ["Al-Buruj", "البروج", "M"],
  ["At-Tariq", "الطارق", "M"],
  ["Al-A'la", "الأعلى", "M"],
  ["Al-Ghashiyah", "الغاشية", "M"],
  ["Al-Fajr", "الفجر", "M"],
  ["Al-Balad", "البلد", "M"],
  ["Ash-Shams", "الشمس", "M"],
  ["Al-Layl", "الليل", "M"],
  ["Ad-Duha", "الضحى", "M"],
  ["Ash-Sharh", "الشرح", "M"],
  ["At-Tin", "التين", "M"],
  ["Al-'Alaq", "العلق", "M"],
  ["Al-Qadr", "القدر", "M"],
  ["Al-Bayyinah", "البينة", "D"],
  ["Az-Zalzalah", "الزلزلة", "D"],
  ["Al-'Adiyat", "العاديات", "M"],
  ["Al-Qari'ah", "القارعة", "M"],
  ["At-Takathur", "التكاثر", "M"],
  ["Al-'Asr", "العصر", "M"],
  ["Al-Humazah", "الهمزة", "M"],
  ["Al-Fil", "الفيل", "M"],
  ["Quraysh", "قريش", "M"],
  ["Al-Ma'un", "الماعون", "M"],
  ["Al-Kawthar", "الكوثر", "M"],
  ["Al-Kafirun", "الكافرون", "M"],
  ["An-Nasr", "النصر", "D"],
  ["Al-Masad", "المسد", "M"],
  ["Al-Ikhlas", "الإخلاص", "M"],
  ["Al-Falaq", "الفلق", "M"],
  ["An-Nas", "الناس", "M"],
];

export interface SurahMeta {
  number: number;
  nameFr: string;
  nameAr: string;
  makki: boolean;
  /** Warsh ayah count — filled from data, falls back to the Hafs count. */
  ayahCount: number;
}

export function surahList(): SurahMeta[] {
  return SURAHS.map(([nameFr, nameAr, kind], i) => ({
    number: i + 1,
    nameFr,
    nameAr,
    makki: kind === "M",
    ayahCount: 0,
  }));
}

export interface WarshChapter {
  chapter: number;
  verses: { chapter: number; verse: number; text: string; number_in_hafs: number[] }[];
}

export async function fetchChapter(n: number): Promise<WarshChapter> {
  const res = await fetch(`/data/warsh/chapters/${n}.json`);
  if (!res.ok) throw new Error(`Sourah ${n} introuvable (${res.status})`);
  return (await res.json()) as WarshChapter;
}

/** Slice verses into a SurahVerse[] usable by the engine (1-based inclusive range). */
export function sliceRange(ch: WarshChapter, from?: number, to?: number): SurahVerse[] {
  const a = Math.max(1, from ?? 1);
  const b = Math.min(ch.verses.length, to ?? ch.verses.length);
  return ch.verses
    .filter((v) => v.verse >= a && v.verse <= b)
    .map((v) => ({ chapter: v.chapter, verse: v.verse, text: v.text }));
}

export async function fetchChapterRange(
  n: number,
  from?: number,
  to?: number,
): Promise<SurahVerse[]> {
  const ch = await fetchChapter(n);
  return sliceRange(ch, from, to);
}
