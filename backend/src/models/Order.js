const { ORDER_STATUS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    platform_order_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    connected_app_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'connected_apps',
        key: 'id'
      }
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    customer_phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    customer_address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    order_items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Order items must be an array');
          }
          if (value.length === 0) {
            throw new Error('Order must contain at least one item');
          }
        }
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
      defaultValue: ORDER_STATUS.RECEIVED
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    platform_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Original payload from delivery platform'
    },
    estimated_delivery_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actual_delivery_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['platform_order_id', 'connected_app_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['customer_phone']
      },
      {
        fields: ['total_amount']
      }
    ],
    scopes: {
      active: {
        where: {
          status: {
            [sequelize.Sequelize.Op.notIn]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED]
          }
        }
      },
      byStatus: (status) => ({
        where: { status }
      }),
      recent: {
        order: [['created_at', 'DESC']]
      }
    }
  });

  Order.associate = (models) => {
    // Order belongs to a connected app
    Order.belongsTo(models.ConnectedApp, {
      foreignKey: 'connected_app_id',
      as: 'platform'
    });

    // Order has many audit logs
    Order.hasMany(models.OrderAuditLog, {
      foreignKey: 'order_id',
      as: 'audit_logs'
    });
  };

  // Instance methods
  Order.prototype.updateStatus = async function(newStatus, userId = null) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    if (newStatus === ORDER_STATUS.COMPLETED) {
      this.completed_at = new Date();
    } else if (newStatus === ORDER_STATUS.CANCELLED) {
      this.cancelled_at = new Date();
    }
    
    await this.save();
    
    // Create audit log
    const { OrderAuditLog } = require('./index');
    await OrderAuditLog.create({
      order_id: this.id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by_user_id: userId,
      timestamp: new Date()
    });
    
    return this;
  };

  return Order;
};