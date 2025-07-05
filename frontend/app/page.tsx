'use client';

import { useState, useEffect } from 'react';
import { Activity, Zap, MessageCircle, BarChart3, Users, Settings } from 'lucide-react';
import EnergyChart from '@/components/EnergyChart';
import DeviceList from '@/components/DeviceList';
import AIChat from '@/components/AIChat';
import { fetchDevices, fetchTelemetry } from '@/lib/api';

interface Device {
  id: number;
  device_id: string;
  device_name: string;
  username?: string;
}

interface TelemetryData {
  id: number;
  device_id: string;
  device_name: string;
  timestamp: string;
  energy_watts: number;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesResponse, telemetryResponse] = await Promise.all([
        fetchDevices(),
        fetchTelemetry({ limit: 100 })
      ]);
      
      setDevices(devicesResponse.devices || []);
      setTelemetryData(telemetryResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalEnergyToday = telemetryData
    .filter(item => {
      const today = new Date().toDateString();
      const itemDate = new Date(item.timestamp).toDateString();
      return today === itemDate;
    })
    .reduce((sum, item) => sum + parseFloat(item.energy_watts.toString()), 0);

  const activeDevices = devices.length;
  const avgEnergyPerDevice = activeDevices > 0 ? (totalEnergyToday / activeDevices) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-primary-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Smart Energy Monitor</h1>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview' 
                    ? 'text-primary-600 border-primary-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('devices')}
                className={`${
                  activeTab === 'devices' 
                    ? 'text-primary-600 border-primary-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Devices
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`${
                  activeTab === 'chat' 
                    ? 'text-primary-600 border-primary-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                AI Assistant
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <Zap className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Energy Today</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalEnergyToday.toFixed(2)} W
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="flex items-center">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <Activity className="h-6 w-6 text-success" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Devices</p>
                        <p className="text-2xl font-bold text-gray-900">{activeDevices}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="flex items-center">
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-warning" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg per Device</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {avgEnergyPerDevice.toFixed(2)} W
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Energy Consumption Overview</h2>
                  <EnergyChart data={telemetryData} />
                </div>

                {/* Recent Activity */}
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-3">
                    {telemetryData.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                          <span className="font-medium text-gray-900">{item.device_name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{item.energy_watts}W</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Management</h2>
                <DeviceList devices={devices} telemetryData={telemetryData} />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Energy Assistant</h2>
                <AIChat />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 