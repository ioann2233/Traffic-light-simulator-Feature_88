from flask import Flask, render_template, jsonify, request
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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/camera-data', methods=['POST'])
def update_camera_data():
    try:
        data = request.get_json()
        camera_id = data.get('camera_id', 'cam1') if data else 'cam1'
        
        ns_count = random.randint(0, 5)
        ew_count = random.randint(0, 5)
        
        return jsonify({
            'camera_id': camera_id,
            'ns': {
                'count': ns_count,
                'waiting': random.randint(0, ns_count),
                'avgSpeed': random.uniform(0.4, 0.8)
            },
            'ew': {
                'count': ew_count,
                'waiting': random.randint(0, ew_count),
                'avgSpeed': random.uniform(0.4, 0.8)
            }
        })
    except Exception as e:
        print(f"Error in update_camera_data: {str(e)}")
        return jsonify({
            'ns': {'count': 0, 'waiting': 0, 'avgSpeed': 0.5},
            'ew': {'count': 0, 'waiting': 0, 'avgSpeed': 0.5}
        })

@app.route('/api/intersection-info', methods=['GET'])
def get_intersection_info():
    return jsonify({
        'name': 'Перекресток улиц Ленина и Пушкина',
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)