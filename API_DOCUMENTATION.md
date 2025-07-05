# 📚 Smart Energy Monitor - API Documentation

## 🎯 Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://smart-energy-monitor.vercel.app/api`

---

## 🔐 Authentication Service (Port 3001)

### **POST /register**
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

---

### **POST /login**
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securePassword123"
  }'
```

---

### **GET /profile**
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3001/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Telemetry Service (Port 3002)

### **POST /api/telemetry**
Store device energy consumption data.

**Request Body:**
```json
{
  "deviceId": "dev001",
  "timestamp": "2024-01-15T10:00:00Z",
  "energyWatts": 2500.50
}
```

**Response (201):**
```json
{
  "message": "Telemetry data stored successfully",
  "data": {
    "id": 123,
    "device_id": "dev001",
    "timestamp": "2024-01-15T10:00:00Z",
    "energy_watts": 2500.50,
    "created_at": "2024-01-15T10:00:01Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "dev001",
    "timestamp": "2024-01-15T10:00:00Z",
    "energyWatts": 2500.50
  }'
```

---

### **GET /api/telemetry**
Retrieve telemetry data with optional filtering.

**Query Parameters:**
- `deviceId` (optional): Filter by specific device
- `startDate` (optional): Start date for time range
- `endDate` (optional): End date for time range  
- `limit` (optional): Maximum number of records (default: 100)

**Response (200):**
```json
{
  "count": 50,
  "data": [
    {
      "id": 123,
      "device_id": "dev001",
      "device_name": "Living Room AC",
      "timestamp": "2024-01-15T10:00:00Z",
      "energy_watts": 2500.50,
      "created_at": "2024-01-15T10:00:01Z"
    }
  ]
}
```

**cURL Examples:**
```bash
# Get all recent data
curl "http://localhost:3002/api/telemetry?limit=10"

# Get data for specific device
curl "http://localhost:3002/api/telemetry?deviceId=dev001&limit=50"

# Get data for date range
curl "http://localhost:3002/api/telemetry?startDate=2024-01-15T00:00:00Z&endDate=2024-01-15T23:59:59Z"
```

---

### **GET /api/devices**
Get list of all registered devices.

**Response (200):**
```json
{
  "count": 5,
  "devices": [
    {
      "id": 1,
      "device_id": "dev001",
      "device_name": "Living Room AC",
      "user_id": 1,
      "username": "alice",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl http://localhost:3002/api/devices
```

---

### **GET /api/devices/{deviceId}/stats**
Get statistical analysis for a specific device.

**Path Parameters:**
- `deviceId`: The device identifier

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 7)

**Response (200):**
```json
{
  "deviceId": "dev001",
  "days": 7,
  "summary": {
    "total_readings": 10080,
    "avg_watts": 2250.75,
    "min_watts": 1800.00,
    "max_watts": 2800.00,
    "total_watts": 22691560.00
  },
  "dailyStats": [
    {
      "day": "2024-01-15T00:00:00Z",
      "total_readings": 1440,
      "avg_watts": 2300.50,
      "min_watts": 1900.00,
      "max_watts": 2700.00,
      "daily_watts": 331272.00
    }
  ]
}
```

**cURL Example:**
```bash
curl "http://localhost:3002/api/devices/dev001/stats?days=7"
```

---

## 🤖 AI Service (Port 3003)

### **POST /api/chat/query**
Process natural language questions about energy consumption.

**Request Body:**
```json
{
  "query": "Which device used the most energy yesterday?"
}
```

**Response (200):**
```json
{
  "originalQuery": "Which device used the most energy yesterday?",
  "parsedQuery": {
    "originalQuery": "Which device used the most energy yesterday?",
    "timeFilter": "1 day",
    "queryType": "highest_usage",
    "deviceFilter": null
  },
  "result": {
    "type": "highest_usage",
    "timeFilter": "1 day",
    "devices": [
      {
        "device_name": "Living Room AC",
        "device_id": "dev001",
        "total_watts": 55200.75,
        "avg_watts": 2300.03,
        "readings_count": 24
      }
    ]
  },
  "response": "In the last 1 day, the device with the highest energy usage was \"Living Room AC\" with 55200.75 watts total consumption."
}
```

**Supported Query Types:**
- **Highest Usage**: "Which device used the most energy yesterday?"
- **Lowest Usage**: "What device used the least energy this week?"
- **Total Usage**: "What was my total energy consumption today?"
- **Average Usage**: "Show me average energy usage per device"
- **Comparison**: "Compare energy usage between all devices"
- **Trends**: "Show me energy trends over the last month"

**cURL Example:**
```bash
curl -X POST http://localhost:3003/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which device used the most energy yesterday?"
  }'
```

**More Query Examples:**
```bash
# Total consumption
curl -X POST http://localhost:3003/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What was my total energy consumption this week?"}'

# Device comparison
curl -X POST http://localhost:3003/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare energy usage between all my devices"}'

# Specific device query
curl -X POST http://localhost:3003/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How much energy did my fridge use today?"}'

# Trend analysis
curl -X POST http://localhost:3003/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me energy consumption trends over time"}'
```

---

## 🔧 Error Handling

All services return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "deviceId, timestamp, and energyWatts are required"
}
```

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**403 Forbidden:**
```json
{
  "error": "Invalid or expired token"
}
```

**404 Not Found:**
```json
{
  "error": "Device not found"
}
```

**409 Conflict:**
```json
{
  "error": "Username or email already exists"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## 🏃 Getting Started

### 1. **Start All Services**
```bash
# Start all services in development
npm run dev

# Or start individually:
cd auth && npm start     # Port 3001
cd telemetry && npm start # Port 3002  
cd ai && npm start       # Port 3003
cd frontend && npm run dev # Port 3000
```

### 2. **Register a User**
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. **Generate Sample Data**
```bash
python3 scripts/simulate_telemetry.py
```

### 4. **Query the AI**
```bash
curl -X POST http://localhost:3003/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Which device used the most energy today?"}'
```

---

## 📊 Postman Collection

Import this collection into Postman for easy testing:

```json
{
  "info": {
    "name": "Smart Energy Monitor API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
            },
            "url": "{{base_url}}/register"
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw", 
              "raw": "{\"username\":\"testuser\",\"password\":\"password123\"}"
            },
            "url": "{{base_url}}/login"
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3001"
    }
  ]
}
```

---

## 🚀 Production Deployment

For production deployment, update base URLs to your deployed services:

```javascript
// Environment variables for production
const config = {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'https://your-auth-service.railway.app',
  TELEMETRY_SERVICE_URL: process.env.TELEMETRY_SERVICE_URL || 'https://your-telemetry-service.railway.app',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'https://your-ai-service.railway.app'
};
```

---

## 📈 Rate Limiting

Production services implement rate limiting:

- **Auth Service**: 5 requests/minute for registration, 10 requests/minute for login
- **Telemetry Service**: 1000 requests/minute per device
- **AI Service**: 10 requests/minute per user

---

## 🔒 Security

- **JWT tokens** expire after 24 hours
- **Passwords** are hashed using bcrypt with 10 salt rounds
- **API endpoints** validate input and sanitize data
- **CORS** is configured for cross-origin requests
- **Environment variables** store sensitive configuration

This completes the comprehensive API documentation for the Smart Energy Monitor system! 