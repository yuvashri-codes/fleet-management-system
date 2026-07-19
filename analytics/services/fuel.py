import os
import joblib

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(base_dir, 'trained_models', 'fuel_model.joblib')

def predict_fuel_consumption(data):
    distance = float(data.get('distance', 100.0))
    avg_mileage = float(data.get('average_mileage', 10.0))
    trip_freq = float(data.get('trip_frequency', 1.0))
    load_tons = float(data.get('load_tons', 10.0))
    
    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            features = [[distance, avg_mileage, trip_freq, load_tons]]
            expected_consumption = float(model.predict(features)[0])
        except Exception as e:
            print(f"Error in fuel prediction: {e}")
            expected_consumption = (distance / avg_mileage) * (1 + 0.015 * load_tons)
    else:
        expected_consumption = (distance / avg_mileage) * (1 + 0.015 * load_tons)
        
    expected_consumption = max(0.5, expected_consumption)
    total_consumption = expected_consumption * trip_freq
    
    cost_per_liter = 1.35
    expected_cost = total_consumption * cost_per_liter
    
    base_consumption = distance / avg_mileage
    if base_consumption > 0:
        eff_ratio = base_consumption / expected_consumption
        eff_score = int(min(100, max(10, eff_ratio * 100)))
    else:
        eff_score = 90
        
    return {
        "expected_fuel_consumption": round(total_consumption, 1),
        "expected_cost": round(expected_cost, 2),
        "efficiency_score": eff_score
    }
