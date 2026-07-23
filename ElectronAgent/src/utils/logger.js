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

    log(...args) {
        const message = args.map(arg => typeof arg === 'object' ? (arg instanceof Error ? arg.stack : JSON.stringify(arg)) : String(arg)).join(' ');
        const entry = `[${new Date().toISOString()}] [${this.name}] ${message}\n`;
        console.log(entry.trim());
        this.writeToFile(entry);
    }

    info(...args) { this.log('INFO:', ...args); }
    error(...args) { this.log('ERROR:', ...args); }
    warn(...args) { this.log('WARN:', ...args); }
    debug(...args) { this.log('DEBUG:', ...args); }

    writeToFile(entry) {
        try {
            fs.appendFileSync(this.logFile, entry);
        } catch (err) {
            // Silent fail - don't crash the app
        }
    }
}
const defaultLogger = new Logger('Agent');
defaultLogger.Logger = Logger;
module.exports = defaultLogger;