#!/usr/bin/env python3
"""
promote_enhanced_chapters.py

For every *-enhanced.mdx file in src/content/chapters/, overwrite the
corresponding base chapter with the enhanced content, then delete the
enhanced file.

Usage:
    python scripts/promote_enhanced_chapters.py           # dry run (safe)
    python scripts/promote_enhanced_chapters.py --execute # actually write
"""

import argparse
import sys
from pathlib import Path

CHAPTERS_DIR = Path(__file__).parent.parent / "src" / "content" / "chapters"
ENHANCED_SUFFIX = "-enhanced.mdx"
BASE_SUFFIX = ".mdx"


def find_enhanced_files(directory: Path) -> list[Path]:
    return sorted(directory.glob(f"*{ENHANCED_SUFFIX}"))


def base_path_for(enhanced: Path) -> Path:
    base_name = enhanced.name.removesuffix(ENHANCED_SUFFIX) + BASE_SUFFIX
    return enhanced.parent / base_name


def validate_pairs(enhanced_files: list[Path]) -> tuple[list[tuple[Path, Path]], list[Path]]:
    valid_pairs = []
    missing_base = []

    for enhanced in enhanced_files:
        base = base_path_for(enhanced)
        if base.exists():
            valid_pairs.append((enhanced, base))
        else:
            missing_base.append(enhanced)

    return valid_pairs, missing_base


def promote(pairs: list[tuple[Path, Path]], execute: bool) -> None:
    label = "EXECUTE" if execute else "DRY RUN"
    print(f"\n[{label}] {len(pairs)} enhanced chapter(s) to promote\n")

    for enhanced, base in pairs:
        print(f"  overwrite  {base.name}")
        print(f"  with       {enhanced.name}")
        print(f"  then delete {enhanced.name}")

        if execute:
            content = enhanced.read_text(encoding="utf-8")
            base.write_text(content, encoding="utf-8")
            enhanced.unlink()
            print(f"  -> done")

        print()

    if not execute:
        print("Dry run complete — no files were changed.")
        print("Re-run with --execute to apply.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually overwrite base chapters and delete enhanced files (omit for dry run)",
    )
    args = parser.parse_args()

    if not CHAPTERS_DIR.is_dir():
        sys.exit(f"ERROR: chapters directory not found at {CHAPTERS_DIR}")

    enhanced_files = find_enhanced_files(CHAPTERS_DIR)
    if not enhanced_files:
        sys.exit("No *-enhanced.mdx files found — nothing to do.")

    pairs, missing = validate_pairs(enhanced_files)

    if missing:
        print("ERROR: the following enhanced files have no matching base chapter:")
        for f in missing:
            print(f"  {f.name}  ->  expected {base_path_for(f).name}")
        sys.exit("\nAborting — fix the missing base files before running.")

    promote(pairs, execute=args.execute)


if __name__ == "__main__":
    main()
