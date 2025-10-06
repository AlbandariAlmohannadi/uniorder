const request = require('supertest');
const app = require('../../src/app');

describe('Orders API', () => {
  let authToken;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('GET /api/orders', () => {
    it('should return orders list', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders')
        .expect(401);
    });
  });
});