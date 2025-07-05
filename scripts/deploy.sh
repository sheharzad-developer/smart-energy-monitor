#!/bin/bash

# Smart Energy Monitor Deployment Script
# This script helps set up and deploy the smart energy monitor application

set -e

echo "🌟 Smart Energy Monitor Deployment Script"
echo "=========================================="

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "⚠️  PostgreSQL client not found. Please install PostgreSQL." >&2; }

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend service dependencies..."
cd auth && npm install
cd ../telemetry && npm install  
cd ../ai && npm install
cd ..

echo "✅ All dependencies installed successfully"

# Create environment files
echo "⚙️  Setting up environment files..."

# Auth service .env
if [ ! -f "auth/.env" ]; then
    cat > auth/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/smart-energy-monitor

# JWT Configuration  
JWT_SECRET=$(openssl rand -hex 64)

# Port Configuration
PORT=3001
EOF
    echo "✅ Created auth/.env"
else
    echo "⚠️  auth/.env already exists, skipping..."
fi

# Telemetry service .env
if [ ! -f "telemetry/.env" ]; then
    cat > telemetry/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/smart-energy-monitor

# Port Configuration
PORT=3002
EOF
    echo "✅ Created telemetry/.env"
else
    echo "⚠️  telemetry/.env already exists, skipping..."
fi

# AI service .env
if [ ! -f "ai/.env" ]; then
    cat > ai/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/smart-energy-monitor

# Port Configuration
PORT=3003
EOF
    echo "✅ Created ai/.env"
else
    echo "⚠️  ai/.env already exists, skipping..."
fi

echo "🎯 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the DATABASE_URL in all .env files with your PostgreSQL password"
echo "2. Create the database: createdb -U postgres smart-energy-monitor"
echo "3. Run the database setup: npm run db:setup"
echo "4. Start the services: npm run dev"
echo ""
echo "For deployment:"
echo "1. Push to GitHub"
echo "2. Connect to Vercel for frontend deployment"
echo "3. Deploy backend services to Railway/Heroku"
echo ""
echo "🚀 Happy coding!" 