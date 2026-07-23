// Configuration for EmpMonitor Agent
// Change these URLs for production deployment

module.exports = {
  // API URLs
  // For local testing: http://localhost:3002 and http://localhost:3001
  // For production: https://yourdomain.com/api
  DESKTOP_API_URL: process.env.DESKTOP_API_URL || 'http://200.141.2.53:3002',
  STORE_LOGS_API_URL: process.env.STORE_LOGS_API_URL || 'http://200.141.2.53:3001',
  
  // API Endpoints
  LOGIN_ENDPOINT: '/api/v3/auth/login',
  ACTIVITY_LOG_ENDPOINT: '/api/v1/desktop/add-activity-log',
  SCREENSHOT_ENDPOINT: '/api/v1/desktop/upload-screenshots',
  SYSTEM_LOG_ENDPOINT: '/api/v1/desktop/add-system-log',
  
  // Tracking Intervals (in milliseconds)
  ACTIVITY_SAMPLE_INTERVAL: 1000,      // Sample activity every 1 seconds
  SCREENSHOT_INTERVAL: 600000,        // Take screenshot every 10 minutes
  UPLOAD_INTERVAL: 10000,            // Upload data every 10 seconds
  
  // Idle Detection
  IDLE_THRESHOLD: 300000,             // 5 minutes of no activity = idle
  
  // Screenshot Settings
  SCREENSHOT_QUALITY: 0.8,            // JPEG quality (0-1)
  MAX_SCREENSHOT_SIZE: 500,           // Max width in KB
  
  // Retry Settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,                  // 5 seconds
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
  LOG_FILE: 'agent.log'
};
