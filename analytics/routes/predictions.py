from flask import Blueprint, request, jsonify
from services.maintenance import predict_maintenance_risk
from services.fuel import predict_fuel_consumption
from services.driver_score import calculate_driver_performance
from services.fleet_health import calculate_fleet_health
from services.cost_forecast import forecast_fleet_costs

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/predict/maintenance', methods=['POST'])
def predict_maintenance():
    data = request.get_json() or {}
    result = predict_maintenance_risk(data)
    return jsonify(result)

@predictions_bp.route('/predict/fuel', methods=['POST'])
def predict_fuel():
    data = request.get_json() or {}
    result = predict_fuel_consumption(data)
    return jsonify(result)

@predictions_bp.route('/predict/driver-score', methods=['POST'])
def predict_driver_score():
    data = request.get_json() or {}
    result = calculate_driver_performance(data)
    return jsonify(result)

@predictions_bp.route('/predict/fleet-health', methods=['GET', 'POST'])
def predict_fleet_health():
    if request.method == 'POST':
        data = request.get_json() or {}
    else:
        data = request.args
    result = calculate_fleet_health(data)
    return jsonify(result)

@predictions_bp.route('/predict/cost-forecast', methods=['GET', 'POST'])
def predict_cost_forecast():
    if request.method == 'POST':
        data = request.get_json() or {}
    else:
        data = request.args
    result = forecast_fleet_costs(data)
    return jsonify(result)
