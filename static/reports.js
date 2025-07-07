/**
 * Reports JavaScript functionality
 * Handles report generation and data visualization with Chart.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize report card buttons
    initReportCardButtons();
    
    // Initialize custom report form
    initCustomReportForm();
    
    // Initialize attendance overview chart
    initAttendanceOverviewChart();
});

function initReportCardButtons() {
    const viewButtons = document.querySelectorAll('.report-card .btn:first-child');
    const downloadButtons = document.querySelectorAll('.report-card .btn:last-child');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reportTitle = this.closest('.report-card').querySelector('.card-title').textContent;
            console.log(`Viewing report: ${reportTitle}`);
            
            // Show a modal with report details
            showReportModal(reportTitle);
        });
    });
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reportTitle = this.closest('.report-card').querySelector('.card-title').textContent;
            console.log(`Downloading report: ${reportTitle}`);
                
            // Show loading state
            button.textContent = 'Preparing...';
            button.disabled = true;
            
            // Generate and download PDF
            generatePDF(reportTitle).then(() => {
                button.textContent = 'Download PDF';
                button.disabled = false;
            }).catch(error => {
                console.error('Error generating PDF:', error);
                button.textContent = 'Download PDF';
                button.disabled = false;
                alert('Failed to generate PDF. Please try again.');
            });
        });
    });
}

// Function to generate and download PDF
async function generatePDF(reportTitle) {
    try {
        // Fetch report data
        const response = await fetch(`/api/reports/data?type=${encodeURIComponent(reportTitle)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch report data');
        }
        const reportData = await response.json();
        
        // Create a new window for PDF content
        const printWindow = window.open('', '_blank');
        
        // Generate HTML content for the PDF
        printWindow.document.write(`
            <html>
            <head>
                <title>${reportTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2c3e50; }
                    .report-info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>${reportTitle}</h1>
                <div class="report-info">
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div>
                    <h2>Report Data</h2>
                    <table>
                        <tr>
                            <th>Category</th>
                            <th>Value</th>
                        </tr>
                        ${reportData.labels.map((label, index) => `
                            <tr>
                                <td>${label}</td>
                                <td>${reportData.datasets[0].data[index]}%</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </body>
            </html>
        `);
        
        // Trigger print dialog
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            // Close the window after printing (optional)
            // printWindow.close();
        }, 500);
        
        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

function showReportModal(reportTitle) {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '800px';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflow = 'auto';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.float = 'right';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
    };
    
    const title = document.createElement('h2');
    title.textContent = reportTitle;
    
    const chartContainer = document.createElement('div');
    chartContainer.style.height = '300px';
    chartContainer.style.marginTop = '20px';
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(chartContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Create a chart in the modal
    createReportChart(chartContainer, reportTitle);
}

function createReportChart(container, reportTitle) {
    // Fetch real report data from the server based on report type
    fetch(`/api/reports/data?type=${encodeURIComponent(reportTitle)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(reportData => {
            console.log('Report data loaded:', reportData);
            renderReportChart(container, reportTitle, reportData);
        })
        .catch(error => {
            console.error('Error fetching report data:', error);
            // Fallback to sample data if API fails
            let chartData = {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: [85, 92, 88, 95],
                    backgroundColor: 'rgba(52, 152, 219, 0.5)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            };
            
            // Customize fallback data based on report type
            if (reportTitle.includes('Weekly')) {
                chartData.labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                chartData.datasets[0].data = [90, 85, 95, 88, 92];
            } else if (reportTitle.includes('Department')) {
                chartData.labels = ['CS Dept', 'Engineering', 'Business', 'Arts', 'Sciences'];
                chartData.datasets[0].data = [95, 88, 82, 78, 90];
            } else if (reportTitle.includes('Trends')) {
                chartData.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                chartData.datasets[0].data = [75, 82, 88, 90, 92, 95];
            }
            
            renderReportChart(container, reportTitle, chartData);
        });
}

function renderReportChart(container, reportTitle, chartData) {
    // Create canvas element
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Create chart
    new Chart(canvas, {
        type: reportTitle.includes('Trends') ? 'line' : 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function initCustomReportForm() {
    const customReportForm = document.getElementById('custom-report-form');
    const dateRange = document.getElementById('date-range');
    const customDateRange = document.getElementById('custom-date-range');
    
    // Handle date range selection
    dateRange.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
        }
    });
    
    // Set default dates
    const today = new Date();
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    startDate.valueAsDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate.valueAsDate = today;
    
    // Handle form submission
    customReportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const reportType = document.getElementById('report-type').value;
        const dateRangeValue = dateRange.value;
        const format = document.getElementById('format').value;
        const includeCharts = document.getElementById('include-charts').checked;
        
        // Get date range values
        let startDateValue = startDate.value;
        let endDateValue = endDate.value;
        
        if (dateRangeValue !== 'custom') {
            // Set date range based on selection
            const today = new Date();
            endDateValue = today.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
            
            if (dateRangeValue === 'today') {
                startDateValue = endDateValue;
            } else if (dateRangeValue === 'this-week') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
                startDateValue = startOfWeek.toISOString().split('T')[0];
            } else if (dateRangeValue === 'this-month') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                startDateValue = startOfMonth.toISOString().split('T')[0];
            }
        }
        
        // Create loading indicator
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Generating...';
        submitBtn.disabled = true;
        
        // Generate and download the report
        generateCustomReport(reportType, startDateValue, endDateValue, format, includeCharts)
            .then(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error generating custom report:', error);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                alert('Failed to generate report. Please try again.');
            });
    });
}

async function generateCustomReport(reportType, startDate, endDate, format, includeCharts) {
    try {
        // In a real application, you would fetch data from the server
        // For now, we'll create a sample report
        
        // Create a new window for the report
        const printWindow = window.open('', '_blank');
        
        // Generate HTML content for the report
        printWindow.document.write(`
            <html>
            <head>
                <title>Custom ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2c3e50; }
                    .report-info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>Custom ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
                <div class="report-info">
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
                    <p><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</p>
                </div>
                <div>
                    <h2>Attendance Summary</h2>
                    <table>
                        <tr>
                            <th>Date</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Attendance Rate</th>
                        </tr>
                        <tr>
                            <td>Sample Date 1</td>
                            <td>25</td>
                            <td>5</td>
                            <td>83.3%</td>
                        </tr>
                        <tr>
                            <td>Sample Date 2</td>
                            <td>28</td>
                            <td>2</td>
                            <td>93.3%</td>
                        </tr>
                        <tr>
                            <td>Sample Date 3</td>
                            <td>27</td>
                            <td>3</td>
                            <td>90.0%</td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `);
        
        // Trigger print dialog based on format
        printWindow.document.close();
        printWindow.focus();
        
        if (format === 'pdf') {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } else {
            // For Excel or CSV, in a real application you would generate and download the file
            // For this demo, we'll just show a message
            printWindow.document.write(`<p>In a real application, this would download as a ${format.toUpperCase()} file.</p>`);
        }
        
        return true;
    } catch (error) {
        console.error('Error generating custom report:', error);
        throw error;
    }
}

function initAttendanceOverviewChart() {
    const chartContainer = document.querySelector('.placeholder-chart');
    
    if (!chartContainer) return;
    
    // Clear placeholder text
    chartContainer.innerHTML = '';
    
    // Create canvas for the chart
    const canvas = document.createElement('canvas');
    canvas.id = 'attendance-overview-chart';
    chartContainer.appendChild(canvas);
    
    // Fetch real attendance overview data
    fetch('/api/attendance/overview')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Attendance overview data loaded:', data);
            createOverviewChart(canvas, data);
        })
        .catch(error => {
            console.error('Error fetching attendance overview data:', error);
            // Fallback to sample data if API fails
            createOverviewChart(canvas, {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                present: [20, 18, 22, 19, 21, 23],
                absent: [2, 4, 0, 3, 1, 0],
                late: [3, 2, 3, 2, 3, 2]
            });
        });
}

function createOverviewChart(canvas, data) {
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Present',
                    data: data.present,
                    backgroundColor: 'rgba(46, 204, 113, 0.5)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Absent',
                    data: data.absent,
                    backgroundColor: 'rgba(231, 76, 60, 0.5)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Late',
                    data: data.late,
                    backgroundColor: 'rgba(241, 196, 15, 0.5)',
                    borderColor: 'rgba(241, 196, 15, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}