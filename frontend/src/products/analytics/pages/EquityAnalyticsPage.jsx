import React from 'react';
import { useReportAnalytics } from '../hooks/useReportAnalytics';
import ChartFrame from '../../../components/analytics/ChartFrame';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const EquityAnalyticsPage = () => {
  const { id, report, loading } = useReportAnalytics();

  if (!id) return <div className="p-8 text-center text-gray-400">Please select a report from the Reports page to view analytics.</div>;
  if (loading || !report) return <div className="p-8 text-center text-gray-400">Loading report data...</div>;

  const c = report.charts || {};
  const m = report.metrics || {};

  const equityChartData = {
    labels: c.equity_curve?.labels || [],
    datasets: (c.equity_curve?.datasets || []).map(ds => ({
      ...ds,
      borderColor: ds.borderColor || '#3b82f6',
      backgroundColor: ds.backgroundColor || 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.18,
    }))
  };

  const equityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8' } }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: '#94a3b8', autoSkip: true, maxTicksLimit: 9, maxRotation: 0 }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Equity Curve</h2>
        <div style={{ color: '#94a3b8' }}>High-fidelity tracking of compounding account balance over time.</div>
      </div>

      <ChartFrame title="Cumulative Equity" height="500px">
        {equityChartData.labels.length > 0 ? (
          <Line data={equityChartData} options={equityChartOptions} />
        ) : (
          <div className="p-8 text-center text-gray-400">Equity Curve data not available.</div>
        )}
      </ChartFrame>
    </div>
  );
};

export default EquityAnalyticsPage;
