# UniOrder - Restaurant Order Management System

A comprehensive order management middleware that consolidates orders from multiple delivery platforms (Jahez, HungerStation, Keeta) into a unified dashboard.

## 🚀 Features

- **Multi-Platform Integration** - Unified orders from Jahez, HungerStation, Keeta
- **Real-Time Updates** - Live order notifications and status changes
- **Role-Based Access** - Admin, Manager, Employee permissions
- **Invoice Generation** - PDF invoices with print functionality
- **Test Environment** - Training dashboard with mock data
- **Analytics Dashboard** - Comprehensive reporting and insights

## 🛠️ Technology Stack

**Frontend:** React 18, TypeScript, Tailwind CSS, Socket.io-client  
**Backend:** Node.js, Express.js, Socket.io, JWT, Sequelize  
**Database:** PostgreSQL, Redis (optional)

## 📦 Quick Start

### Prerequisites
- Node.js v20+
- PostgreSQL v15+
- Docker (optional)

### Installation
```bash
# Clone repository
git clone https://github.com/AlbandariAlmohannadi/uniorder.git
cd uniorder

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run database migrations
cd backend && npm run migrate

# Seed test data
npm run seed

# Start development servers
npm run dev
```

### Docker Setup
```bash
docker-compose up -d
```

## 🔐 Default Login Credentials

- **Admin:** admin / password123
- **Manager:** manager1 / password123  
- **Employee:** employee1 / password123

## 📱 Demo Features

1. **Employee Dashboard** - Process orders in real-time
2. **Test Dashboard** - Practice with mock data
3. **Manager Analytics** - View reports and insights
4. **Admin Panel** - Manage users and integrations
5. **Invoice System** - Generate and print receipts

## 🏗️ Project Structure

```
uniorder/
├── frontend/          # React application
├── backend/           # Node.js API server
├── docs/             # Documentation
└── docker-compose.yml # Container setup
```

## 🔧 Configuration

Update environment variables in `.env` files:
- Database connection
- JWT secrets
- Platform API keys
- Redis connection (optional)

## 📖 Documentation

See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for detailed technical documentation.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎥 Demo Video

[Link to demo video will be added here]

---

**Built with ❤️ for restaurant efficiency**