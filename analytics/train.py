import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression

# Setup folders
base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_dir = os.path.join(base_dir, 'dataset')
models_dir = os.path.join(base_dir, 'trained_models')

os.makedirs(dataset_dir, exist_ok=True)
os.makedirs(models_dir, exist_ok=True)

def train_maintenance_model():
    print("Generating predictive maintenance training dataset...")
    np.random.seed(42)
    n_samples = 1000
    
    odometer = np.random.randint(5000, 150000, n_samples)
    vehicle_age = np.random.randint(6, 120, n_samples)
    maint_count = np.random.randint(0, 15, n_samples)
    fuel_avg = np.random.uniform(5.0, 25.0, n_samples)
    trip_freq = np.random.randint(5, 60, n_samples)
    
    # Calculate target label based on feature thresholds
    # High odometer, older vehicle, low maintenance count, high fuel consumption -> high risk
    score = (odometer / 150000) * 0.4 + (vehicle_age / 120) * 0.3 - (maint_count / 15) * 0.2 + (fuel_avg / 25.0) * 0.2
    prob = 1 / (1 + np.exp(-10 * (score - 0.45)))
    target = np.random.binomial(1, prob)
    
    df = pd.DataFrame({
        'odometer': odometer,
        'vehicle_age_months': vehicle_age,
        'maintenance_history_count': maint_count,
        'fuel_consumption_avg': fuel_avg,
        'trip_frequency': trip_freq,
        'maintenance_required': target
    })
    
    csv_path = os.path.join(dataset_dir, 'maintenance.csv')
    df.to_csv(csv_path, index=False)
    print(f"Saved dataset to {csv_path}")
    
    X = df.drop('maintenance_required', axis=1)
    y = df['maintenance_required']
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    model_path = os.path.join(models_dir, 'maintenance_model.joblib')
    joblib.dump(model, model_path)
    print(f"Trained & saved maintenance model to {model_path}")

def train_fuel_model():
    print("Generating fuel consumption training dataset...")
    np.random.seed(42)
    n_samples = 1000
    
    distance = np.random.uniform(10.0, 1000.0, n_samples)
    avg_mileage = np.random.uniform(5.0, 20.0, n_samples)
    trip_freq = np.random.randint(1, 10, n_samples)
    load_tons = np.random.uniform(1.0, 40.0, n_samples)
    
    # Base formula: fuel = distance / mileage
    # Load adds extra fuel consumption (e.g. +1.5% per ton)
    fuel_cons = (distance / avg_mileage) * (1 + 0.015 * load_tons)
    # Add random noise
    fuel_cons += np.random.normal(0, fuel_cons * 0.05)
    fuel_cons = np.clip(fuel_cons, 0.5, None)
    
    df = pd.DataFrame({
        'distance': distance,
        'average_mileage': avg_mileage,
        'trip_frequency': trip_freq,
        'load_tons': load_tons,
        'fuel_consumption': fuel_cons
    })
    
    csv_path = os.path.join(dataset_dir, 'fuel.csv')
    df.to_csv(csv_path, index=False)
    print(f"Saved dataset to {csv_path}")
    
    X = df.drop('fuel_consumption', axis=1)
    y = df['fuel_consumption']
    
    model = LinearRegression()
    model.fit(X, y)
    
    model_path = os.path.join(models_dir, 'fuel_model.joblib')
    joblib.dump(model, model_path)
    print(f"Trained & saved fuel model to {model_path}")

if __name__ == '__main__':
    train_maintenance_model()
    train_fuel_model()
    print("Machine learning training completed successfully!")
