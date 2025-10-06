'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addIndex('users', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', ['is_active']);
    await queryInterface.removeColumn('users', 'is_active');
  }
};