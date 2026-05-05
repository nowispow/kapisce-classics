#!/usr/bin/env python3
"""
Identify and remove image files under metadata/pride-and-prejudice/ that are
not referenced by any MDX file in src/content/chapters/.

Default mode is dry-run (prints what would be deleted).
Pass --delete to actually remove files.
"""

import argparse
import re
import sys
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent
CHAPTERS_DIR = PROJECT_ROOT / "src" / "content" / "chapters"
METADATA_BASE = CHAPTERS_DIR / "metadata" / "pride-and-prejudice"

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}

# Matches ![alt](path) — re.DOTALL allows newlines in alt text (seen in sw/, pt/)
IMG_RE = re.compile(r'!\[([^\]]*?)\]\(([^)\s]+)\)', re.DOTALL)
# Fallback for HTML <img src="..."> tags
IMG_HTML_RE = re.compile(r'<img\s[^>]*src=["\']([^"\']+)["\']', re.IGNORECASE)

# ─── Collect referenced images ────────────────────────────────────────────────

def collect_referenced_images() -> set[Path]:
    referenced: set[Path] = set()
    for mdx_file in CHAPTERS_DIR.rglob("*.mdx"):
        text = mdx_file.read_text(encoding="utf-8")
        for m in IMG_RE.finditer(text):
            raw_path = m.group(2)
            resolved = (mdx_file.parent / raw_path).resolve()
            referenced.add(resolved)
        for m in IMG_HTML_RE.finditer(text):
            raw_path = m.group(1)
            resolved = (mdx_file.parent / raw_path).resolve()
            referenced.add(resolved)
    return referenced


# ─── Collect on-disk images ───────────────────────────────────────────────────

def collect_disk_images() -> set[Path]:
    return {
        p.resolve()
        for p in METADATA_BASE.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    }


# ─── Validate references exist on disk ───────────────────────────────────────

def validate_references(referenced: set[Path]) -> list[Path]:
    return [p for p in sorted(referenced) if not p.exists()]


# ─── Formatting helpers ───────────────────────────────────────────────────────

def fmt_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


# ─── Report ───────────────────────────────────────────────────────────────────

def print_report(
    disk_images: set[Path],
    referenced: set[Path],
    to_delete: set[Path],
    missing_refs: list[Path],
    dry_run: bool,
    verbose: bool,
) -> None:
    mode = "DRY RUN" if dry_run else "LIVE DELETE"
    print(f"\n=== cleanup_images.py ({mode}) ===\n")

    if missing_refs:
        print(f"WARNING: {len(missing_refs)} referenced image(s) not found on disk:")
        for p in missing_refs:
            print(f"  MISSING  {p.relative_to(PROJECT_ROOT)}")
        print()

    if verbose and referenced:
        kept = disk_images & referenced
        print(f"Referenced images (kept): {len(kept)}")
        for chapter_dir in sorted({p.parent for p in kept}):
            chapter_files = sorted(p for p in kept if p.parent == chapter_dir)
            print(f"  {chapter_dir.relative_to(METADATA_BASE)}/")
            for p in chapter_files:
                print(f"    {p.name}  ({fmt_size(p.stat().st_size)})")
        print()

    if to_delete:
        action = "Would delete" if dry_run else "Deleting"
        total_size = sum(p.stat().st_size for p in to_delete)
        print(f"Unreferenced images ({action}): {len(to_delete)}  ({fmt_size(total_size)})")
        for chapter_dir in sorted({p.parent for p in to_delete}):
            chapter_files = sorted(p for p in to_delete if p.parent == chapter_dir)
            print(f"  {chapter_dir.relative_to(METADATA_BASE)}/")
            for p in chapter_files:
                print(f"    {p.name}  ({fmt_size(p.stat().st_size)})")
        print()
    else:
        print("No unreferenced images found — nothing to delete.\n")

    total_disk_size = sum(p.stat().st_size for p in disk_images)
    total_delete_size = sum(p.stat().st_size for p in to_delete) if to_delete else 0
    print("Summary")
    print(f"  Images on disk:          {len(disk_images):>5}  ({fmt_size(total_disk_size)})")
    print(f"  Referenced (kept):       {len(disk_images & referenced):>5}")
    print(f"  Unreferenced (to delete):{len(to_delete):>5}  ({fmt_size(total_delete_size)} to recover)")


# ─── Delete ───────────────────────────────────────────────────────────────────

def delete_images(to_delete: set[Path]) -> tuple[int, int]:
    deleted, failed = 0, 0
    for p in sorted(to_delete):
        try:
            p.unlink()
            print(f"  deleted  {p.relative_to(PROJECT_ROOT)}")
            deleted += 1
        except OSError as e:
            print(f"  FAILED   {p.relative_to(PROJECT_ROOT)}: {e}", file=sys.stderr)
            failed += 1
    return deleted, failed


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Remove unreferenced images from metadata/pride-and-prejudice/."
    )
    parser.add_argument("--delete", action="store_true", help="Actually delete files (default: dry-run)")
    parser.add_argument("--force", action="store_true", help="Proceed even if referenced images are missing")
    parser.add_argument("-v", "--verbose", action="store_true", help="Also list referenced (kept) images")
    args = parser.parse_args()

    dry_run = not args.delete

    print("Scanning MDX files for image references...")
    referenced = collect_referenced_images()

    print("Walking metadata directory for image files...")
    disk_images = collect_disk_images()

    missing_refs = validate_references(referenced)
    if missing_refs and not args.force:
        print(f"\nERROR: {len(missing_refs)} referenced image(s) not found on disk.")
        print("This may indicate a path resolution bug. Review warnings above.")
        print("Pass --force to proceed anyway.\n")
        for p in missing_refs:
            print(f"  MISSING  {p}")
        sys.exit(1)

    to_delete = disk_images - referenced

    print_report(disk_images, referenced, to_delete, missing_refs, dry_run, args.verbose)

    if not dry_run and to_delete:
        print(f"\nDeleting {len(to_delete)} image(s)...")
        deleted, failed = delete_images(to_delete)
        print(f"\nDone. {deleted} deleted, {failed} failed.")
    elif dry_run and to_delete:
        print("\nRun with --delete to remove these files.")


if __name__ == "__main__":
    main()
