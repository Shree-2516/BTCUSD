import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import MainChart from '../components/MainChart';

const Insights = () => {
  const { currentPrice, insightsData, fetchInsights, fetchHistory, isLoadingInsights } = useDashboardStore();

  const [calcAmount, setCalcAmount] = useState('');
  const [calcPrice, setCalcPrice] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [chartType, setChartType] = useState('candle');

  useEffect(() => {
    fetchInsights();
    fetchHistory('BTCUSD', '1h');
  }, [fetchInsights, fetchHistory]);

  // Format price
  const lastPrice = Number(currentPrice?.mark_price || currentPrice?.close || 0);
  const formattedPrice = lastPrice > 0 
    ? `$${lastPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
    : '$0,000.00';
  
  // Format change
  const changePct = Number(currentPrice?.mark_change_24h || 0);
  const sign = changePct >= 0 ? '+' : '';
  const changeClass = changePct >= 0 ? 'pnl-up' : 'pnl-down';
  
  const openPrice = Number(currentPrice?.open || lastPrice);
  const changeAbs = lastPrice - openPrice;
  const formattedChange = lastPrice > 0
    ? `${sign}${changePct.toFixed(2)}% (${sign}$${Math.abs(changeAbs).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
    : '+0.00% (+$00.00)';

  // Fear & Greed
  const fngValue = insightsData?.fng?.value || 50;
  const fngLabel = insightsData?.fng?.label || 'Neutral';

  // ROI helpers
  const getRoiData = (key) => insightsData?.roi?.[key] || { return_pct: 0, start_date: '--', start_price: 0 };
  const weeklyRoi = getRoiData('Weekly');
  const monthlyRoi = getRoiData('Monthly');
  const yearlyRoi = getRoiData('Yearly');
  const maxRoi = getRoiData('Max');

  const renderRoiCard = (title, roiObj) => (
    <div className="card glass roi-card">
      <label>{title}</label>
      <div className={`roi-val ${roiObj.return_pct >= 0 ? 'pnl-up' : 'pnl-down'}`}>
        {roiObj.return_pct >= 0 ? '+' : ''}{roiObj.return_pct}%
      </div>
      <div className="roi-price">Start: {roiObj.start_date} @ ${roiObj.start_price.toLocaleString()}</div>
    </div>
  );

  // Halving
  const halvingDays = insightsData?.halving?.days || '--';
  const halvingHours = insightsData?.halving?.hours || '--';
  const halvingDate = insightsData?.halving?.date || 'April 2028';

  // Whale Alerts
  const whaleAlerts = insightsData?.whale_alerts || [];

  // P/L Calculator
  const handleCalculate = () => {
    if (!calcAmount || !calcPrice || lastPrice <= 0) return;
    const inv = Number(calcAmount);
    const buyPrice = Number(calcPrice);
    
    if (inv <= 0 || buyPrice <= 0) return;
    
    const btcAmount = inv / buyPrice;
    const currentVal = btcAmount * lastPrice;
    const netPnL = currentVal - inv;
    const roi = (netPnL / inv) * 100;
    
    setCalcResult({ currentVal, netPnL, roi });
  };

  return (
    <div className="w-full">
      <div className="insights-container">
        {/* Top Header: Live Status */}
        <div className="insights-header-row">
          <div className="card glass status-card">
            <div className="live-status-large">
              <span className="label">Live BTC/USD Price</span>
              <div className="price-val">{formattedPrice}</div>
              <div className={`change-val ${changeClass}`}>{formattedChange}</div>
            </div>
          </div>
          <div className="card glass sentiment-card">
            <h3>Market Sentiment</h3>
            <div className="fng-gauge-container">
              <div className="fng-gauge">
                <div className="gauge-fill" style={{width: `${fngValue}%`}}></div>
              </div>
              <div className="fng-meta">
                <span>{fngValue}</span>
                <span>{fngLabel}</span>
              </div>
              <div className="fng-scale">
                <span>Fear</span>
                <span>Greed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Returns Grid */}
        <div className="roi-grid">
          {renderRoiCard('Weekly Return', weeklyRoi)}
          {renderRoiCard('Monthly Return', monthlyRoi)}
          {renderRoiCard('Yearly (YTD)', yearlyRoi)}
          {renderRoiCard('Max Return (Cycle)', maxRoi)}
        </div>

        <div className="insights-main-grid">
          {/* Charting Engine Placeholder (Would need a LightweightCharts wrapper) */}
          <div className="col-chart">
            <section className="card glass insights-chart-container">
              <div className="chart-header">
                <div className="chart-controls">
                  <div className="btn-group">
                    <button 
                      className={`btn btn-tab ${chartType === 'candle' ? 'active' : ''}`}
                      onClick={() => setChartType('candle')}
                    >
                      Candlestick
                    </button>
                    <button 
                      className={`btn btn-tab ${chartType === 'line' ? 'active' : ''}`}
                      onClick={() => setChartType('line')}
                    >
                      Line
                    </button>
                  </div>
                  <div className="overlay-controls">
                    <label><input type="checkbox" /> MA (20)</label>
                    <label><input type="checkbox" /> RSI</label>
                  </div>
                </div>
                <div className="timezone-label">Asia/Kolkata (IST)</div>
              </div>
              <MainChart chartType={chartType} />
            </section>

            <section className="card glass whale-alerts">
              <h3>On-Chain "Whale" Alerts</h3>
              <div className="whale-list">
                {isLoadingInsights ? (
                  <div className="loading-small">Scanning blockchain...</div>
                ) : whaleAlerts.length > 0 ? (
                  whaleAlerts.map((alert, i) => (
                    <div key={i} className={`whale-item impact-${alert.impact?.toLowerCase() || 'low'}`}>
                      <div className="whale-msg">{alert.message}</div>
                      <div className="whale-meta">Impact: {alert.impact} • {alert.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="loading-small">No whale alerts found.</div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Features */}
          <div className="col-features">
            <section className="card glass halving-card">
              <h3>Bitcoin Halving Countdown</h3>
              <div className="countdown-grid">
                <div className="cd-item">
                  <span>{halvingDays}</span>
                  <label>Days</label>
                </div>
                <div className="cd-item">
                  <span>{halvingHours}</span>
                  <label>Hours</label>
                </div>
              </div>
              <p className="halving-date">Next Halving: <span>{halvingDate}</span></p>
            </section>

            <section className="card glass pl-calculator">
              <h3>Profit/Loss Calculator</h3>
              <div className="form-group">
                <label>Investment Amount (USD)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 1000" 
                  value={calcAmount}
                  onChange={e => setCalcAmount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Purchase Price (USD)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 60000" 
                  value={calcPrice}
                  onChange={e => setCalcPrice(e.target.value)}
                />
              </div>
              
              {calcResult && (
                <div className="calc-results">
                  <div className="res-item">
                    <label>Current Value</label>
                    <span>${calcResult.currentVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="res-item">
                    <label>Net Profit/Loss</label>
                    <span className={calcResult.netPnL >= 0 ? 'pnl-up' : 'pnl-down'}>
                      {calcResult.netPnL >= 0 ? '+' : ''}${calcResult.netPnL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="res-item">
                    <label>ROI</label>
                    <span className={calcResult.roi >= 0 ? 'pnl-up' : 'pnl-down'}>
                      {calcResult.roi >= 0 ? '+' : ''}{calcResult.roi.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              
              <button 
                className="btn btn-primary w-full" 
                style={{marginTop: '10px'}}
                onClick={handleCalculate}
              >
                Calculate
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
