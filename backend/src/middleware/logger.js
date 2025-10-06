const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = {
  // Log levels
  LEVELS: {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
  },

  // Write log to file
  writeLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    const logString = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);

    fs.appendFileSync(logFile, logString);

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${timestamp}] ${level}: ${message}`, meta);
    }
  },

  // Log methods
  error(message, meta = {}) {
    this.writeLog(this.LEVELS.ERROR, message, meta);
  },

  warn(message, meta = {}) {
    this.writeLog(this.LEVELS.WARN, message, meta);
  },

  info(message, meta = {}) {
    this.writeLog(this.LEVELS.INFO, message, meta);
  },

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog(this.LEVELS.DEBUG, message, meta);
    }
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip, headers } = req;

  // Log request
  logger.info('Request started', {
    method,
    url,
    ip,
    userAgent: headers['user-agent'],
    userId: req.user?.id
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Log response
    logger.info('Request completed', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      success: statusCode < 400
    });

    // Log errors
    if (statusCode >= 400) {
      logger.error('Request failed', {
        method,
        url,
        statusCode,
        error: data.message || 'Unknown error',
        userId: req.user?.id
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  const { method, url, ip } = req;

  logger.error('Unhandled error', {
    method,
    url,
    ip,
    error: error.message,
    stack: error.stack,
    userId: req.user?.id
  });

  next(error);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};