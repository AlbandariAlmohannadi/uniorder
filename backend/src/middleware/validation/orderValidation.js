const Joi = require('joi');
const { API_RESPONSE_CODES, ORDER_STATUS } = require('../../utils/constants');

const schemas = {
  updateOrderStatus: Joi.object({
    status: Joi.string().valid(...Object.values(ORDER_STATUS)).required(),
    notes: Joi.string().max(500).allow('')
  }),

  createOrder: Joi.object({
    platform_order_id: Joi.string().required(),
    connected_app_id: Joi.number().integer().positive().required(),
    customer_name: Joi.string().min(1).max(255).required(),
    customer_phone: Joi.string().min(1).max(50).required(),
    customer_address: Joi.string().min(1).required(),
    order_items: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().integer().positive().required(),
        price: Joi.number().positive().required(),
        notes: Joi.string().allow('')
      })
    ).min(1).required(),
    total_amount: Joi.number().positive().required(),
    notes: Joi.string().max(500).allow('')
  }),

  updateOrderNotes: Joi.object({
    notes: Joi.string().max(500).allow('')
  }),

  cancelOrder: Joi.object({
    reason: Joi.string().max(255).required()
  }),

  bulkUpdateOrders: Joi.object({
    orderIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    status: Joi.string().valid(...Object.values(ORDER_STATUS)).required(),
    notes: Joi.string().max(500).allow('')
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
  validateUpdateOrderStatus: validate('updateOrderStatus'),
  validateCreateOrder: validate('createOrder'),
  validateUpdateOrderNotes: validate('updateOrderNotes'),
  validateCancelOrder: validate('cancelOrder'),
  validateBulkUpdateOrders: validate('bulkUpdateOrders')
};