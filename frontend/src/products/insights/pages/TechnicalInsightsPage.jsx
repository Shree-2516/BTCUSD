import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../../../store/dashboardStore';
import MainChart from '../../../components/MainChart';

const TechnicalInsightsPage = () => {
  const { currentPrice, insightsData, fetchInsights, fetchHistory } = useDashboardStore();
  const [chartType, setChartType] = useState('candle');

  useEffect(() => {
    fetchInsights();
    fetchHistory('BTCUSD', '1h');
  }, [fetchInsights, fetchHistory]);

  const lastPrice = Number(currentPrice?.mark_price || currentPrice?.close || 0);
  const formattedPrice = lastPrice > 0 
    ? `$${lastPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
    : '$0,000.00';
  
  const changePct = Number(currentPrice?.mark_change_24h || 0);
  const sign = changePct >= 0 ? '+' : '';
  const changeClass = changePct >= 0 ? 'pnl-up' : 'pnl-down';
  
  const openPrice = Number(currentPrice?.open || lastPrice);
  const changeAbs = lastPrice - openPrice;
  const formattedChange = lastPrice > 0
    ? `${sign}${changePct.toFixed(2)}% (${sign}$${Math.abs(changeAbs).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
    : '+0.00% (+$00.00)';

  const getRoiData = (key) => insightsData?.roi?.[key] || { return_pct: 0, start_date: '--', start_price: 0 };
  const weeklyRoi = getRoiData('Weekly');
  const monthlyRoi = getRoiData('Monthly');
  const yearlyRoi = getRoiData('Yearly');
  const maxRoi = getRoiData('Max');

  const renderRoiCard = (title, roiObj) => (
    <div className="card glass roi-card" style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
      <label style={{ color: '#94a3b8', fontSize: '14px' }}>{title}</label>
      <div className={`roi-val ${roiObj.return_pct >= 0 ? 'pnl-up' : 'pnl-down'}`} style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>
        {roiObj.return_pct >= 0 ? '+' : ''}{roiObj.return_pct}%
      </div>
      <div className="roi-price" style={{ color: '#64748b', fontSize: '12px' }}>Start: {roiObj.start_date} @ ${roiObj.start_price.toLocaleString()}</div>
    </div>
  );

  const halvingDays = insightsData?.halving?.days || '--';
  const halvingHours = insightsData?.halving?.hours || '--';
  const halvingDate = insightsData?.halving?.date || 'April 2028';

  return (
    <div className="w-full text-slate-50" style={{ overflowY: 'auto', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', gap: '24px' }}>
        <div className="card glass" style={{ flex: 1, padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>Live BTC/USD Price</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formattedPrice}</div>
          <div className={changeClass} style={{ fontSize: '16px' }}>{formattedChange}</div>
        </div>
        <div className="card glass" style={{ flex: 1, padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#94a3b8' }}>Bitcoin Halving Countdown</h3>
          <div style={{ display: 'flex', gap: '32px', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{halvingDays}</span>
              <span style={{ color: '#64748b', marginLeft: '8px' }}>Days</span>
            </div>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{halvingHours}</span>
              <span style={{ color: '#64748b', marginLeft: '8px' }}>Hours</span>
            </div>
          </div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Next Halving: <span style={{ color: '#f8fafc' }}>{halvingDate}</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        {renderRoiCard('Weekly Return', weeklyRoi)}
        {renderRoiCard('Monthly Return', monthlyRoi)}
        {renderRoiCard('Yearly (YTD)', yearlyRoi)}
        {renderRoiCard('Max Return (Cycle)', maxRoi)}
      </div>

      <section className="card glass" style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', minHeight: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className={`btn btn-tab ${chartType === 'candle' ? 'active' : ''}`}
              onClick={() => setChartType('candle')}
              style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: chartType === 'candle' ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}
            >
              Candlestick
            </button>
            <button 
              className={`btn btn-tab ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
              style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: chartType === 'line' ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}
            >
              Line
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" /> MA (20)</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" /> RSI</label>
            <span style={{ color: '#64748b', marginLeft: '16px' }}>Asia/Kolkata (IST)</span>
          </div>
        </div>
        <div style={{ height: '400px' }}>
          <MainChart chartType={chartType} />
        </div>
      </section>
    </div>
  );
};

export default TechnicalInsightsPage;
