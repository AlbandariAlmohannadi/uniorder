const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const menuRoutes = require('./menuRoutes');
const orderRoutes = require('./orderRoutes');
const integrationRoutes = require('./integrationRoutes');
const reportRoutes = require('./reports');
const healthRoutes = require('./healthRoutes');


// API version info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UniOrder API v1.0',
    version: process.env.API_VERSION || '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      menu: '/api/menu',
      orders: '/api/orders',
      integrations: '/api/integrations',
      reports: '/api/reports',

      webhooks: '/webhooks'
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/integrations', integrationRoutes);
router.use('/reports', reportRoutes);
router.use('/', healthRoutes);


// Webhook routes (separate from /api prefix)
router.use('/webhooks', integrationRoutes);

module.exports = router;