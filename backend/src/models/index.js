const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const ConnectedApp = require('./ConnectedApp')(sequelize, DataTypes);
const MenuItem = require('./MenuItem')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const OrderAuditLog = require('./OrderAuditLog')(sequelize, DataTypes);

// Define associations
const models = {
  User,
  ConnectedApp,
  MenuItem,
  Order,
  OrderAuditLog
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;

module.exports = models;