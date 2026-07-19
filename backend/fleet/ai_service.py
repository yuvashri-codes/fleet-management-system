import os
import requests
import datetime
from django.core.cache import cache
from django.db import models
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance

FLASK_API_URL = os.getenv('FLASK_API_URL', 'http://localhost:5001')

class PredictiveAIService:
    
    @classmethod
    def get_maintenance_predictions(cls, user):
        cache_key = f"ai_maintenance_{user.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        if user.role == 'DRIVER':
            vehicles = Vehicle.objects.filter(assigned_driver__email=user.email)
        else:
            vehicles = Vehicle.objects.all()

        results = []
        for vehicle in vehicles:
            odometer = vehicle.current_odometer
            purchase_date = vehicle.purchase_date or datetime.date.today()
            age_months = max(1, (datetime.date.today() - purchase_date).days // 30)
            
            maint_count = Maintenance.objects.filter(vehicle=vehicle).count()
            
            fuel_logs = FuelLog.objects.filter(vehicle=vehicle)
            if fuel_logs.exists():
                fuel_avg = float(fuel_logs.aggregate(models.Avg('fuel_quantity'))['fuel_quantity__avg'] or 10.0)
            else:
                fuel_avg = 10.0
                
            trip_frequency = Trip.objects.filter(vehicle=vehicle).count()
            
            payload = {
                "odometer": odometer,
                "vehicle_age_months": age_months,
                "maintenance_history_count": maint_count,
                "fuel_consumption_avg": fuel_avg,
                "trip_frequency": trip_frequency
            }
            
            try:
                response = requests.post(f"{FLASK_API_URL}/predict/maintenance", json=payload, timeout=2.0)
                if response.status_code == 200:
                    pred = response.json()
                else:
                    pred = cls._get_fallback_maintenance(payload)
            except Exception as e:
                print(f"Flask Predictive Maintenance unreachable: {e}")
                pred = cls._get_fallback_maintenance(payload)
                
            pred["vehicle_id"] = vehicle.id
            pred["vehicle_number"] = vehicle.vehicle_number
            pred["brand"] = vehicle.brand
            pred["model"] = vehicle.model
            results.append(pred)
            
        cache.set(cache_key, results, 180)
        return results

    @classmethod
    def get_fuel_predictions(cls, user, distance=100.0, load_tons=5.0):
        if user.role == 'DRIVER':
            vehicles = Vehicle.objects.filter(assigned_driver__email=user.email)
        else:
            vehicles = Vehicle.objects.all()
            
        results = []
        for vehicle in vehicles:
            avg_mileage = float(vehicle.mileage or 10.0)
            trip_freq = max(1, Trip.objects.filter(vehicle=vehicle).count())
            
            payload = {
                "distance": distance,
                "average_mileage": avg_mileage,
                "trip_frequency": trip_freq,
                "load_tons": load_tons
            }
            
            try:
                response = requests.post(f"{FLASK_API_URL}/predict/fuel", json=payload, timeout=2.0)
                if response.status_code == 200:
                    pred = response.json()
                else:
                    pred = cls._get_fallback_fuel(payload)
            except Exception as e:
                print(f"Flask Fuel prediction unreachable: {e}")
                pred = cls._get_fallback_fuel(payload)
                
            pred["vehicle_id"] = vehicle.id
            pred["vehicle_number"] = vehicle.vehicle_number
            pred["brand"] = vehicle.brand
            pred["model"] = vehicle.model
            results.append(pred)
            
        return results

    @classmethod
    def get_driver_scores(cls, user):
        cache_key = f"ai_drivers_{user.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        if user.role == 'DRIVER':
            drivers = Driver.objects.filter(email=user.email)
        else:
            drivers = Driver.objects.all()
            
        results = []
        for driver in drivers:
            trips = Trip.objects.filter(driver=driver)
            total_trips = trips.count()
            completed = trips.filter(current_status='COMPLETED').count()
            
            completion_rate = (completed / total_trips * 100.0) if total_trips > 0 else 100.0
            avg_dist = float(trips.aggregate(models.Avg('distance'))['distance__avg'] or 100.0)
            
            fuel_logs = FuelLog.objects.filter(driver=driver)
            avg_mileage = float(fuel_logs.aggregate(models.Avg('mileage'))['mileage__avg'] or 12.0)
            
            penalty_score = float(trips.filter(current_status='CANCELLED').count() * 1.5)
            penalty_score = min(10.0, penalty_score)
            
            driver_rating = 4.0 + (min(10, driver.experience) / 10.0)
            
            payload = {
                "driver_rating": driver_rating,
                "trip_completion_rate": completion_rate,
                "average_distance": avg_dist,
                "average_fuel_efficiency": avg_mileage,
                "penalty_score": penalty_score
            }
            
            try:
                response = requests.post(f"{FLASK_API_URL}/predict/driver-score", json=payload, timeout=2.0)
                if response.status_code == 200:
                    pred = response.json()
                else:
                    pred = cls._get_fallback_driver_score(payload)
            except Exception as e:
                print(f"Flask Driver score unreachable: {e}")
                pred = cls._get_fallback_driver_score(payload)
                
            pred["driver_id"] = driver.id
            pred["driver_name"] = driver.name
            pred["employee_id"] = driver.employee_id
            results.append(pred)
            
        results.sort(key=lambda x: x['overall_score'], reverse=True)
        cache.set(cache_key, results, 180)
        return results

    @classmethod
    def get_fleet_health(cls, user):
        cache_key = f"ai_fleet_health_{user.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
            
        if user.role == 'DRIVER':
            v_total = Vehicle.objects.filter(assigned_driver__email=user.email).count()
            v_maint = Vehicle.objects.filter(assigned_driver__email=user.email, status='MAINTENANCE').count()
            trips = Trip.objects.filter(driver__email=user.email)
            fuel = FuelLog.objects.filter(driver__email=user.email)
            drv_perf = 90.0
        else:
            v_total = Vehicle.objects.count()
            v_maint = Vehicle.objects.filter(status='MAINTENANCE').count()
            trips = Trip.objects.all()
            fuel = FuelLog.objects.all()
            drv_scores = cls.get_driver_scores(user)
            drv_perf = sum([d['overall_score'] for d in drv_scores]) / len(drv_scores) if drv_scores else 85.0

        v_avail = v_total - v_maint
        availability_pct = (v_avail / v_total * 100.0) if v_total > 0 else 100.0
        
        avg_fuel_eff = float(fuel.aggregate(models.Avg('mileage'))['mileage__avg'] or 10.0)
        fuel_eff_pct = min(100.0, (avg_fuel_eff / 12.0) * 100.0)
        
        maint_health = 100.0
        if v_total > 0:
            maint_health = ((v_total - v_maint) / v_total) * 100.0
            
        completed = trips.filter(current_status='COMPLETED').count()
        total_trips = trips.count()
        success_rate = (completed / total_trips * 100.0) if total_trips > 0 else 100.0
        
        payload = {
            "vehicle_availability": availability_pct,
            "fuel_efficiency": fuel_eff_pct,
            "maintenance_health": maint_health,
            "trip_success_rate": success_rate,
            "driver_performance": drv_perf
        }
        
        try:
            response = requests.get(f"{FLASK_API_URL}/predict/fleet-health", params=payload, timeout=2.0)
            if response.status_code == 200:
                result = response.json()
            else:
                result = cls._get_fallback_fleet_health(payload)
        except Exception as e:
            print(f"Flask Fleet Health unreachable: {e}")
            result = cls._get_fallback_fleet_health(payload)
            
        cache.set(cache_key, result, 180)
        return result

    @classmethod
    def get_cost_forecast(cls, user):
        if user.role == 'DRIVER':
            fuel_sum = float(FuelLog.objects.filter(driver__email=user.email).aggregate(models.Sum('total_cost'))['total_cost__sum'] or 0.0)
            maint_sum = 0.0
        else:
            fuel_sum = float(FuelLog.objects.aggregate(models.Sum('total_cost'))['total_cost__sum'] or 0.0)
            maint_sum = float(Maintenance.objects.aggregate(models.Sum('actual_cost'))['actual_cost__sum'] or 0.0)
            if maint_sum == 0.0:
                maint_sum = float(Maintenance.objects.aggregate(models.Sum('estimated_cost'))['estimated_cost__sum'] or 0.0)

        payload = {
            "current_monthly_fuel": fuel_sum / 2.0 if fuel_sum > 0 else 8500.0,
            "current_monthly_maintenance": maint_sum / 2.0 if maint_sum > 0 else 3200.0
        }
        
        try:
            response = requests.get(f"{FLASK_API_URL}/predict/cost-forecast", params=payload, timeout=2.0)
            if response.status_code == 200:
                result = response.json()
            else:
                result = cls._get_fallback_cost_forecast(payload)
        except Exception as e:
            print(f"Flask Cost Forecast unreachable: {e}")
            result = cls._get_fallback_cost_forecast(payload)
            
        return result

    @classmethod
    def get_intelligent_recommendations(cls, user):
        if user.role == 'DRIVER':
            vehicles = Vehicle.objects.filter(assigned_driver__email=user.email)
        else:
            vehicles = Vehicle.objects.all()
            
        maintenance_issues = []
        high_cost_vehicles = []
        drivers_low_score = []
        
        for v in vehicles.filter(current_odometer__gt=100000):
            maintenance_issues.append({
                "vehicle_number": v.vehicle_number,
                "odometer": v.current_odometer
            })
            
        for v in vehicles:
            fuel_sum = float(FuelLog.objects.filter(vehicle=v).aggregate(models.Sum('total_cost'))['total_cost__sum'] or 0.0)
            if fuel_sum > 3000.0:
                high_cost_vehicles.append({
                    "vehicle_number": v.vehicle_number,
                    "cost": fuel_sum
                })
                
        drv_scores = cls.get_driver_scores(user)
        for ds in drv_scores:
            if ds['overall_score'] < 75:
                drivers_low_score.append({
                    "name": ds['driver_name'],
                    "score": ds['overall_score']
                })
                
        payload = {
            "maintenance_issues": maintenance_issues[:3],
            "high_cost_vehicles": high_cost_vehicles[:3],
            "drivers_low_score": drivers_low_score[:3]
        }
        
        try:
            response = requests.post(f"{FLASK_API_URL}/recommendations", json=payload, timeout=2.0)
            if response.status_code == 200:
                result = response.json()
            else:
                result = cls._get_fallback_recommendations(payload)
        except Exception as e:
            print(f"Flask Recommendations unreachable: {e}")
            result = cls._get_fallback_recommendations(payload)
            
        return result

    @classmethod
    def _get_fallback_maintenance(cls, payload):
        import datetime
        odometer = payload['odometer']
        age = payload['vehicle_age_months']
        maint_count = payload['maintenance_history_count']
        fuel_avg = payload['fuel_consumption_avg']
        
        score = (odometer / 150000) * 0.4 + (age / 120) * 0.3 - (maint_count / 15) * 0.2 + (fuel_avg / 25.0) * 0.2
        import numpy as np
        prob = float(1 / (1 + np.exp(-10 * (score - 0.45))))
        risk = 'LOW' if prob < 0.35 else 'MEDIUM' if prob < 0.70 else 'HIGH'
        days = 60 if risk == 'LOW' else 14 if risk == 'MEDIUM' else 3
        s_date = (datetime.date.today() + datetime.timedelta(days=days)).isoformat()
        return {"maintenance_probability": round(prob, 2), "risk_level": risk, "suggested_service_date": s_date}

    @classmethod
    def _get_fallback_fuel(cls, payload):
        dist = payload['distance']
        mileage = payload['average_mileage']
        freq = payload['trip_frequency']
        load = payload['load_tons']
        cons = (dist / mileage) * (1 + 0.015 * load) * freq
        cost = cons * 1.35
        eff = int(min(100, max(10, (dist / mileage) / (cons / freq) * 100))) if cons > 0 else 90
        return {"expected_fuel_consumption": round(cons, 1), "expected_cost": round(cost, 2), "efficiency_score": eff}

    @classmethod
    def _get_fallback_driver_score(cls, payload):
        rating = payload['driver_rating']
        completion = payload['trip_completion_rate']
        dist = payload['average_distance']
        eff = payload['average_fuel_efficiency']
        penalties = payload['penalty_score']
        
        driving_eff = max(10.0, min(100.0, 95.0 - penalties * 4.0))
        score = int(max(0, min(100, 0.25 * (rating / 5 * 100) + 0.25 * completion + 0.25 * driving_eff + 0.25 * (eff / 20 * 100) - penalties * 2)))
        return {"driver_rating": round(rating, 2), "driving_efficiency": round(driving_eff, 1), "trip_completion_rate": round(completion, 1), "average_distance": round(dist, 1), "average_fuel_efficiency": round(eff, 1), "penalty_score": round(penalties, 1), "overall_score": score}

    @classmethod
    def _get_fallback_fleet_health(cls, payload):
        avg_score = sum(payload.values()) / len(payload)
        recs = ["Optimal backup health diagnostics enabled."]
        return {"overall_score": int(avg_score), "vehicle_availability": payload["vehicle_availability"], "fuel_efficiency": payload["fuel_efficiency"], "maintenance_health": payload["maintenance_health"], "trip_success_rate": payload["trip_success_rate"], "driver_performance": payload["driver_performance"], "recommendations": recs}

    @classmethod
    def _get_fallback_cost_forecast(cls, payload):
        fuel = payload['current_monthly_fuel'] * 1.02
        maint = payload['current_monthly_maintenance'] * 1.015
        annual = (fuel + maint) * 12.0
        return {"monthly_fuel_forecast": round(fuel, 2), "monthly_maintenance_forecast": round(maint, 2), "annual_operating_forecast": round(annual, 2), "forecast_trends": []}

    @classmethod
    def _get_fallback_recommendations(cls, payload):
        return [
            {"category": "MAINTENANCE", "title": "Check engine sensors", "detail": "Preventive diagnostics cycle scheduled.", "impact": "Prevents breakdown risks"},
            {"category": "FUEL", "title": "Review routes", "detail": "High traffic routes optimize search.", "impact": "Saves fuel costs"}
        ]
