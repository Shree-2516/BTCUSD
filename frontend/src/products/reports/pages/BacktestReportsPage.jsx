import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const BacktestReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load backtest reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Report deleted successfully');
        setReports(reports.filter(r => r.id !== id));
      } else {
        toast.error('Failed to delete report');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete report');
    }
  };

  const handleOpen = (id) => {
    navigate(`/products/analytics/performance?id=${id}`);
  };

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Backtest Reports</h2>
        <div style={{ color: '#94a3b8' }}>Saved simulation strategy execution logs and performance metrics.</div>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {loading ? (
          <div className="text-center p-8 text-gray-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center p-8 text-gray-400">No backtest reports found. Run a backtest in the Trading module.</div>
        ) : (
          <table className="journal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '12px 0' }}>ID</th>
                <th style={{ padding: '12px 0' }}>Strategy</th>
                <th style={{ padding: '12px 0' }}>Date</th>
                <th style={{ padding: '12px 0' }}>Net PnL</th>
                <th style={{ padding: '12px 0' }}>Win Rate</th>
                <th style={{ padding: '12px 0' }}>Trades</th>
                <th style={{ padding: '12px 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 0', color: '#94a3b8' }}>#{r.id}</td>
                  <td style={{ padding: '16px 0', fontWeight: 'bold' }}>{r.strategy_name}</td>
                  <td style={{ padding: '16px 0', color: '#cbd5e1' }}>{r.created_at}</td>
                  <td style={{ padding: '16px 0', color: r.net_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                    ${parseFloat(r.net_pnl || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 0' }}>{r.win_rate}</td>
                  <td style={{ padding: '16px 0' }}>{r.total_trades}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleOpen(r.id)}
                      className="btn btn-secondary mr-2"
                      style={{ padding: '4px 12px', fontSize: '13px' }}
                    >
                      Open
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id)}
                      className="btn"
                      style={{ padding: '4px 12px', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                    >
                      Delete
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

export default BacktestReportsPage;
