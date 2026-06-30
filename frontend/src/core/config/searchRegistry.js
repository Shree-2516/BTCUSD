export const GLOBAL_ROUTE_REGISTRY = [
  // Flagship Products
  { name: "Trading Terminal", type: "product", path: "/products/trading/live", keywords: ["live trading", "terminal", "execute", "chart", "orderbook"] },
  { name: "AI Predictions", type: "product", path: "/products/predictions/daily", keywords: ["forecast", "ml", "signals", "predict"] },
  { name: "Analytics Studio", type: "product", path: "/products/analytics/performance", keywords: ["statistics", "charts", "metrics", "alpha"] },
  { name: "Reports Center", type: "product", path: "/products/reports/backtest", keywords: ["saved", "history", "pdf", "export"] },
  { name: "News Intelligence", type: "product", path: "/products/news/live", keywords: ["coindesk", "articles", "nlp", "sentiment"] },
  { name: "Wallet Center", type: "product", path: "/products/wallet/balance", keywords: ["virtual money", "usdt", "balance", "funds"] },
  { name: "Market Insights", type: "product", path: "/products/insights/technical", keywords: ["volatility", "regime", "halving", "delta"] },

  // Deep-Nested Child Modules (Trading Terminal)
  { name: "Live Trading", type: "module", path: "/products/trading/live", keywords: ["real-time", "broker", "active positions"] },
  { name: "Paper Trading", type: "module", path: "/products/trading/paper", keywords: ["simulated", "mock", "virtual execution"] },
  { name: "Backtesting", type: "module", path: "/products/trading/backtest", keywords: ["historical strategy", "simulation", "run backtest"] },
  { name: "Strategies", type: "module", path: "/products/trading/strategies", keywords: ["crud", "manage parameters", "indicators"] },
  { name: "Trade History", type: "module", path: "/products/trading/history", keywords: ["past orders", "executed contracts", "logs"] },

  // Deep-Nested Child Modules (AI Predictions)
  { name: "Daily Forecast", type: "module", path: "/products/predictions/daily", keywords: ["24h", "ai signal gauge", "range slider"] },
  { name: "Weekly Forecast", type: "module", path: "/products/predictions/weekly", keywords: ["7 day lookahead", "trend target"] },
  { name: "Monthly Forecast", type: "module", path: "/products/predictions/monthly", keywords: ["30 day structural", "long term trend"] },
  { name: "Regime Detection", type: "module", path: "/products/predictions/regime", keywords: ["gmm", "hmm", "market environment", "vix"] },
  { name: "Confidence Analysis", type: "module", path: "/products/predictions/confidence", keywords: ["predict_proba", "accuracy percentage", "calibration"] },
  { name: "Feature Importance", type: "module", path: "/products/predictions/importance", keywords: ["shap values", "coefficients", "indicators weight"] },

  // Deep-Nested Child Modules (News Intelligence)
  { name: "Sentiment Analysis", type: "module", path: "/products/news/sentiment", keywords: ["moving average sentiment", "trends chart"] },
  { name: "Market Impact", type: "module", path: "/products/news/impact", keywords: ["price volatility correlation", "post release deviation"] },
  { name: "AI Summary", type: "module", path: "/products/news/summary", keywords: ["bulleted layout", "llm brief", "executive caching"] },

  // Deep-Nested Child Modules (Wallet Center)
  { name: "Balance", type: "module", path: "/products/wallet/balance", keywords: ["total equity", "available margin", "unrealized pnl"] },
  { name: "Transactions", type: "module", path: "/products/wallet/transactions", keywords: ["margin_block", "settlement logs", "history list"] },
  { name: "Deposits", type: "module", path: "/products/wallet/deposits", keywords: ["add virtual capital", "fund simulation"] },
  { name: "Withdrawals", type: "module", path: "/products/wallet/withdrawals", keywords: ["remove capital", "drawdown test"] },
  { name: "PnL Ledger", type: "module", path: "/products/wallet/ledger", keywords: ["settlement statement", "balance shifts log"] }
];
