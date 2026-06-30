import React from 'react';
import { useReportAnalytics } from '../hooks/useReportAnalytics';
import ChartFrame from '../../../components/analytics/ChartFrame';
import MetricCard from '../../../components/analytics/MetricCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DistributionPage = () => {
  const { id, report, loading } = useReportAnalytics();

  if (!id) return <div className="p-8 text-center text-gray-400">Please select a report from the Reports page to view analytics.</div>;
  if (loading || !report) return <div className="p-8 text-center text-gray-400">Loading report data...</div>;

  const a = report.analytics || {};
  const c = report.charts || {};
  const t = report.trades || [];

  const formatLabel = (label) => {
    const clean = String(label).replace(/[\[\(\)\]]/g, '');
    const parts = clean.split(',');
    if (parts.length === 2) {
      const min = Math.round(parseFloat(parts[0]));
      const max = Math.round(parseFloat(parts[1]));
      return `${min} to ${max}`;
    }
    return String(label);
  };

  let pnlChartData = { labels: [], datasets: [] };
  
  if (c.pnl_dist && c.pnl_dist.labels) {
    pnlChartData = {
      labels: c.pnl_dist.labels.map(formatLabel),
      datasets: [{
        label: 'Number of trades',
        data: c.pnl_dist.datasets?.[0]?.data || [],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      }]
    };
  } else if (a.pnl_distribution && Object.keys(a.pnl_distribution).length > 0) {
    pnlChartData = {
      labels: Object.keys(a.pnl_distribution).map(formatLabel),
      datasets: [{
        label: 'Number of trades',
        data: Object.values(a.pnl_distribution),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      }]
    };
  } else if (t.length > 0) {
     pnlChartData = {
         labels: ['Trades'],
         datasets: [{ data: [t.length], backgroundColor: '#3b82f6' }]
     };
  }

  const pnlChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
        ticks: { 
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15
        },
        title: {
          display: true,
          text: 'PnL range per trade (USDT)',
          color: '#e2e8f0'
        }
      },
      y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#94a3b8', precision: 0 } }
    }
  };

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Trade Distribution</h2>
        <div style={{ color: '#94a3b8' }}>Analyze PnL distribution, skewness, and kurtosis to assess fat-tail risks.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
          label="Skewness" 
          value={a.skewness != null ? parseFloat(a.skewness).toFixed(2) : '0.00'} 
          subValue="Symmetry of returns (0 is normal)"
        />
        <MetricCard 
          label="Kurtosis" 
          value={a.kurtosis != null ? parseFloat(a.kurtosis).toFixed(2) : '0.00'} 
          subValue="Fat-tail risk (>3 indicates heavy tails)"
        />
      </div>

      <ChartFrame title="PnL Distribution Histogram" height="400px">
        <Bar data={pnlChartData} options={pnlChartOptions} />
      </ChartFrame>
    </div>
  );
};

export default DistributionPage;
