const fs = require('fs');
const path = require('path');

// FORCE logs to C:\empmonitor-data
const logPath = 'C:\\empmonitor-data\\logs';

// Create log directory
if (!fs.existsSync(logPath)) {
    try {
        fs.mkdirSync(logPath, { recursive: true });
    } catch (err) {
        console.error('Failed to create log directory:', err);
    }
}

class Logger {
    constructor(name = 'App') {
        this.name = name;
        this.logFile = path.join(logPath, `${name}.log`);
    }

    log(message) {
        const entry = `[${new Date().toISOString()}] [${this.name}] ${message}\n`;
        console.log(entry.trim());
        this.writeToFile(entry);
    }

    info(message) { this.log(`INFO: ${message}`); }
    error(message) { this.log(`ERROR: ${message}`); }
    warn(message) { this.log(`WARN: ${message}`); }
    debug(message) { this.log(`DEBUG: ${message}`); }

    writeToFile(entry) {
        try {
            fs.appendFileSync(this.logFile, entry);
        } catch (err) {
            // Silent fail - don't crash the app
        }
    }
}

module.exports = { Logger };