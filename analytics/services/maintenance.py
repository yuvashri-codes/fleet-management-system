import os
import joblib
import datetime
import numpy as np

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(base_dir, 'trained_models', 'maintenance_model.joblib')

def predict_maintenance_risk(data):
    odometer = float(data.get('odometer', 10000))
    age = float(data.get('vehicle_age_months', 12))
    maint_count = float(data.get('maintenance_history_count', 0))
    fuel_avg = float(data.get('fuel_consumption_avg', 10.0))
    trip_freq = float(data.get('trip_frequency', 10))
    
    # Try to load model
    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            features = [[odometer, age, maint_count, fuel_avg, trip_freq]]
            prob = float(model.predict_proba(features)[0][1])
        except Exception as e:
            print(f"Error in model prediction: {e}")
            prob = calculate_fallback_risk(odometer, age, maint_count, fuel_avg)
    else:
        prob = calculate_fallback_risk(odometer, age, maint_count, fuel_avg)
        
    # Map risk levels
    if prob < 0.35:
        risk_level = 'LOW'
        days_to_service = 60
    elif prob < 0.70:
        risk_level = 'MEDIUM'
        days_to_service = 14
    else:
        risk_level = 'HIGH'
        days_to_service = 3
        
    suggested_date = (datetime.date.today() + datetime.timedelta(days=days_to_service)).isoformat()
    
    return {
        "maintenance_probability": round(prob, 2),
        "risk_level": risk_level,
        "suggested_service_date": suggested_date
    }

def calculate_fallback_risk(odometer, age, maint_count, fuel_avg):
    score = (odometer / 150000) * 0.4 + (age / 120) * 0.3 - (maint_count / 15) * 0.2 + (fuel_avg / 25.0) * 0.2
    prob = 1 / (1 + np.exp(-10 * (score - 0.45)))
    return float(prob)
