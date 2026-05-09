import json
import os

def generate_time_series():
    # End target is 2021 with ~37.3M total pending.
    # We will generate data backwards from 2021 to 2011 to simulate growth.
    
    years = list(range(2011, 2022))
    
    # Simulate a steady growth in pendency over the decade.
    # E.g., 2011 = ~24M, growing to 37.3M in 2021
    
    data = []
    
    base_pending = 24500000
    base_civil = 7000000
    base_criminal = 17500000
    
    for i, year in enumerate(years):
        # Add some random-ish growth
        factor = (i / len(years)) ** 1.2
        
        target_total = int(base_pending + factor * (37341287 - base_pending))
        
        if year == 2021:
            target_civil = 10098092
            target_criminal = 27243195
        else:
            target_civil = int(base_civil + factor * (10098092 - base_civil))
            target_criminal = int(base_criminal + factor * (27243195 - base_criminal))
        
        # Simulate clearance rate (usually hovers between 50-70%)
        # In 2020-2021 it dipped due to COVID
        clearance_rate = 0.65 if year < 2020 else (0.52 if year == 2020 else 0.58)
        
        data.append({
            "year": year,
            "total_pending": target_total,
            "civil_pending": target_civil,
            "criminal_pending": target_criminal,
            "clearance_rate": clearance_rate
        })
        
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ts_file = os.path.join(project_root, "frontend", "public", "data", "time_series.json")
    
    with open(ts_file, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(',', ':'))
        
    print(f"Generated time_series.json with {len(data)} records.")

if __name__ == "__main__":
    generate_time_series()
