const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

class ActivityUploader {
  constructor(config, token, userInfo) {
    this.config = config;
    this.token = token;
    this.userInfo = userInfo;
    this.isRunning = false;
    this.interval = null;
    
    this.activityTracker = null;
  }

  setActivityTracker(tracker) {
    this.activityTracker = tracker;
  }

  // Upload activity data
  async uploadActivity(activityData) {
    try {
      logger.debug('Uploading activity data');
      
      const response = await axios.post(
        `${this.config.STORE_LOGS_API_URL}${this.config.ACTIVITY_LOG_ENDPOINT}`,
        activityData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          timeout: 30000
        }
      );

      if (response.data && (response.data.success || response.data.code === 200 || response.data.status === 'success' || response.data.message === 'Data saved')) {
        logger.info('Activity data uploaded successfully');
        return true;
      } else {
        logger.warn('Activity upload failed:', response.data?.message || response.data);
        return false;
      }
    } catch (err) {
      logger.error('Error uploading activity:', err.message);
      return false;
    }
  }

  // Upload with retry logic
  async uploadWithRetry(activityData, retries = this.config.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      const success = await this.uploadActivity(activityData);
      if (success) {
        return true;
      }
      
      logger.warn(`Retry ${i + 1}/${retries} for activity upload`);
      await new Promise(resolve => setTimeout(resolve, this.config.RETRY_DELAY));
    }
    
    logger.error('Activity upload failed after all retries');
    return false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Activity uploader already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting activity uploader');
    
    // Upload activity data every 5 minutes
    this.interval = setInterval(async () => {
      if (!this.activityTracker) {
        logger.warn('Activity tracker not set');
        return;
      }

      const activityData = this.activityTracker.getActivityData();
      if (activityData && activityData.appUsage && activityData.appUsage.length > 0) {
        await this.uploadWithRetry({ sign: activityData.dataId || new Date().toISOString(), data: [activityData] });
      } else {
        logger.debug('No activity data to upload');
      }
    }, this.config.UPLOAD_INTERVAL);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping activity uploader');
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = ActivityUploader;
