from transformers import pipeline
import cv2
import numpy as np
import os

# Load the image classification model for individual recognition
face_recognition = pipeline('image-classification', model='microsoft/resnet-50')

def recognize_faces(image_path):
    # Load image and perform recognition
    results = face_recognition(image_path)
    return results

def recognize_multiple_faces(image_path):
    """
    Recognize multiple faces in a single image for group attendance
    Uses OpenCV for face detection and then applies recognition on each detected face
    """
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        return [{"label": "Error: Could not load image", "score": 0}]
    
    # Convert to grayscale for face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Load OpenCV's pre-trained face detector
    face_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
    if not os.path.exists(face_cascade_path):
        # Fallback to a local path if the OpenCV path doesn't work
        face_cascade_path = 'haarcascade_frontalface_default.xml'
        if not os.path.exists(face_cascade_path):
            return [{"label": "Error: Face cascade file not found", "score": 0}]
    
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    # If no faces detected, return the original image classification result
    if len(faces) == 0:
        return face_recognition(image_path)
    
    # Process each detected face
    results = []
    for i, (x, y, w, h) in enumerate(faces):
        # Extract the face region
        face_img = image[y:y+h, x:x+w]
        
        # Save the face temporarily
        temp_face_path = f"temp_face_{i}.jpg"
        cv2.imwrite(temp_face_path, face_img)
        
        try:
            # Recognize this face
            face_result = face_recognition(temp_face_path)
            
            # Add position information to help with identification
            if isinstance(face_result, list) and len(face_result) > 0:
                face_result[0]['position'] = {'x': x, 'y': y, 'width': w, 'height': h}
                results.append(face_result[0])
            else:
                results.append({"label": "Unknown", "score": 0, 
                               'position': {'x': x, 'y': y, 'width': w, 'height': h}})
        except Exception as e:
            results.append({"label": f"Error: {str(e)}", "score": 0,
                           'position': {'x': x, 'y': y, 'width': w, 'height': h}})
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_face_path):
                os.remove(temp_face_path)
    
    return results