import React from 'react';
import { useReportAnalytics } from '../hooks/useReportAnalytics';
import MetricCard from '../../../components/analytics/MetricCard';

const PortfolioStatisticsPage = () => {
  const { id, report, loading } = useReportAnalytics();

  if (!id) return <div className="p-8 text-center text-gray-400">Please select a report from the Reports page to view analytics.</div>;
  if (loading || !report) return <div className="p-8 text-center text-gray-400">Loading report data...</div>;

  const m = report.metrics || {};
  const a = report.analytics || {};
  const ls = a.long_short_split || {};

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Portfolio Statistics</h2>
        <div style={{ color: '#94a3b8' }}>Analyze asset allocation and strategy exposure behavior.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
          label="Avg Trade Duration" 
          value={m.avg_trade_duration || '0.00 hours'} 
        />
        <MetricCard 
          label="Trade Frequency" 
          value={m.total_trades || 0} 
          subValue="Total Executions"
        />
        <MetricCard 
          label="Long Exposure PnL" 
          value={`$${parseFloat(ls.long_pnl || 0).toFixed(2)}`} 
          subValue={`${ls.long_count || 0} Trades`}
          valueClass={parseFloat(ls.long_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        <MetricCard 
          label="Short Exposure PnL" 
          value={`$${parseFloat(ls.short_pnl || 0).toFixed(2)}`} 
          subValue={`${ls.short_count || 0} Trades`}
          valueClass={parseFloat(ls.short_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
         <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
         }}>
           <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Streak & Efficiency</h3>
           <table className="journal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <tbody>
               <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Consecutive Wins</td><td style={{ textAlign: 'right' }}>{m.consecutive_wins || 0}</td></tr>
               <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Consecutive Losses</td><td style={{ textAlign: 'right' }}>{m.consecutive_losses || 0}</td></tr>
               <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Winning Trades</td><td style={{ textAlign: 'right' }}>{m.winning_trades || 0}</td></tr>
               <tr><td style={{ padding: '8px 0' }}>Losing Trades</td><td style={{ textAlign: 'right' }}>{m.losing_trades || 0}</td></tr>
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default PortfolioStatisticsPage;
