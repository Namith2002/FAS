// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Navigation toggle for mobile
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('show');
        });
    }
    
    // Form validation
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    // Add error class
                    field.classList.add('error-input');
                    
                    // Create error message if it doesn't exist
                    let errorMessage = field.nextElementSibling;
                    if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                        errorMessage = document.createElement('div');
                        errorMessage.classList.add('error-message');
                        errorMessage.textContent = 'This field is required';
                        field.parentNode.insertBefore(errorMessage, field.nextSibling);
                    }
                } else {
                    // Remove error class
                    field.classList.remove('error-input');
                    
                    // Remove error message if it exists
                    const errorMessage = field.nextElementSibling;
                    if (errorMessage && errorMessage.classList.contains('error-message')) {
                        errorMessage.remove();
                    }
                }
            });
            
            if (!isValid) {
                event.preventDefault();
            }
        });
    });
});

// Attendance page specific functionality
if (document.getElementById('video') && document.querySelector('.attendance-container')) {
    // Access the webcam
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const video = document.getElementById('video');
            video.srcObject = stream;
            
            // Store the stream globally so we can stop it later if needed
            window.cameraStream = stream;
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
            document.querySelector('.video-container').innerHTML = `
                <div class="error">
                    <p>Error accessing webcam: ${error.message}</p>
                    <p>Please ensure you have granted camera permissions.</p>
                </div>
            `;
        });
    
    // Capture image from video
    document.getElementById('capture').addEventListener('click', function() {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        const video = document.getElementById('video');
        
        // Show loading indicator
        const resultsContainer = document.querySelector('.results-container');
        resultsContainer.innerHTML = '<p>Processing image...</p>';
        
        // Draw the current video frame on the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob and create a form to submit
        canvas.toBlob(function(blob) {
            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');
            
            // Send the image to the server
            fetch('/attendance', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(html => {
                // Extract just the results section from the response
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newResults = doc.querySelector('.results-container');
                
                if (newResults) {
                    resultsContainer.innerHTML = newResults.innerHTML;
                    
                    // Check if user is not recognized and show registration prompt
                    if (newResults.textContent.includes('not recognized') || 
                        newResults.textContent.includes('No face detected')) {
                        const registrationPrompt = document.querySelector('.registration-prompt');
                        if (registrationPrompt) {
                            registrationPrompt.style.display = 'block';
                            registrationPrompt.classList.add('highlight-prompt');
                            setTimeout(() => {
                                registrationPrompt.classList.remove('highlight-prompt');
                            }, 3000);
                        }
                    }
                } else {
                    resultsContainer.innerHTML = '<p>No results returned from server.</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            });
        }, 'image/jpeg');
    });
}

// Registration page specific functionality
if (document.getElementById('video') && document.querySelector('.form-container')) {
    // Access the webcam
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.getElementById('video');
                video.srcObject = stream;
                
                // Store the stream globally so we can stop it later if needed
                window.cameraStream = stream;
            })
            .catch(error => {
                console.error('Error accessing webcam:', error);
                document.querySelector('.video-container').innerHTML = `
                    <div class="error">
                        <p>Error accessing webcam: ${error.message}</p>
                        <p>Please ensure you have granted camera permissions or use the file upload option.</p>
                    </div>
                `;
            });
        
        // Capture button functionality
        const captureBtn = document.getElementById('capture');
        if (captureBtn) {
            captureBtn.addEventListener('click', function() {
                const canvas = document.getElementById('canvas');
                const context = canvas.getContext('2d');
                const video = document.getElementById('video');
                
                // Draw the current video frame on the canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to blob
                canvas.toBlob(function(blob) {
                    // Create a File object from the blob
                    const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
                    
                    // Create a FileList-like object
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    
                    // Set the file input's files property
                    const photoInput = document.getElementById('photo');
                    if (photoInput) {
                        photoInput.files = dataTransfer.files;
                        
                        // Show success message
                        const small = document.querySelector('.form-group small');
                        if (small) {
                            small.textContent = 'Photo captured successfully!';
                            small.style.color = 'green';
                        }
                    }
                }, 'image/jpeg');
            });
        }
    }
}

// Clean up camera resources when navigating away
window.addEventListener('beforeunload', function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => {
            track.stop();
        });
    }
});