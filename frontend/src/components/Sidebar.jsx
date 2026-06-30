import { NavLink } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { useEffect } from 'react';

const Sidebar = () => {
  const { walletStatus, fetchWalletStatus } = useWalletStore();

  useEffect(() => {
    fetchWalletStatus();
  }, [fetchWalletStatus]);

  const balance = walletStatus?.available_balance || 0;

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-icon"></span>
        <span className="logo-text">SHREE.TRADER</span>
      </div>

      <nav className="nav-menu">
        <NavLink to="/" className="nav-link" end>
          {({ isActive }) => <div className={`nav-item ${isActive ? 'active' : ''}`} id="nav-dashboard">Dashboard</div>}
        </NavLink>
        <NavLink to="/insights" className="nav-link">
          {({ isActive }) => <div className={`nav-item ${isActive ? 'active' : ''}`} id="nav-insights">BTCUSD Insights</div>}
        </NavLink>
        <NavLink to="/wallet" className="nav-link">
          {({ isActive }) => <div className={`nav-item ${isActive ? 'active' : ''}`} id="nav-wallet">Wallet</div>}
        </NavLink>
        <NavLink to="/reports" className="nav-link">
          {({ isActive }) => <div className={`nav-item ${isActive ? 'active' : ''}`} id="nav-reports">Reports</div>}
        </NavLink>
        <NavLink to="/analytics" className="nav-link">
          {({ isActive }) => <div className={`nav-item ${isActive ? 'active' : ''}`} id="nav-analytics">Analytics</div>}
        </NavLink>
        <NavLink to="/ai-predictions" className="nav-link">
          {({ isActive }) => <div className={`nav-item ${isActive ? 'active' : ''}`} id="nav-ai-predictions">AI Predictions</div>}
        </NavLink>
        <NavLink to="/news" className="nav-link">
          {({ isActive }) => <div className={`nav-item ${isActive ? 'active' : ''}`} id="nav-news">News Sentiment</div>}
        </NavLink>
      </nav>

      <div className="wallet-mini">
        <span className="label">Balance</span>
        <div className="balance-row">
          <span id="wallet-balance">{balance.toFixed(2)}</span>
          <span className="currency">USDT</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
