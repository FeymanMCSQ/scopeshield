'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function RevenueTrendChart() {
  // Mock data: last 7 days
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Recaptured revenue ($)',
        data: [0, 50, 50, 120, 120, 200, 260],
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
    },
  } as const;

  return (
    <div className="mb-6 rounded-lg border bg-white p-4">
      <div className="mb-2 text-sm font-medium">Revenue trend</div>
      <div className="text-xs text-gray-600 mb-3">
        Mock data for now (Task 18 win condition).
      </div>
      <Line data={data} options={options} />
    </div>
  );
}
