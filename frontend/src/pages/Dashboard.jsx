import { useState, useEffect } from 'react';
import MainChart from '../components/MainChart';
import { useDashboardStore } from '../store/dashboardStore';
import { useTradeStore } from '../store/tradeStore';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('backtest');
  const [timeframe, setTimeframe] = useState('1h');
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  
  // Backtest state
  const [btCapital, setBtCapital] = useState(10000);
  const [btLot, setBtLot] = useState(0.1);
  const [btStart, setBtStart] = useState('2024-01-01');
  const [btEnd, setBtEnd] = useState('2024-05-01');
  const [btLoading, setBtLoading] = useState(false);
  const [backtestStats, setBacktestStats] = useState(null);
  const [lastBacktestReport, setLastBacktestReport] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Live Test state
  const [liveSize, setLiveSize] = useState(0.1);
  const [liveLeverage, setLiveLeverage] = useState(10);
  const [liveCooldown, setLiveCooldown] = useState(0);
  const [liveStopLoss, setLiveStopLoss] = useState('');
  const [liveTakeProfit, setLiveTakeProfit] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  
  const { fetchHistory } = useDashboardStore();
  const { activeTrades, fetchActiveTrades } = useTradeStore();

  useEffect(() => {
    fetchHistory('BTCUSD', timeframe);
  }, [timeframe, fetchHistory]);

  useEffect(() => {
    fetchActiveTrades();
  }, [fetchActiveTrades]);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const res = await fetch('/api/strategies');
        if (res.ok) {
          const data = await res.json();
          setStrategies(data);
        }
      } catch (err) {
        console.error("Failed to fetch strategies", err);
      }
    };
    fetchStrategies();
  }, []);

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

  const handleStartLiveTest = async () => {
    if (!selectedStrategy) return alert("Please select a strategy first.");
    setLiveLoading(true);
    try {
      const payload = {
        strategy_name: selectedStrategy,
        lot_size: parseFloat(liveSize),
        leverage: parseFloat(liveLeverage),
        cooldown_seconds: parseInt(liveCooldown) || 0
      };
      if (liveStopLoss) payload.stop_loss = parseFloat(liveStopLoss);
      if (liveTakeProfit) payload.take_profit = parseFloat(liveTakeProfit);

      const res = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start live test');
      
      alert('Live test started!');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Left Column: Controls & Stats */}
      <div className="col-controls">
        <section className="card glass">
          <h3>Strategy Configuration</h3>
          <div className="form-group">
            <label>Select Strategy</label>
            <select value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)}>
              <option value="">Select a strategy...</option>
              {strategies.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
              onClick={() => setActiveTab('backtest')}
            >
              Backtest
            </button>
            <button 
              className={`tab-btn ${activeTab === 'livetest' ? 'active' : ''}`}
              onClick={() => setActiveTab('livetest')}
            >
              Live Test
            </button>
          </div>

          {activeTab === 'backtest' && (
            <div className="tab-content">
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
          )}

          {activeTab === 'livetest' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Position Size</label>
                <input type="number" value={liveSize} onChange={e => setLiveSize(e.target.value)} step="0.1" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Leverage</label>
                  <input type="number" value={liveLeverage} onChange={e => setLiveLeverage(e.target.value)} min="1" step="1" />
                </div>
                <div className="form-group">
                  <label>Cooldown (sec)</label>
                  <input type="number" value={liveCooldown} onChange={e => setLiveCooldown(e.target.value)} min="0" step="1" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stop Loss</label>
                  <input type="number" value={liveStopLoss} onChange={e => setLiveStopLoss(e.target.value)} placeholder="Optional" step="0.01" />
                </div>
                <div className="form-group">
                  <label>Take Profit</label>
                  <input type="number" value={liveTakeProfit} onChange={e => setLiveTakeProfit(e.target.value)} placeholder="Optional" step="0.01" />
                </div>
              </div>
              <button className="btn btn-success w-full" onClick={handleStartLiveTest} disabled={liveLoading}>
                {liveLoading ? 'Starting...' : 'Start Live Test'}
              </button>
            </div>
          )}
        </section>

        <section className="card glass" id="stats-card">
          <h3>Performance Summary</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <label>Net PnL</label>
              <span>{backtestStats ? (typeof backtestStats.pnl === 'number' ? backtestStats.pnl.toFixed(2) : backtestStats.pnl) : '--'}</span>
            </div>
            <div className="stat-item">
              <label>Win Rate</label>
              <span>{backtestStats ? (typeof backtestStats.winRate === 'number' ? `${backtestStats.winRate.toFixed(2)}%` : backtestStats.winRate) : '--'}</span>
            </div>
            <div className="stat-item">
              <label>Total Trades</label>
              <span>{backtestStats ? backtestStats.totalTrades : '--'}</span>
            </div>
            <div className="stat-item">
              <label>Max Drawdown</label>
              <span>{backtestStats ? (typeof backtestStats.drawdown === 'number' ? `${backtestStats.drawdown.toFixed(2)}%` : backtestStats.drawdown) : '--'}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Chart & Trades */}
      <div className="col-display">
        <section className="card glass chart-container">
          <div className="chart-header">
            <div className="timeframes">
              <button className={`tf-btn ${timeframe === '5m' ? 'active' : ''}`} onClick={() => setTimeframe('5m')}>5m</button>
              <button className={`tf-btn ${timeframe === '15m' ? 'active' : ''}`} onClick={() => setTimeframe('15m')}>15m</button>
              <button className={`tf-btn ${timeframe === '1h' ? 'active' : ''}`} onClick={() => setTimeframe('1h')}>1h</button>
            </div>
          </div>
          <MainChart />
        </section>

        <section className="card glass active-trades">
          <div className="section-header">
            <h3>Active Trades</h3>
            <span className="badge">{activeTrades.length} Open</span>
          </div>
          <div className="active-trades-list">
            {activeTrades.length === 0 ? (
              <div className="no-trades">No active trades</div>
            ) : (
              activeTrades.map((trade, i) => (
                <div key={i} className="trade-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className={`trade-type ${trade.side.toLowerCase()}`} style={{ fontWeight: 'bold' }}>{trade.side}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Size: {trade.size} @ {trade.leverage}x</div>
                  </div>
                  <div className="trade-details" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)' }}>Entry</div>
                      <div>{trade.entry_price ? trade.entry_price.toFixed(2) : '--'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)' }}>Current</div>
                      <div>{trade.current_price ? trade.current_price.toFixed(2) : '--'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>PnL</div>
                      <div className={trade.unrealized_pnl >= 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold' }}>
                        {trade.unrealized_pnl ? trade.unrealized_pnl.toFixed(2) : '0.00'} USDT
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
