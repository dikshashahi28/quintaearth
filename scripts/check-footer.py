"""Reject reintroduced template credits in pages or browser scripts."""

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
CREDITS = re.compile(r"html\s*codex|theme\s*wagon", re.IGNORECASE)


def main():
    failures = []
    checked = 0
    for path in sorted(ROOT.rglob("*")):
        if ".git" in path.parts or path.suffix.lower() not in {".html", ".js"}:
            continue
        checked += 1
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if CREDITS.search(line):
                failures.append(f"{path.relative_to(ROOT)}:{number}: template credit found")
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(f"PASS: no template credits in {checked} HTML or JavaScript files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
