import React from 'react';
import { useReportAnalytics } from '../hooks/useReportAnalytics';
import MetricCard from '../../../components/analytics/MetricCard';

const PerformanceAnalyticsPage = () => {
  const { id, report, loading } = useReportAnalytics();

  if (!id) return <div className="p-8 text-center text-gray-400">Please select a report from the Reports page to view analytics.</div>;
  if (loading || !report) return <div className="p-8 text-center text-gray-400">Loading report data...</div>;

  const p = report.performance || {};
  const m = report.metrics || {};

  return (
    <div className="w-full text-slate-50">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Performance Analytics</h2>
          <div style={{ color: '#94a3b8' }}>
            Report #{report.id || id} • {report.parameters?.strategy || 'Strategy'} • {report.parameters?.resolution || '1h'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary">Export CSV</button>
          <button className="btn btn-secondary">Export Excel</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
          label="Net Profit" 
          value={`$${parseFloat(p.net_pnl || 0).toFixed(2)}`} 
          subValue="Total Return"
          valueClass={p.net_pnl >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        <MetricCard 
          label="Win Rate" 
          value={p.win_rate} 
          subValue={`${p.total_trades} Trades`}
        />
        <MetricCard 
          label="Profit Factor" 
          value={m.profit_factor || '0.00'} 
          subValue="Institutional Grade"
        />
        <MetricCard 
          label="Sharpe Ratio" 
          value={m.sharpe_ratio || '0.00'} 
          subValue="Risk Adjusted"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
         <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
         }}>
           <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Profitability</h3>
           <table className="journal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <tbody>
               <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Gross Profit</td><td style={{ textAlign: 'right' }}>{m.gross_profit != null ? '$' + Number(m.gross_profit).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
               <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Gross Loss</td><td style={{ textAlign: 'right' }}>{m.gross_loss != null ? '$' + Number(m.gross_loss).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
               <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Largest Win</td><td style={{ textAlign: 'right' }}>{m.largest_win != null ? '$' + Number(m.largest_win).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
               <tr><td style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Largest Loss</td><td style={{ textAlign: 'right' }}>{m.largest_loss != null ? '$' + Number(m.largest_loss).toLocaleString(undefined, {maximumFractionDigits: 2}) : '$0.00'}</td></tr>
               <tr><td style={{ padding: '8px 0' }}>Avg Profit/Trade</td><td style={{ textAlign: 'right' }}>{m.avg_profit_per_trade != null ? '$' + Number(m.avg_profit_per_trade).toFixed(2) : '$0.00'}</td></tr>
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default PerformanceAnalyticsPage;
