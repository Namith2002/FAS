from flask import Flask, render_template, request, redirect, url_for, jsonify
from transformers import pipeline
from werkzeug.utils import secure_filename
import os
import json
import time
from datetime import datetime, timedelta
import cv2
import numpy as np
from attendance import recognize_faces, recognize_multiple_faces

app = Flask(__name__, static_folder='static')

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

# Create data directory for storing user data
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

# Path to the user database JSON file
users_db_path = os.path.join(data_dir, 'users.json')
attendance_db_path = os.path.join(data_dir, 'attendance.json')

# Initialize user database if it doesn't exist
if not os.path.exists(users_db_path):
    with open(users_db_path, 'w') as f:
        json.dump([], f)

# Initialize attendance database if it doesn't exist
if not os.path.exists(attendance_db_path):
    with open(attendance_db_path, 'w') as f:
        json.dump([], f)

# Load the image classification model
face_recognition = pipeline('image-classification', model='microsoft/resnet-50')

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Handle login logic
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        # Handle signup logic
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/attendance', methods=['GET', 'POST'])
def attendance():
    if request.method == 'POST':
        # Handle image upload and recognition
        if 'image' not in request.files:
            return render_template('attendance.html', error='No file part')
        
        file = request.files['image']
        if file.filename == '':
            return render_template('attendance.html', error='No selected file')
        
        filename = secure_filename(file.filename)
        file_path = os.path.join(uploads_dir, filename)
        file.save(file_path)
        
        # Get the attendance mode (individual or group)
        attendance_mode = request.form.get('mode', 'individual')
        
        try:
            # Load user database
            with open(users_db_path, 'r') as f:
                users = json.load(f)
            
            recognized_users = []
            results_text = ""
            
            # Choose recognition method based on mode
            if attendance_mode == 'individual':
                # Perform individual face recognition
                recognition_results = recognize_faces(file_path)
                
                # Check if any face is recognized
                user_found = False
                
                # Simple matching logic (in a real system, this would be more sophisticated)
                for result in recognition_results:
                    label = result['label']
                    score = result['score']
                    
                    # Check if the label matches any registered user
                    for user in users:
                        if user.get('face_id') and label.lower() in user['face_id'].lower():
                            user_found = True
                            
                            # Record attendance
                            record_attendance(user['username'])
                            
                            results_text = f"User recognized: {user['username']}\nAttendance marked successfully!"
                            recognized_users.append({
                                'username': user['username'],
                                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                            })
                            break
                    
                    if user_found:
                        break
                
                if not user_found:
                    results_text = "Face not recognized. Please register first."
            
            else:  # Group mode
                # Perform group face recognition
                recognition_results = recognize_multiple_faces(file_path)
                
                if not recognition_results:
                    results_text = "No faces detected in the image."
                else:
                    # Track how many users were recognized
                    recognized_count = 0
                    
                    # Process each recognition result
                    for result in recognition_results:
                        label = result['label']
                        score = result['score']
                        
                        # Check if the label matches any registered user
                        for user in users:
                            if user.get('face_id') and label.lower() in user['face_id'].lower():
                                # Record attendance
                                record_attendance(user['username'])
                                
                                recognized_users.append({
                                    'username': user['username'],
                                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                })
                                
                                recognized_count += 1
                                break
                    
                    if recognized_count > 0:
                        results_text = f"Group attendance marked successfully! Recognized {recognized_count} users."
                    else:
                        results_text = "No registered users recognized in the group. Please ensure users are registered first."
            
            return render_template('attendance.html', 
                                  results=results_text, 
                                  recognized_users=recognized_users,
                                  mode=attendance_mode)
        except Exception as e:
            return render_template('attendance.html', error=str(e))
    
    return render_template('attendance.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Get form data
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email')
        
        # Check if photo was uploaded
        if 'photo' not in request.files:
            return render_template('register.html', error='No photo uploaded')
        
        photo = request.files['photo']
        if photo.filename == '':
            return render_template('register.html', error='No photo selected')
        
        # Save the photo
        filename = secure_filename(f"{username}_{int(time.time())}.jpg")
        photo_path = os.path.join(uploads_dir, filename)
        photo.save(photo_path)
        
        # Process the face for recognition
        try:
            # In a real system, you would extract face embeddings here
            # For this demo, we'll just use the image classification results
            results = face_recognition(photo_path)
            face_id = results[0]['label'] if results else "unknown"
            
            # Load existing users
            users = []
            if os.path.exists(users_db_path):
                with open(users_db_path, 'r') as f:
                    users = json.load(f)
            
            # Add new user
            new_user = {
                'username': username,
                'email': email,
                'face_id': face_id,
                'photo_path': photo_path,
                'registered_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            users.append(new_user)
            
            # Save updated users list
            with open(users_db_path, 'w') as f:
                json.dump(users, f, indent=4)
            
            return render_template('register.html', success=f"User {username} registered successfully!")
        except Exception as e:
            return render_template('register.html', error=f"Error processing face: {str(e)}")
    
    return render_template('register.html')

def recognize_faces(image_path):
    # Load image and perform recognition
    results = face_recognition(image_path)
    return results

def record_attendance(username):
    # Load existing attendance records
    attendance_records = []
    if os.path.exists(attendance_db_path):
        with open(attendance_db_path, 'r') as f:
            attendance_records = json.load(f)
    
    # Add new attendance record
    new_record = {
        'username': username,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'date': datetime.now().strftime('%Y-%m-%d')
    }
    
    attendance_records.append(new_record)
    
    # Save updated attendance records
    with open(attendance_db_path, 'w') as f:
        json.dump(attendance_records, f, indent=4)

# API routes for real-time data

@app.route('/api/attendance/summary')
def api_attendance_summary():
    # Get attendance data for the current user
    attendance_records = []
    if os.path.exists(attendance_db_path):
        with open(attendance_db_path, 'r') as f:
            attendance_records = json.load(f)
    
    # Filter records for the current user (in a real app, you'd use session data)
    # For demo, we'll use the first username in the records
    username = attendance_records[0]['username'] if attendance_records else 'default_user'
    user_records = [record for record in attendance_records if record['username'] == username]
    
    # Calculate statistics
    total_days = 30  # This would be calculated based on the current month
    present_days = len(set([record['date'] for record in user_records]))
    absent_days = total_days - present_days
    attendance_percentage = round((present_days / total_days) * 100) if total_days > 0 else 0
    
    return jsonify({
        'totalDays': total_days,
        'presentDays': present_days,
        'absentDays': absent_days,
        'attendancePercentage': attendance_percentage
    })

@app.route('/api/user/profile')
def api_user_profile():
    # Get user data (in a real app, you'd use session data)
    users = []
    if os.path.exists(users_db_path):
        with open(users_db_path, 'r') as f:
            users = json.load(f)
    
    # For demo, we'll use the first user in the database
    user = users[0] if users else {
        'username': 'John Doe',
        'role': 'Student',
        'email': 'john.doe@example.com',
        'department': 'Computer Science'
    }
    
    # Get attendance data for calculating statistics
    attendance_records = []
    if os.path.exists(attendance_db_path):
        with open(attendance_db_path, 'r') as f:
            attendance_records = json.load(f)
    
    user_records = [record for record in attendance_records if record['username'] == user['username']]
    days_present = len(set([record['date'] for record in user_records]))
    attendance_percentage = round((days_present / 30) * 100)  # Assuming 30 days in a month
    
    # Add profile image path
    profile_image = f"/uploads/{user['username']}.jpg" if os.path.exists(f"uploads/{user['username']}.jpg") else "/static/images/default-profile.jpg"
    
    return jsonify({
        'username': user['username'],
        'role': user.get('role', 'Student'),
        'email': user.get('email', ''),
        'department': user.get('department', ''),
        'attendancePercentage': attendance_percentage,
        'daysPresent': days_present,
        'profileImage': profile_image
    })

@app.route('/api/reports/data')
def api_reports_data():
    report_type = request.args.get('type', '')
    
    # Get attendance data
    attendance_records = []
    if os.path.exists(attendance_db_path):
        with open(attendance_db_path, 'r') as f:
            attendance_records = json.load(f)
    
    # Process data based on report type
    if 'Weekly' in report_type:
        # Get data for the current week
        today = datetime.now()
        start_of_week = today - timedelta(days=today.weekday())
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        
        # Count attendance for each day
        data = [0, 0, 0, 0, 0]  # Default values
        for record in attendance_records:
            record_date = datetime.strptime(record['date'], '%Y-%m-%d')
            if record_date >= start_of_week:
                weekday = record_date.weekday()
                if weekday < 5:  # Monday to Friday
                    data[weekday] += 1
        
        # Calculate percentages
        total_users = len(set([record['username'] for record in attendance_records]))
        if total_users > 0:
            data = [round((count / total_users) * 100) for count in data]
        
        return jsonify({
            'labels': days,
            'datasets': [{
                'label': 'Attendance Rate (%)',
                'data': data,
                'backgroundColor': 'rgba(52, 152, 219, 0.5)',
                'borderColor': 'rgba(52, 152, 219, 1)',
                'borderWidth': 1
            }]
        })
    
    elif 'Monthly' in report_type:
        # Get data for the current month
        today = datetime.now()
        weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        
        # Count attendance for each week
        data = [0, 0, 0, 0]  # Default values
        for record in attendance_records:
            record_date = datetime.strptime(record['date'], '%Y-%m-%d')
            if record_date.month == today.month and record_date.year == today.year:
                # Determine which week of the month
                day = record_date.day
                week_index = min(3, (day - 1) // 7)
                data[week_index] += 1
        
        # Calculate percentages
        total_users = len(set([record['username'] for record in attendance_records]))
        if total_users > 0:
            data = [round((count / total_users) * 100) for count in data]
        
        return jsonify({
            'labels': weeks,
            'datasets': [{
                'label': 'Attendance Rate (%)',
                'data': data,
                'backgroundColor': 'rgba(52, 152, 219, 0.5)',
                'borderColor': 'rgba(52, 152, 219, 1)',
                'borderWidth': 1
            }]
        })
    
    elif 'Department' in report_type:
        # This would require department data for each user
        # For demo, we'll use sample departments
        departments = ['CS Dept', 'Engineering', 'Business', 'Arts', 'Sciences']
        data = [95, 88, 82, 78, 90]  # Sample data
        
        return jsonify({
            'labels': departments,
            'datasets': [{
                'label': 'Attendance Rate (%)',
                'data': data,
                'backgroundColor': 'rgba(52, 152, 219, 0.5)',
                'borderColor': 'rgba(52, 152, 219, 1)',
                'borderWidth': 1
            }]
        })
    
    elif 'Trends' in report_type:
        # Get data for the last 6 months
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        data = [75, 82, 88, 90, 92, 95]  # Sample data
        
        return jsonify({
            'labels': months,
            'datasets': [{
                'label': 'Attendance Rate (%)',
                'data': data,
                'backgroundColor': 'rgba(52, 152, 219, 0.5)',
                'borderColor': 'rgba(52, 152, 219, 1)',
                'borderWidth': 1
            }]
        })
    
    # Default response
    return jsonify({
        'labels': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        'datasets': [{
            'label': 'Attendance Rate (%)',
            'data': [85, 92, 88, 95],
            'backgroundColor': 'rgba(52, 152, 219, 0.5)',
            'borderColor': 'rgba(52, 152, 219, 1)',
            'borderWidth': 1
        }]
    })

@app.route('/api/attendance/overview')
def api_attendance_overview():
    # Get attendance data
    attendance_records = []
    if os.path.exists(attendance_db_path):
        with open(attendance_db_path, 'r') as f:
            attendance_records = json.load(f)
    
    # Process data for the last 6 months
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    present_data = [20, 18, 22, 19, 21, 23]  # Sample data
    absent_data = [2, 4, 0, 3, 1, 0]  # Sample data
    late_data = [3, 2, 3, 2, 3, 2]  # Sample data
    
    # In a real implementation, you would calculate these values from actual attendance records
    
    return jsonify({
        'labels': months,
        'present': present_data,
        'absent': absent_data,
        'late': late_data
    })

@app.route('/attendance_summary')
def attendance_summary():
    return render_template('attendance_summary.html')

@app.route('/user_profile')
def user_profile():
    return render_template('user_profile.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

if __name__ == '__main__':
    app.run(debug=True)