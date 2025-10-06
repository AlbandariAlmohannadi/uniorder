const Joi = require('joi');
const { API_RESPONSE_CODES, USER_ROLES } = require('../../utils/constants');

const schemas = {
  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid(...Object.values(USER_ROLES)).default(USER_ROLES.EMPLOYEE)
  }),

  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email(),
    role: Joi.string().valid(...Object.values(USER_ROLES)),
    is_active: Joi.boolean()
  }),

  updatePassword: Joi.object({
    newPassword: Joi.string().min(6).max(128).required()
  }),

  toggleStatus: Joi.object({
    isActive: Joi.boolean().required()
  })
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(API_RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateCreateUser: validate('createUser'),
  validateUpdateUser: validate('updateUser'),
  validateUpdatePassword: validate('updatePassword'),
  validateToggleStatus: validate('toggleStatus')
};