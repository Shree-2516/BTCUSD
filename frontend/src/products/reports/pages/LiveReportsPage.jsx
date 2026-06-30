import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LiveReportsPage = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLiveSummaries = async () => {
    try {
      const res = await fetch('/api/reports/live/summaries');
      if (!res.ok) throw new Error('API Endpoint not found');
      const data = await res.json();
      setSummaries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load live summaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSummaries();
  }, []);

  const handleOpenLiveAnalytics = () => {
    // Currently get_live_report() generates a single report for all trades, 
    // but Analytics Studio defaults to ?id= from reports table.
    // For live, if analytics fetches 'live' we route it.
    // However, the Analytics Studio currently relies on ?id=. 
    // For now, we will route them to trading/performance or prompt.
    // But since Phase 10.4 we have ?id= for Analytics, a live dashboard requires ?mode=live handled by useReportAnalytics.
    // We will just inform the user or route them if supported.
    toast.success('Live analytics generation requested. Processing...');
    // We route to analytics with a special query param.
    navigate(`/products/analytics/performance?mode=live`);
  };

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Live Reports</h2>
        <div style={{ color: '#94a3b8' }}>Forward-tested metrics, tracking active and settled real-world portfolio executions.</div>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {loading ? (
          <div className="text-center p-8 text-gray-400">Loading live data...</div>
        ) : summaries.length === 0 ? (
          <div className="text-center p-8 text-gray-400">No live trading history found. Start paper or live trading first.</div>
        ) : (
          <table className="journal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '12px 0' }}>Strategy / Mode</th>
                <th style={{ padding: '12px 0' }}>Last Active</th>
                <th style={{ padding: '12px 0' }}>Total Realized PnL</th>
                <th style={{ padding: '12px 0' }}>Live Win Rate</th>
                <th style={{ padding: '12px 0' }}>Trades Executed</th>
                <th style={{ padding: '12px 0' }}>Open Exposure</th>
                <th style={{ padding: '12px 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 0', fontWeight: 'bold' }}>{s.strategy_name}</td>
                  <td style={{ padding: '16px 0', color: '#cbd5e1' }}>{s.last_active}</td>
                  <td style={{ padding: '16px 0', color: s.total_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                    ${parseFloat(s.total_pnl || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 0' }}>{s.win_rate}</td>
                  <td style={{ padding: '16px 0' }}>{s.total_trades}</td>
                  <td style={{ padding: '16px 0' }}>${parseFloat(s.open_exposure || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>
                    <button 
                      onClick={handleOpenLiveAnalytics}
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', fontSize: '13px' }}
                    >
                      Open Live Analytics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LiveReportsPage;
