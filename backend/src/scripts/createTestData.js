const { sequelize } = require('../config/database');
const { User, MenuItem, Order, ConnectedApp } = require('../models');
const { hashPassword } = require('../utils/encryption');
const path = require('path');
const fs = require('fs');

const createTestData = async () => {
  try {
    console.log('Creating test data...');

    // Create test users
    const hashedPassword = await hashPassword('password123');
    
    const users = await User.bulkCreate([
      {
        username: 'admin',
        email: 'admin@uniorder.com',
        password_hash: hashedPassword,
        role: 'admin',
        is_active: true
      },
      {
        username: 'manager1',
        email: 'manager@restaurant.com',
        password_hash: hashedPassword,
        role: 'manager',
        is_active: true
      },
      {
        username: 'employee1',
        email: 'employee@restaurant.com',
        password_hash: hashedPassword,
        role: 'employee',
        is_active: true
      }
    ], { ignoreDuplicates: true });

    // Create comprehensive menu items with images
    const menuItems = await MenuItem.bulkCreate([
      {
        name: 'Classic Beef Burger',
        description: 'Juicy beef patty with fresh lettuce, tomato, onion, and our special sauce',
        price: 28.50,
        category: 'Burgers',
        is_available: true,
        image_url: '/images/burger.jpg',
        preparation_time: 15
      },
      {
        name: 'Margherita Pizza',
        description: 'Traditional Italian pizza with fresh mozzarella, tomato sauce, and basil',
        price: 42.00,
        category: 'Pizza',
        is_available: true,
        image_url: '/images/pizza.jpg',
        preparation_time: 20
      },
      {
        name: 'Espresso Coffee',
        description: 'Rich and aromatic espresso made from premium coffee beans',
        price: 12.00,
        category: 'Beverages',
        is_available: true,
        image_url: '/images/coffee.jpg',
        preparation_time: 3
      },
      {
        name: 'Chicken Shawarma Wrap',
        description: 'Grilled chicken with garlic sauce, vegetables, and pickles in pita bread',
        price: 22.00,
        category: 'Wraps',
        is_available: true,
        image_url: '/images/pexels-ella-olsson-572949-1640772.jpg',
        preparation_time: 12
      },
      {
        name: 'Mediterranean Salad',
        description: 'Fresh mixed greens with olives, feta cheese, and olive oil dressing',
        price: 18.50,
        category: 'Salads',
        is_available: true,
        image_url: '/images/pexels-fotios-photos-745052.jpg',
        preparation_time: 8
      },
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon grilled to perfection with herbs and lemon',
        price: 65.00,
        category: 'Seafood',
        is_available: true,
        image_url: '/images/pexels-furkanalakoc-33929953.jpg',
        preparation_time: 25
      },
      {
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with layers of chocolate ganache',
        price: 15.00,
        category: 'Desserts',
        is_available: true,
        image_url: '/images/pexels-norma-mortenson-4393668.jpg',
        preparation_time: 5
      },
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice, no added sugar',
        price: 8.00,
        category: 'Beverages',
        is_available: true,
        image_url: '/images/pexels-viktoria-alipatova-1083711-2074130.jpg',
        preparation_time: 2
      },
      {
        name: 'Pasta Carbonara',
        description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
        price: 32.00,
        category: 'Pasta',
        is_available: true,
        image_url: '/images/pexels-chipi1189-33964550.jpg',
        preparation_time: 18
      },
      {
        name: 'Vegetarian Burger',
        description: 'Plant-based patty with avocado, sprouts, and vegan mayo',
        price: 26.00,
        category: 'Burgers',
        is_available: true,
        image_url: '/images/pexels-bingqian-li-230971044-32116008.jpg',
        preparation_time: 15
      }
    ], { ignoreDuplicates: true });

    // Create sample orders with realistic data
    const sampleOrders = [
      {
        platform_order_id: 'JZ-2024-001',
        customer_name: 'Ahmed Al-Rashid',
        customer_phone: '+966501234567',
        customer_address: 'King Fahd Road, Riyadh 12345, Saudi Arabia',
        order_items: [
          { name: 'Classic Beef Burger', quantity: 2, price: 28.50, notes: 'No onions please' },
          { name: 'Fresh Orange Juice', quantity: 2, price: 8.00 }
        ],
        total_amount: 73.00,
        status: 'received',
        connected_app_id: 1,
        created_at: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        platform_order_id: 'HS-2024-002',
        customer_name: 'Fatima Mohammed',
        customer_phone: '+966507654321',
        customer_address: 'Olaya Street, Riyadh 11564, Saudi Arabia',
        order_items: [
          { name: 'Margherita Pizza', quantity: 1, price: 42.00 },
          { name: 'Espresso Coffee', quantity: 2, price: 12.00 }
        ],
        total_amount: 66.00,
        status: 'preparing',
        connected_app_id: 2,
        created_at: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
      },
      {
        platform_order_id: 'KT-2024-003',
        customer_name: 'Omar Hassan',
        customer_phone: '+966509876543',
        customer_address: 'Prince Sultan Road, Jeddah 23442, Saudi Arabia',
        order_items: [
          { name: 'Chicken Shawarma Wrap', quantity: 3, price: 22.00 },
          { name: 'Mediterranean Salad', quantity: 1, price: 18.50 }
        ],
        total_amount: 84.50,
        status: 'ready',
        connected_app_id: 3,
        created_at: new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
      },
      {
        platform_order_id: 'JZ-2024-004',
        customer_name: 'Sarah Abdullah',
        customer_phone: '+966502468135',
        customer_address: 'Tahlia Street, Riyadh 12311, Saudi Arabia',
        order_items: [
          { name: 'Grilled Salmon', quantity: 1, price: 65.00 },
          { name: 'Chocolate Cake', quantity: 1, price: 15.00 }
        ],
        total_amount: 80.00,
        status: 'completed',
        connected_app_id: 1,
        created_at: new Date(Date.now() - 90 * 60 * 1000) // 90 minutes ago
      },
      {
        platform_order_id: 'HS-2024-005',
        customer_name: 'Mohammed Ali',
        customer_phone: '+966505551234',
        customer_address: 'King Abdul Aziz Road, Dammam 31411, Saudi Arabia',
        order_items: [
          { name: 'Pasta Carbonara', quantity: 2, price: 32.00 },
          { name: 'Vegetarian Burger', quantity: 1, price: 26.00 }
        ],
        total_amount: 90.00,
        status: 'received',
        connected_app_id: 2,
        created_at: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      }
    ];

    for (const orderData of sampleOrders) {
      await Order.create(orderData);
    }

    console.log('Test data created successfully!');
    console.log(`Created ${users.length} users`);
    console.log(`Created ${menuItems.length} menu items`);
    console.log(`Created ${sampleOrders.length} sample orders`);
    
    console.log('\nTest Login Credentials:');
    console.log('Admin: admin / password123');
    console.log('Manager: manager1 / password123');
    console.log('Employee: employee1 / password123');

  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('Test data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create test data:', error);
      process.exit(1);
    });
}

module.exports = createTestData;