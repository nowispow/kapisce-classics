#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path


ALT_PATTERN = r"((?:\\.|[^\]])*?)"
LINKED_IMAGE_RE = re.compile(
    rf"\[!\\?\[{ALT_PATTERN}\\?\]\((images/[^)\s]+)(?:\s+\"[^\"]*\")?\)\]\((images/[^)\s]+)(?:\s+\"[^\"]*\")?\)"
)
IMAGE_RE = re.compile(rf"!\\?\[{ALT_PATTERN}\\?\]\((images/[^)\s]+)(?:\s+\"[^\"]*\")?\)")


def normalize_alt(alt: str) -> str:
    cleaned = alt.replace("\\[", "[").replace("\\]", "]").strip()
    return cleaned if cleaned else "[Image unavailable]"


def replace_images(text: str) -> tuple[str, int]:
    replacements = 0

    def linked_image_replacer(match: re.Match[str]) -> str:
        nonlocal replacements
        replacements += 1
        return normalize_alt(match.group(1))

    updated = LINKED_IMAGE_RE.sub(linked_image_replacer, text)

    def image_replacer(match: re.Match[str]) -> str:
        nonlocal replacements
        replacements += 1
        return normalize_alt(match.group(1))

    updated = IMAGE_RE.sub(image_replacer, updated)
    return updated, replacements


def process_file(path: Path, write: bool) -> tuple[int, bool]:
    original = path.read_text(encoding="utf-8")
    updated, replacements = replace_images(original)
    changed = updated != original
    if write and changed:
        path.write_text(updated, encoding="utf-8")
    return replacements, changed


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Replace markdown image references that point to missing local "
            'Pandoc-style assets like "(images/foo.jpg)" with plain fallback text.'
        )
    )
    parser.add_argument(
        "--path",
        default="src/content/chapters",
        help="File or directory to process (default: src/content/chapters).",
    )
    parser.add_argument(
        "--glob",
        default="pride-and-prejudice*.mdx",
        help='Glob for files when --path is a directory (default: "pride-and-prejudice*.mdx").',
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
    total_replacements = 0
    changed_files: list[Path] = []

    for file_path in files:
        replacements, changed = process_file(file_path, args.write)
        if replacements > 0:
            total_replacements += replacements
            changed_files.append(file_path)

    mode = "APPLY" if args.write else "DRY-RUN"
    print(
        f"[{mode}] files_with_changes={len(changed_files)} image_refs_replaced={total_replacements}"
    )
    for file_path in changed_files:
        print(file_path.as_posix())

    if not args.write and changed_files:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
