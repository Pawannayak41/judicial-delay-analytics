"""
generate_geojson.py
Creates simplified India state and district GeoJSON files.
Downloads from a reliable CDN source (Natural Earth / Datameet).

Usage:
    python generate_geojson.py
"""

import json
import os
import urllib.request
from pathlib import Path

GEO_DIR = Path(__file__).parent.parent / "frontend" / "public" / "data" / "geo"
GEO_DIR.mkdir(parents=True, exist_ok=True)

# India GeoJSON sources (Datameet India Maps)
SOURCES = {
    "india_states.geojson": (
        "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson",
        # fallback
        "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson",
    ),
    "india_districts.geojson": (
        "https://raw.githubusercontent.com/datameet/maps/master/Districts/India_Districts.geojson",
    ),
}

def download(url: str, path: Path) -> bool:
    try:
        print(f"  Downloading {url[:60]}...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        path.write_bytes(data)
        print(f"  ✓ Saved {path.name} ({len(data)/1024:.0f} KB)")
        return True
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        return False


def generate_stub_states_geojson() -> dict:
    """
    Generates a minimal stub GeoJSON with approximate India state centroids as 
    point-based polygons. Not true boundaries, but enough for the map to load 
    and demonstrate the choropleth system until real GeoJSON is downloaded.
    
    Real boundary data is downloaded from the CDN above.
    """
    # Approximate centroids for Indian states (lon, lat)
    states = [
        ("Uttar Pradesh", "UP", [80.9, 26.8]),
        ("Maharashtra", "MH", [75.7, 19.7]),
        ("West Bengal", "WB", [87.9, 22.9]),
        ("Bihar", "BR", [85.3, 25.1]),
        ("Rajasthan", "RJ", [74.2, 27.0]),
        ("Madhya Pradesh", "MP", [78.7, 23.5]),
        ("Gujarat", "GJ", [71.5, 22.3]),
        ("Karnataka", "KA", [75.7, 15.3]),
        ("Andhra Pradesh", "AP", [79.7, 15.9]),
        ("Tamil Nadu", "TN", [78.7, 11.1]),
        ("Telangana", "TS", [79.1, 17.4]),
        ("Haryana", "HR", [76.1, 29.1]),
        ("Punjab", "PB", [75.3, 31.1]),
        ("Odisha", "OD", [84.2, 20.9]),
        ("Jharkhand", "JH", [85.3, 23.6]),
        ("Chhattisgarh", "CG", [81.9, 21.3]),
        ("Assam", "AS", [92.9, 26.2]),
        ("Kerala", "KL", [76.3, 10.9]),
        ("Uttarakhand", "UK", [79.0, 30.1]),
        ("Himachal Pradesh", "HP", [77.2, 31.9]),
        ("Jammu & Kashmir", "JK", [75.3, 33.7]),
        ("Delhi", "DL", [77.2, 28.6]),
        ("Goa", "GA", [74.1, 15.3]),
        ("Manipur", "MN", [93.9, 24.8]),
        ("Meghalaya", "ML", [91.4, 25.5]),
        ("Tripura", "TR", [91.9, 23.9]),
        ("Arunachal Pradesh", "AR", [94.7, 28.2]),
        ("Nagaland", "NL", [94.6, 26.2]),
        ("Mizoram", "MZ", [92.7, 23.2]),
        ("Sikkim", "SK", [88.5, 27.5]),
        ("Chandigarh", "CH", [76.8, 30.7]),
        ("Puducherry", "PY", [79.8, 11.9]),
        ("Ladakh", "LA", [77.6, 34.2]),
        ("Lakshadweep", "LD", [72.6, 10.6]),
        ("Andaman & Nicobar Islands", "AN", [92.7, 12.0]),
    ]

    features = []
    d = 1.0  # rough half-size of placeholder box

    for name, code, center in states:
        lon, lat = center
        # Create a tiny box polygon centered at the state centroid
        coords = [[
            [lon - d, lat - d],
            [lon + d, lat - d],
            [lon + d, lat + d],
            [lon - d, lat + d],
            [lon - d, lat - d],
        ]]
        features.append({
            "type": "Feature",
            "properties": {
                "NAME_1": name,
                "ST_NM": name,
                "st_nm": name,
                "STATE_ID": code,
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": coords,
            }
        })

    return {"type": "FeatureCollection", "features": features}


def main():
    print("Fetching India GeoJSON files...")

    # Try downloading real state GeoJSON
    state_path = GEO_DIR / "india_states.geojson"
    dist_path = GEO_DIR / "india_districts.geojson"

    # State boundaries
    if not state_path.exists():
        success = False
        for url in SOURCES["india_states.geojson"]:
            if download(url, state_path):
                success = True
                break
        if not success:
            print("  Using stub state GeoJSON (download failed)")
            stub = generate_stub_states_geojson()
            state_path.write_text(json.dumps(stub, separators=(",", ":")))

    # District boundaries (large file ~15MB, optional)
    if not dist_path.exists():
        for url in SOURCES.get("india_districts.geojson", ()):
            if download(url, dist_path):
                break
        else:
            print("  District GeoJSON not available — using stub")
            stub = generate_stub_states_geojson()  # reuse state stub as fallback
            dist_path.write_text(json.dumps(stub, separators=(",", ":")))

    print(f"\n✅ GeoJSON files ready in {GEO_DIR}")


if __name__ == "__main__":
    main()
