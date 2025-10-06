const ORDER_STATUS = {
  RECEIVED: 'received',
  PREPARING: 'preparing',
  READY: 'ready',
  READY_FOR_PICKUP: 'ready_for_pickup', // Alias for READY
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const REJECTION_REASONS = {
  OUT_OF_STOCK: 'Out of Stock',
  ITEM_UNAVAILABLE: 'Item Unavailable',
  TECHNICAL_ERROR: 'Technical Error',
  RESTAURANT_CLOSED: 'Restaurant Closed',
  OTHER: 'Other'
};

const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

const DELIVERY_PLATFORMS = {
  JAHEZ: 'jahez',
  HUNGERSTATION: 'hungerstation',
  KEETA: 'keeta'
};

const API_RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

const SOCKET_EVENTS = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATED: 'order_updated',
  ITEM_AVAILABILITY_CHANGED: 'item_availability_changed',
  REQUEST_ORDER_UPDATE: 'request_order_update',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect'
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100
};

module.exports = {
  ORDER_STATUS,
  USER_ROLES,
  ROLES: USER_ROLES, // Alias for compatibility
  DELIVERY_PLATFORMS,
  API_RESPONSE_CODES,
  SOCKET_EVENTS,
  PAGINATION,
  REJECTION_REASONS
};