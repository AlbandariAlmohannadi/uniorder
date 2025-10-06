const Joi = require('joi');
const { API_RESPONSE_CODES, USER_ROLES } = require('../../utils/constants');

const schemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(255).required(),
    password: Joi.string().min(6).required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(128).required()
  }),

  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid(...Object.values(USER_ROLES)).default(USER_ROLES.EMPLOYEE)
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
  validateLogin: validate('login'),
  validateChangePassword: validate('changePassword'),
  validateRegister: validate('register')
};