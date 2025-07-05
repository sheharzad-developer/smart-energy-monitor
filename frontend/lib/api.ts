const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app' 
  : 'http://localhost:3000';

// API client with error handling
class ApiClient {
  async request(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(url: string) {
    return this.request(url);
  }

  async post(url: string, data: any) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

const api = new ApiClient();

// Auth API functions
export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.post('/api/auth/register', userData),
  
  login: (credentials: { username: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  
  getProfile: (token: string) =>
    api.request('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

// Telemetry API functions
export const fetchDevices = () => api.get('/api/telemetry/devices');

export const fetchTelemetry = (params: {
  deviceId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return api.get(`/api/telemetry/telemetry${queryString ? `?${queryString}` : ''}`);
};

export const postTelemetry = (data: {
  deviceId: string;
  timestamp: string;
  energyWatts: number;
}) => api.post('/api/telemetry/telemetry', data);

export const getDeviceStats = (deviceId: string, days: number = 7) =>
  api.get(`/api/telemetry/devices/${deviceId}/stats?days=${days}`);

// AI API functions
export const aiAPI = {
  query: (question: string) =>
    api.post('/api/ai/chat/query', { query: question }),
};

// Helper functions
export const formatEnergyValue = (watts: number): string => {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${watts.toFixed(2)} W`;
};

export const formatDateTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const calculateEnergyUsage = (telemetryData: any[], timeframe: 'day' | 'week' | 'month' = 'day') => {
  const now = new Date();
  const cutoff = new Date();
  
  switch (timeframe) {
    case 'day':
      cutoff.setDate(now.getDate() - 1);
      break;
    case 'week':
      cutoff.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoff.setMonth(now.getMonth() - 1);
      break;
  }

  return telemetryData
    .filter(item => new Date(item.timestamp) >= cutoff)
    .reduce((sum, item) => sum + parseFloat(item.energy_watts), 0);
}; 