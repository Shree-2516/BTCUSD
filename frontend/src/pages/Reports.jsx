import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../api/services/report';
import { tradeService } from '../api/services/trade';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [liveTrades, setLiveTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const reportsRes = await reportService.getReports();
      setReports(reportsRes || []);
      
      const tradeHistoryRes = await tradeService.getTradeHistory();
      setLiveTrades(tradeHistoryRes || []);
    } catch (err) {
      console.error('Error fetching reports data:', err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await reportService.deleteReport(id);
      toast.success('Report deleted');
      fetchAllData();
    } catch (err) {
      toast.error('Failed to delete report');
    }
  };

  const handleDeleteTrade = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trade history?')) return;
    try {
      await tradeService.deleteTrade(id);
      toast.success('Trade deleted');
      fetchAllData();
    } catch (err) {
      toast.error('Failed to delete trade');
    }
  };

  const navigate = useNavigate();

  const handleOpenReport = (id) => {
    navigate(`/analytics?id=${id}`);
  };

  return (
    <div className="w-full">
      <section className="card glass reports-browser">
                    <div className="section-header">
                        <h3>Saved Strategy Reports</h3>
                        <span className="badge" id="reports-count">{reports.length} Reports</span>
                    </div>
                    <div className="table-container">
                        <table id="reports-list-table">
                            <thead>
                                <tr>
                                    <th>Saved On</th>
                                    <th>Strategy Name</th>
                                    <th>Net PnL</th>
                                    <th>Win Rate</th>
                                    <th>Trades</th>
                                    <th>Max DD</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                  <tr><td colSpan="7">Loading...</td></tr>
                                ) : reports.length === 0 ? (
                                  <tr><td colSpan="7">No saved reports found</td></tr>
                                ) : (
                                  reports.map((r, i) => (
                                    <tr key={i}>
                                      <td>{new Date(r.created_at).toLocaleString()}</td>
                                      <td>{r.strategy_name}</td>
                                      <td>
                                        <span className={r.net_pnl >= 0 ? 'pnl-up' : 'pnl-down'}>
                                          {r.net_pnl >= 0 ? '+' : ''}{r.net_pnl.toFixed(2)}
                                        </span>
                                      </td>
                                      <td>{r.win_rate}%</td>
                                      <td>{r.total_trades}</td>
                                      <td>{r.max_drawdown}%</td>
                                      <td>
                                        <div className="btn-group">
                                          <button className="btn btn-sm" onClick={() => handleOpenReport(r.id)}>Open</button>
                                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteReport(r.id)}>Delete</button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="card glass trade-log" style={{marginTop: '24px'}}>
                    <h3>Live Trade History</h3>
                    <div className="table-scroll">
                        <table id="trade-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Entry Price</th>
                                    <th>Exit Price</th>
                                    <th>PnL</th>
                                    <th>Date</th>
                                    <th>Entry Time</th>
                                    <th>Exit Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                  <tr><td colSpan="8">Loading...</td></tr>
                                ) : liveTrades.length === 0 ? (
                                  <tr><td colSpan="8">No live trades yet</td></tr>
                                ) : (
                                  liveTrades.map((t, i) => (
                                    <tr key={i}>
                                      <td>{t.type}</td>
                                      <td>{t.entry_price?.toFixed(2) || '-'}</td>
                                      <td>{t.exit_price?.toFixed(2) || '-'}</td>
                                      <td>
                                        <span className={t.pnl >= 0 ? 'pnl-up' : 'pnl-down'}>
                                          {t.pnl >= 0 ? '+' : ''}{t.pnl?.toFixed(2) || '0.00'}
                                        </span>
                                      </td>
                                      <td>{t.entry_time ? new Date(t.entry_time).toLocaleDateString() : '-'}</td>
                                      <td>{t.entry_time ? new Date(t.entry_time).toLocaleTimeString() : '-'}</td>
                                      <td>{t.exit_time ? new Date(t.exit_time).toLocaleTimeString() : '-'}</td>
                                      <td>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTrade(t.id)}>Delete</button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            
    </div>
  );
};

export default Reports;
