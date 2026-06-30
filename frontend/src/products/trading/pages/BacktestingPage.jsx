import React, { useState } from 'react';
import StrategySelector from '../components/shared/StrategySelector';
import PerformanceStats from '../components/shared/PerformanceStats';

const BacktestingPage = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [btCapital, setBtCapital] = useState(10000);
  const [btLot, setBtLot] = useState(0.1);
  const [btStart, setBtStart] = useState('2024-01-01');
  const [btEnd, setBtEnd] = useState('2024-05-01');
  const [timeframe, setTimeframe] = useState('1h');
  
  const [btLoading, setBtLoading] = useState(false);
  const [backtestStats, setBacktestStats] = useState(null);
  const [lastBacktestReport, setLastBacktestReport] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleRunBacktest = async () => {
    if (!selectedStrategy) return alert("Please select a strategy first.");
    setBtLoading(true);
    setLastBacktestReport(null);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_name: selectedStrategy,
          initial_capital: parseFloat(btCapital),
          start_date: btStart,
          end_date: btEnd,
          resolution: timeframe
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run backtest');
      
      setLastBacktestReport(data);
      const perf = data.performance || {};
      const metrics = data.metrics || {};
      setBacktestStats({
        pnl: perf.net_pnl ?? metrics.net_profit ?? data.net_pnl ?? 0,
        winRate: metrics.win_rate ?? perf.win_rate ?? data.win_rate ?? '--',
        totalTrades: perf.total_trades ?? metrics.total_trades ?? data.total_trades ?? 0,
        drawdown: metrics.max_drawdown ?? perf.max_drawdown ?? data.max_drawdown ?? '--'
      });
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setBtLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!lastBacktestReport) return;
    setSaveLoading(true);
    try {
      const res = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_data: lastBacktestReport })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save report');
      alert(`Report saved successfully! ID: ${data.report_id}`);
    } catch (err) {
      alert("Error saving report: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="col-controls">
        <section className="card glass">
          <h3>Backtesting Configuration</h3>
          
          <StrategySelector selectedStrategy={selectedStrategy} onChange={setSelectedStrategy} />

          <div className="tab-content" style={{ marginTop: '20px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Initial Capital</label>
                <input type="number" value={btCapital} onChange={e => setBtCapital(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Lot Size</label>
                <input type="number" value={btLot} onChange={e => setBtLot(e.target.value)} step="0.1" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={btStart} onChange={e => setBtStart(e.target.value)} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={btEnd} onChange={e => setBtEnd(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Resolution</label>
              <select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="1d">1d</option>
              </select>
            </div>

            <button className="btn btn-primary w-full" onClick={handleRunBacktest} disabled={btLoading}>
              {btLoading ? 'Running...' : 'Run Backtest'}
            </button>
            {lastBacktestReport && (
              <button 
                className="btn btn-success w-full" 
                style={{ marginTop: '12px' }} 
                onClick={handleSaveReport} 
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving...' : 'Save Report'}
              </button>
            )}
          </div>
        </section>
      </div>
      
      <div className="col-display">
        <PerformanceStats title="Backtest Performance" stats={backtestStats} />
      </div>
    </div>
  );
};

export default BacktestingPage;
