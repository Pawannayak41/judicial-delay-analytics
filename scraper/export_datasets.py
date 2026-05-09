"""
export_datasets.py
Normalizes raw scraped data and exports to frontend-ready JSON.
Run after scrape_njdg.py if using live data.

Usage:
    python export_datasets.py [--raw raw/scraped_states.json]
"""

import json
import sys
import argparse
from pathlib import Path
from normalize import normalize_state, normalize_district, make_id
from generate_synthetic import generate_states_and_districts, generate_summary, generate_time_series, export_all as export_synthetic


def export_from_raw(raw_path: Path):
    """
    Attempt to export from raw scraped JSON.
    Falls back to synthetic if raw data is incomplete.
    """
    print(f"Loading raw data from {raw_path}...")
    with open(raw_path, encoding="utf-8") as f:
        raw = json.load(f)

    if not raw or len(raw) < 5:
        print("⚠ Raw data too sparse — falling back to synthetic generator")
        export_synthetic()
        return

    # Normalize state names
    normalized = []
    for item in raw:
        state_name = normalize_state(item.get("name", ""))
        normalized.append({
            **item,
            "name": state_name,
            "id": make_id(state_name),
        })

    print(f"✓ Normalized {len(normalized)} states")
    print("⚠ District-level data not available from raw scrape — using synthetic for districts")

    # Export synthetic but override state-level pendency with real values
    states_data, districts_data = generate_states_and_districts()
    raw_map = {normalize_state(r["name"]).lower(): r for r in normalized}

    for s in states_data:
        match = raw_map.get(s["name"].lower())
        if match and match.get("raw_pending", 0) > 0:
            # Adjust total_pending to match real value, keep structure
            ratio = match["raw_pending"] / s["total_pending"]
            s["total_pending"] = match["raw_pending"]
            s["civil_pending"] = int(s["civil_pending"] * ratio)
            s["criminal_pending"] = s["total_pending"] - s["civil_pending"]

    summary = generate_summary(states_data)
    summary["num_districts"] = len(districts_data)
    time_series = generate_time_series(states_data)

    out_dir = Path(__file__).parent.parent / "frontend" / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    def save(name, data):
        path = out_dir / name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        kb = path.stat().st_size / 1024
        print(f"  ✓ {name} ({kb:.1f} KB)")

    save("india_summary.json", summary)
    save("states.json", states_data)
    save("districts.json", districts_data)
    save("time_series.json", time_series)
    print(f"\n✅ Exported to {out_dir}")


def main():
    parser = argparse.ArgumentParser(description="Export NJDG datasets to frontend JSON")
    parser.add_argument("--raw", default="raw/scraped_states.json",
                        help="Path to raw scraped JSON (default: raw/scraped_states.json)")
    parser.add_argument("--synthetic", action="store_true",
                        help="Force use of synthetic data generator")
    args = parser.parse_args()

    if args.synthetic:
        print("Using synthetic data generator...")
        export_synthetic()
        return

    raw_path = Path(args.raw)
    if raw_path.exists():
        export_from_raw(raw_path)
    else:
        print(f"Raw data not found at {raw_path} — using synthetic generator")
        export_synthetic()


if __name__ == "__main__":
    main()
