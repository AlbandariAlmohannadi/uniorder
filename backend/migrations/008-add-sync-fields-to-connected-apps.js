'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('connected_apps', 'last_sync', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('connected_apps', 'sync_status', {
      type: Sequelize.ENUM('connected', 'disconnected', 'error'),
      allowNull: false,
      defaultValue: 'disconnected'
    });

    await queryInterface.addIndex('connected_apps', ['sync_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('connected_apps', ['sync_status']);
    await queryInterface.removeColumn('connected_apps', 'sync_status');
    await queryInterface.removeColumn('connected_apps', 'last_sync');
  }
};