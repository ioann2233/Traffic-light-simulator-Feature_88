from flask import Flask, render_template, jsonify, send_file, request
import cv2
import numpy as np
import io
import random

app = Flask(__name__)

def detect_vehicles(frame):
    # Initialize background subtractor
    back_sub = cv2.createBackgroundSubtractorMOG2()
    
    # Apply background subtraction
    fg_mask = back_sub.apply(frame)
    
    # Find contours
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    objects = []
    for contour in contours:
        if cv2.contourArea(contour) > 500:  # Filter small contours
            x, y, w, h = cv2.boundingRect(contour)
            center_x = x + w/2
            center_y = y + h/2
            
            # Determine direction based on position
            direction = 'north'
            if center_x < frame.shape[1]/3:
                direction = 'west'
            elif center_x > 2*frame.shape[1]/3:
                direction = 'east'
            elif center_y < frame.shape[0]/2:
                direction = 'north'
            else:
                direction = 'south'
                
            objects.append({
                'direction': direction,
                'position': (center_x, center_y)
            })
    
    return objects

def calculate_average_speed(objects, directions):
    if not objects:
        return 0
    
    # Filter objects by direction
    direction_objects = [obj for obj in objects if obj['direction'] in directions]
    
    # For simplicity, return a normalized value between 0 and 1
    # In a real implementation, this would calculate actual speeds
    return len(direction_objects) / max(len(objects), 1)

def process_camera_frame(frame):
    # Convert to grayscale for motion detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Blur to reduce noise
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Detect moving objects
    objects = detect_vehicles(blur)
    
    return {
        'northSouth': {
            'count': len([obj for obj in objects if obj['direction'] in ['north', 'south']]),
            'speed': calculate_average_speed(objects, ['north', 'south'])
        },
        'eastWest': {
            'count': len([obj for obj in objects if obj['direction'] in ['east', 'west']]),
            'speed': calculate_average_speed(objects, ['east', 'west'])
        }
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download')
def download():
    return send_file(
        'traffic_algorithm.py',
        as_attachment=True,
        download_name='smart_traffic_control.py'
    )

@app.route('/api/camera-data', methods=['POST'])
def update_camera_data():
    try:
        data = request.get_json()
        if data is None:
            data = {'camera_id': 'cam1'}
            
        camera_id = data.get('camera_id', 'cam1')
        
        # Генерация реалистичных данных
        ns_count = random.randint(3, 10)
        ew_count = random.randint(3, 10)
        
        ns_waiting = min(random.randint(0, ns_count), ns_count)
        ew_waiting = min(random.randint(0, ew_count), ew_count)
        
        response_data = {
            'camera_id': camera_id,
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

@app.route('/api/simulate-camera', methods=['GET'])
def simulate_camera():
    camera_id = request.args.get('camera_id', 'cam1')
    return jsonify({
        'camera_id': camera_id,
        'location': {
            'lat': 55.7558,
            'lon': 37.6173
        },
        'direction': random.choice(['north', 'south', 'east', 'west'])
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
