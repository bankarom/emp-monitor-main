const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = require('../utils/logger');

class ScreenshotUploader {
  constructor(config, token, userInfo) {
    this.config = config;
    this.token = token;
    this.userInfo = userInfo;
    this.isRunning = false;
    this.interval = null;
    
    this.screenshotCapture = null;
  }

  setScreenshotCapture(capture) {
    this.screenshotCapture = capture;
  }

  // Upload screenshot
  async uploadScreenshot(screenshot) {
    try {
      logger.debug(`Uploading screenshot: ${screenshot.filename}`);
      
      const formData = new FormData();
      formData.append('screenshots', fs.createReadStream(screenshot.filepath));
      formData.append('timestamp', screenshot.timestamp);
      formData.append('screenId', screenshot.screenId);
      
      const response = await axios.post(
        `${this.config.STORE_LOGS_API_URL}${this.config.SCREENSHOT_ENDPOINT}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.token}`
          },
          timeout: 60000
        }
      );

      if (response.data && response.data.success) {
        logger.info(`Screenshot uploaded successfully: ${screenshot.filename}`);
        // Delete local file after successful upload
        this.screenshotCapture.deleteScreenshot(screenshot.filepath);
        return true;
      } else {
        logger.warn('Screenshot upload failed:', response.data?.message);
        return false;
      }
    } catch (err) {
      logger.error('Error uploading screenshot:', err.message);
      return false;
    }
  }

  // Upload multiple screenshots
  async uploadScreenshots(screenshots) {
    if (!screenshots || screenshots.length === 0) {
      return;
    }

    logger.info(`Uploading ${screenshots.length} screenshots`);
    
    for (const screenshot of screenshots) {
      await this.uploadWithRetry(screenshot);
    }
  }

  // Upload with retry logic
  async uploadWithRetry(screenshot, retries = this.config.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      const success = await this.uploadScreenshot(screenshot);
      if (success) {
        return true;
      }
      
      logger.warn(`Retry ${i + 1}/${retries} for screenshot upload`);
      await new Promise(resolve => setTimeout(resolve, this.config.RETRY_DELAY));
    }
    
    logger.error('Screenshot upload failed after all retries');
    return false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Screenshot uploader already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting screenshot uploader');
    
    // Upload screenshots every 5 minutes
    this.interval = setInterval(async () => {
      if (!this.screenshotCapture) {
        logger.warn('Screenshot capture not set');
        return;
      }

      const screenshots = this.screenshotCapture.getScreenshots();
      if (screenshots.length > 0) {
        await this.uploadScreenshots(screenshots);
      } else {
        logger.debug('No screenshots to upload');
      }
    }, this.config.UPLOAD_INTERVAL);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping screenshot uploader');
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = ScreenshotUploader;
