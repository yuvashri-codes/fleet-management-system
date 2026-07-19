def generate_recommendations(data):
    maintenance_issues = data.get('maintenance_issues', [])
    high_cost_vehicles = data.get('high_cost_vehicles', [])
    drivers_low_score = data.get('drivers_low_score', [])
    
    recs = []
    
    for issue in maintenance_issues:
        recs.append({
            "category": "MAINTENANCE",
            "title": f"Schedule maintenance for {issue['vehicle_number']}",
            "detail": f"Odometer is at {issue['odometer']} KM. High probability of service requirement soon.",
            "impact": "Reduces road breakdown risks by 40%"
        })
        
    for vehicle in high_cost_vehicles:
        recs.append({
            "category": "COST",
            "title": f"Evaluate replacement of vehicle {vehicle['vehicle_number']}",
            "detail": f"Fuel expenses are high and mileage is below efficiency benchmarks.",
            "impact": "Reduces fuel costs by up to 25%"
        })
        
    for driver in drivers_low_score:
        recs.append({
            "category": "TRAINING",
            "title": f"Coaching required for driver {driver['name']}",
            "detail": f"Driver safety and performance score is currently low ({driver['score']}/100).",
            "impact": "Improves trip dispatch safety metrics"
        })
        
    if not recs:
        recs.append({
            "category": "MAINTENANCE",
            "title": "Optimize preventive maintenance cycles",
            "detail": "Vehicles with odometer > 100k KM should be scheduled for multi-point fluid checks.",
            "impact": "Reduces corrective maintenance costs by 15%"
        })
        recs.append({
            "category": "FUEL",
            "title": "Reduce idle time guidelines",
            "detail": "Review idle logs on active trips to enforce driver operator safety rules.",
            "impact": "Reduces fuel consumption costs by 8%"
        })
        recs.append({
            "category": "OPERATION",
            "title": "Re-routing long-haul dispatches",
            "detail": "Plan trip logistics based on highway conditions and low traffic time windows.",
            "impact": "Improves trip completion rates"
        })
        
    return recs
