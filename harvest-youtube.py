#!/usr/bin/env python3
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


VIDEO_IDS = [
    # JustinOdisho
    "_nddFrGergU",
    "4FqPx8DNB8w",
    "B3HXSHLtAcw",
    # CinecomCrew
    "4mG7_-W9P1M",
    "0UVcyEOOUmY",
    "rrr1MRg8pdw",
    # TheFilmLook
    "ljRKfJ9u3_4",
    "Iw3WTBG4uMU",
    "9G20NjQNiK4",
    # theqazman / Waqas Qazi
    "UTR2atiHCbM",
    "iWWf5XMUj1Q",
    "5bpssRK4PUs",
    # Alex Hormozi
    "XsWSvz-aewA",
    "EonibwnAEME",
    "OQf2Ba-Lp_4",
    # Dan Martell
    "TWuzAO7ukk0",
    "yvXNmdfYJYY",
    "wZeOwqmSw84",
    # Dean Graziosi
    "YXYGSqaXVBg",
    "_R_ZxI0hrs4",
    "Wfij1Dxn9UQ",
    # Iman Gadzhi
    "oapvt-AaFpc",
    "5BgmmGHYk1U",
    "pLxRBCBY1HQ",
    # HillierSmith
    "mDQucCHy1Js",
    "9TG1joKdSCY",
    "GS67Z0nj15Y",
    # Film Riot
    "0ezgpEpXB_0",
    "CVeuiwa8l2Y",
    "tVYM2nAwROQ",
    # Peter McKinnon
    "sBROX48mNS8",
    "J2fr0PHw2Yg",
    "vXiS5L5Unu8",
    # This Guy Edits / Sven Pape
    "Ehvh5adVqMo",
    "VKsc211xciI",
    "oZeqVPFPKVM",
    # Casey Faris
    "MCDVcQIA3UM",
    "REpmmKN7EWU",
    "3mo_vgKfYCU",
    # Finzar
    "lYj7Mouw-dc",
    "Ormb3Z0QJVs",
    "lODhwmdCudM",
]

SCRIPT_DIR = Path(__file__).resolve().parent
COOKIES_PATH = SCRIPT_DIR / "cookies.txt"
OUTPUT_PATH = SCRIPT_DIR / "youtube_payload.json"


def main() -> int:
    if not COOKIES_PATH.exists():
        print("Missing cookies.txt in the same directory as harvest-youtube.py.", file=sys.stderr)
        return 1

    payload = []
    for index, video_id in enumerate(VIDEO_IDS, start=1):
        print(f"[{index}/{len(VIDEO_IDS)}] Downloading English auto-subtitles for {video_id}...")
        try:
            transcript = download_transcript(video_id)
        except Exception as error:
            print(f"  failed: {error}", file=sys.stderr)
            continue

        if not transcript:
            print("  skipped: transcript was empty after cleanup.", file=sys.stderr)
            continue

        payload.append(
            {
                "video_id": video_id,
                "source": "youtube",
                "content_type": "transcript",
                "content": transcript,
            }
        )
        print(f"  added {len(transcript):,} characters.")

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Done. Wrote {len(payload)} transcripts to {OUTPUT_PATH.name}.")
    return 0


def download_transcript(video_id: str) -> str:
    with tempfile.TemporaryDirectory(prefix="youtube_subs_") as tmp_dir:
        output_template = str(Path(tmp_dir) / f"{video_id}.%(ext)s")
        command = [
            "yt-dlp",
            "--skip-download",
            "--write-auto-subs",
            "--sub-langs",
            "en",
            "--sub-format",
            "srt",
            "--convert-subs",
            "srt",
            "--cookies",
            str(COOKIES_PATH),
            "--no-playlist",
            "--ignore-no-formats-error",
            "--quiet",
            "--no-warnings",
            "-o",
            output_template,
            f"https://www.youtube.com/watch?v={video_id}",
        ]

        subprocess.run(command, check=True, cwd=SCRIPT_DIR)

        subtitle_files = sorted(Path(tmp_dir).glob(f"{video_id}*.srt"))
        if not subtitle_files:
            raise RuntimeError("yt-dlp did not produce an SRT subtitle file.")

        return clean_srt(subtitle_files[0].read_text(encoding="utf-8", errors="replace"))


def clean_srt(raw: str) -> str:
    lines = []
    for line in raw.splitlines():
        cleaned = line.lstrip("\ufeff").strip()
        if not cleaned:
            continue
        if cleaned.isdigit():
            continue
        if re.match(r"^\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}", cleaned):
            continue
        if re.match(r"^(WEBVTT|Kind:|Language:)", cleaned, flags=re.IGNORECASE):
            continue

        cleaned = re.sub(r"<[^>]+>", " ", cleaned)
        lines.append(cleaned)

    return re.sub(r"\s+", " ", " ".join(lines)).strip()


if __name__ == "__main__":
    raise SystemExit(main())
