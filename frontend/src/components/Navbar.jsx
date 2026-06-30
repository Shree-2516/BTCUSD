import { useDashboardStore } from '../store/dashboardStore';

const Navbar = () => {
  const { currentPrice, liveStatus } = useDashboardStore();

  // Handle color classes for price change if we had the raw change value, 
  // but let's just display the price for now since we just receive the ticker.
  // The backend ticker payload typically has 'mark_price' or similar.
  const price = currentPrice?.mark_price ? parseFloat(currentPrice.mark_price).toLocaleString(undefined, { minimumFractionDigits: 3 }) : 'Loading...';
  
  // Calculate change if previous close is available, else leave dummy for now
  const changePct = currentPrice?.price_change_percent 
    ? `${parseFloat(currentPrice.price_change_percent).toFixed(2)}%` 
    : '--%';
  
  const isPositive = currentPrice?.price_change_percent > 0;
  const changeClass = isPositive ? 'positive' : 'negative';

  return (
    <header className="top-header">
      <div className="live-ticker">
        <span className="symbol">BTCUSD</span>
        <span id="ticker-price" className="price">${price}</span>
        <span id="ticker-change" className={`change ${changePct !== '--%' ? changeClass : ''}`}>{changePct}</span>
      </div>
      <div className="header-actions">
        {/* We can use a button to navigate to Wallet page, or just leave it for UI parity */}
        <button className="btn btn-secondary" id="btn-add-funds" onClick={() => window.location.href = '/wallet'}>Add Funds</button>
        <div className="status-indicator">
          <span className="status-dot" id="live-status-dot"></span>
          <span id="live-status-text">{liveStatus?.state || 'System Ready'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
