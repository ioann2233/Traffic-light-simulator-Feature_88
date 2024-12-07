from flask import Flask, render_template, jsonify, send_file
import io

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/export-algorithm')
def export_algorithm():
    """Export the traffic control algorithm as a Python file"""
    with open('traffic_algorithm.py', 'r') as file:
        algorithm_code = file.read()
    
    buffer = io.BytesIO()
    buffer.write(algorithm_code.encode())
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='text/x-python',
        as_attachment=True,
        download_name='smart_traffic_control.py'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
