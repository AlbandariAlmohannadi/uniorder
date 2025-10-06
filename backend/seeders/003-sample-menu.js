'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First delete existing items to avoid duplicates
    await queryInterface.bulkDelete('menu_items', null, {});
    
    await queryInterface.bulkInsert('menu_items', [
      {
        name: 'Classic Burger',
        description: 'Beef patty with lettuce, tomato, and cheese',
        price: 25.00,
        category: 'Burgers',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Chicken Shawarma',
        description: 'Grilled chicken with garlic sauce and vegetables',
        price: 18.00,
        category: 'Sandwiches',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, tomato sauce, and basil',
        price: 35.00,
        category: 'Pizza',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Caesar Salad',
        description: 'Romaine lettuce with Caesar dressing and croutons',
        price: 22.00,
        category: 'Salads',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Coca Cola',
        description: 'Refreshing soft drink',
        price: 5.00,
        category: 'Beverages',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('menu_items', null, {});
  }
};