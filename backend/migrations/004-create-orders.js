'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      platform_order_id: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      connected_app_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'connected_apps',
          key: 'id'
        }
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      customer_phone: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      customer_address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      order_items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('received', 'preparing', 'ready', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'received'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      platform_metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      estimated_delivery_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actual_delivery_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('orders', ['platform_order_id', 'connected_app_id'], { unique: true });
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['created_at']);
    await queryInterface.addIndex('orders', ['customer_phone']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  }
};