# UniOrder API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## Authentication Endpoints

### POST /auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
}
```

### POST /auth/logout
Logout current user.

### GET /auth/profile
Get current user profile.

### PUT /auth/profile
Update user profile.

### PUT /auth/change-password
Change user password.

## Order Endpoints

### GET /orders
Get paginated list of orders with filters.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `status` (string): Filter by order status
- `platform` (string): Filter by platform
- `fromDate` (string): Start date filter
- `toDate` (string): End date filter
- `search` (string): Search in order ID, customer name, or phone

### GET /orders/:id
Get specific order details.

### PUT /orders/:id/status
Update order status.

**Request Body:**
```json
{
  "status": "preparing",
  "notes": "Optional notes"
}
```

### POST /orders
Create new order (for testing/manual entry).

### GET /orders/stats/daily
Get daily order statistics.

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format (default: today)

### GET /orders/stats/weekly
Get weekly order statistics.

### GET /orders/stats/monthly
Get monthly order statistics.

### GET /orders/dashboard
Get dashboard data with real-time statistics.

## Menu Endpoints

### GET /menu
Get all menu items with optional filters.

**Query Parameters:**
- `category` (string): Filter by category
- `is_available` (boolean): Filter by availability
- `search` (string): Search in item name

### GET /menu/:id
Get specific menu item.

### POST /menu
Create new menu item.

**Request Body:**
```json
{
  "name": "Burger",
  "description": "Delicious beef burger",
  "price": 25.50,
  "category": "Main Course",
  "is_available": true,
  "image_url": "https://example.com/image.jpg"
}
```

### PUT /menu/:id
Update existing menu item.

### DELETE /menu/:id
Delete menu item.

### PATCH /menu/:id/availability
Toggle menu item availability.

**Request Body:**
```json
{
  "is_available": true
}
```

### GET /menu/categories
Get all menu categories.

### PATCH /menu/bulk-update
Bulk update menu items.

## User Management Endpoints (Admin Only)

### GET /users
Get all users.

### POST /users
Create new user.

### PUT /users/:id
Update user.

### DELETE /users/:id
Delete user.

## Integration Endpoints

### POST /integrations/jahez
Configure Jahez integration.

**Request Body:**
```json
{
  "apiKey": "jahez_api_key",
  "apiSecret": "jahez_api_secret",
  "webhookSecret": "webhook_secret"
}
```

### GET /integrations/jahez/status
Check Jahez connection status.

### POST /integrations/hungerstation
Configure HungerStation integration.

### POST /integrations/keeta
Configure Keeta integration.

## Webhook Endpoints

### POST /webhooks/jahez
Receive orders from Jahez platform.

### POST /webhooks/hungerstation
Receive orders from HungerStation platform.

### POST /webhooks/keeta
Receive orders from Keeta platform.

## Report Endpoints

### GET /reports/revenue
Get revenue report.

**Query Parameters:**
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

### GET /reports/performance
Get performance report.

### GET /reports/platforms
Get platform comparison report.

### GET /reports/customers
Get customer insights.

### GET /reports/menu
Get menu performance report.

### GET /reports/trends
Get order trends.

**Query Parameters:**
- `period` (string): daily, weekly, or monthly
- `days` (number): Number of days to analyze

### GET /reports/export/pdf
Export report as PDF.

### GET /reports/export/excel
Export report as Excel.

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Order Status Values

- `received` - Order received from platform
- `preparing` - Order is being prepared
- `ready` - Order is ready for pickup/delivery
- `completed` - Order completed successfully
- `cancelled` - Order cancelled

## User Roles

- `admin` - Full system access
- `manager` - Management features access
- `employee` - Basic order management access

## Rate Limiting

- API endpoints: 1000 requests per 15 minutes per IP
- Webhook endpoints: 100 requests per minute per IP

## WebSocket Events

### Client Events (Emit)
- `join_room` - Join order updates room
- `leave_room` - Leave order updates room

### Server Events (Listen)
- `new_order` - New order received
- `order_updated` - Order status updated
- `item_availability_changed` - Menu item availability changed
- `connection_status` - Connection status updates

## Example Usage

### JavaScript/TypeScript
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password'
  })
});

const data = await response.json();
const token = data.data.token;

// Get orders
const ordersResponse = await fetch('/api/orders?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const orders = await ordersResponse.json();
```

### cURL
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get orders
curl -X GET http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```