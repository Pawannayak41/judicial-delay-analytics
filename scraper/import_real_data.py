import csv
import json
import math
import os
import sys

from normalize import normalize_state, make_id, normalize_district

# Hardcoded State ID mapping to match existing map properties
STATE_ID_MAP = {
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Bihar": "BR",
    "Chhattisgarh": "CG",
    "Goa": "GA",
    "Gujarat": "GJ",
    "Haryana": "HR",
    "Himachal Pradesh": "HP",
    "Jharkhand": "JH",
    "Karnataka": "KA",
    "Kerala": "KL",
    "Madhya Pradesh": "MP",
    "Maharashtra": "MH",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "Nagaland": "NL",
    "Odisha": "OD",
    "Punjab": "PB",
    "Rajasthan": "RJ",
    "Sikkim": "SK",
    "Tamil Nadu": "TN",
    "Telangana": "TS",
    "Tripura": "TR",
    "Uttar Pradesh": "UP",
    "Uttarakhand": "UK",
    "West Bengal": "WB",
    "Andaman & Nicobar Islands": "AN",
    "Chandigarh": "CH",
    "Dadra & NH and Daman & Diu": "DN", # Used generic DN
    "Delhi": "DL",
    "Jammu & Kashmir": "JK",
    "Ladakh": "LA",
    "Lakshadweep": "LD",
    "Puducherry": "PY"
}

def parse_int(val):
    if not val:
        return 0
    try:
        # handle commas in numbers
        v = str(val).replace(',', '').strip()
        return int(v)
    except:
        return 0

def process_age_distribution(row):
    # Total
    age_0_1 = parse_int(row.get('0 to 1 Years_Total', 0))
    age_1_3 = parse_int(row.get('1 to 3 Years_Total', 0))
    age_3_5 = parse_int(row.get('3 to 5 Years_Total', 0))
    age_5_10 = parse_int(row.get('5 to 10 Years_Total', 0))
    
    # sum up the 10+ years
    age_10_20 = parse_int(row.get('10 to 20 Years_Total', 0))
    age_20_30 = parse_int(row.get('20 to 30 Years_Total', 0))
    age_above_30 = parse_int(row.get('Above 30 Years_Total', 0))
    age_10plus = age_10_20 + age_20_30 + age_above_30
    
    return {
        "0_1yr": age_0_1,
        "1_3yr": age_1_3,
        "3_5yr": age_3_5,
        "5_10yr": age_5_10,
        "10plus_yr": age_10plus
    }

def generate_mock_judge_stats(total_cases):
    # Let's assume ~3000 cases per judge on average
    # Let's assume a vacancy rate around 20-40%
    if total_cases == 0:
        return 0, 0, 0.0, 0.0, 0
    
    working = max(math.ceil(total_cases / 3000), 3)
    sanctioned = math.ceil(working / 0.7) # 30% vacancy
    vacancy_rate = round((sanctioned - working) / sanctioned, 3)
    disposal_rate = 0.65 # mock disposal rate
    cases_per_judge = math.ceil(total_cases / working)
    
    return sanctioned, working, vacancy_rate, disposal_rate, cases_per_judge

def import_real_data():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ref_dir = os.path.join(project_root, "Case-Pendency-Ref", "Final Visualization")
    
    states_csv = os.path.join(ref_dir, "states_cases.csv")
    districts_csv = os.path.join(ref_dir, "districts_cases.csv")
    
    frontend_data_dir = os.path.join(project_root, "frontend", "public", "data")
    
    if not os.path.exists(states_csv) or not os.path.exists(districts_csv):
        print(f"Error: Could not find CSV files in {ref_dir}")
        return
        
    print(f"Parsing states from {states_csv}")
    states_data = []
    india_summary = {
        "total_pending": 0,
        "civil_pending": 0,
        "criminal_pending": 0,
        "total_judges_sanctioned": 0,
        "total_judges_working": 0,
        "vacancy_rate": 0,
        "disposal_rate": 0,
        "cases_per_judge": 0,
        "backlog_severity": 0,
        "age_distribution": {
            "0_1yr": 0, "1_3yr": 0, "3_5yr": 0, "5_10yr": 0, "10plus_yr": 0
        }
    }
    
    # Keep track of district count per state
    district_counts = {}
    
    # Process districts first to get counts
    districts_data = []
    print(f"Parsing districts from {districts_csv}")
    with open(districts_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_state = row.get('State', '').strip()
            if not raw_state: continue
            
            state_name = normalize_state(raw_state)
            state_slug = make_id(state_name)
            state_id = STATE_ID_MAP.get(state_name, state_slug.upper()[:2])
            
            raw_district = row.get('District', '').strip()
            if not raw_district: continue
            
            district_name = normalize_district(raw_district, state_name)
            district_id = f"{state_slug}__{make_id(district_name)}"
            
            if state_id not in district_counts:
                district_counts[state_id] = 0
            district_counts[state_id] += 1
            
            total_pending = parse_int(row.get('Total_Total', 0))
            civil_pending = parse_int(row.get('Total_Civil', 0))
            criminal_pending = parse_int(row.get('Total_Criminal', 0))
            
            sanctioned, working, vac_rate, disp_rate, cpj = generate_mock_judge_stats(total_pending)
            backlog_severity = round(min(cpj / 8000, 1.0), 4) # normalized to 0-1
            
            age_dist = process_age_distribution(row)
            
            districts_data.append({
                "id": district_id,
                "state_id": state_id,
                "state_name": state_name,
                "name": district_name,
                "total_pending": total_pending,
                "civil_pending": civil_pending,
                "criminal_pending": criminal_pending,
                "judges_sanctioned": sanctioned,
                "judges_working": working,
                "vacancy_rate": vac_rate,
                "disposal_rate": disp_rate,
                "cases_per_judge": cpj,
                "backlog_severity": backlog_severity,
                "age_distribution": age_dist
            })

    # Process states
    with open(states_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_state = row.get('State', '').strip()
            if not raw_state: continue
            
            state_name = normalize_state(raw_state)
            state_slug = make_id(state_name)
            state_id = STATE_ID_MAP.get(state_name, state_slug.upper()[:2])
            
            total_pending = parse_int(row.get('Total_Total', 0))
            civil_pending = parse_int(row.get('Total_Civil', 0))
            criminal_pending = parse_int(row.get('Total_Criminal', 0))
            
            sanctioned, working, vac_rate, disp_rate, cpj = generate_mock_judge_stats(total_pending)
            backlog_severity = round(min(cpj / 8000, 1.0), 4)
            
            age_dist = process_age_distribution(row)
            
            # Add to national summary
            india_summary["total_pending"] += total_pending
            india_summary["civil_pending"] += civil_pending
            india_summary["criminal_pending"] += criminal_pending
            india_summary["total_judges_sanctioned"] += sanctioned
            india_summary["total_judges_working"] += working
            for k in age_dist:
                india_summary["age_distribution"][k] += age_dist[k]
                
            states_data.append({
                "id": state_id,
                "slug": state_slug,
                "name": state_name,
                "total_pending": total_pending,
                "civil_pending": civil_pending,
                "criminal_pending": criminal_pending,
                "judges_sanctioned": sanctioned,
                "judges_working": working,
                "vacancy_rate": vac_rate,
                "disposal_rate": disp_rate,
                "cases_per_judge": cpj,
                "backlog_severity": backlog_severity,
                "num_districts": district_counts.get(state_id, 0),
                "age_distribution": age_dist
            })
            
    # Calculate derived stats for India summary
    w = india_summary["total_judges_working"]
    s = india_summary["total_judges_sanctioned"]
    india_summary["vacancy_rate"] = round((s - w) / s, 3) if s > 0 else 0
    india_summary["cases_per_judge"] = math.ceil(india_summary["total_pending"] / w) if w > 0 else 0
    india_summary["disposal_rate"] = 0.65
    india_summary["backlog_severity"] = round(min(india_summary["cases_per_judge"] / 8000, 1.0), 4)
    india_summary["last_updated"] = "2021-01-29T00:00:00Z"
    india_summary["source"] = "NJDG (Scraped via Case-Pendency repo)"
    india_summary["num_states"] = len(states_data)
    india_summary["num_districts"] = len(districts_data)
    
    # Save files
    with open(os.path.join(frontend_data_dir, "states.json"), "w", encoding='utf-8') as f:
        json.dump(states_data, f, separators=(',', ':'))
        
    with open(os.path.join(frontend_data_dir, "districts.json"), "w", encoding='utf-8') as f:
        json.dump(districts_data, f, separators=(',', ':'))
        
    with open(os.path.join(frontend_data_dir, "india_summary.json"), "w", encoding='utf-8') as f:
        json.dump(india_summary, f, separators=(',', ':'))
        
    print(f"Successfully processed {len(states_data)} states and {len(districts_data)} districts.")

if __name__ == "__main__":
    import_real_data()
