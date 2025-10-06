'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('connected_apps', [
      {
        app_name: 'jahez',
        is_active: false,
        config: JSON.stringify({
          webhook_url: '/webhooks/jahez',
          supported_features: ['orders', 'menu_sync', 'status_updates']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        app_name: 'hungerstation',
        is_active: false,
        config: JSON.stringify({
          webhook_url: '/webhooks/hungerstation',
          supported_features: ['orders', 'status_updates']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        app_name: 'keeta',
        is_active: false,
        config: JSON.stringify({
          webhook_url: '/webhooks/keeta',
          supported_features: ['orders', 'status_updates']
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('connected_apps', {
      app_name: ['jahez', 'hungerstation', 'keeta']
    });
  }
};