import json
import os

def scale_time_series():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ts_file = os.path.join(project_root, "frontend", "public", "data", "time_series.json")
    
    with open(ts_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Find the pending value for Jan 2021
    jan_2021_pending = None
    for pt in data.get('national', []):
        if pt['month'] == '2021-01':
            jan_2021_pending = pt['pending']
            break
            
    if not jan_2021_pending:
        print("Could not find Jan 2021 national data")
        return
        
    # The real data total pending from states_cases.csv is ~37,341,287
    target_pending = 37341287
    scale_factor = target_pending / jan_2021_pending
    
    print(f"Scaling all time series data by factor {scale_factor:.4f}...")
    
    def scale_points(pts):
        for pt in pts:
            pt['filed'] = int(pt['filed'] * scale_factor)
            pt['disposed'] = int(pt['disposed'] * scale_factor)
            pt['pending'] = int(pt['pending'] * scale_factor)
            
    scale_points(data.get('national', []))
    for state, pts in data.get('by_state', {}).items():
        scale_points(pts)
        
    with open(ts_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
        
    print("Done scaling time_series.json")

if __name__ == "__main__":
    scale_time_series()
