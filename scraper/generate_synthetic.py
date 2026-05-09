"""
generate_synthetic.py
Generates a rich, realistic synthetic dataset mirroring NJDG statistics.
Seeds with real state/district names and statistically plausible distributions.

Usage:
    python generate_synthetic.py

Output: ../frontend/public/data/*.json
"""

import json
import math
import random
import os
from pathlib import Path
from normalize import normalize_state, normalize_district, make_id

random.seed(42)

# ─────────────────────────────────────────────────────────────────
# 1. STATE DEFINITIONS — realistic weights based on actual HC data
# ─────────────────────────────────────────────────────────────────

STATES = [
    # (name, id_code, population_weight, n_districts, base_pendency, civil_ratio, judge_sanctioned, vacancy_pct)
    ("Uttar Pradesh",       "UP",  1.0,  75, 11_200_000, 0.42, 3800, 0.32),
    ("Maharashtra",         "MH",  0.85, 36,  5_800_000, 0.48, 2700, 0.28),
    ("West Bengal",         "WB",  0.65, 23,  3_200_000, 0.51, 1600, 0.30),
    ("Bihar",               "BR",  0.72, 38,  4_100_000, 0.39, 1800, 0.38),
    ("Rajasthan",           "RJ",  0.58, 33,  3_800_000, 0.44, 1700, 0.29),
    ("Madhya Pradesh",      "MP",  0.62, 52,  3_600_000, 0.41, 1900, 0.33),
    ("Gujarat",             "GJ",  0.52, 26,  2_200_000, 0.49, 1400, 0.22),
    ("Karnataka",           "KA",  0.48, 31,  1_800_000, 0.50, 1500, 0.27),
    ("Andhra Pradesh",      "AP",  0.42, 13,  1_400_000, 0.46, 1100, 0.25),
    ("Tamil Nadu",          "TN",  0.44, 37,  1_600_000, 0.52, 1300, 0.24),
    ("Telangana",           "TS",  0.38, 33,  1_100_000, 0.47, 900,  0.26),
    ("Haryana",             "HR",  0.33, 22,  1_500_000, 0.43, 800,  0.29),
    ("Punjab",              "PB",  0.29, 23,  1_200_000, 0.45, 700,  0.28),
    ("Odisha",              "OD",  0.36, 30,  1_100_000, 0.40, 800,  0.31),
    ("Jharkhand",           "JH",  0.32, 24,    900_000, 0.38, 700,  0.36),
    ("Chhattisgarh",        "CG",  0.30, 28,    750_000, 0.40, 600,  0.33),
    ("Assam",               "AS",  0.28, 35,    650_000, 0.42, 550,  0.30),
    ("Kerala",              "KL",  0.26, 14,    620_000, 0.55, 700,  0.20),
    ("Uttarakhand",         "UK",  0.22, 13,    480_000, 0.43, 400,  0.30),
    ("Himachal Pradesh",    "HP",  0.18, 12,    290_000, 0.44, 280,  0.26),
    ("Jammu & Kashmir",     "JK",  0.20, 20,    360_000, 0.41, 320,  0.35),
    ("Delhi",               "DL",  0.40, 11,  1_800_000, 0.54, 800,  0.24),
    ("Goa",                 "GA",  0.08,  2,     95_000, 0.57, 100,  0.18),
    ("Manipur",             "MN",  0.07,  9,     85_000, 0.39, 80,   0.35),
    ("Meghalaya",           "ML",  0.07,  7,     75_000, 0.41, 70,   0.32),
    ("Tripura",             "TR",  0.07,  8,     80_000, 0.40, 75,   0.31),
    ("Arunachal Pradesh",   "AR",  0.06, 25,     55_000, 0.38, 60,   0.40),
    ("Nagaland",            "NL",  0.06,  8,     45_000, 0.37, 50,   0.38),
    ("Mizoram",             "MZ",  0.05,  8,     40_000, 0.42, 45,   0.35),
    ("Sikkim",              "SK",  0.03,  4,     22_000, 0.45, 30,   0.28),
    ("Chandigarh",          "CH",  0.08,  1,    120_000, 0.52, 80,   0.20),
    ("Puducherry",          "PY",  0.05,  4,     65_000, 0.53, 55,   0.22),
    ("Ladakh",              "LA",  0.03,  2,     18_000, 0.38, 20,   0.40),
    ("Lakshadweep",         "LD",  0.01,  1,      4_000, 0.48, 8,    0.25),
    ("Andaman & Nicobar Islands", "AN", 0.02, 3, 12_000, 0.44, 15,  0.30),
]

# Sample district names per state (abbreviated — generator fills remainder with generic names)
DISTRICT_SAMPLES = {
    "UP":  ["Lucknow", "Agra", "Prayagraj", "Kanpur Nagar", "Varanasi", "Meerut",
             "Gorakhpur", "Ghaziabad", "Bareilly", "Aligarh", "Moradabad", "Saharanpur",
             "Jhansi", "Faizabad", "Mathura", "Rampur", "Muzaffarnagar", "Azamgarh",
             "Bijnor", "Budaun", "Shahjahanpur", "Lakhimpur Kheri", "Ballia", "Jaunpur",
             "Sitapur", "Hardoi", "Pratapgarh", "Rae Bareli", "Unnao", "Etawah",
             "Mainpuri", "Etah", "Firozabad", "Hathras", "Kasganj", "Farrukhabad",
             "Kannauj", "Pilibhit", "Bahraich", "Basti", "Gonda", "Sultanpur",
             "Fatehpur", "Hamirpur", "Banda", "Chitrakoot", "Mirzapur", "Sonbhadra",
             "Sant Ravidas Nagar", "Chandauli", "Ghazipur", "Deoria", "Kushinagar",
             "Maharajganj", "Siddharthnagar", "Sant Kabir Nagar", "Ambedkar Nagar",
             "Shravasti", "Balrampur", "Barabanki", "Amethi", "Amroha",
             "Hapur", "Sambhal", "Shamli", "Mau", "Deoria"],
    "MH":  ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane",
             "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati",
             "Akola", "Latur", "Nanded", "Jalgaon", "Dhule",
             "Ahmednagar", "Raigad", "Ratnagiri", "Satara", "Sangli",
             "Osmanabad", "Beed", "Parbhani", "Wardha", "Yavatmal",
             "Chandrapur", "Gadchiroli", "Gondia", "Buldhana", "Washim",
             "Sindhudurg", "Hingoli", "Jalna", "Nandurbar", "Bhandara", "Pallghar"],
    "WB":  ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Hooghly",
             "Burdwan", "Nadia", "Murshidabad", "Malda", "West Midnapore",
             "East Midnapore", "Birbhum", "Bankura", "Purulia", "Cooch Behar",
             "Jalpaiguri", "Darjeeling", "North Dinajpur", "South Dinajpur",
             "Alipurduar", "Jhargram", "Kalimpong", "Paschim Bardhaman"],
    "DL":  ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
             "North West Delhi", "South Delhi", "South East Delhi", "South West Delhi",
             "West Delhi", "Shahdara"],
}

# Age distribution weights (0-1yr, 1-3yr, 3-5yr, 5-10yr, 10+yr)
def age_dist(total: int, severity: float) -> dict:
    """severity 0..1 controls proportion of older cases."""
    base = [0.22, 0.28, 0.18, 0.18, 0.14]
    aged = [0.12, 0.18, 0.18, 0.24, 0.28]
    w = [base[i] * (1 - severity) + aged[i] * severity for i in range(5)]
    s = sum(w)
    w = [x / s for x in w]
    counts = [int(total * x) for x in w]
    counts[-1] = total - sum(counts[:-1])
    return {
        "0_1yr": max(0, counts[0]),
        "1_3yr": max(0, counts[1]),
        "3_5yr": max(0, counts[2]),
        "5_10yr": max(0, counts[3]),
        "10plus_yr": max(0, counts[4]),
    }


def jitter(val: float, pct: float = 0.15) -> float:
    return val * (1 + random.uniform(-pct, pct))


# ─────────────────────────────────────────────────────────────────
# 2. GENERATE STATE AND DISTRICT DATA
# ─────────────────────────────────────────────────────────────────

def generate_states_and_districts():
    states_data = []
    districts_data = []

    for (sname, scode, pop_w, n_dist, base_pend, civil_ratio,
         judge_sanct, vac_pct) in STATES:

        total_pending = int(jitter(base_pend, 0.12))
        civil_pending = int(total_pending * jitter(civil_ratio, 0.05))
        criminal_pending = total_pending - civil_pending
        judges_working = int(judge_sanct * (1 - jitter(vac_pct, 0.10)))
        vacancy_rate = round(1 - judges_working / judge_sanct, 3)
        disposal_rate = round(jitter(0.72 - pop_w * 0.05, 0.08), 3)
        disposal_rate = max(0.45, min(0.92, disposal_rate))
        cases_per_judge = round(total_pending / max(judges_working, 1))
        backlog_severity = round(min(1.0, total_pending / 12_000_000), 4)

        severity_score = min(1.0, cases_per_judge / 8000)
        age_dist_data = age_dist(total_pending, severity_score)

        # Get district sample list
        sample = DISTRICT_SAMPLES.get(scode, [])
        districts_this_state = []
        used = set()

        # Fill up to n_dist districts
        for dname in sample[:n_dist]:
            districts_this_state.append(dname)
            used.add(dname)

        extra = n_dist - len(districts_this_state)
        for i in range(extra):
            dname = f"{sname} District {i+1}"
            districts_this_state.append(dname)

        # Per-district data
        dist_weights = [random.expovariate(1.0) for _ in districts_this_state]
        total_w = sum(dist_weights)

        for dname, dw in zip(districts_this_state, dist_weights):
            frac = dw / total_w
            d_pending = max(100, int(total_pending * frac))
            d_civil = int(d_pending * jitter(civil_ratio, 0.08))
            d_criminal = d_pending - d_civil
            d_judge_sanct = max(5, int(judge_sanct * frac * 1.1))
            d_judge_work = max(3, int(d_judge_sanct * (1 - jitter(vac_pct, 0.15))))
            d_disposal = round(jitter(disposal_rate, 0.10), 3)
            d_disposal = max(0.35, min(0.95, d_disposal))
            d_cpj = round(d_pending / max(d_judge_work, 1))
            d_severity = min(1.0, d_cpj / 8000)

            dist_id = make_id(sname, dname)
            canonical_dname = normalize_district(dname, sname)

            districts_data.append({
                "id": dist_id,
                "state_id": scode,
                "state_name": sname,
                "name": canonical_dname,
                "total_pending": d_pending,
                "civil_pending": d_civil,
                "criminal_pending": d_criminal,
                "judges_sanctioned": d_judge_sanct,
                "judges_working": d_judge_work,
                "vacancy_rate": round(1 - d_judge_work / d_judge_sanct, 3),
                "disposal_rate": d_disposal,
                "cases_per_judge": d_cpj,
                "backlog_severity": round(d_severity, 4),
                "age_distribution": age_dist(d_pending, d_severity),
            })

        state_id = make_id(sname)
        states_data.append({
            "id": scode,
            "slug": state_id,
            "name": sname,
            "total_pending": total_pending,
            "civil_pending": civil_pending,
            "criminal_pending": criminal_pending,
            "judges_sanctioned": judge_sanct,
            "judges_working": judges_working,
            "vacancy_rate": vacancy_rate,
            "disposal_rate": disposal_rate,
            "cases_per_judge": cases_per_judge,
            "backlog_severity": backlog_severity,
            "num_districts": n_dist,
            "age_distribution": age_dist_data,
        })

    return states_data, districts_data


# ─────────────────────────────────────────────────────────────────
# 3. GENERATE INDIA SUMMARY
# ─────────────────────────────────────────────────────────────────

def generate_summary(states_data):
    total_pending = sum(s["total_pending"] for s in states_data)
    civil_pending = sum(s["civil_pending"] for s in states_data)
    criminal_pending = sum(s["criminal_pending"] for s in states_data)
    judge_sanct = sum(s["judges_sanctioned"] for s in states_data)
    judge_work = sum(s["judges_working"] for s in states_data)

    age_keys = ["0_1yr", "1_3yr", "3_5yr", "5_10yr", "10plus_yr"]
    age_agg = {k: sum(s["age_distribution"][k] for s in states_data) for k in age_keys}

    return {
        "last_updated": "2024-12-01",
        "source": "NJDG (synthetic dataset — mirrors real schema)",
        "total_pending": total_pending,
        "civil_pending": civil_pending,
        "criminal_pending": criminal_pending,
        "total_judges_sanctioned": judge_sanct,
        "total_judges_working": judge_work,
        "vacancy_rate": round(1 - judge_work / judge_sanct, 4),
        "disposal_rate": round(
            sum(s["disposal_rate"] * s["total_pending"] for s in states_data) / total_pending, 4
        ),
        "cases_per_judge": round(total_pending / max(judge_work, 1)),
        "age_distribution": age_agg,
        "num_states": len(states_data),
        "num_districts": None,  # filled later
    }


# ─────────────────────────────────────────────────────────────────
# 4. GENERATE TIME SERIES
# ─────────────────────────────────────────────────────────────────

def generate_time_series(states_data):
    import datetime

    months = []
    start = datetime.date(2020, 1, 1)
    end = datetime.date(2024, 12, 1)
    d = start
    while d <= end:
        months.append(d.strftime("%Y-%m"))
        month = d.month + 1 if d.month < 12 else 1
        year = d.year if d.month < 12 else d.year + 1
        d = datetime.date(year, month, 1)

    total_pending_base = sum(s["total_pending"] for s in states_data)

    # National time series
    national = []
    current_pending = int(total_pending_base * 0.82)  # ~2020 baseline
    for i, month in enumerate(months):
        trend = 1 + 0.003 * i  # slight growth trend
        seasonal = 1 + 0.04 * math.sin(2 * math.pi * (i % 12) / 12)
        filed = int(jitter(1_100_000 * trend * seasonal, 0.06))
        disposed = int(jitter(filed * 0.87, 0.05))
        current_pending = current_pending + filed - disposed
        national.append({
            "month": month,
            "filed": filed,
            "disposed": disposed,
            "pending": max(current_pending, 30_000_000),
        })

    # Per-state time series (top 10 by pendency)
    top_states = sorted(states_data, key=lambda s: s["total_pending"], reverse=True)[:10]
    by_state = {}
    for st in top_states:
        st_series = []
        base_filed = int(st["total_pending"] * 0.09 / 12)
        pend = int(st["total_pending"] * 0.82)
        for i, month in enumerate(months):
            trend = 1 + 0.002 * i
            seasonal = 1 + 0.03 * math.sin(2 * math.pi * (i % 12) / 12)
            filed = int(jitter(base_filed * trend * seasonal, 0.08))
            disposed = int(jitter(filed * jitter(st["disposal_rate"], 0.05), 0.05))
            pend = pend + filed - disposed
            st_series.append({
                "month": month,
                "filed": filed,
                "disposed": disposed,
                "pending": max(pend, 0),
            })
        by_state[st["id"]] = st_series

    return {"national": national, "by_state": by_state}


# ─────────────────────────────────────────────────────────────────
# 5. EXPORT
# ─────────────────────────────────────────────────────────────────

def export_all():
    out_dir = Path(__file__).parent.parent / "frontend" / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Generating states and districts...")
    states_data, districts_data = generate_states_and_districts()

    print("Generating india summary...")
    summary = generate_summary(states_data)
    summary["num_districts"] = len(districts_data)

    print("Generating time series...")
    time_series = generate_time_series(states_data)

    def save(name, data):
        path = out_dir / name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        kb = path.stat().st_size / 1024
        print(f"  ✓ {name}  ({kb:.1f} KB, {len(data) if isinstance(data, list) else '—'} records)")

    save("india_summary.json", summary)
    save("states.json", states_data)
    save("districts.json", districts_data)
    save("time_series.json", time_series)

    print(f"\n✅ Datasets written to {out_dir}")
    print(f"   States: {len(states_data)}")
    print(f"   Districts: {len(districts_data)}")
    print(f"   Time series months: {len(time_series['national'])}")


if __name__ == "__main__":
    export_all()
