import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const MetricCard = ({ label, value, subValue, valueClass = '' }) => (
  <div style={{
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }}>
    <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>{label}</span>
    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }} className={valueClass}>
      {value}
    </div>
    {subValue && <div style={{ color: '#64748b', fontSize: '12px' }}>{subValue}</div>}
  </div>
);

const PortfolioReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('/api/reports/portfolio');
        if (!res.ok) {
           throw new Error('Endpoint not found (server needs restart?)');
        }
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load portfolio summary');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Portfolio Reports</h2>
        <div style={{ color: '#94a3b8' }}>Aggregated structural health overview across all strategies.</div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center p-8">Compiling global portfolio metrics...</div>
      ) : summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <MetricCard 
            label="Total Combined PnL (Backtests)" 
            value={`$${parseFloat(summary.total_backtest_pnl || 0).toFixed(2)}`} 
            subValue={`${summary.total_strategies_tested} Strategies Tested`}
            valueClass={summary.total_backtest_pnl >= 0 ? 'text-green-500' : 'text-red-500'}
          />
          <MetricCard 
            label="Total Combined PnL (Live/Paper)" 
            value={`$${parseFloat(summary.total_live_pnl || 0).toFixed(2)}`} 
            subValue={`${summary.total_live_trades} Executions Completed`}
            valueClass={summary.total_live_pnl >= 0 ? 'text-green-500' : 'text-red-500'}
          />
          <MetricCard 
            label="Global Live Win Rate" 
            value={summary.global_live_win_rate} 
            subValue="Accuracy across all live models"
          />
        </div>
      ) : (
        <div className="text-gray-400">Failed to load data.</div>
      )}
    </div>
  );
};

export default PortfolioReportsPage;
