/**
 * User Profile JavaScript functionality
 * Handles user profile data and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the user profile page
    if (window.location.href.includes('user_profile')) {
        initUserProfile();
    }
});

function initUserProfile() {
    console.log('Initializing User Profile page');
    
    // Load user data
    loadUserData();
    
    // Initialize profile image upload
    initProfileImageUpload();
    
    // Initialize form validation
    initFormValidation();
}

function loadUserData() {
    // Fetch real user data from the server
    fetch('/api/user/profile')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(userData => {
            console.log('User data loaded');
            updateUserProfileUI(userData);
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            // Fallback to sample data if API fails
            updateUserProfileUI({
                username: 'John Doe',
                role: 'Student',
                email: 'john.doe@example.com',
                department: 'Computer Science',
                attendancePercentage: 92,
                daysPresent: 24,
                profileImage: '/static/images/default-profile.jpg'
            });
        });
}

function updateUserProfileUI(userData) {
    // Update profile information
    document.querySelector('.profile-name').textContent = userData.username;
    document.querySelector('.profile-role').textContent = userData.role;
    document.querySelector('.profile-picture').src = userData.profileImage;
    
    // Update attendance statistics
    document.querySelector('.stat-value:nth-child(1)').textContent = userData.attendancePercentage + '%';
    document.querySelector('.stat-value:nth-child(3)').textContent = userData.daysPresent;
    
    // Update form fields if they exist
    const emailField = document.getElementById('email');
    if (emailField) emailField.value = userData.email;
    
    const departmentField = document.getElementById('department');
    if (departmentField) departmentField.value = userData.department;
}

function initProfileImageUpload() {
    const uploadBtn = document.querySelector('.btn-block');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            // Trigger click on the file input
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    
                    // Preview the image
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const profilePic = document.querySelector('.profile-picture');
                        if (profilePic) {
                            profilePic.src = e.target.result;
                        }
                    };
                    reader.readAsDataURL(file);
                    
                    // Upload the image (this would be an AJAX call in a real implementation)
                    console.log('Uploading profile image:', file.name);
                }
            });
        });
    }
}

function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Basic validation example
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    // Add error styling
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                console.log('Form validation failed');
            } else {
                console.log('Form validation passed');
            }
        });
    });
}