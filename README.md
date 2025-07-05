# 🌟 Smart Energy Monitor

A comprehensive IoT energy monitoring system with AI-powered analytics that helps users track, analyze, and optimize their energy consumption in real-time.

## 🚀 Features

### 🔐 Authentication System
- **User Registration & Login** with secure JWT tokens
- **Password Hashing** using bcrypt
- **Protected Routes** and middleware

### 📊 Telemetry Management
- **Real-time Device Monitoring** with energy consumption tracking
- **RESTful APIs** for device data collection
- **Advanced Analytics** with device statistics and trends
- **Time-series Data Storage** in PostgreSQL

### 🤖 AI-Powered Insights
- **Natural Language Queries** - Ask questions in plain English
- **Smart Analytics** - "Which device used the most energy yesterday?"
- **Comparative Analysis** - Compare energy usage across devices
- **Trend Analysis** - Track consumption patterns over time

### 🎨 Modern Frontend
- **Next.js 13+** with App Router
- **Real-time Dashboard** with interactive charts
- **Responsive Design** with Tailwind CSS
- **Device Management** interface
- **AI Chat Assistant** for energy insights

## 🏗️ Architecture

```
smart-energy-monitor/
├── frontend/          # Next.js dashboard (Port 3000)
├── auth/             # Authentication service (Port 3001)
├── telemetry/        # Device data collection (Port 3002)
├── ai/               # AI analytics service (Port 3003)
└── shared/           # Shared utilities and types
```

### 📱 Tech Stack

- **Frontend**: Next.js 13+, React 18, TypeScript, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express.js, PostgreSQL
- **Authentication**: JWT, bcrypt
- **AI/Analytics**: Rule-based NLP with structured queries
- **Database**: PostgreSQL with time-series optimization
- **Deployment**: Vercel (Frontend), Railway/Heroku (Backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smart-energy-monitor.git
   cd smart-energy-monitor
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up PostgreSQL Database**
   ```bash
   createdb -U postgres smart-energy-monitor
   ```

4. **Configure Environment Variables**
   
   Create `.env` files in each service directory:
   
   **auth/.env**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/smart-energy-monitor
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3001
   ```
   
   **telemetry/.env**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/smart-energy-monitor
   PORT=3002
   ```
   
   **ai/.env**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/smart-energy-monitor
   PORT=3003
   ```

5. **Initialize Database Schema**
   ```bash
   npm run db:setup
   ```

6. **Start Development Servers**
   ```bash
   npm run dev
   ```

   Or start individual services:
   ```bash
   npm run dev:frontend  # http://localhost:3000
   npm run dev:auth      # http://localhost:3001
   npm run dev:telemetry # http://localhost:3002
   npm run dev:ai        # http://localhost:3003
   ```

## 📡 API Documentation

### Authentication Service (Port 3001)

#### Register User
```bash
POST /register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "password123"
}
```

#### Login
```bash
POST /login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### Telemetry Service (Port 3002)

#### Store Device Data
```bash
POST /api/telemetry
Content-Type: application/json

{
  "deviceId": "dev001",
  "timestamp": "2024-01-15T10:00:00Z",
  "energyWatts": 2500.50
}
```

#### Get Device Statistics
```bash
GET /api/devices/dev001/stats?days=7
```

### AI Service (Port 3003)

#### Natural Language Query
```bash
POST /api/chat/query
Content-Type: application/json

{
  "query": "Which device used the most energy yesterday?"
}
```

## 🎯 Sample Queries

The AI service understands natural language questions like:

- "Which device used the most energy yesterday?"
- "What's the total energy consumption this week?"
- "Show me the average usage for my fridge"
- "Compare energy usage between all devices"
- "What are the energy consumption trends over the last month?"

## 🚀 Deployment

### Frontend (Vercel)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables** in Vercel dashboard:
   - `AUTH_SERVICE_URL`
   - `TELEMETRY_SERVICE_URL` 
   - `AI_SERVICE_URL`

### Backend Services

Deploy to Railway, Heroku, or your preferred platform:

1. **Database Setup**: Use a managed PostgreSQL service
2. **Environment Variables**: Configure production URLs and secrets
3. **Health Checks**: Each service includes health check endpoints

## 📊 Sample Data

The system includes seeded data with:
- **3 Sample Users**: alice, bob, charlie
- **5 IoT Devices**: AC, Fridge, Heater, Lights, Washing Machine
- **20+ Telemetry Records** with realistic energy consumption patterns

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install:all

# Start all services in development
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Clean all node_modules
npm run clean

# Lint code
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chart.js for beautiful data visualizations
- Tailwind CSS for rapid UI development
- PostgreSQL for reliable data storage
- Vercel for seamless deployment

---

Built with ❤️ for sustainable energy monitoring
