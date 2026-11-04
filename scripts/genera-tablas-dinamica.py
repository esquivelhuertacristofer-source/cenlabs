"""Regenera los estados discretos de 283 y 284 con CoolProp."""
import json
from pathlib import Path
from CoolProp.CoolProp import PropsSI


def rankine(p_mpa, degrees):
    fluid = "IF97::Water"
    p_low = 10000
    p_high = p_mpa * 1e6
    hf = PropsSI("H", "P", p_low, "Q", 0, fluid)
    hg = PropsSI("H", "P", p_low, "Q", 1, fluid)
    h2 = hf + (p_high - p_low) / PropsSI("D", "P", p_low, "Q", 0, fluid)
    h3 = PropsSI("H", "P", p_high, "T", degrees + 273.15, fluid)
    s3 = PropsSI("S", "P", p_high, "T", degrees + 273.15, fluid)
    sf = PropsSI("S", "P", p_low, "Q", 0, fluid)
    sg = PropsSI("S", "P", p_low, "Q", 1, fluid)
    quality = (s3 - sf) / (sg - sf)
    h4 = hf + quality * (hg - hf)
    return [(h3 - h4 - (h2 - hf)) / (h3 - h2), quality, (h3 - h4 - (h2 - hf)) / 1000, [h / 1000 for h in (hf, h2, h3, h4)]]


def refrigeration(evap, subcool):
    fluid = "HEOS::R134a"
    t_cond = 313.15
    p_evap = PropsSI("P", "T", evap + 273.15, "Q", 1, fluid)
    p_cond = PropsSI("P", "T", t_cond, "Q", 0, fluid)
    h1 = PropsSI("H", "P", p_evap, "Q", 1, fluid)
    s1 = PropsSI("S", "P", p_evap, "Q", 1, fluid)
    h2s = PropsSI("H", "P", p_cond, "S", s1, fluid)
    h2 = h1 + (h2s - h1) / 0.8
    h3 = PropsSI("H", "P", p_cond, "T", t_cond - subcool, fluid) if subcool else PropsSI("H", "P", p_cond, "Q", 0, fluid)
    return [(h1 - h3) / (h2 - h1), (h1 - h3) / 1000, (h2 - h1) / 1000, [h / 1000 for h in (h1, h2, h3, h3)]]


def write_tables():
    target = Path(__file__).resolve().parents[1] / "public/labs/_dinamica-propiedades.js"
    tables = {
        "rankine": {f"{p}/{t}": rankine(p, t) for p in range(2, 13) for t in range(400, 601, 25)},
        "refrigeration": {f"{t}/{s}": refrigeration(t, s) for t in range(-20, 11, 2) for s in range(0, 13, 2)},
    }
    with target.open("w", encoding="utf8") as out:
        out.write("// Generado por scripts/genera-tablas-dinamica.py.\n")
        for name, rows in tables.items():
            out.write(f"export const {name} = {{\n")
            for key, row in rows.items():
                out.write(f"  {json.dumps(key)}: {json.dumps(row)},\n")
            out.write("};\n")


if __name__ == "__main__":
    write_tables()
