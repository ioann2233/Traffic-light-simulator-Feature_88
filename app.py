from flask import Flask, render_template, jsonify, send_file, request
import cv2
import numpy as np
import io

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
        frame = request.files['frame'].read()
        # Convert bytes to numpy array
        nparr = np.frombuffer(frame, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process frame
        traffic_data = process_camera_frame(img)
        return jsonify(traffic_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
