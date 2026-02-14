#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import shlex
from pathlib import Path


MARKER_CANDIDATE_RE = re.compile(r"\{([^{}\n]+)\}")
CLASS_TOKEN_RE = re.compile(r"\.[A-Za-z0-9_-]+$")
ID_TOKEN_RE = re.compile(r"#[A-Za-z0-9_-]+$")
KEY_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_-]*$")


def is_pandoc_marker(content: str) -> bool:
    try:
        tokens = shlex.split(content)
    except ValueError:
        return False

    if not tokens:
        return False

    for token in tokens:
        if CLASS_TOKEN_RE.fullmatch(token):
            continue
        if ID_TOKEN_RE.fullmatch(token):
            continue
        if "=" in token:
            key, value = token.split("=", 1)
            if KEY_RE.fullmatch(key) and value != "":
                continue
        return False

    return True


def strip_markers(text: str) -> tuple[str, int]:
    removed = 0

    def replacer(match: re.Match[str]) -> str:
        nonlocal removed
        body = match.group(1).strip()
        if is_pandoc_marker(body):
            removed += 1
            return ""
        return match.group(0)

    updated = MARKER_CANDIDATE_RE.sub(replacer, text)
    return updated, removed


def process_file(path: Path, write: bool) -> tuple[int, bool]:
    original = path.read_text(encoding="utf-8")
    updated, removed = strip_markers(original)
    changed = updated != original

    if write and changed:
        path.write_text(updated, encoding="utf-8")

    return removed, changed


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Remove Pandoc-style single-curly-brace attribute markers from MDX files, "
            'e.g. "{.smcap}", "{#page_x}", "{width=\\"450\\"}".'
        )
    )
    parser.add_argument(
        "--path",
        default="src/content",
        help="File or directory to process (default: src/content).",
    )
    parser.add_argument(
        "--glob",
        default="**/*.mdx",
        help='Glob for files when --path is a directory (default: "**/*.mdx").',
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Apply changes in place. Without this flag, runs in dry-run mode.",
    )
    args = parser.parse_args()

    root = Path(args.path)
    if not root.exists():
        raise SystemExit(f"Path not found: {root}")

    files = [root] if root.is_file() else sorted(root.glob(args.glob))

    total_removed = 0
    changed_files: list[Path] = []

    for file_path in files:
        removed, changed = process_file(file_path, args.write)
        if removed > 0:
            total_removed += removed
            changed_files.append(file_path)

    mode = "APPLY" if args.write else "DRY-RUN"
    print(f"[{mode}] files_with_changes={len(changed_files)} markers_removed={total_removed}")
    for file_path in changed_files:
        print(file_path.as_posix())

    if not args.write and changed_files:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
