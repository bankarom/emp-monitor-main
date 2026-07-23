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

  // Detect USB insertion/removal
  detectUSBEvents() {
    try {
      // PowerShell command to get recent USB events
      const ps = `
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-DriverFrameworks-UserMode'} -MaxEvents 10 | 
Where-Object {$_.TimeCreated -gt (Get-Date).AddMinutes(-5)} | 
Select-Object TimeCreated, Id, Message | 
ConvertTo-Json
      `.replace(/\n/g, ' ');
      
      const output = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, {
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString();
      
      if (output && output !== '[]') {
        logger.debug('USB events detected:', output);
        return {
          type: 'USB',
          data: output,
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      // No events or permission issue - ignore
    }
    return null;
  }

  // Detect print events
  detectPrintEvents() {
    try {
      const ps = `
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-PrintService/Operational'; Id=307} -MaxEvents 10 | 
Where-Object {$_.TimeCreated -gt (Get-Date).AddMinutes(-5)} | 
Select-Object TimeCreated, Message | 
ConvertTo-Json
      `.replace(/\n/g, ' ');
      
      const output = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, {
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString();
      
      if (output && output !== '[]') {
        logger.debug('Print events detected:', output);
        return {
          type: 'PRINT',
          data: output,
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      // No events or permission issue - ignore
    }
    return null;
  }

  // Detect screen lock/unlock
  detectScreenLockEvents() {
    try {
      const ps = `
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4800,4801} -MaxEvents 10 | 
Where-Object {$_.TimeCreated -gt (Get-Date).AddMinutes(-5)} | 
Select-Object TimeCreated, Id, Message | 
ConvertTo-Json
      `.replace(/\n/g, ' ');
      
      const output = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, {
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString();
      
      if (output && output !== '[]') {
        logger.debug('Screen lock events detected:', output);
        return {
          type: 'SCREEN_LOCK',
          data: output,
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      // No events or permission issue - ignore
    }
    return null;
  }

  // Collect all system events
  collectEvents() {
    const events = [];
    
    const usbEvent = this.detectUSBEvents();
    if (usbEvent) events.push(usbEvent);
    
    const printEvent = this.detectPrintEvents();
    if (printEvent) events.push(printEvent);
    
    const lockEvent = this.detectScreenLockEvents();
    if (lockEvent) events.push(lockEvent);
    
    return events;
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
