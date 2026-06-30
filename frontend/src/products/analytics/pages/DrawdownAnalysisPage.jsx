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
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const DrawdownAnalysisPage = () => {
  const { id, report, loading } = useReportAnalytics();

  if (!id) return <div className="p-8 text-center text-gray-400">Please select a report from the Reports page to view analytics.</div>;
  if (loading || !report) return <div className="p-8 text-center text-gray-400">Loading report data...</div>;

  const c = report.charts || {};
  
  const equityChartData = {
    labels: c.equity_curve?.labels || [],
    datasets: (c.equity_curve?.datasets || []).map(ds => ({
      ...ds,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.18,
    }))
  };

  // Compute Underwater Drawdown Chart Data
  let peak = 0;
  const equityCurveRaw = report.equity_curve || [];
  const drawdownLabels = [];
  const drawdownData = [];

  equityCurveRaw.forEach(p => {
    peak = Math.max(peak, p.equity);
    const dd = peak > 0 ? ((peak - p.equity) / peak) * 100 : 0;
    drawdownLabels.push(new Date(p.time).toLocaleDateString());
    drawdownData.push(-dd); // Inverted underwater
  });

  const drawdownChartData = {
    labels: drawdownLabels.length > 0 ? drawdownLabels : c.equity_curve?.labels || [],
    datasets: [{
      label: 'Drawdown (%)',
      data: drawdownData,
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      tension: 0.18,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false }
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
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Drawdown Analysis</h2>
        <div style={{ color: '#94a3b8' }}>Dual chart layout tracking equity peaks and inverted peak-to-trough drops.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ChartFrame title="Equity Curve" height="300px">
          <Line data={equityChartData} options={chartOptions} />
        </ChartFrame>
        
        <ChartFrame title="Underwater Drawdown Chart" height="300px">
          <Line data={drawdownChartData} options={chartOptions} />
        </ChartFrame>
      </div>
    </div>
  );
};

export default DrawdownAnalysisPage;
