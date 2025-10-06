// Mock Redis for development when Redis is not available
const cache = {
  data: new Map(),
  
  async get(key) {
    try {
      const value = this.data.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache GET error:', error.message);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      this.data.set(key, JSON.stringify(value));
      // Simple TTL implementation
      setTimeout(() => {
        this.data.delete(key);
      }, ttl * 1000);
      return true;
    } catch (error) {
      console.error('Cache SET error:', error.message);
      return false;
    }
  },

  async del(key) {
    try {
      this.data.delete(key);
      return true;
    } catch (error) {
      console.error('Cache DEL error:', error.message);
      return false;
    }
  },

  async exists(key) {
    try {
      return this.data.has(key);
    } catch (error) {
      console.error('Cache EXISTS error:', error.message);
      return false;
    }
  }
};

async function connectRedis() {
  console.log('✅ Using in-memory cache (Redis not available)');
}

module.exports = {
  client: null,
  connectRedis,
  cache
};