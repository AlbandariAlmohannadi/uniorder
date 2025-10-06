const { DELIVERY_PLATFORMS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const ConnectedApp = sequelize.define('ConnectedApp', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    app_name: {
      type: DataTypes.ENUM(...Object.values(DELIVERY_PLATFORMS)),
      allowNull: false,
      unique: true
    },
    api_key_encrypted: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    api_secret_encrypted: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    webhook_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    webhook_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidJSON(value) {
          if (typeof value !== 'object') {
            throw new Error('Config must be a valid JSON object');
          }
        }
      }
    },
    last_sync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sync_status: {
      type: DataTypes.ENUM('connected', 'disconnected', 'error'),
      defaultValue: 'disconnected'
    }
  }, {
    tableName: 'connected_apps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['app_name']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['sync_status']
      }
    ]
  });

  ConnectedApp.associate = (models) => {
    // ConnectedApp has many orders
    ConnectedApp.hasMany(models.Order, {
      foreignKey: 'connected_app_id',
      as: 'orders'
    });
  };

  return ConnectedApp;
};