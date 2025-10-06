const { USER_ROLES, API_RESPONSE_CODES } = require('../utils/constants');

/**
 * Role-based authorization middleware
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(API_RESPONSE_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(API_RESPONSE_CODES.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin only access
 */
const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Manager or Admin access
 */
const requireManager = requireRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER]);

/**
 * Any authenticated user (Employee, Manager, or Admin)
 */
const requireEmployee = requireRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE]);

/**
 * Check if user can access resource based on ownership or role
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @param {string[]} allowedRoles - Roles that can access any resource
 * @returns {Function} Express middleware function
 */
const requireOwnershipOrRole = (getResourceOwnerId, allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.MANAGER]) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(API_RESPONSE_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has privileged role
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // Check ownership
      const resourceOwnerId = await getResourceOwnerId(req);
      if (resourceOwnerId && resourceOwnerId === req.user.id) {
        return next();
      }

      return res.status(API_RESPONSE_CODES.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(API_RESPONSE_CODES.INTERNAL_ERROR).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireManager,
  requireEmployee,
  requireOwnershipOrRole
};