const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { SOCKET_EVENTS } = require('../utils/constants');

/**
 * Socket.io authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user || !user.is_active) {
      return next(new Error('Invalid or inactive user'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

/**
 * Initialize Socket.io handlers
 */
function initializeSocketHandlers(io) {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`User ${socket.user.username} connected (${socket.id})`);

    // Join user to role-based rooms
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${socket.user.id}`);

    // Handle order status update requests
    socket.on(SOCKET_EVENTS.REQUEST_ORDER_UPDATE, async (data) => {
      try {
        const { orderId, newStatus } = data;
        
        // Emit to all connected users (will be handled by API)
        socket.broadcast.emit(SOCKET_EVENTS.ORDER_UPDATED, {
          orderId,
          newStatus,
          updatedBy: socket.user.username,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`User ${socket.user.username} disconnected (${socket.id})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Helper functions for emitting events
  io.emitNewOrder = (order) => {
    io.emit(SOCKET_EVENTS.NEW_ORDER, order);
  };

  io.emitOrderUpdate = (orderUpdate) => {
    io.emit(SOCKET_EVENTS.ORDER_UPDATED, orderUpdate);
  };

  io.emitItemAvailabilityChange = (itemUpdate) => {
    io.emit(SOCKET_EVENTS.ITEM_AVAILABILITY_CHANGED, itemUpdate);
  };

  console.log('✅ Socket.io handlers initialized');
}

module.exports = initializeSocketHandlers;