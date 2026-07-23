const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

// FORCE the app to use C:\empmonitor-data
const customDataPath = 'C:\\empmonitor-data';

// Create the directory if it doesn't exist
if (!fs.existsSync(customDataPath)) {
    try {
        fs.mkdirSync(customDataPath, { recursive: true });
        console.log('✅ Created storage directory:', customDataPath);
    } catch (err) {
        console.error('❌ Failed to create directory:', err);
    }
}



class Storage {
    constructor() {
        try {
            this.store = new Store({
                name: 'empmonitor',
                cwd: customDataPath,
                defaults: {
                    token: null,
                    employeeId: null,
                    trackingState: false,
                    employee: null
                }
            });
            console.log('✅ Storage initialized at:', customDataPath);
        } catch (error) {
            console.error('❌ Storage error:', error);
            this.store = new Store({ name: 'empmonitor' });
        }
    }

    get(key) { return this.store.get(key); }
    set(key, value) { this.store.set(key, value); }
    delete(key) { this.store.delete(key); }
    clear() { this.store.clear(); }
    getToken() { return this.store.get('token'); }
    setToken(token) { this.store.set('token', token); }
    saveToken(token) { this.store.set('token', token); }
    clearToken() { this.store.delete('token'); }
    getEmployeeId() { return this.store.get('employeeId'); }
    setEmployeeId(id) { this.store.set('employeeId', id); }
    getTrackingState() { return this.store.get('trackingState', false); }
    setTrackingState(state) { this.store.set('trackingState', state); }
    getEmployee() { return this.store.get('employee'); }
    setEmployee(data) { this.store.set('employee', data); }
    getUserInfo() { return this.store.get('employee'); }
    saveUserInfo(info) { this.store.set('employee', info); }
    getApiUrls() {
        return {
            desktopUrl: this.store.get('desktopApiUrl'),
            storeLogsUrl: this.store.get('storeLogsApiUrl')
        };
    }
    saveApiUrls(desktopUrl, storeLogsUrl) {
        this.store.set('desktopApiUrl', desktopUrl);
        this.store.set('storeLogsApiUrl', storeLogsUrl);
    }
}

module.exports = { Storage };