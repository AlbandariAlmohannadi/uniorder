'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_audit_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        }
      },
      old_status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      new_status: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      changed_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      changed_by_system: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      change_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('order_audit_logs', ['order_id']);
    await queryInterface.addIndex('order_audit_logs', ['timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('order_audit_logs');
  }
};