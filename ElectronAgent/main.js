const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
// ===== FIX: FORCE the app to use C:\empmonitor-data =====
process.env.ELECTRON_STORE_PATH = 'C:\\empmonitor-data';
process.env.USERPROFILE = 'C:\\';
process.env.APPDATA = 'C:\\empmonitor-data';
process.env.LOCALAPPDATA = 'C:\\empmonitor-data';
// ===========================================================
const path = require('path');
const config = require('./src/utils/config');
const storage = require('./src/utils/storage');
const logger = require('./src/utils/logger');

// Global references
let mainWindow = null;
let tray = null;
let activityTracker = null;
let screenshotCapture = null;
let activityUploader = null;
let screenshotUploader = null;
let systemEvents = null;
let idleDetector = null;

// Create login window
function createLoginWindow() {
  logger.info('Creating login window');
  
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    resizable: false,
    frame: true,
    icon: path.join(__dirname, 'resources', 'icon.ico')
  });

  mainWindow.loadFile('src/renderer/login.html');
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    logger.info('Login window closed');
    mainWindow = null;
  });
}

// Create system tray
function createTray() {
  logger.info('Creating system tray');
  
  const iconPath = path.join(__dirname, 'resources', 'tray-icon.ico');
  let icon;
  
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      logger.warn('Tray icon not found, using default');
      icon = nativeImage.createEmpty();
    }
  } catch (err) {
    logger.error('Failed to load tray icon:', err);
    icon = nativeImage.createEmpty();
  }
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Online', 
      type: 'normal', 
      enabled: false,
      id: 'status'
    },
    { type: 'separator' },
    { 
      label: 'Stop Tracking', 
      click: stopTracking,
      id: 'stop'
    },
    { 
      label: 'Start Tracking', 
      click: startTracking,
      id: 'start',
      visible: false
    },
    { type: 'separator' },
    { 
      label: 'Logout', 
      click: logout 
    },
    { type: 'separator' },
    { 
      label: 'Exit', 
      click: () => {
        logger.info('Exiting application');
        stopTracking();
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('EmpMonitor Agent - Online');
  tray.setContextMenu(contextMenu);
}

// Update tray status
function updateTrayStatus(isOnline) {
  if (!tray) return;
  
  const menu = tray.getContextMenu();
  const statusItem = menu.getMenuItemById('status');
  const stopItem = menu.getMenuItemById('stop');
  const startItem = menu.getMenuItemById('start');
  
  if (statusItem) {
    statusItem.label = isOnline ? 'Online' : 'Offline';
  }
  
  if (stopItem) {
    stopItem.visible = isOnline;
  }
  
  if (startItem) {
    startItem.visible = !isOnline;
  }
  
  tray.setToolTip(`EmpMonitor Agent - ${isOnline ? 'Online' : 'Offline'}`);
  tray.setContextMenu(menu);
}

// Start tracking
function startTracking() {
  const token = storage.getToken();
  const userInfo = storage.getUserInfo();
  
  if (!token) {
    logger.warn('No token found, showing login window');
    createLoginWindow();
    return;
  }

  logger.info('Starting tracking for user:', userInfo?.email || 'unknown');
  
  try {
    // Load tracking modules
    const ActivityTracker = require('./src/tracker/activity-tracker');
    const ScreenshotCapture = require('./src/tracker/screenshot-capture');
    const ActivityUploader = require('./src/uploader/activity-uploader');
    const ScreenshotUploader = require('./src/uploader/screenshot-uploader');
    const SystemEvents = require('./src/tracker/system-events');
    const IdleDetector = require('./src/tracker/idle-detector');

    // Initialize trackers
    activityTracker = new ActivityTracker(config, token, userInfo);
    screenshotCapture = new ScreenshotCapture(config, token, userInfo);
    activityUploader = new ActivityUploader(config, token, userInfo);
    screenshotUploader = new ScreenshotUploader(config, token, userInfo);
    systemEvents = new SystemEvents(config, token, userInfo);
    idleDetector = new IdleDetector(config, token, userInfo);

    // Start tracking
    activityTracker.start();
    screenshotCapture.start();
    systemEvents.start();
    idleDetector.start();

    // Start uploaders
    activityUploader.start();
    screenshotUploader.start();

    // Update state
    storage.setTrackingState(true);
    updateTrayStatus(true);
    
    logger.info('All tracking modules started successfully');
  } catch (err) {
    logger.error('Failed to start tracking:', err);
    updateTrayStatus(false);
  }
}

// Stop tracking
function stopTracking() {
  logger.info('Stopping tracking');
  
  try {
    if (activityTracker) {
      activityTracker.stop();
      activityTracker = null;
    }
    if (screenshotCapture) {
      screenshotCapture.stop();
      screenshotCapture = null;
    }
    if (systemEvents) {
      systemEvents.stop();
      systemEvents = null;
    }
    if (idleDetector) {
      idleDetector.stop();
      idleDetector = null;
    }
    if (activityUploader) {
      activityUploader.stop();
      activityUploader = null;
    }
    if (screenshotUploader) {
      screenshotUploader.stop();
      screenshotUploader = null;
    }

    storage.setTrackingState(false);
    updateTrayStatus(false);
    
    logger.info('All tracking modules stopped');
  } catch (err) {
    logger.error('Error stopping tracking:', err);
  }
}

// Logout
function logout() {
  logger.info('Logging out');
  
  stopTracking();
  storage.clearToken();
  storage.clearAllData();
  
  if (tray) {
    tray.destroy();
    tray = null;
  }
  
  createLoginWindow();
}

// IPC handlers
ipcMain.on('login-success', () => {
  logger.info('Login successful');
  
  if (mainWindow) {
    mainWindow.close();
  }
  
  createTray();
  startTracking();
});

ipcMain.on('login-failed', (event, error) => {
  logger.error('Login failed:', error);
});

// App ready
app.whenReady().then(() => {
  logger.info('Application ready');
  
  const token = storage.getToken();
  const trackingState = storage.getTrackingState();
  
  if (token && trackingState) {
    // Auto-login and start tracking
    createTray();
    startTracking();
  } else {
    // Show login window
    createLoginWindow();
  }
});

// Quit when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit if tray is active
    if (!tray) {
      app.quit();
    }
  }
});

// Before quit
app.on('before-quit', () => {
  logger.info('Application quitting');
  stopTracking();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});