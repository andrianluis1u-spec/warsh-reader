#!/usr/bin/env python3
"""Download the Warsh mushaf text into ../public/data/warsh.

Source: https://github.com/risan/quran-json (Qur'anpedia Warsh 'an Nafi').
The whole Quran lands in quran.json and each chapter also in chapters/N.json
(the shape the frontend fetches). Warsh has its own numbering: 6,214 ayat.
"""

from __future__ import annotations

import json
import os
import urllib.request

BRANCH = os.environ.get(
    "WARSH_SOURCE_REF", "codex/quran-modernization-corpus-expansion"
)
SOURCE = (
    "https://raw.githubusercontent.com/risan/quran-json/"
    f"{BRANCH}/data/quranpedia/warsh.json"
)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "warsh")


def main() -> None:
    print(f"Fetching {SOURCE}")
    with urllib.request.urlopen(SOURCE) as r:  # noqa: S310
        raw = json.load(r)

    os.makedirs(os.path.join(OUT_DIR, "chapters"), exist_ok=True)

    total = 0
    chapters = []
    for cid, verses in raw.items():
        cid = int(cid)
        chapters.append({"chapter": cid, "verses": verses})
        total += len(verses)
        per_chapter = os.path.join(OUT_DIR, "chapters", f"{cid}.json")
        with open(per_chapter, "w", encoding="utf-8") as f:
            json.dump({"chapter": cid, "verses": verses}, f, ensure_ascii=False)

    with open(os.path.join(OUT_DIR, "quran.json"), "w", encoding="utf-8") as f:
        json.dump(raw, f, ensure_ascii=False)

    print(f"Wrote {len(chapters)} chapters, {total} ayat (expected 6214) -> {OUT_DIR}")
    if total != 6214:
        print("WARNING: unexpected ayah count — verify the source data!")


if __name__ == "__main__":
    main()
