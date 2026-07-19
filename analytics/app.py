import os
from flask import Flask, jsonify
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')
    app.run(host='0.0.0.0', port=port, debug=debug)
