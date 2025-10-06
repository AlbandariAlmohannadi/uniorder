const orderService = require('../../../src/services/orderService');
const { Order, ConnectedApp, OrderAuditLog } = require('../../../src/models');

jest.mock('../../../src/models');

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: 1, platform_order_id: 'TEST001', status: 'received' },
        { id: 2, platform_order_id: 'TEST002', status: 'preparing' }
      ];

      Order.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockOrders
      });

      const result = await orderService.getOrders({
        page: 1,
        limit: 10
      });

      expect(result).toEqual({
        orders: mockOrders,
        total: 2
      });
      expect(Order.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 0
      });
    });

    it('should apply status filter', async () => {
      Order.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 1, status: 'completed' }]
      });

      await orderService.getOrders({
        page: 1,
        limit: 10,
        filters: { status: 'completed' }
      });

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'completed' }
        })
      );
    });
  });

  describe('createOrder', () => {
    it('should create new order successfully', async () => {
      const orderData = {
        platform_order_id: 'TEST001',
        connected_app_id: 1,
        customer_name: 'John Doe',
        customer_phone: '+966501234567',
        customer_address: '123 Main St',
        order_items: [{ name: 'Burger', quantity: 1, price: 25 }],
        total_amount: 25.00
      };

      const mockConnectedApp = { id: 1, app_name: 'jahez' };
      const mockOrder = { id: 1, ...orderData };

      ConnectedApp.findByPk.mockResolvedValue(mockConnectedApp);
      Order.findOne.mockResolvedValue(null);
      Order.create.mockResolvedValue(mockOrder);
      OrderAuditLog.create.mockResolvedValue({});
      
      jest.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(orderData);

      expect(ConnectedApp.findByPk).toHaveBeenCalledWith(1);
      expect(Order.findOne).toHaveBeenCalled();
      expect(Order.create).toHaveBeenCalledWith({
        ...orderData,
        status: 'received'
      });
      expect(OrderAuditLog.create).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should throw error if connected app not found', async () => {
      ConnectedApp.findByPk.mockResolvedValue(null);

      await expect(orderService.createOrder({
        connected_app_id: 999
      })).rejects.toThrow('Connected app not found');
    });
  });
});