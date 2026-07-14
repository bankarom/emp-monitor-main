const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'agent.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

let currentLogLevel = LOG_LEVELS.info;

function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLogLevel = LOG_LEVELS[level];
  }
}

function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
}

function writeLog(level, message) {
  if (LOG_LEVELS[level] < currentLogLevel) {
    return;
  }

  const formattedMessage = formatMessage(level, message);
  
  // Write to file
  fs.appendFile(logFile, formattedMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });

  // Also log to console
  console.log(formattedMessage.trim());
}

function debug(message) {
  writeLog('debug', message);
}

function info(message) {
  writeLog('info', message);
}

function warn(message) {
  writeLog('warn', message);
}

function error(message) {
  writeLog('error', message);
}

module.exports = {
  setLogLevel,
  debug,
  info,
  warn,
  error
};
