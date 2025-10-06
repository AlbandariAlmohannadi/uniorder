module.exports = (sequelize, DataTypes) => {
  const OrderAuditLog = sequelize.define('OrderAuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    old_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    changed_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    changed_by_system: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'System component that made the change (e.g., webhook, scheduler)'
    },
    change_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional context about the change'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'order_audit_logs',
    timestamps: false, // Using custom timestamp field
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['changed_by_user_id']
      },
      {
        fields: ['new_status']
      }
    ]
  });

  OrderAuditLog.associate = (models) => {
    // Audit log belongs to an order
    OrderAuditLog.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });

    // Audit log belongs to a user (optional)
    OrderAuditLog.belongsTo(models.User, {
      foreignKey: 'changed_by_user_id',
      as: 'changed_by_user'
    });
  };

  return OrderAuditLog;
};