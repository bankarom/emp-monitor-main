const { execSync } = require('child_process');
const logger = require('../utils/logger');
const { uIOhook } = require('uiohook-napi');

class ActivityTracker {
  constructor(config, token, userInfo) {
    this.config = config;
    this.token = token;
    this.userInfo = userInfo;
    this.isRunning = false;
    this.interval = null;
    
    // Activity data buffer
    this.activityBuffer = [];
    this.sessionStartTime = new Date();
    
    // Activity counters
    this.clicksCount = 0;
    this.keysCount = 0;
    this.movementsCount = 0;
    
    // Per-second activity arrays
    this.activityPerSecond = {
      buttonClicks: [],
      keystrokes: [],
      mouseMovements: [],
      fakeActivities: []
    };
    
    // App usage tracking
    this.currentApp = null;
    this.appStartTime = null;
    this.appUsage = [];
    
    // App name mapping
    this.appMap = {
      'chrome': 'Google Chrome',
      'msedge': 'Microsoft Edge',
      'firefox': 'Mozilla Firefox',
      'Code': 'Visual Studio Code',
      'code': 'Visual Studio Code',
      'WINWORD': 'Microsoft Word',
      'EXCEL': 'Microsoft Excel',
      'POWERPNT': 'Microsoft PowerPoint',
      'Teams': 'Microsoft Teams',
      'Slack': 'Slack',
      'zoom': 'Zoom',
      'notepad': 'Notepad',
      'explorer': 'File Explorer',
      'cmd': 'Command Prompt',
      'powershell': 'PowerShell',
      'WindowsTerminal': 'Windows Terminal',
      'devenv': 'Visual Studio'
    };
    
    // Skip these processes
    this.skipProcesses = ['node', 'node.exe', 'powershell', 'cmd', 'WindowsTerminal', 'conhost', 'svchost'];
  }

  // Get active window information
  getActiveWindow() {
    try {
      const psScript = `
Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;using System.Text;public class W{[DllImport(""user32.dll"")]public static extern IntPtr GetForegroundWindow();[DllImport(""user32.dll"")]public static extern int GetWindowText(IntPtr h,StringBuilder s,int n);[DllImport(""user32.dll"")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}"
$h=[W]::GetForegroundWindow()
$s=New-Object System.Text.StringBuilder 512
[W]::GetWindowText($h,$s,512)|Out-Null
$procId=0;[W]::GetWindowThreadProcessId($h,[ref]$procId)|Out-Null
$p=Get-Process -Id $procId -EA SilentlyContinue
Write-Output "$($p.ProcessName)|||$($s.ToString())"
`;
      const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
      const out = execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${b64}`, {
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString().trim();
      
      let [proc, title] = out.split('|||');
      let finalProc = (proc || '').trim();
      let finalTitle = (title || '').trim();
      
      // Fallback to process name if title is empty
      if (!finalTitle && finalProc) {
        finalTitle = this.getFriendlyAppName(finalProc);
      }
      
      return { 
        proc: finalProc, 
        title: finalTitle 
      };
    } catch (err) {
      logger.error('Error getting active window:', err.message);
      return { proc: '', title: '' };
    }
  }

  // Get friendly app name
  getFriendlyAppName(proc) {
    if (!proc) return 'Unknown';
    return this.appMap[proc] || this.appMap[proc.toLowerCase()] || proc;
  }

  // Guess URL from browser title
  guessUrl(proc, title) {
    const t = title.toLowerCase();
    const browsers = ['chrome', 'msedge', 'firefox'];
    
    if (!browsers.some(b => proc.toLowerCase().includes(b))) {
      return null;
    }
    
    if (t.includes('youtube')) return 'https://www.youtube.com';
    if (t.includes('github')) return 'https://github.com';
    if (t.includes('stackoverflow')) return 'https://stackoverflow.com';
    if (t.includes('gmail')) return 'https://mail.google.com';
    if (t.includes('google')) return 'https://www.google.com';
    if (t.includes('linkedin')) return 'https://www.linkedin.com';
    if (t.includes('twitter') || t.includes('x.com')) return 'https://twitter.com';
    if (t.includes('facebook')) return 'https://www.facebook.com';
    
    return null;
  }

  // Track mouse activity
  trackMouseActivity() {
    // Handled via uIOhook events, nothing to do here per second
  }

  // Track keyboard activity
  trackKeyboardActivity() {
    // Handled via uIOhook events, nothing to do here per second
  }

  // Update per-second activity arrays
  updatePerSecondArrays() {
    const clicksStr = this.clicksCount.toString();
    const keysStr = this.keysCount.toString();
    const movementsStr = this.movementsCount.toString();
    
    this.activityPerSecond.buttonClicks.push(clicksStr);
    this.activityPerSecond.keystrokes.push(keysStr);
    this.activityPerSecond.mouseMovements.push(movementsStr);
    this.activityPerSecond.fakeActivities.push(0);
    
    // Reset counters
    this.clicksCount = 0;
    this.keysCount = 0;
    this.movementsCount = 0;
  }

  // Track app usage
  trackAppUsage(activeWindow) {
    const appName = this.getFriendlyAppName(activeWindow.proc);
    const url = this.guessUrl(activeWindow.proc, activeWindow.title);
    
    if (this.currentApp !== appName) {
      // App changed, save previous app usage
      if (this.currentApp && this.appStartTime) {
        const duration = (Date.now() - this.appStartTime) / 1000;
        if (duration > 0) {
          this.appUsage.push({
            app: this.currentApp,
            title: this.currentTitle,
            url: this.currentUrl,
            start: this.appUsageStart,
            end: this.appUsageStart + duration,
            keystrokes: this.currentKeystrokes
          });
        }
      }
      
      // Start tracking new app
      this.currentApp = appName;
      this.currentTitle = activeWindow.title;
      this.currentUrl = url;
      this.appStartTime = Date.now();
      this.appUsageStart = (Date.now() - this.sessionStartTime) / 1000;
      this.currentKeystrokes = '';
    }
    
    // Accumulate keystrokes for current app
    if (this.keysCount > 0) {
      this.currentKeystrokes += 'x'.repeat(this.keysCount);
    }
  }

  // Sample activity
  sampleActivity() {
    try {
      const activeWindow = this.getActiveWindow();
      
      // Skip if process should be ignored
      if (this.skipProcesses.includes(activeWindow.proc)) {
        return null;
      }
      
      // Track mouse and keyboard
      this.trackMouseActivity();
      this.trackKeyboardActivity();
      
      // Track app usage
      this.trackAppUsage(activeWindow);
      
      // Update per-second arrays
      this.updatePerSecondArrays();
      
      return {
        app: this.getFriendlyAppName(activeWindow.proc),
        title: activeWindow.title,
        url: this.guessUrl(activeWindow.proc, activeWindow.title),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('Error sampling activity:', err.message);
      return null;
    }
  }

  // Get activity data for upload
  getActivityData() {
    const now = new Date();
    const dataId = now.toISOString();
    const intervalSeconds = (now - this.sessionStartTime) / 1000;
    
    // Finalize current app usage
    if (this.currentApp && this.appStartTime) {
      const duration = (Date.now() - this.appStartTime) / 1000;
      if (duration > 0) {
        this.appUsage.push({
          app: this.currentApp,
          title: this.currentTitle,
          url: this.currentUrl,
          start: this.appUsageStart,
          end: this.appUsageStart + duration,
          keystrokes: this.currentKeystrokes
        });
        
        // Reset for next interval so it doesn't overlap
        this.appStartTime = Date.now();
        this.appUsageStart = 0;
        this.currentKeystrokes = '';
      }
    }
    
    // Build activity payload
    const payload = {
      userId: this.userInfo.employee_id || this.userInfo.id,
      userEmail: this.userInfo.email,
      adminId: this.userInfo.organization_id,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      dataId: dataId,
      systemTimeUtc: now.toUTCString(),
      date: dataId.split('T')[0],
      time: dataId.split('T')[1].split('.')[0],
      
      timestampInUtc: Math.floor(now.getTime() / 1000),
      timestampServer: Math.floor(now.getTime() / 1000),
      timestampActual: Math.floor(now.getTime() / 1000),
      
      projectId: 0,
      taskId: 0,
      breakInSeconds: 0,
      
      taskNote: '',
      appVersion: '1.0.0',
      
      clicksCount: this.activityPerSecond.buttonClicks.reduce((a, b) => a + parseInt(b || 0), 0),
      fakeActivitiesCount: 0,
      keysCount: this.activityPerSecond.keystrokes.reduce((a, b) => a + parseInt(b || 0), 0),
      movementsCount: this.activityPerSecond.mouseMovements.reduce((a, b) => a + parseInt(b || 0), 0),
      
      activityPerSecond: this.activityPerSecond,
      
      mode: {
        name: 'computer',
        start: 0,
        end: intervalSeconds
      },
      
      appUsage: this.appUsage,
      
      status: 1
    };
    
    // Reset buffers
    this.activityBuffer = [];
    this.appUsage = [];
    this.activityPerSecond = {
      buttonClicks: [],
      keystrokes: [],
      mouseMovements: [],
      fakeActivities: []
    };
    this.sessionStartTime = new Date();
    
    return payload;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.sessionStartTime = new Date();
    
    logger.info('Activity tracker started');

    // Setup uIOhook events
    uIOhook.on('keydown', (e) => { this.keysCount++; });
    uIOhook.on('mousedown', (e) => { this.clicksCount++; });
    uIOhook.on('mousemove', (e) => { this.movementsCount++; });
    uIOhook.start();
    
    // Start sampling interval
    this.interval = setInterval(() => {
      this.sampleActivity();
    }, this.config.ACTIVITY_SAMPLE_INTERVAL);
  }

  // Stop tracking
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    uIOhook.stop();
    
    // Finalize current app usage
    if (this.currentApp) {
      this.appUsage.push({
        appName: this.currentApp.appName,
        url: this.currentApp.url || null,
        startTime: this.currentApp.startTime,
        endTime: new Date().toISOString()
      });
    }
    
    logger.info('Activity tracker stopped');
  }
}

module.exports = ActivityTracker;
