#!/usr/bin/env python3
import json
import time
from pathlib import Path
from typing import Any

import requests


SUBREDDITS = [
    "VideoEditing",
    "Filmmakers",
    "ColorGrading",
    "AfterEffects",
    "PremierePro",
    "editors",
    "vfx",
    "colorists",
    "sounddesign",
    "audioengineering",
    "DaVinciResolve",
    "CapCut",
]
POST_LIMIT = 200
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = SCRIPT_DIR / "reddit_payload.json"
USER_AGENT = "PrometheusVideoEditingKnowledgeHarvester/1.0"
PULLPUSH_URL = "https://api.pullpush.io/reddit/search/submission/"


def main() -> int:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    posts = []
    for index, subreddit in enumerate(SUBREDDITS, start=1):
        print(f"[{index}/{len(SUBREDDITS)}] Fetching r/{subreddit} top posts from the past year...")
        posts.extend(fetch_subreddit_posts(session, subreddit))
        if index < len(SUBREDDITS):
            time.sleep(2)

    OUTPUT_PATH.write_text(json.dumps(posts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Done. Wrote {len(posts)} posts to {OUTPUT_PATH.name}.")
    return 0


def fetch_subreddit_posts(session: requests.Session, subreddit: str) -> list[dict[str, Any]]:
    try:
        return fetch_reddit_top_posts(session, subreddit)
    except requests.HTTPError as error:
        status_code = error.response.status_code if error.response is not None else None
        if status_code != 403:
            raise

        print("  reddit.com blocked this environment; using PullPush fallback.")
        return fetch_pullpush_posts(session, subreddit)


def fetch_reddit_top_posts(session: requests.Session, subreddit: str) -> list[dict[str, Any]]:
    url = f"https://www.reddit.com/r/{subreddit}/top.json"
    posts = []
    after = None

    while len(posts) < POST_LIMIT:
        page_limit = min(100, POST_LIMIT - len(posts))
        params = {"t": "year", "limit": page_limit}
        if after:
            params["after"] = after

        response = session.get(url, params=params, timeout=30)
        response.raise_for_status()

        listing = response.json().get("data", {})
        children = listing.get("children", [])
        if not children:
            break

        for child in children:
            data = child.get("data", {})
            post_id = str(data.get("id") or "").strip()
            if not post_id:
                continue

            posts.append(
                {
                    "id": post_id,
                    "subreddit": subreddit,
                    "title": str(data.get("title") or "").strip(),
                    "body": str(data.get("selftext") or "").strip(),
                    "score": int(data.get("score") or 0),
                    "url": normalize_reddit_url(str(data.get("permalink") or data.get("url") or "").strip()),
                    "source": "reddit",
                    "content_type": "forum_post",
                }
            )

        after = listing.get("after")
        if not after:
            break
        time.sleep(1)

    print(f"  added {len(posts)} posts.")
    return posts


def fetch_pullpush_posts(session: requests.Session, subreddit: str) -> list[dict[str, Any]]:
    posts = []
    seen_ids = set()

    top_posts = fetch_pullpush_page(session, subreddit, {"sort": "desc", "sort_type": "score", "size": 100})
    append_pullpush_posts(posts, seen_ids, subreddit, top_posts)

    before = None
    while len(posts) < POST_LIMIT:
        params = {
            "sort": "desc",
            "sort_type": "created_utc",
            "size": min(100, POST_LIMIT - len(posts)),
        }
        if before is not None:
            params["before"] = before

        page = fetch_pullpush_page(session, subreddit, params)
        added = append_pullpush_posts(posts, seen_ids, subreddit, page)
        timestamps = [int(item.get("created_utc") or 0) for item in page if item.get("created_utc")]
        if not page or not timestamps:
            break

        before = min(timestamps) - 1
        if added == 0:
            break
        time.sleep(1)

    print(f"  added {len(posts)} posts.")
    return posts[:POST_LIMIT]


def fetch_pullpush_page(session: requests.Session, subreddit: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    response = session.get(PULLPUSH_URL, params={"subreddit": subreddit, **params}, timeout=30)
    response.raise_for_status()
    data = response.json().get("data", [])
    return data if isinstance(data, list) else []


def append_pullpush_posts(
    posts: list[dict[str, Any]],
    seen_ids: set[str],
    subreddit: str,
    items: list[dict[str, Any]],
) -> int:
    added = 0
    for data in items:
        post_id = str(data.get("id") or "").strip()
        if not post_id or post_id in seen_ids:
            continue

        seen_ids.add(post_id)
        posts.append(
            {
                "id": post_id,
                "subreddit": subreddit,
                "title": str(data.get("title") or "").strip(),
                "body": str(data.get("selftext") or data.get("body") or "").strip(),
                "score": int(data.get("score") or 0),
                "url": normalize_reddit_url(str(data.get("permalink") or data.get("url") or "").strip()),
                "source": "reddit",
                "content_type": "forum_post",
            }
        )
        added += 1

        if len(posts) >= POST_LIMIT:
            break

    return added


def normalize_reddit_url(value: str) -> str:
    if not value:
        return ""
    if value.startswith("/"):
        return f"https://www.reddit.com{value}"
    return value


if __name__ == "__main__":
    raise SystemExit(main())
