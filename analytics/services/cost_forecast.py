import datetime

def forecast_fleet_costs(data):
    current_monthly_fuel = float(data.get('current_monthly_fuel', 12000.0))
    current_monthly_maint = float(data.get('current_monthly_maintenance', 4500.0))
    
    predicted_fuel = current_monthly_fuel * 1.02
    predicted_maint = current_monthly_maint * 1.015
    
    annual_operating = (predicted_fuel + predicted_maint) * 12.0
    
    today = datetime.date.today()
    months_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    start_m = today.month
    forecast_trends = []
    
    for i in range(6):
        m_idx = (start_m + i) % 12
        forecast_trends.append({
            "month": months_labels[m_idx],
            "fuel_forecast": round(predicted_fuel * (1 + 0.005 * i), 2),
            "maintenance_forecast": round(predicted_maint * (1 + 0.003 * i), 2)
        })
        
    return {
        "monthly_fuel_forecast": round(predicted_fuel, 2),
        "monthly_maintenance_forecast": round(predicted_maint, 2),
        "annual_operating_forecast": round(annual_operating, 2),
        "forecast_trends": forecast_trends
    }
