import React, { useState, useEffect } from 'react';
import MainChart from '../../../components/MainChart';
import { useDashboardStore } from '../../../store/dashboardStore';
import { useTradeStore } from '../../../store/tradeStore';
import StrategySelector from '../components/shared/StrategySelector';
import PerformanceStats from '../components/shared/PerformanceStats';

const PaperTradingPage = () => {
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  
  // Paper Test state
  const [paperSize, setPaperSize] = useState(0.1);
  const [paperLeverage, setPaperLeverage] = useState(10);
  const [paperCooldown, setPaperCooldown] = useState(0);
  const [paperStopLoss, setPaperStopLoss] = useState('');
  const [paperTakeProfit, setPaperTakeProfit] = useState('');
  const [paperLoading, setPaperLoading] = useState(false);
  
  const { fetchHistory } = useDashboardStore();
  const { activeTrades, fetchActiveTrades } = useTradeStore(); // Replace with paper trades later if distinct API is used

  useEffect(() => {
    fetchHistory('BTCUSD', timeframe);
  }, [timeframe, fetchHistory]);

  useEffect(() => {
    fetchActiveTrades(); // For now fetch existing, but eventually fetch from paper endpoint
  }, [fetchActiveTrades]);

  const handleStartPaperTest = async () => {
    if (!selectedStrategy) return alert("Please select a strategy first.");
    setPaperLoading(true);
    try {
      const payload = {
        strategy_name: selectedStrategy,
        lot_size: parseFloat(paperSize),
        leverage: parseFloat(paperLeverage),
        cooldown_seconds: parseInt(paperCooldown) || 0,
        is_paper: true // Tell backend it's a paper trade
      };
      if (paperStopLoss) payload.stop_loss = parseFloat(paperStopLoss);
      if (paperTakeProfit) payload.take_profit = parseFloat(paperTakeProfit);

      const res = await fetch('/api/live/start', { // Modify later to use /api/paper/start or similar
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start paper test');
      
      alert('Paper test started!');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setPaperLoading(false);
    }
  };

  const handleResetPaperBalance = () => {
    alert("Paper balance reset feature coming soon.");
  };

  return (
    <div className="dashboard-grid">
      <div className="col-controls">
        <section className="card glass" style={{ border: '1px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Paper Trading</h3>
            <span className="badge" style={{ background: 'var(--accent-blue)', color: '#fff' }}>SIMULATED</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Test your strategies with virtual funds.</p>

          <StrategySelector selectedStrategy={selectedStrategy} onChange={setSelectedStrategy} />

          <div className="tab-content" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Position Size</label>
              <input type="number" value={paperSize} onChange={e => setPaperSize(e.target.value)} step="0.1" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Leverage</label>
                <input type="number" value={paperLeverage} onChange={e => setPaperLeverage(e.target.value)} min="1" step="1" />
              </div>
              <div className="form-group">
                <label>Cooldown (sec)</label>
                <input type="number" value={paperCooldown} onChange={e => setPaperCooldown(e.target.value)} min="0" step="1" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Stop Loss</label>
                <input type="number" value={paperStopLoss} onChange={e => setPaperStopLoss(e.target.value)} placeholder="Optional" step="0.01" />
              </div>
              <div className="form-group">
                <label>Take Profit</label>
                <input type="number" value={paperTakeProfit} onChange={e => setPaperTakeProfit(e.target.value)} placeholder="Optional" step="0.01" />
              </div>
            </div>
            <button className="btn btn-primary w-full" onClick={handleStartPaperTest} disabled={paperLoading}>
              {paperLoading ? 'Starting...' : 'Start Paper Test'}
            </button>
            <button className="btn btn-outline w-full" style={{ marginTop: '12px' }} onClick={handleResetPaperBalance}>
              Reset Paper Balance
            </button>
          </div>
        </section>

        <PerformanceStats title="Paper Performance" stats={null} />
      </div>

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
            <h3>Active Paper Trades</h3>
            <span className="badge">{activeTrades.length} Open</span>
          </div>
          <div className="active-trades-list">
            {activeTrades.length === 0 ? (
              <div className="no-trades">No active paper trades</div>
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

export default PaperTradingPage;
