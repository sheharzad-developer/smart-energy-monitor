'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TelemetryData {
  id: number;
  device_id: string;
  device_name: string;
  timestamp: string;
  energy_watts: number;
}

interface EnergyChartProps {
  data: TelemetryData[];
}

export default function EnergyChart({ data }: EnergyChartProps) {
  // Group data by device and prepare for chart
  const prepareChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Get unique devices
    const devices = Array.from(new Set(data.map(item => item.device_name)));
    
    // Group data by hour for the last 24 hours
    const now = new Date();
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
      return hour;
    });

    const labels = last24Hours.map(hour => 
      hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );

    // Color palette for different devices
    const colors = [
      'rgba(59, 130, 246, 0.8)', // blue
      'rgba(16, 185, 129, 0.8)', // green
      'rgba(245, 158, 11, 0.8)', // yellow
      'rgba(239, 68, 68, 0.8)',  // red
      'rgba(139, 92, 246, 0.8)', // purple
    ];

    const datasets = devices.map((deviceName, index) => {
      const deviceData = data.filter(item => item.device_name === deviceName);
      
      const hourlyData = last24Hours.map(hour => {
        const hourStart = new Date(hour);
        const hourEnd = new Date(hour);
        hourEnd.setHours(hourEnd.getHours() + 1);

        const hourReadings = deviceData.filter(item => {
          const itemTime = new Date(item.timestamp);
          return itemTime >= hourStart && itemTime < hourEnd;
        });

        if (hourReadings.length === 0) return 0;
        
        // Calculate average for the hour
        const total = hourReadings.reduce((sum, reading) => sum + reading.energy_watts, 0);
        return total / hourReadings.length;
      });

      return {
        label: deviceName,
        data: hourlyData,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('0.8', '0.2'),
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      };
    });

    return {
      labels,
      datasets,
    };
  };

  const chartData = prepareChartData();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}W`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (Last 24 Hours)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Energy Consumption (Watts)',
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  if (chartData.datasets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500">No data available</p>
          <p className="text-sm text-gray-400">Energy consumption data will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
} 