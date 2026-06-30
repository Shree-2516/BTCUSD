import React from 'react';
import { useReportAnalytics } from '../hooks/useReportAnalytics';
import MetricCard from '../../../components/analytics/MetricCard';

const RiskAnalyticsPage = () => {
  const { id, report, loading } = useReportAnalytics();

  if (!id) return <div className="p-8 text-center text-gray-400">Please select a report from the Reports page to view analytics.</div>;
  if (loading || !report) return <div className="p-8 text-center text-gray-400">Loading report data...</div>;

  const m = report.metrics || {};

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Risk Analytics</h2>
        <div style={{ color: '#94a3b8' }}>Institutional-grade risk metrics dashboards.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
          label="Sortino Ratio" 
          value={m.sortino_ratio || '0.00'} 
          subValue="Downside Risk Adjusted"
        />
        <MetricCard 
          label="Value at Risk (95%)" 
          value={m.value_at_risk_95 || '0.00%'} 
          subValue="Expected Max Loss"
        />
        <MetricCard 
          label="Expectancy" 
          value={m.expectancy != null ? '$' + Number(m.expectancy).toFixed(2) : '$0.00'} 
          subValue="Avg Return per Trade"
        />
        <MetricCard 
          label="Calmar Ratio" 
          value={m.calmar_ratio || '0.00'} 
          subValue="CAGR / Max Drawdown"
        />
      </div>

      <div style={{
         backgroundColor: 'rgba(30, 41, 59, 0.4)',
         borderRadius: '16px',
         padding: '24px',
         border: '1px solid rgba(255, 255, 255, 0.05)',
         maxWidth: '600px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Detailed Risk Profile</h3>
        <table className="journal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <tbody>
            <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Sharpe Ratio</td><td style={{ textAlign: 'right' }}>{m.sharpe_ratio || '0.00'}</td></tr>
            <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Risk Reward Ratio</td><td style={{ textAlign: 'right' }}>{m.risk_reward_ratio || '0.00'}</td></tr>
            <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Max Drawdown</td><td style={{ textAlign: 'right' }}>{m.max_drawdown || '0.00%'}</td></tr>
            <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Avg Drawdown</td><td style={{ textAlign: 'right' }}>{m.avg_drawdown || '0.00%'}</td></tr>
            <tr><td style={{ padding: '8px 0' }}>Recovery Factor</td><td style={{ textAlign: 'right' }}>{m.recovery_factor || '0.00'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskAnalyticsPage;
