from flask import Blueprint, request, jsonify
from services.recommendations import generate_recommendations

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/recommendations', methods=['GET', 'POST'])
def recommendations():
    if request.method == 'POST':
        data = request.get_json() or {}
    else:
        data = request.args
    result = generate_recommendations(data)
    return jsonify(result)
