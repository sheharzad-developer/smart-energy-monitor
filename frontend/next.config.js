/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    TELEMETRY_SERVICE_URL: process.env.TELEMETRY_SERVICE_URL || 'http://localhost:3002',
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:3003',
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/:path*`,
      },
      {
        source: '/api/telemetry/:path*',
        destination: `${process.env.TELEMETRY_SERVICE_URL || 'http://localhost:3002'}/api/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: `${process.env.AI_SERVICE_URL || 'http://localhost:3003'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig; 