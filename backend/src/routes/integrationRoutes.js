const express = require('express');
const IntegrationController = require('../controllers/integrationController');
const { requireAdmin } = require('../middleware/roleCheck');
const { authenticateToken } = require('../middleware/auth');
const integrationService = require('../services/integrationService');
const orderService = require('../services/orderService');

const router = express.Router();

// Webhook routes (public, no authentication required)
router.post('/jahez', async (req, res) => {
  try {
    const signature = req.headers['x-jahez-signature'];
    const eventType = req.headers['x-jahez-event'];
    
    const result = await integrationService.processWebhook('jahez', req.body, signature, eventType);
    
    if (result && result.data) {
      // Create order in database
      const order = await orderService.createOrder({
        ...result.data,
        connected_app_id: 1 // This should be dynamically determined
      });
      
      // Emit real-time update
      req.app.get('io')?.emitNewOrder(order);
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Jahez webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/hungerstation', async (req, res) => {
  try {
    const signature = req.headers['x-hungerstation-signature'];
    const eventType = req.headers['x-event-type'];
    
    const result = await integrationService.processWebhook('hungerstation', req.body, signature, eventType);
    
    if (result && result.data) {
      const order = await orderService.createOrder({
        ...result.data,
        connected_app_id: 2 // This should be dynamically determined
      });
      
      req.app.get('io')?.emitNewOrder(order);
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('HungerStation webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/keeta', async (req, res) => {
  try {
    const signature = req.headers['x-keeta-signature'];
    const eventType = req.headers['x-event-type'];
    
    const result = await integrationService.processWebhook('keeta', req.body, signature, eventType);
    
    if (result && result.data) {
      const order = await orderService.createOrder({
        ...result.data,
        connected_app_id: 3 // This should be dynamically determined
      });
      
      req.app.get('io')?.emitNewOrder(order);
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Keeta webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Protected integration management routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/integrations - Get all integrations
router.get('/', IntegrationController.getIntegrations);

// GET /api/integrations/stats - Get integration statistics
router.get('/stats', IntegrationController.getIntegrationStats);

// GET /api/integrations/:platform/status - Check integration status
router.get('/:platform/status', IntegrationController.getIntegrationStatus);

// POST /api/integrations/:platform/test - Test integration connection
router.post('/:platform/test', IntegrationController.testIntegration);

// POST /api/integrations/jahez - Configure Jahez integration
router.post('/jahez', IntegrationController.configureJahez);

// POST /api/integrations/hungerstation - Configure HungerStation integration
router.post('/hungerstation', IntegrationController.configureHungerStation);

// POST /api/integrations/keeta - Configure Keeta integration
router.post('/keeta', IntegrationController.configureKeeta);

// PUT /api/integrations/:platform/toggle - Toggle integration status
router.put('/:platform/toggle', IntegrationController.toggleIntegration);

// DELETE /api/integrations/:platform - Delete integration
router.delete('/:platform', IntegrationController.deleteIntegration);

module.exports = router;