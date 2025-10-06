const { server, initializeApp } = require('./app');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize database and Redis connections
    await initializeApp();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 UniOrder API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.io ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();