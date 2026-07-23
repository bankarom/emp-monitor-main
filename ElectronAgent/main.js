console.log("===== MAIN.JS STARTED =====");
const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron'); 
console.log("Electron version:", process.versions.electron);

app.on('ready', () => {
    console.log("EVENT: ready");
});

app.on('will-finish-launching', () => {
    console.log("EVENT: will-finish-launching");
});

app.on('window-all-closed', () => {
    console.log("EVENT: window-all-closed");
});

app.on('quit', () => {
    console.log("EVENT: quit");
});

app.on('before-quit', () => {
    console.log("EVENT: before-quit");
});
// NOTE: Do NOT override APPDATA/LOCALAPPDATA/USERPROFILE here.
// Electron/Chromium uses these env vars internally during initialization.
// Overriding them before app.whenReady() causes a native EXCEPTION_BREAKPOINT crash.
// The electron-store 'cwd' option in storage.js handles custom storage paths safely.
const path = require('path');
console.log("1 - path loaded");

const config = require('./src/utils/config');
console.log("2 - config loaded");

const { Storage } = require('./src/utils/storage');
console.log("3 - storage module loaded");

const { Logger } = require('./src/utils/logger');
const logger = new Logger('Main');
console.log("4 - logger instantiated");
// Global references
let storage = null;
let mainWindow = null;
let tray = null;
let contextMenu = null;
let activityTracker = null;
let screenshotCapture = null;
let activityUploader = null;
let screenshotUploader = null;
let systemEvents = null;
let idleDetector = null;

// Create login window - FIXED to force window to show!
function createLoginWindow() {
  logger.info('Creating login window');
  console.log("A - Creating BrowserWindow");
  
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
    show: true,           // ← FORCE window to show
    focusable: true,      // ← Allow window to receive focus
    alwaysOnTop: true,    // ← Keep window on top
    icon: path.join(__dirname, 'resources', 'icon.ico')
  });
  console.log("B - About to load login.html");

mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'login.html'));
console.log("C - login.html loaded");
  
  // FORCE the window to show and focus
  mainWindow.show();
  console.log("D - Window shown");
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true);
  
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
  
  const iconPath = path.join(__dirname, 'resources', 'icon.ico');
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
  
  contextMenu = Menu.buildFromTemplate([
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
  if (!tray || !contextMenu) return;
  
  const menu = contextMenu;
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
  const userInfo = storage.getEmployee();
  
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
    activityUploader.setActivityTracker(activityTracker);
    screenshotUploader.setScreenshotCapture(screenshotCapture);
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
  storage.clear();
  
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

    console.log("5 - APP READY");

    // Instantiate Storage AFTER app is ready
    // (electron-store internally calls app.getPath('userData') which requires ready state)
    try {
        storage = new Storage();
        console.log("5.5 - storage instantiated");
    } catch (err) {
        console.error("ERROR instantiating Storage:", err);
    }

    try {

        console.log("6 - Before createLoginWindow");

        createLoginWindow();

        console.log("7 - After createLoginWindow");

    } catch (err) {

        console.error("ERROR INSIDE createLoginWindow");
        console.error(err);

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