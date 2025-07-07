/**
 * Dashboard JavaScript functionality
 * Handles dashboard card interactions and button events
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to dashboard cards
    const dashboardCards = document.querySelectorAll('.dashboard-container .card');
    
    dashboardCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Initialize button event handlers
    initAttendanceSummaryButton();
    initUserProfileButton();
    initReportsButton();
});

/**
 * Initialize Attendance Summary button functionality
 */
function initAttendanceSummaryButton() {
    const attendanceBtn = document.querySelector('a[href*="attendance_summary"] .btn');
    
    if (attendanceBtn) {
        attendanceBtn.addEventListener('click', function(e) {
            // You can add additional functionality here before navigation
            console.log('Navigating to Attendance Summary page');
            // The actual navigation is handled by the href attribute
        });
    }
}

/**
 * Initialize User Profile button functionality
 */
function initUserProfileButton() {
    const profileBtn = document.querySelector('a[href*="user_profile"] .btn');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            // You can add additional functionality here before navigation
            console.log('Navigating to User Profile page');
            // The actual navigation is handled by the href attribute
        });
    }
}

/**
 * Initialize Reports button functionality
 */
function initReportsButton() {
    const reportsBtn = document.querySelector('a[href*="reports"] .btn');
    
    if (reportsBtn) {
        reportsBtn.addEventListener('click', function(e) {
            // You can add additional functionality here before navigation
            console.log('Navigating to Reports page');
            // The actual navigation is handled by the href attribute
        });
    }
}