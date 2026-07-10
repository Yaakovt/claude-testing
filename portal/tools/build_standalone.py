#!/usr/bin/env python3
"""Inline all <script src> tags of index.html into one self-contained file.

Outputs:
  dist/portal.html — full standalone document
"""
import re
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text()


def inline(match):
    src = match.group(1)
    code = (root / src).read_text()
    # </script> inside JS strings would terminate the tag early
    code = code.replace("</script>", "<\\/script>")
    return "<script>\n" + code + "\n</script>"


html = re.sub(r'<script src="([^"]+)"></script>', inline, html)

dist = root / "dist"
dist.mkdir(exist_ok=True)
out = dist / "portal.html"
out.write_text(html)
print(f"wrote {out} ({out.stat().st_size // 1024} KiB)")
