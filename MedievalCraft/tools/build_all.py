#!/usr/bin/env python3
"""
build_all.py — regenerate the entire MedievalCraft pack in the correct order.

Order matters: generate.py writes static block/item textures (including flat
water/lava placeholders); generate_anim.py then OVERWRITES the liquids/fire/
portal with animated frame-strips + .mcmeta; generate_extra.py adds particles,
paintings, entities and GUI.

Run:  python3 tools/build_all.py
"""
import os
import runpy
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

for step in ("generate.py", "generate_anim.py", "generate_extra.py"):
    print(f"=== {step} ===")
    runpy.run_path(os.path.join(HERE, step), run_name="__main__")

print("\nAll textures generated.")
