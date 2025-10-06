const express = require('express');
const router = express.Router();
const RestaurantController = require('../controllers/restaurantController');
const { auth } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Get restaurant status
router.get('/status', auth, RestaurantController.getStatus);

// Update restaurant open/close status (Manager+ only)
router.patch('/status', auth, roleCheck(['admin', 'manager']), RestaurantController.updateStatus);

// Update auto-accept setting (Manager+ only)
router.patch('/auto-accept', auth, roleCheck(['admin', 'manager']), RestaurantController.updateAutoAccept);

// Get restaurant settings
router.get('/settings', auth, RestaurantController.getSettings);

module.exports = router;