def calculate_driver_performance(data):
    driver_rating = float(data.get('driver_rating', 4.5))
    completion_rate = float(data.get('trip_completion_rate', 95.0))
    avg_dist = float(data.get('average_distance', 150.0))
    avg_fuel_eff = float(data.get('average_fuel_efficiency', 10.0))
    penalty_score = float(data.get('penalty_score', 0.0))
    
    # Calculate scores
    driving_eff = max(10.0, min(100.0, 95.0 - penalty_score * 4.0))
    
    # Weighted average overall score
    rating_pct = (driver_rating / 5.0) * 100.0
    fuel_eff_pct = min(100.0, (avg_fuel_eff / 20.0) * 100.0)
    
    overall_score = (
        0.25 * rating_pct +
        0.25 * completion_rate +
        0.25 * driving_eff +
        0.25 * fuel_eff_pct -
        penalty_score * 2.0
    )
    overall_score = max(0, min(100, int(overall_score)))
    
    return {
        "driver_rating": round(driver_rating, 2),
        "driving_efficiency": round(driving_eff, 1),
        "trip_completion_rate": round(completion_rate, 1),
        "average_distance": round(avg_dist, 1),
        "average_fuel_efficiency": round(avg_fuel_eff, 1),
        "penalty_score": round(penalty_score, 1),
        "overall_score": overall_score
    }
