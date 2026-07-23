const logger = require('../utils/logger');

class IdleDetector {
  constructor(config, token, userInfo) {
    this.config = config;
    this.token = token;
    this.userInfo = userInfo;
    this.isRunning = false;
    this.interval = null;
    
    this.lastActivityTime = Date.now();
    this.isIdle = false;
  }

  // Update last activity time
  updateActivity() {
    this.lastActivityTime = Date.now();
    if (this.isIdle) {
      this.isIdle = false;
      logger.info('User is no longer idle');
    }
  }

  // Check if user is idle
  checkIdle() {
    const { powerMonitor } = require('electron');
    // getSystemIdleTime returns time in seconds. We multiply by 1000 to compare with IDLE_THRESHOLD which is in ms.
    const idleTimeSeconds = powerMonitor.getSystemIdleTime();
    const idleTimeMs = idleTimeSeconds * 1000;
    const isNowIdle = idleTimeMs > this.config.IDLE_THRESHOLD;
    
    if (isNowIdle && !this.isIdle) {
      this.isIdle = true;
      logger.info(`User is idle for ${idleTimeSeconds} seconds`);
      this.sendIdleEvent(true, idleTimeMs);
    } else if (!isNowIdle && this.isIdle) {
      this.isIdle = false;
      logger.info('User is no longer idle');
      this.sendIdleEvent(false, idleTimeMs);
    }
    
    return this.isIdle;
  }

  // Send idle event to server
  async sendIdleEvent(isIdle, idleDurationMs) {
    try {
      const axios = require('axios');
      
      const payload = {
        employee_id: this.userInfo.employee_id || this.userInfo.id,
        organization_id: this.userInfo.organization_id,
        log_data: {
          type: 'IDLE',
          isIdle: isIdle,
          idleDuration: idleDurationMs || 0,
          timestamp: new Date().toISOString()
        }
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
      
      logger.info(`Idle event sent: ${isIdle ? 'Idle' : 'Active'}`);
    } catch (err) {
      logger.error('Error sending idle event:', err.message);
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn('Idle detector already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting idle detector');
    this.lastActivityTime = Date.now();
    
    // Check idle status every 30 seconds
    this.interval = setInterval(() => {
      this.checkIdle();
    }, 30000);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping idle detector');
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = IdleDetector;
