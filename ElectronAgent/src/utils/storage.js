const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

// THIS IS THE FIX - using a path WITHOUT spaces!
const customDataPath = 'C:\\empmonitor-data';

// Create the directory if it doesn't exist
if (!fs.existsSync(customDataPath)) {
    fs.mkdirSync(customDataPath, { recursive: true });
}

// Force electron-store to use our custom path
process.env.ELECTRON_STORE_PATH = customDataPath;

class Storage {
    constructor() {
        try {
            this.store = new Store({
                name: 'empmonitor',
                cwd: customDataPath
            });
            console.log('✅ Storage using:', customDataPath);
        } catch (error) {
            console.error('Storage error:', error);
            this.store = new Store({ name: 'empmonitor' });
        }
    }

    get(key) { return this.store.get(key); }
    set(key, value) { this.store.set(key, value); }
    delete(key) { this.store.delete(key); }
    clear() { this.store.clear(); }
    getToken() { return this.store.get('token'); }
    setToken(token) { this.store.set('token', token); }
    clearToken() { this.store.delete('token'); }
    getEmployeeId() { return this.store.get('employeeId'); }
    setEmployeeId(id) { this.store.set('employeeId', id); }
    getTrackingState() { return this.store.get('trackingState', false); }
    setTrackingState(state) { this.store.set('trackingState', state); }
    getEmployee() { return this.store.get('employee'); }
    setEmployee(data) { this.store.set('employee', data); }
}

module.exports = { Storage };