/**
 * Utility functions for sanitizing sensitive data in logs and responses
 */

const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'api_key',
  'authorization',
  'cookie',
  'session'
];

/**
 * Recursively sanitize an object by removing or masking sensitive fields
 * @param {any} obj - Object to sanitize
 * @param {string[]} sensitiveFields - Array of field names to sanitize
 * @returns {any} Sanitized object
 */
const sanitizeObject = (obj, sensitiveFields = SENSITIVE_FIELDS) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sensitiveFields));
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Sanitize request data for logging
 * @param {Object} req - Express request object
 * @returns {Object} Sanitized request data
 */
const sanitizeRequest = (req) => {
  return {
    method: req.method,
    url: req.url,
    headers: sanitizeObject(req.headers),
    body: sanitizeObject(req.body),
    params: sanitizeObject(req.params),
    query: sanitizeObject(req.query),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
};

module.exports = {
  sanitizeObject,
  sanitizeRequest,
  SENSITIVE_FIELDS
};