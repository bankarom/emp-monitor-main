const { desktopCapturer } = require('electron');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ScreenshotCapture {
  constructor(config, token, userInfo) {
    this.config = config;
    this.token = token;
    this.userInfo = userInfo;
    this.isRunning = false;
    this.interval = null;
    
    // Screenshot buffer
    this.screenshotBuffer = [];
    this.tempDir = path.join(__dirname, '../../temp/screenshots');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Capture screenshot
  async captureScreenshot() {
    try {
      logger.debug('Capturing screenshot');
      
      // Get all screens
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: {
          width: 1920,
          height: 1080
        }
      });
      
      // Capture each screen
      const screenshots = [];
      
      for (const source of sources) {
        if (source.name.includes('Screen') || source.name.includes('Display')) {
          const timestamp = new Date().toISOString();
          const filename = `screenshot_${Date.now()}_${source.id}.png`;
          const filepath = path.join(this.tempDir, filename);
          
          // Save screenshot to temp file
          fs.writeFileSync(filepath, source.thumbnail.toPNG());
          
          // Get file size
          const stats = fs.statSync(filepath);
          const fileSizeKB = stats.size / 1024;
          
          screenshots.push({
            filename: filename,
            filepath: filepath,
            screenId: source.id,
            screenName: source.name,
            timestamp: timestamp,
            size: fileSizeKB
          });
          
          logger.debug(`Screenshot captured: ${filename} (${fileSizeKB.toFixed(2)} KB)`);
        }
      }
      
      return screenshots;
    } catch (err) {
      logger.error('Error capturing screenshot:', err.message);
      return [];
    }
  }

  // Get screenshots for upload
  getScreenshots() {
    const screenshots = [...this.screenshotBuffer];
    this.screenshotBuffer = [];
    return screenshots;
  }

  // Cleanup temp files
  cleanupTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        const filepath = path.join(this.tempDir, file);
        fs.unlinkSync(filepath);
      });
      logger.debug('Cleaned up temp screenshot files');
    } catch (err) {
      logger.error('Error cleaning up temp files:', err.message);
    }
  }

  // Delete specific screenshot file
  deleteScreenshot(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.debug(`Deleted screenshot: ${filepath}`);
      }
    } catch (err) {
      logger.error('Error deleting screenshot:', err.message);
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn('Screenshot capture already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting screenshot capture');
    
    // Capture screenshot every 10 minutes
    this.interval = setInterval(async () => {
      const screenshots = await this.captureScreenshot();
      this.screenshotBuffer.push(...screenshots);
      
      // Keep only last 10 screenshots to prevent memory issues
      if (this.screenshotBuffer.length > 10) {
        const toDelete = this.screenshotBuffer.splice(0, this.screenshotBuffer.length - 10);
        toDelete.forEach(ss => this.deleteScreenshot(ss.filepath));
      }
    }, this.config.SCREENSHOT_INTERVAL);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping screenshot capture');
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // Cleanup temp files
    this.cleanupTempFiles();
  }
}

module.exports = ScreenshotCapture;
