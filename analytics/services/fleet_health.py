def calculate_fleet_health(data):
    vehicle_availability = float(data.get('vehicle_availability', 92.0))
    fuel_efficiency = float(data.get('fuel_efficiency', 85.0))
    maintenance_health = float(data.get('maintenance_health', 88.0))
    trip_success_rate = float(data.get('trip_success_rate', 96.0))
    driver_performance = float(data.get('driver_performance', 89.0))
    
    overall_score = (
        0.20 * vehicle_availability +
        0.20 * fuel_efficiency +
        0.20 * maintenance_health +
        0.20 * trip_success_rate +
        0.20 * driver_performance
    )
    overall_score = max(0, min(100, int(overall_score)))
    
    recs = []
    if vehicle_availability < 90:
        recs.append("Increase vehicle availability by resolving pending corrective maintenance tickets.")
    if fuel_efficiency < 85:
        recs.append("Optimize fuel usage by retiring older high-cost vehicles and routing fuel card audits.")
    if maintenance_health < 90:
        recs.append("Schedule preventive maintenance ahead of deadlines to reduce emergency repair risks.")
    if trip_success_rate < 95:
        recs.append("Investigate trip cancellation patterns and dispatch routes planning systems.")
    if driver_performance < 90:
        recs.append("Enroll low-scoring operators in safety and efficiency training programs.")
        
    if not recs:
        recs.append("Fleet health index is optimal. Maintain scheduled preventive diagnostics intervals.")
        
    return {
        "overall_score": overall_score,
        "vehicle_availability": vehicle_availability,
        "fuel_efficiency": fuel_efficiency,
        "maintenance_health": maintenance_health,
        "trip_success_rate": trip_success_rate,
        "driver_performance": driver_performance,
        "recommendations": recs
    }
