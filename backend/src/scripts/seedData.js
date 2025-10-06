const { sequelize } = require('../config/database');
const { User, ConnectedApp, MenuItem } = require('../models');
const { hashPassword } = require('../utils/encryption');
const { USER_ROLES, DELIVERY_PLATFORMS } = require('../utils/constants');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database (create tables) - only in development
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ force: true });
    } else {
      throw new Error('Cannot run force sync in production environment');
    }
    console.log('✅ Database tables created');

    // Create admin user
    const adminPassword = await hashPassword('password');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@uniorder.com',
      password_hash: adminPassword,
      role: USER_ROLES.ADMIN
    });
    console.log('✅ Admin user created');

    // Create manager user
    const managerPassword = await hashPassword('password');
    const manager = await User.create({
      username: 'manager',
      email: 'manager@uniorder.com',
      password_hash: managerPassword,
      role: USER_ROLES.MANAGER
    });
    console.log('✅ Manager user created');

    // Create employee user
    const employeePassword = await hashPassword('password');
    const employee = await User.create({
      username: 'employee',
      email: 'employee@uniorder.com',
      password_hash: employeePassword,
      role: USER_ROLES.EMPLOYEE
    });
    console.log('✅ Employee user created');

    // Create connected apps
    await ConnectedApp.bulkCreate([
      {
        app_name: DELIVERY_PLATFORMS.JAHEZ,
        webhook_url: '/webhooks/jahez',
        is_active: true,
        config: {
          api_version: 'v1',
          webhook_events: ['order.created', 'order.updated']
        }
      },
      {
        app_name: DELIVERY_PLATFORMS.HUNGERSTATION,
        webhook_url: '/webhooks/hungerstation',
        is_active: true,
        config: {
          api_version: 'v1',
          webhook_events: ['order.created', 'order.updated']
        }
      },
      {
        app_name: DELIVERY_PLATFORMS.KEETA,
        webhook_url: '/webhooks/keeta',
        is_active: true,
        config: {
          api_version: 'v1',
          webhook_events: ['order.created', 'order.updated']
        }
      }
    ]);
    console.log('✅ Connected apps created');

    // Create sample menu items
    const menuItems = [
      // Burgers
      {
        name: 'Classic Beef Burger',
        description: 'Juicy beef patty with lettuce, tomato, onion, and special sauce',
        price: 25.00,
        category: 'Burgers',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
        preparation_time: 15,
        ingredients: ['beef patty', 'lettuce', 'tomato', 'onion', 'special sauce', 'bun'],
        allergens: ['gluten', 'dairy']
      },
      {
        name: 'Chicken Deluxe Burger',
        description: 'Grilled chicken breast with avocado, bacon, and mayo',
        price: 28.00,
        category: 'Burgers',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1606755962773-d324e9a13086?w=400&h=300&fit=crop',
        preparation_time: 18,
        ingredients: ['chicken breast', 'avocado', 'bacon', 'mayo', 'lettuce', 'bun'],
        allergens: ['gluten', 'dairy']
      },
      {
        name: 'Veggie Burger',
        description: 'Plant-based patty with fresh vegetables and hummus',
        price: 22.00,
        category: 'Burgers',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400&h=300&fit=crop',
        preparation_time: 12,
        ingredients: ['plant-based patty', 'hummus', 'lettuce', 'tomato', 'cucumber', 'bun'],
        allergens: ['gluten']
      },

      // Pizza
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        price: 35.00,
        category: 'Pizza',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
        preparation_time: 20,
        ingredients: ['pizza dough', 'tomato sauce', 'mozzarella', 'basil'],
        allergens: ['gluten', 'dairy']
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Traditional pepperoni pizza with mozzarella cheese',
        price: 40.00,
        category: 'Pizza',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        preparation_time: 22,
        ingredients: ['pizza dough', 'tomato sauce', 'mozzarella', 'pepperoni'],
        allergens: ['gluten', 'dairy']
      },
      {
        name: 'Vegetarian Supreme',
        description: 'Loaded with bell peppers, mushrooms, olives, and onions',
        price: 38.00,
        category: 'Pizza',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop',
        preparation_time: 25,
        ingredients: ['pizza dough', 'tomato sauce', 'mozzarella', 'bell peppers', 'mushrooms', 'olives', 'onions'],
        allergens: ['gluten', 'dairy']
      },

      // Appetizers
      {
        name: 'Buffalo Wings',
        description: 'Spicy chicken wings served with blue cheese dip',
        price: 18.00,
        category: 'Appetizers',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=300&fit=crop',
        preparation_time: 15,
        ingredients: ['chicken wings', 'buffalo sauce', 'blue cheese dip'],
        allergens: ['dairy']
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Crispy breaded mozzarella with marinara sauce',
        price: 15.00,
        category: 'Appetizers',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&h=300&fit=crop',
        preparation_time: 10,
        ingredients: ['mozzarella', 'breadcrumbs', 'marinara sauce'],
        allergens: ['gluten', 'dairy']
      },
      {
        name: 'Loaded Nachos',
        description: 'Tortilla chips with cheese, jalapeños, and sour cream',
        price: 20.00,
        category: 'Appetizers',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop',
        preparation_time: 8,
        ingredients: ['tortilla chips', 'cheese sauce', 'jalapeños', 'sour cream', 'guacamole'],
        allergens: ['dairy']
      },

      // Beverages
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 8.00,
        category: 'Beverages',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop',
        preparation_time: 3,
        ingredients: ['fresh oranges'],
        allergens: []
      },
      {
        name: 'Coca Cola',
        description: 'Classic Coca Cola soft drink',
        price: 5.00,
        category: 'Beverages',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
        preparation_time: 1,
        ingredients: ['coca cola'],
        allergens: []
      },
      {
        name: 'Iced Coffee',
        description: 'Cold brew coffee served with ice',
        price: 12.00,
        category: 'Beverages',
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
        preparation_time: 5,
        ingredients: ['coffee beans', 'ice', 'milk'],
        allergens: ['dairy']
      }
    ];

    await MenuItem.bulkCreate(menuItems);
    console.log('✅ Sample menu items created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Created accounts:');
    console.log('Admin: admin / password');
    console.log('Manager: manager / password');
    console.log('Employee: employee / password');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };