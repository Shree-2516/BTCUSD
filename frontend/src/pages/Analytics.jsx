import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportService } from '../api/services/report';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    const fetchReportData = async (reportId) => {
      try {
        setLoading(true);
        const data = await reportService.getReportDetails(reportId);
        setReport(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportData(id);
    } else {
      const fetchLatest = async () => {
        try {
          const reports = await reportService.getReports();
          if (reports && reports.length > 0) {
            setSearchParams({ id: reports[0].id }, { replace: true });
          }
        } catch (err) {
          console.error('Failed to fetch reports list', err);
        }
      };
      fetchLatest();
    }
  }, [id, setSearchParams]);

  if (!id) {
    return <div className="p-8 text-center text-gray-400">Please select a report from the Reports page to view analytics.</div>;
  }

  if (loading || !report) {
    return <div className="p-8 text-center text-gray-400">Loading report data...</div>;
  }

  // Safely extract metrics
  const p = report.performance || {};
  const m = report.metrics || {};
  const t = report.trades || [];
  const a = report.analytics || {};
  const c = report.charts || {};
  const exits = report.exits || {};

  // Formatter for cleanly displaying PnL ranges
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

  // Setup data for PnL Distribution chart
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
     // fallback if neither exists
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
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        },
        title: {
          display: true,
          text: 'PnL range per trade (USDT)',
          color: '#e2e8f0',
          font: { weight: 'bold' }
        }
      },
      y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#94a3b8', precision: 0 } }
    }
  };

  // Setup data for Exit Reasons doughnut chart
  // Note: the backend uses 'reason' or 'exit_reason' interchangeably. In get_live_report it's 'exit_reason'.
  // We'll calculate it from trades if exit_reason_counts is empty.
  let exitCounts = exits.exit_reason_counts || {};
  if (Object.keys(exitCounts).length === 0 && t.length > 0) {
    t.forEach(trade => {
      const reason = trade.exit_reason || trade.reason || 'Unknown';
      exitCounts[reason] = (exitCounts[reason] || 0) + 1;
    });
  }
  
  const exitChartData = {
    labels: Object.keys(exitCounts),
    datasets: [{
      data: Object.values(exitCounts),
      backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
      borderWidth: 0,
      cutout: '70%',
    }]
  };
  
  const exitChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20 } }
    }
  };

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
    <div className="w-full">
      <div className="analytics-dashboard">
        <div className="section-header">
          <div>
            <h2>Institutional Backtest Analytics</h2>
            <div className="analytics-report-meta">
              Report #{report.id || id} • {report.parameters?.strategy || 'Strategy'} • {report.parameters?.resolution || '1h'}
            </div>
          </div>
          <div className="export-group">
            <button className="btn btn-secondary">Export CSV</button>
            <button className="btn btn-secondary">Export Excel</button>
          </div>
        </div>

        <div className="tab-nav">
          <div className={`tab-link ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}>Metrics</div>
          <div className={`tab-link ${activeTab === 'equity' ? 'active' : ''}`} onClick={() => setActiveTab('equity')}>Equity Curve</div>
          <div className={`tab-link ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>Trade Journal</div>
          <div className={`tab-link ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>AI Insights</div>
        </div>

        {activeTab === 'metrics' && (
          <div className="analytics-tab-content">
            <div className="analytics-grid">
              <div className="analytics-card">
                <span className="label">Net Profit</span>
                <div className={`value ${p.net_pnl >= 0 ? 'pnl-up' : 'pnl-down'}`}>
                  ${parseFloat(p.net_pnl || 0).toFixed(2)}
                </div>
                <div className="sub-value">Total Return</div>
              </div>
              <div className="analytics-card">
                <span className="label">Win Rate</span>
                <div className="value">{p.win_rate}</div>
                <div className="sub-value">{p.total_trades} Trades</div>
              </div>
              <div className="analytics-card">
                <span className="label">Profit Factor</span>
                <div className="value">{m.profit_factor || '0.00'}</div>
                <div className="sub-value">Institutional Grade</div>
              </div>
              <div className="analytics-card">
                <span className="label">Sharpe Ratio</span>
                <div className="value">{m.sharpe_ratio || '0.00'}</div>
                <div className="sub-value">Risk Adjusted</div>
              </div>
            </div>

            <div className="chart-section chart-section--metrics" style={{ marginTop: '24px', display: 'flex', gap: '24px', height: '350px' }}>
              <div className="chart-box chart-box--analytics card glass" style={{ flex: 1, padding: '24px' }}>
                <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>PnL Distribution</h4>
                <div style={{ position: 'relative', height: 'calc(100% - 30px)' }}>
                  <Bar data={pnlChartData} options={pnlChartOptions} />
                </div>
              </div>
              <div className="chart-box chart-box--analytics card glass" style={{ flex: 1, padding: '24px' }}>
                <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Exit Reasons</h4>
                <div style={{ position: 'relative', height: 'calc(100% - 30px)' }}>
                  <Doughnut data={exitChartData} options={exitChartOptions} />
                </div>
              </div>
            </div>

            <div className="metric-grid-3" style={{ marginTop: '24px' }}>
              <section className="card glass">
                <h3>Risk Metrics</h3>
                <table className="journal-table">
                  <tbody>
                    <tr><td>Max Drawdown</td> <td>{m.max_drawdown || '0.00%'}</td></tr>
                    <tr><td>Avg Drawdown</td> <td>{m.avg_drawdown || '0.00%'}</td></tr>
                    <tr><td>Recovery Factor</td> <td>{m.recovery_factor || '0.00'}</td></tr>
                    <tr><td>Sortino Ratio</td> <td>{m.sortino_ratio || '0.00'}</td></tr>
                    <tr><td>Calmar Ratio</td> <td>{m.calmar_ratio || '0.00'}</td></tr>
                  </tbody>
                </table>
              </section>
              <section className="card glass">
                <h3>Efficiency</h3>
                <table className="journal-table">
                  <tbody>
                    <tr><td>Expectancy</td> <td>{m.expectancy != null ? Number(m.expectancy).toFixed(2) : '0.00'}</td></tr>
                    <tr><td>Avg Trade Duration</td> <td>{m.avg_trade_duration || '0.00 hours'}</td></tr>
                    <tr><td>Consecutive Wins</td> <td>{m.consecutive_wins || 0}</td></tr>
                    <tr><td>Consecutive Losses</td> <td>{m.consecutive_losses || 0}</td></tr>
                    <tr><td>CAGR</td> <td>{m.cagr || '0.00%'}</td></tr>
                  </tbody>
                </table>
              </section>
              <section className="card glass">
                <h3>Profitability</h3>
                <table className="journal-table">
                  <tbody>
                    <tr><td>Gross Profit</td> <td>{m.gross_profit != null ? '$' + Number(m.gross_profit).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
                    <tr><td>Gross Loss</td> <td>{m.gross_loss != null ? '$' + Number(m.gross_loss).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
                    <tr><td>Largest Win</td> <td>{m.largest_win != null ? '$' + Number(m.largest_win).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
                    <tr><td>Largest Loss</td> <td>{m.largest_loss != null ? '$' + Number(m.largest_loss).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
                    <tr><td>Avg Profit/Trade</td> <td>{m.avg_profit_per_trade != null ? '$' + Number(m.avg_profit_per_trade).toFixed(2) : '$0.00'}</td></tr>
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'equity' && (
          <div className="analytics-tab-content">
            <div className="card glass" style={{ height: '500px', padding: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Cumulative Equity & Drawdown</h4>
              <div style={{ position: 'relative', height: 'calc(100% - 30px)' }}>
                 {equityChartData.labels.length > 0 ? (
                   <Line data={equityChartData} options={equityChartOptions} />
                 ) : (
                   <div className="p-8 text-center text-gray-400">Equity Curve data not available.</div>
                 )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="analytics-tab-content">
            <div className="trade-journal-container">
              <div className="journal-header">
                <h3>Detailed Trade Journal</h3>
              </div>
              <div className="table-responsive">
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Side</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>Size</th>
                      <th>PnL</th>
                      <th>Duration</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.map((trade, i) => (
                      <tr key={i}>
                        <td>{trade.id || i + 1}</td>
                        <td className={trade.type === 'BUY' ? 'pnl-up' : 'pnl-down'}>{trade.type || trade.side || '-'}</td>
                        <td>${parseFloat(trade.entry_price || 0).toFixed(2)}</td>
                        <td>${parseFloat(trade.exit_price || 0).toFixed(2)}</td>
                        <td>{trade.size || trade.quantity || '-'}</td>
                        <td className={parseFloat(trade.pnl || 0) >= 0 ? 'pnl-up' : 'pnl-down'}>
                           ${parseFloat(trade.pnl || 0).toFixed(2)}
                        </td>
                        <td>{trade.duration ? (trade.duration / 3600).toFixed(1) + 'h' : '-'}</td>
                        <td>{trade.reason || trade.exit_reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="analytics-tab-content">
            <div className="card glass p-8 text-center text-gray-400">
               AI Insights data not available for this report.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Analytics;
