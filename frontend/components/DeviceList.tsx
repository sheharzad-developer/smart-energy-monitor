'use client';

import { useState } from 'react';
import { Activity, Zap, Calendar, TrendingUp } from 'lucide-react';
import { formatEnergyValue, formatDateTime } from '@/lib/api';

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

interface DeviceListProps {
  devices: Device[];
  telemetryData: TelemetryData[];
}

export default function DeviceList({ devices, telemetryData }: DeviceListProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // Calculate stats for each device
  const getDeviceStats = (deviceId: string) => {
    const deviceTelemetry = telemetryData.filter(item => item.device_id === deviceId);
    
    if (deviceTelemetry.length === 0) {
      return {
        totalReadings: 0,
        totalConsumption: 0,
        averageConsumption: 0,
        lastReading: null,
        isActive: false,
      };
    }

    const totalConsumption = deviceTelemetry.reduce(
      (sum, reading) => sum + reading.energy_watts, 0
    );
    const averageConsumption = totalConsumption / deviceTelemetry.length;
    const lastReading = deviceTelemetry.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    // Consider device active if last reading is within 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const isActive = new Date(lastReading.timestamp) > twentyFourHoursAgo;

    return {
      totalReadings: deviceTelemetry.length,
      totalConsumption,
      averageConsumption,
      lastReading,
      isActive,
    };
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('ac') || name.includes('air')) return '❄️';
    if (name.includes('fridge') || name.includes('refrigerator')) return '🧊';
    if (name.includes('heater') || name.includes('heating')) return '🔥';
    if (name.includes('light') || name.includes('lamp')) return '💡';
    if (name.includes('washing') || name.includes('washer')) return '🧺';
    if (name.includes('tv') || name.includes('television')) return '📺';
    if (name.includes('computer') || name.includes('pc')) return '💻';
    return '⚡';
  };

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
        <p className="text-gray-500">Connect your smart devices to start monitoring energy consumption.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          const stats = getDeviceStats(device.device_id);
          const icon = getDeviceIcon(device.device_name);
          
          return (
            <div
              key={device.device_id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedDevice === device.device_id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedDevice(
                selectedDevice === device.device_id ? null : device.device_id
              )}
            >
              {/* Status indicator */}
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                stats.isActive ? 'bg-green-400' : 'bg-gray-300'
              }`} />

              <div className="flex items-start space-x-3">
                <div className="text-2xl">{icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {device.device_name}
                  </h3>
                  <p className="text-xs text-gray-500">ID: {device.device_id}</p>
                  {device.username && (
                    <p className="text-xs text-gray-500">Owner: {device.username}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total Consumption</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatEnergyValue(stats.totalConsumption)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Average</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatEnergyValue(stats.averageConsumption)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Readings</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.totalReadings}
                  </span>
                </div>

                {stats.lastReading && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Last Reading</span>
                      <span className="text-xs text-gray-700">
                        {formatEnergyValue(stats.lastReading.energy_watts)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(stats.lastReading.timestamp)}
                    </p>
                  </div>
                )}
              </div>

              <div className={`mt-3 text-xs font-medium ${
                stats.isActive ? 'text-green-600' : 'text-gray-500'
              }`}>
                {stats.isActive ? '● Active' : '● Inactive'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed View */}
      {selectedDevice && (
        <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Details</h3>
            <button
              onClick={() => setSelectedDevice(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {(() => {
            const device = devices.find(d => d.device_id === selectedDevice);
            const deviceTelemetry = telemetryData
              .filter(item => item.device_id === selectedDevice)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            if (!device) return null;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {formatEnergyValue(getDeviceStats(selectedDevice).totalConsumption)}
                    </div>
                    <div className="text-xs text-gray-500">Total Consumption</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {formatEnergyValue(getDeviceStats(selectedDevice).averageConsumption)}
                    </div>
                    <div className="text-xs text-gray-500">Average</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {getDeviceStats(selectedDevice).totalReadings}
                    </div>
                    <div className="text-xs text-gray-500">Total Readings</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-lg font-bold ${
                      getDeviceStats(selectedDevice).isActive ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {getDeviceStats(selectedDevice).isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-xs text-gray-500">Status</div>
                  </div>
                </div>

                {/* Recent Readings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Readings</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {deviceTelemetry.slice(0, 10).map((reading) => (
                      <div 
                        key={reading.id} 
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatEnergyValue(reading.energy_watts)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(reading.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
} 