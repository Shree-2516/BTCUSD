import React, { useState, useEffect } from 'react';
import MainChart from '../../../components/MainChart';
import { useDashboardStore } from '../../../store/dashboardStore';
import { useTradeStore } from '../../../store/tradeStore';
import StrategySelector from '../components/shared/StrategySelector';
import PerformanceStats from '../components/shared/PerformanceStats';

const LiveTradingPage = () => {
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  
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
          <h3>Live Trading Configuration</h3>
          
          <StrategySelector selectedStrategy={selectedStrategy} onChange={setSelectedStrategy} />

          <div className="tab-content" style={{ marginTop: '20px' }}>
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
        </section>

        {/* Can use PerformanceStats here if we have live stats from API. Leaving a placeholder for Live Stats */}
        <PerformanceStats title="Live Performance" stats={null} />
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

export default LiveTradingPage;
