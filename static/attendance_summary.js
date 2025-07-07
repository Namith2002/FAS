/**
 * Attendance Summary JavaScript functionality
 * Handles attendance data visualization and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the attendance summary page
    if (window.location.href.includes('attendance_summary')) {
        initAttendanceSummary();
    }
});

function initAttendanceSummary() {
    console.log('Initializing Attendance Summary page');
    
    // Example function to load attendance data
    loadAttendanceData();
    
    // Example function to initialize attendance charts
    initAttendanceCharts();
}

function loadAttendanceData() {
    // Fetch real attendance data from the server
    fetch('/api/attendance/summary')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Attendance data loaded');
            // Update UI with the loaded data
            updateAttendanceUI(data);
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            // Fallback to sample data if API fails
            updateAttendanceUI({
                totalDays: 30,
                presentDays: 27,
                absentDays: 3,
                attendancePercentage: 90
            });
        });
}

function updateAttendanceUI(data) {
    // Update UI elements with attendance data
    const percentageElement = document.getElementById('attendance-percentage');
    if (percentageElement) percentageElement.textContent = data.attendancePercentage + '%';
    
    const presentDaysElement = document.getElementById('present-days');
    if (presentDaysElement) presentDaysElement.textContent = data.presentDays;
    
    const absentDaysElement = document.getElementById('absent-days');
    if (absentDaysElement) absentDaysElement.textContent = data.absentDays;
    
    const totalDaysElement = document.getElementById('total-days');
    if (totalDaysElement) totalDaysElement.textContent = data.totalDays;
}

function updateAttendanceChart(data) {
    const ctx = document.getElementById('attendance-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Present', 'Absent'],
            datasets: [{
                data: [data.presentDays, data.absentDays],
                backgroundColor: ['rgba(46, 204, 113, 0.8)', 'rgba(231, 76, 60, 0.8)'],
                borderColor: ['rgba(46, 204, 113, 1)', 'rgba(231, 76, 60, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initAttendanceCharts() {
    console.log('Initializing attendance charts');
    
    const chartContainer = document.getElementById('attendance-chart');
    if (!chartContainer) {
        console.error('Chart container not found');
        return;
    }
    
    // Fetch data for the chart
    fetch('/api/attendance/summary')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Create attendance pie chart
            updateAttendanceChart(data);
            
            // Create attendance trend chart if container exists
            const trendChartContainer = document.getElementById('attendance-trend-chart');
            if (trendChartContainer) {
                createAttendanceTrendChart(trendChartContainer);
            }
        })
        .catch(error => {
            console.error('Error fetching chart data:', error);
            // Use sample data if API fails
            updateAttendanceChart({
                presentDays: 24,
                absentDays: 2
            });
        });
}

function createAttendanceTrendChart(container) {
    // Fetch trend data from the API
    fetch('/api/attendance/overview')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const ctx = container.getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Attendance %',
                        data: data.present.map((val, idx) => {
                            const total = val + data.absent[idx] + data.late[idx];
                            return total > 0 ? Math.round((val / total) * 100) : 0;
                        }),
                        borderColor: 'rgba(52, 152, 219, 1)',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Attendance Rate (%)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Month'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching trend data:', error);
            // Display error message in the container
            container.innerHTML = '<p class="error-message">Failed to load attendance trend data</p>';
        });
}