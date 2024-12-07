from flask import Flask, render_template, jsonify, request
import random
import os
import logging

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/intersection-info', methods=['GET'])
def get_intersection_info():
    return jsonify({
        'name': 'Перекресток №1',
        'cameras': {
            'ns': {
                'ip': '192.168.1.101',
                'status': 'active'
            },
            'ew': {
                'ip': '192.168.1.102',
                'status': 'active'
            }
        }
    })

@app.route('/api/camera-data', methods=['POST'])
def update_camera_data():
    try:
        data = request.get_json()
        if not data:
            data = {'camera_id': 'cam1'}
        
        # Генерация реалистичных данных
        ns_count = random.randint(3, 10)
        ew_count = random.randint(3, 10)
        
        ns_waiting = min(random.randint(0, ns_count), ns_count)
        ew_waiting = min(random.randint(0, ew_count), ew_count)
        
        response_data = {
            'camera_id': data.get('camera_id', 'cam1'),
            'ns': {
                'count': ns_count,
                'waiting': ns_waiting,
                'avgSpeed': random.uniform(0.4, 0.8)
            },
            'ew': {
                'count': ew_count,
                'waiting': ew_waiting,
                'avgSpeed': random.uniform(0.4, 0.8)
            }
        }
        
        return jsonify(response_data)
    except Exception as e:
        print(f"Error in update_camera_data: {str(e)}")
        return jsonify({
            'ns': {'count': 5, 'waiting': 2, 'avgSpeed': 0.6},
            'ew': {'count': 5, 'waiting': 2, 'avgSpeed': 0.6}
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)