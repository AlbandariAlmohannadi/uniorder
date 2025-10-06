'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('connected_apps', 'api_secret_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('connected_apps', 'webhook_secret', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('connected_apps', 'api_secret_encrypted');
    await queryInterface.removeColumn('connected_apps', 'webhook_secret');
  }
};