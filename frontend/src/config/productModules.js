export const productModules = {
  trading: [
    { id: 'live', title: 'Live Trading', description: 'Real-time execution interface.', icon: '⚡', route: '/products/trading/live', enabled: true },
    { id: 'paper', title: 'Paper Trading', description: 'Simulated trading environment.', icon: '📝', route: '/products/trading/paper', enabled: true },
    { id: 'backtest', title: 'Backtesting', description: 'Historical strategy testing.', icon: '⏳', route: '/products/trading/backtest', enabled: true },
    { id: 'strategies', title: 'Strategies', description: 'Algorithmic logic builder.', icon: '🧩', route: '/products/trading/strategies', enabled: true },
    { id: 'history', title: 'Trade History', description: 'Past execution log.', icon: '📜', route: '/products/trading/history', enabled: true },
    { id: 'performance', title: 'Performance', description: 'Trade performance metrics.', icon: '📈', route: '/products/trading/performance', enabled: true }
  ],
  predictions: [
    { id: 'daily', title: 'Daily Forecast', description: 'Short-term price predictions.', icon: '📅', route: '/products/predictions/daily', enabled: true },
    { id: 'weekly', title: 'Weekly Forecast', description: 'Mid-term price predictions.', icon: '📆', route: '/products/predictions/weekly', enabled: true },
    { id: 'monthly', title: 'Monthly Forecast', description: 'Macro trend predictions.', icon: '🗓️', route: '/products/predictions/monthly', enabled: true },
    { id: 'regime', title: 'Regime Detection', description: 'Current market state.', icon: '🔍', route: '/products/predictions/regime', enabled: true },
    { id: 'confidence', title: 'Confidence Analysis', description: 'Model certainty metrics.', icon: '🎯', route: '/products/predictions/confidence', enabled: true },
    { id: 'features', title: 'Feature Importance', description: 'Key driving indicators.', icon: '🔑', route: '/products/predictions/features', enabled: true }
  ],
  news: [
    { id: 'live', title: 'Live News', description: 'Real-time market updates.', icon: '📡', route: '/products/news/live', enabled: true },
    { id: 'sentiment', title: 'Sentiment Analysis', description: 'Social & news sentiment.', icon: '😊', route: '/products/news/sentiment', enabled: true },
    { id: 'impact', title: 'Market Impact', description: 'News event effect models.', icon: '💥', route: '/products/news/impact', enabled: true },
    { id: 'summary', title: 'AI Summary', description: 'Auto-summarized briefings.', icon: '🤖', route: '/products/news/summary', enabled: true }
  ],
  analytics: [
    { id: 'performance', title: 'Performance Analytics', description: 'Deep dive into PnL.', icon: '📊', route: '/products/analytics/performance', enabled: true },
    { id: 'risk', title: 'Risk Analytics', description: 'Exposure and VaR.', icon: '⚠️', route: '/products/analytics/risk', enabled: true },
    { id: 'portfolio', title: 'Portfolio Statistics', description: 'Trade stats and streaks.', icon: '💼', route: '/products/analytics/portfolio', enabled: true },
    { id: 'equity', title: 'Equity Analytics', description: 'Account growth tracking.', icon: '📈', route: '/products/analytics/equity', enabled: true },
    { id: 'distribution', title: 'Trade Distribution', description: 'PnL histograms.', icon: '📉', route: '/products/analytics/distribution', enabled: true },
    { id: 'drawdown', title: 'Drawdown Analysis', description: 'Peak-to-trough tracker.', icon: '📉', route: '/products/analytics/drawdown', enabled: true }
  ],
  reports: [
    { id: 'backtest', title: 'Backtest Reports', description: 'Strategy historical reports.', icon: '📊', route: '/products/reports/backtest', enabled: true },
    { id: 'live', title: 'Live Reports', description: 'Current strategy reports.', icon: '📄', route: '/products/reports/live', enabled: true },
    { id: 'export', title: 'Export Center', description: 'Download CSV/PDF data.', icon: '📥', route: '/products/reports/export', enabled: true },
    { id: 'portfolio', title: 'Portfolio Reports', description: 'Periodic portfolio reviews.', icon: '💼', route: '/products/reports/portfolio', enabled: true }
  ],
  wallet: [
    { id: 'balance', title: 'Balance', description: 'Current asset holdings.', icon: '💰', route: '/products/wallet/balance', enabled: true },
    { id: 'transactions', title: 'Transactions', description: 'Ledger history.', icon: '🧾', route: '/products/wallet/transactions', enabled: true },
    { id: 'deposits', title: 'Deposits', description: 'Add funds to platform.', icon: '⬇️', route: '/products/wallet/deposits', enabled: true },
    { id: 'withdrawals', title: 'Withdrawals', description: 'Remove funds to external wallet.', icon: '⬆️', route: '/products/wallet/withdrawals', enabled: true }
  ],
  insights: [
    { id: 'regime', title: 'Market Regime', description: 'Macro market environment.', icon: '🌍', route: '/products/insights/regime', enabled: true },
    { id: 'orderflow', title: 'Order Flow', description: 'Volume and liquidity analysis.', icon: '🌊', route: '/products/insights/orderflow', enabled: true },
    { id: 'volatility', title: 'Volatility', description: 'Historical and implied vol.', icon: '⚡', route: '/products/insights/volatility', enabled: true },
    { id: 'technical', title: 'Technical Insights', description: 'Automated TA signals.', icon: '📐', route: '/products/insights/technical', enabled: true }
  ]
};
