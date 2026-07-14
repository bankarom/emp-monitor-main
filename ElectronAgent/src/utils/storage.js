const Store = require('electron-store');
const path = require('path');

// Initialize electron-store
const store = new Store({
  name: 'emp-monitor-agent',
  cwd: path.join(__dirname, '../../')
});

// Save JWT token
function saveToken(token) {
  store.set('auth.token', token);
}

// Get JWT token
function getToken() {
  return store.get('auth.token');
}

// Clear token (logout)
function clearToken() {
  store.delete('auth.token');
}

// Save user info
function saveUserInfo(user) {
  store.set('auth.user', user);
}

// Get user info
function getUserInfo() {
  return store.get('auth.user');
}

// Save API URLs (for production)
function saveApiUrls(desktopUrl, storeLogsUrl) {
  store.set('api.desktopUrl', desktopUrl);
  store.set('api.storeLogsUrl', storeLogsUrl);
}

// Get API URLs
function getApiUrls() {
  return {
    desktopUrl: store.get('api.desktopUrl'),
    storeLogsUrl: store.get('api.storeLogsUrl')
  };
}

// Save tracking state
function setTrackingState(isTracking) {
  store.set('tracking.isActive', isTracking);
}

// Get tracking state
function getTrackingState() {
  return store.get('tracking.isActive', false);
}

// Save last upload time
function setLastUploadTime(timestamp) {
  store.set('tracking.lastUpload', timestamp);
}

// Get last upload time
function getLastUploadTime() {
  return store.get('tracking.lastUpload', 0);
}

// Clear all data (for logout/uninstall)
function clearAllData() {
  store.clear();
}

module.exports = {
  saveToken,
  getToken,
  clearToken,
  saveUserInfo,
  getUserInfo,
  saveApiUrls,
  getApiUrls,
  setTrackingState,
  getTrackingState,
  setLastUploadTime,
  getLastUploadTime,
  clearAllData
};
