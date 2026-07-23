const { execSync } = require('child_process');
const logger = require('../utils/logger');

class SystemEvents {
  constructor(config, token, userInfo) {
    this.config = config;
    this.token = token;
    this.userInfo = userInfo;
    this.isRunning = false;
    this.interval = null;
    
    this.eventBuffer = [];
  }

  // Collect all system events
  collectEvents() {
    const events = [];
    
    // We removed PowerShell-based USB/Print logging because it blocked the event loop.
    // If USB/Print logging is strictly required later, we can add a native Node.js C++ addon.
    
    // Screen lock events are now handled asynchronously by Electron's powerMonitor in main.js
    // or we can just skip polling them here and let the agent rely on idle-detector.
    
    const clipboardEvent = this.detectClipboardEvents();
    if (clipboardEvent) events.push(clipboardEvent);
    
    return events;
  }

  // Detect clipboard / file copy events
  detectClipboardEvents() {
    try {
      const { clipboard } = require('electron');
      // Read formats
      const formats = clipboard.availableFormats();
      if (formats.length > 0) {
        let content = '';
        if (formats.includes('text/plain')) {
          content = clipboard.readText().substring(0, 50); // only log first 50 chars for DLP
        }
        
        // This is a basic heuristic for DLP, track if they copied files or large text
        const isFile = formats.includes('FileName') || formats.includes('FileNameW');
        
        if (this.lastClipboardContent !== content || this.lastClipboardWasFile !== isFile) {
          this.lastClipboardContent = content;
          this.lastClipboardWasFile = isFile;
          
          if (content || isFile) {
            logger.debug('Clipboard/Copy event detected');
            return {
              type: isFile ? 'FILE_COPY' : 'CLIPBOARD_COPY',
              data: isFile ? 'User copied file(s) to clipboard' : `Copied text: ${content}...`,
              timestamp: new Date().toISOString()
            };
          }
        }
      }
    } catch (err) {
      // Ignore clipboard read errors
    }
    return null;
  }

  // Upload system events
  async uploadEvents(events) {
    if (events.length === 0) {
      return;
    }

    try {
      const axios = require('axios');
      
      for (const event of events) {
        const payload = {
          employee_id: this.userInfo.employee_id || this.userInfo.id,
          organization_id: this.userInfo.organization_id,
          log_data: event
        };
        
        await axios.post(
          `${this.config.STORE_LOGS_API_URL}${this.config.SYSTEM_LOG_ENDPOINT}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.token}`
            },
            timeout: 10000
          }
        );
        
        logger.info(`System event uploaded: ${event.type}`);
      }
    } catch (err) {
      logger.error('Error uploading system events:', err.message);
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn('System events tracker already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting system events tracker');
    
    // Check for events every 30 seconds
    this.interval = setInterval(() => {
      const events = this.collectEvents();
      if (events.length > 0) {
        this.uploadEvents(events);
      }
    }, 30000);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping system events tracker');
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = SystemEvents;
