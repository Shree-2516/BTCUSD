let chart, candleSeries;
let insightsChart, insightsSeries, insightsLineSeries, maSeries;
let ws;
let isLive = false;
let currentResolution = "1h";
let tradeMarkers = [];
let lastBacktestReport = null;
let activePriceLines = [];
let insightsInitialLoad = false;
let analyticsCharts = {}; // To store Chart.js instances

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initInsightsChart();
    loadStrategies();
    loadWallet();
    initWebSocket();
    setupEventListeners();
    fetchInitialData();
});

function initChart() {
    const container = document.getElementById('main-chart');
    if (!container) return;

    const chartOptions = {
        width: container.clientWidth,
        height: container.clientHeight || 450,
        layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: '#94a3b8',
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            timeVisible: true,
            tickMarkFormatter: (time, tickMarkType, locale) => {
                const date = new Date(time * 1000);
                const options = { timeZone: 'Asia/Kolkata', hour12: false };
                
                if (tickMarkType === 0) { // Year
                    return date.toLocaleString(locale, { ...options, year: 'numeric' });
                } else if (tickMarkType === 1) { // Month
                    return date.toLocaleString(locale, { ...options, month: 'short' });
                } else if (tickMarkType === 2) { // Day
                    return date.toLocaleString(locale, { ...options, day: 'numeric' });
                } else { // Time
                    return date.toLocaleString(locale, { ...options, hour: '2-digit', minute: '2-digit' });
                }
            }
        },
        localization: {
            locale: 'en-IN',
            timeFormatter: (time) => {
                const date = new Date(time * 1000);
                return date.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
            }
        },
    };

    try {
        chart = LightweightCharts.createChart(container, chartOptions);
        candleSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Handle Resize
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || !entries[0].contentRect) return;
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height });
        });
        resizeObserver.observe(container);
    } catch (err) {
        console.error("Failed to initialize chart:", err);
    }
}

async function loadStrategies() {
    const res = await fetch('/api/strategies');
    const strategies = await res.json();
    const select = document.getElementById('strategy-select');
    strategies.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

async function loadWallet() {
    try {
        const res = await fetch('/api/wallet');
        const data = await res.json();
        const bal = Number(data.balance);
        const avail = Number(data.available_balance);
        const balTxt = Number.isFinite(bal) ? bal.toFixed(2) : '--';
        const availTxt = Number.isFinite(avail) ? avail.toFixed(2) : '--';

        const wb = document.getElementById('wallet-balance');
        if (wb) wb.textContent = balTxt;

        const pageBalance = document.getElementById('wallet-page-balance');
        if (pageBalance) pageBalance.textContent = balTxt;

        const availBalance = document.getElementById('wallet-available-balance');
        if (availBalance) availBalance.textContent = availTxt;
    } catch (err) {
        console.error("Error loading wallet:", err);
    }
}

async function loadWalletHistory() {
    try {
        const res = await fetch('/api/wallet/history');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const history = await res.json();
        const tbody = document.querySelector('#wallet-history-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (Array.isArray(history)) {
            history.forEach(t => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${t.timestamp}</td>
                    <td style="color: ${t.type === 'CREDIT' ? 'var(--success)' : 'var(--danger)'}">${t.type}</td>
                    <td>${Number.isFinite(Number(t.amount)) ? Number(t.amount).toFixed(2) : '--'}</td>
                    <td>${Number.isFinite(Number(t.balance_after)) ? Number(t.balance_after).toFixed(2) : '--'}</td>
                    <td>${t.reason}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            console.error("Wallet history is not an array:", history);
            tbody.innerHTML = '<tr><td colspan="5">No history found or error loading data.</td></tr>';
        }
    } catch (err) {
        console.error("Error loading wallet history:", err);
    }
}

async function loadReports() {
    try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const reports = await res.json();
        const tbody = document.querySelector('#reports-list-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (Array.isArray(reports)) {
            reports.forEach(r => {
                const row = document.createElement('tr');
                const np = Number(r.net_pnl);
                const pnlStr = Number.isFinite(np) ? np.toFixed(2) : '--';
                const wr = Number(r.win_rate);
                const wrStr = Number.isFinite(wr) ? `${wr.toFixed(2)}%` : (r.win_rate != null ? String(r.win_rate) : '--');
                row.innerHTML = `
                    <td>${r.created_at}</td>
                    <td>${r.strategy_name}</td>
                    <td class="${Number.isFinite(np) && np >= 0 ? 'pnl-up' : 'pnl-down'}">${pnlStr}</td>
                    <td>${wrStr}</td>
                    <td>${r.total_trades != null ? r.total_trades : '--'}</td>
                    <td>${r.max_drawdown != null ? r.max_drawdown : '--'}</td>
                    <td><button class="btn btn-secondary" onclick="viewReportDetails(${r.id})">Open</button></td>
                `;
                tbody.appendChild(row);
            });
            
            const countBadge = document.getElementById('reports-count');
            if (countBadge) countBadge.textContent = `${reports.length} Reports`;
        } else {
            console.error("Reports data is not an array:", reports);
            tbody.innerHTML = '<tr><td colspan="7">No reports found or error loading data.</td></tr>';
        }
    } catch (err) {
        console.error("Error loading reports:", err);
    }
}

async function viewReportDetails(reportId) {
    try {
        const res = await fetch(`/api/reports/${reportId}`);
        const report = await res.json();
        try {
            displayReport(report);
        } catch (e) {
            console.error('displayReport', e);
            alert('Report loaded but summary display failed: ' + (e.message || e));
        }
        switchView('dashboard');
    } catch (err) {
        alert("Failed to load report details");
    }
}

function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/live`);
    
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ticker') {
            updateTickerUI(msg);
            updateInsightsTicker(msg);
            if (msg.active_trades) {
                renderActiveTrades(msg.active_trades);
                updateChartMarkers(msg.active_trades);
            }
        }
    };

    ws.onclose = () => {
        setTimeout(initWebSocket, 5000); // Reconnect
    };
}

function updateTickerUI(msg) {
    const data = msg.data;
    if (!data) return;
    
    const priceEl = document.getElementById('ticker-price');
    const lastPrice = parseFloat(data.mark_price || data.close || 0);
    
    // Strict validation: must be a finite number > 0
    if (!lastPrice || !isFinite(lastPrice) || lastPrice <= 0) return;

    priceEl.textContent = `$${lastPrice.toLocaleString()}`;

    const changeEl = document.getElementById('ticker-change');
    if (changeEl && data.mark_change_24h !== undefined && data.mark_change_24h !== null) {
        const changePct = Number(data.mark_change_24h);
        if (Number.isFinite(changePct)) {
            const sign = changePct >= 0 ? '+' : '';
            changeEl.textContent = `${sign}${changePct.toFixed(2)}%`;
            changeEl.className = `change ${changePct >= 0 ? 'pnl-up' : 'pnl-down'}`;
        }
    }
    
    // Update chart if live
    if (isLive && candleSeries) {
        try {
            const resMap = {"5m": 300, "15m": 900, "1h": 3600};
            const resolutionSeconds = resMap[currentResolution] || 3600; 
            const candleTime = Math.floor(Date.now() / 1000 / resolutionSeconds) * resolutionSeconds;
            
            candleSeries.update({
                time: candleTime,
                open: lastPrice,
                high: lastPrice,
                low: lastPrice,
                close: lastPrice
            });
        } catch (e) {
            console.error("Chart update error:", e);
        }

        if (msg.event) {
            handleLiveEvent(msg.event);
        }
    }
}

function handleLiveEvent(event) {
    if (!event || !event.data) return;
    const trade = event.data;
    const type = event.type;
    
    const tbody = document.querySelector('#trade-table tbody');
    if (tbody) {
        const row = document.createElement('tr');
        const pnl = trade.pnl || 0;
            row.innerHTML = `
                <td>${trade.type}</td>
                <td>${fmtPrice(trade.price)}</td>
                <td>${trade.exit_price != null && trade.exit_price !== '' ? fmtPrice(trade.exit_price) : '--'}</td>
                <td class="${pnl >= 0 ? 'pnl-up' : 'pnl-down'}">${fmtPnl(trade.pnl)}</td>
            <td>${new Date().toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata'})}</td>
            <td>${new Date().toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata', hour12: false})}</td>
            <td>${trade.exit_price ? new Date().toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata', hour12: false}) : '--'}</td>
        `;
        tbody.prepend(row);
    }

    if (type === 'trade' && candleSeries) {
        const markerTime = Math.floor(new Date().getTime() / 1000);
        tradeMarkers.push({
            time: markerTime,
            position: trade.type === 'BUY' ? 'belowBar' : 'aboveBar',
            color: trade.type === 'BUY' ? '#22c55e' : '#ef4444',
            shape: trade.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: trade.type
        });
        candleSeries.setMarkers(tradeMarkers);
    }
    
    loadWallet();
}

function setupEventListeners() {
    // Navigation
    document.getElementById('nav-dashboard').addEventListener('click', () => switchView('dashboard'));
    document.getElementById('nav-insights').addEventListener('click', () => switchView('insights'));
    document.getElementById('nav-wallet').addEventListener('click', () => switchView('wallet'));
    document.getElementById('nav-reports').addEventListener('click', () => switchView('reports'));
    document.getElementById('nav-analytics').addEventListener('click', () => {
        if (!lastBacktestReport) {
            alert("No backtest report available. Please run a backtest first.");
            return;
        }
        switchView('analytics');
    });
    document.getElementById('nav-ai').addEventListener('click', () => switchView('ai'));
    document.getElementById('btn-add-funds').addEventListener('click', () => switchView('wallet'));

    // Timeframe selector
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentResolution = btn.dataset.tf;
            fetchInitialData();
        });
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            document.getElementById('backtest-params').classList.add('hidden');
            document.getElementById('livetest-params').classList.add('hidden');
            
            document.getElementById(`${tab}-params`).classList.remove('hidden');
        });
    });

    // Run Backtest
    document.getElementById('run-backtest').addEventListener('click', runBacktest);

    // Save Report
    document.getElementById('save-report-btn').addEventListener('click', saveCurrentReport);

    // Wallet Actions
    document.getElementById('confirm-deposit').addEventListener('click', () => handleWalletAction('deposit'));
    document.getElementById('confirm-withdraw').addEventListener('click', () => handleWalletAction('withdraw'));
    document.getElementById('btn-reset-wallet')?.addEventListener('click', resetWallet);

    // Live Test
    document.getElementById('start-live').addEventListener('click', () => toggleLive(true));
    document.getElementById('stop-live').addEventListener('click', () => toggleLive(false));

    
    // P/L Calculator
    document.getElementById('btn-calculate').addEventListener('click', calculatePL);

    // Chart Toggles
    document.querySelectorAll('#chart-type-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#chart-type-toggle button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            toggleInsightsChartType(btn.dataset.type);
        });
    });

    document.getElementById('toggle-ma').addEventListener('change', (e) => {
        if (maSeries) maSeries.applyOptions({ visible: e.target.checked });
    });

    // Analytics Tab Navigation
    document.querySelectorAll('[data-analytics-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-analytics-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.dataset.analyticsTab;
            document.querySelectorAll('.analytics-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`analytics-tab-${target}`).classList.remove('hidden');
            resizeAnalyticsCharts();
        });
    });

    // Export Triggers
    document.getElementById('btn-export-csv').addEventListener('click', () => exportActiveReport('csv'));
    document.getElementById('btn-export-excel').addEventListener('click', () => exportActiveReport('excel'));

    // Journal Search
    document.getElementById('journal-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#advanced-journal-table tbody tr');
        rows.forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
        });
    });

    // Initial trades load
    loadTradeHistory();
}

function switchView(view) {
    console.log(`DEBUG: Switching view to ${view}`);
    
    // 1. Update Navigation UI
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById(`nav-${view}`);
    if (navItem) navItem.classList.add('active');

    // 2. Hide all views
    const views = {
        'dashboard': document.querySelector('.dashboard-grid'),
        'wallet': document.getElementById('view-wallet'),
        'reports': document.getElementById('view-reports'),
        'insights': document.getElementById('view-insights'),
        'ai': document.getElementById('view-ai'),
        'analytics': document.getElementById('view-analytics')
    };

    Object.values(views).forEach(v => {
        if (v) v.classList.add('hidden');
    });

    // 3. Show requested view
    const activeView = views[view];
    if (activeView) {
        console.log(`DEBUG: Showing view element for ${view}`);
        activeView.classList.remove('hidden');
    } else {
        console.warn(`DEBUG: No view element found for ${view}`);
    }

    // 4. Trigger view-specific logic
    if (view === 'wallet') {
        loadWalletHistory();
    } else if (view === 'reports') {
        loadReports();
        loadTradeHistory();
    } else if (view === 'insights') {
        loadInsights();
        if (!insightsInitialLoad) {
            fetchInsightsHistory();
            insightsInitialLoad = true;
        }
    } else if (view === 'ai') {
        loadAIInsights();
    } else if (view === 'analytics') {
        if (lastBacktestReport) {
            try {
                renderDetailedReport(lastBacktestReport);
                resizeAnalyticsCharts();
            } catch (e) {
                console.error('Analytics view failed', e);
            }
        }
    }
}

async function loadAIInsights() {
    console.log("DEBUG: Loading AI Insights...");
    try {
        const response = await fetch('/api/ai-insights');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("DEBUG: AI Data received:", data);
        
        if (data.error) {
            console.error("AI API Error:", data.error);
            return;
        }

        // 1. Update Gauge
        const confidence = data.confidence || 0;
        const trend = data.trend || 'HOLD';
        const gaugePath = document.getElementById('ai-gauge-path');
        const confidenceEl = document.getElementById('ai-confidence');
        const trendEl = document.getElementById('ai-trend');

        if (gaugePath) {
            // Full dash is 125.6
            const offset = 125.6 * (1 - (confidence / 100));
            gaugePath.style.strokeDashoffset = offset;
            gaugePath.style.stroke = trend === 'BUY' ? '#22c55e' : trend === 'SELL' ? '#ef4444' : '#f59e0b';
        }
        if (confidenceEl) confidenceEl.textContent = `${confidence}%`;
        if (trendEl) trendEl.textContent = trend;

        // 2. Update Meta
        const trendText = document.getElementById('ai-trend-text');
        if (trendText) {
            trendText.textContent = trend;
            trendText.className = trend === 'BUY' ? 'pnl-up' : trend === 'SELL' ? 'pnl-down' : '';
        }
        const volText = document.getElementById('ai-vol-text');
        if (volText) volText.textContent = data.volatility_forecast || '--%';
        
        const whaleText = document.getElementById('ai-whale-text');
        if (whaleText) whaleText.textContent = data.whale_activity || 'Stable';

        // 3. Update Indicator Breakdown
        if (data.indicators) {
            const maEl = document.getElementById('ind-ma');
            const volEl = document.getElementById('ind-vol');
            const momEl = document.getElementById('ind-mom');

            if (maEl) {
                maEl.textContent = data.indicators["MA Cross"];
                maEl.className = data.indicators["MA Cross"] === 'BULLISH' ? 'pnl-up' : 'pnl-down';
            }
            if (volEl) {
                volEl.textContent = data.indicators["Volatility"];
                volEl.className = data.indicators["Volatility"] === 'STABLE' ? 'pnl-up' : 'pnl-down';
            }
            if (momEl) {
                momEl.textContent = data.indicators["Momentum"];
                momEl.className = data.indicators["Momentum"] === 'POSITIVE' ? 'pnl-up' : 'pnl-down';
            }
        }

        // 4. Update Range
        if (data.predicted_range) {
            const lowEl = document.getElementById('range-low');
            const highEl = document.getElementById('range-high');
            if (lowEl) lowEl.textContent = `$${data.predicted_range.low.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
            if (highEl) highEl.textContent = `$${data.predicted_range.high.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
            
            // Adjust progress bar position (mock logic for visual)
            const progress = document.getElementById('range-progress-bar');
            if (progress) {
                progress.style.left = '10%';
                progress.style.right = '10%';
            }
        }

        // 5. Update Success Rate
        if (data.accuracy_48h !== undefined) {
            const successRateEl = document.getElementById('ai-success-rate');
            const successPathEl = document.getElementById('ai-success-path');
            if (successRateEl) successRateEl.textContent = `${data.accuracy_48h}%`;
            if (successPathEl) {
                successPathEl.setAttribute('stroke-dasharray', `${data.accuracy_48h}, 100`);
            }
        }

        // 6. Update AI Intelligence Dashboard
        if (data.layers && data.layers.ai_sentiment) {
            console.log("DEBUG: Updating AI Intelligence Dashboard", data.layers.ai_sentiment);
            const ai = data.layers.ai_sentiment;
            const thesisEl = document.getElementById('ai-thesis');
            const riskEl = document.getElementById('ai-risk-level');
            const contextEl = document.getElementById('ai-context');

            if (thesisEl) thesisEl.textContent = ai.trade_thesis || ai.reasoning || "Analysis complete.";
            if (riskEl) {
                const riskVal = ai.risk_level || 'MEDIUM';
                riskEl.textContent = riskVal;
                
                // Dynamic styling for risk
                const riskColors = { 'LOW': '#22c55e', 'MEDIUM': '#f59e0b', 'HIGH': '#ef4444', 'CRITICAL': '#7f1d1d' };
                riskEl.style.background = riskColors[riskVal] || '#f59e0b';
                riskEl.style.color = 'white';
                riskEl.style.padding = '2px 8px';
                riskEl.style.borderRadius = '4px';
                riskEl.style.fontWeight = 'bold';
            }
            if (contextEl) contextEl.textContent = ai.market_context || 'Stable';
        }
    } catch (e) {
        console.error("Error loading AI insights:", e);
    }
}

async function runBacktest() {
    const loader = document.getElementById('loader');
    const strategyName = document.getElementById('strategy-select').value;
    if (!strategyName) return alert('Please select a strategy');

    const params = {
        strategy_name: strategyName,
        initial_capital: parseFloat(document.getElementById('bt-capital').value),
        start_date: document.getElementById('bt-start').value,
        end_date: document.getElementById('bt-end').value,
        resolution: currentResolution
    };

    loader.classList.remove('hidden');
    try {
        const res = await fetch('/api/backtest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const report = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = report.detail || report.error || report.message || `HTTP ${res.status}`;
            const detailStr = typeof msg === 'string' ? msg : (Array.isArray(msg) ? msg.map(m => m.msg || JSON.stringify(m)).join('; ') : JSON.stringify(msg));
            throw new Error(detailStr || 'Request failed');
        }
        if (report.error) throw new Error(report.error);

        lastBacktestReport = report;

        try {
            displayReport(report);
        } catch (e) {
            console.error('displayReport failed', e);
            throw new Error(e.message || 'Failed to update performance summary');
        }

        try {
            const analyticsView = document.getElementById('view-analytics');
            if (analyticsView && !analyticsView.classList.contains('hidden')) {
                renderDetailedReport(report);
                resizeAnalyticsCharts();
            }
        } catch (e) {
            console.error('Analytics render failed (backtest data is still saved in memory)', e);
        }

        const saveBtn = document.getElementById('save-report-btn');
        if (saveBtn) saveBtn.classList.remove('hidden');
    } catch (err) {
        alert('Backtest Failed: ' + err.message);
    } finally {
        loader.classList.add('hidden');
    }
}

function fmtPrice(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x.toFixed(2) : '--';
}

function fmtPnl(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x.toFixed(2) : '--';
}

/** Ensure Chart.js line/bar charts get equal-length labels + finite numeric (or null) points. */
function sanitizeChartJsCartesianData(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const labels = Array.isArray(raw.labels) ? raw.labels.map(l => (l == null ? '' : String(l))) : [];
    if (!labels.length) return null;
    const datasets = (raw.datasets || []).map(ds => {
        const dataIn = Array.isArray(ds.data) ? ds.data : [];
        const data = labels.map((_, i) => {
            const v = dataIn[i];
            if (v === null || v === undefined || v === '') return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
        });
        return { ...ds, data };
    });
    return { ...raw, labels, datasets };
}

/** Normalize API report (legacy flat fields vs current metrics/performance). */
function getBacktestSummary(report) {
    if (!report || typeof report !== 'object') {
        return { netPnl: 0, winRate: '--', totalTrades: 0, maxDrawdown: '--' };
    }
    const perf = report.performance || {};
    const m = report.metrics || {};
    const netPnl = perf.net_pnl != null ? Number(perf.net_pnl) : (m.net_profit != null ? Number(m.net_profit) : Number(report.net_pnl));
    const winRate = m.win_rate != null ? m.win_rate
        : (perf.win_rate != null ? `${Number(perf.win_rate).toFixed(2)}%` : (report.win_rate != null ? String(report.win_rate) : '--'));
    const totalTrades = perf.total_trades != null ? perf.total_trades
        : (m.total_trades != null ? m.total_trades : (report.total_trades != null ? report.total_trades : 0));
    const maxDd = m.max_drawdown != null ? m.max_drawdown
        : (perf.max_drawdown != null ? `${Number(perf.max_drawdown).toFixed(2)}%` : (report.max_drawdown != null ? String(report.max_drawdown) : '--'));
    return {
        netPnl: Number.isFinite(netPnl) ? netPnl : 0,
        winRate,
        totalTrades,
        maxDrawdown: maxDd
    };
}

function displayReport(report) {
    if (!report || typeof report !== 'object') {
        console.error('displayReport: invalid report', report);
        return;
    }
    const s = getBacktestSummary(report);
    const net = Number.isFinite(Number(s.netPnl)) ? Number(s.netPnl) : 0;

    const pnlEl = document.getElementById('stat-pnl');
    if (pnlEl) {
        pnlEl.textContent = net.toFixed(2);
        pnlEl.className = net >= 0 ? 'pnl-up' : 'pnl-down';
    }
    const wrEl = document.getElementById('stat-winrate');
    if (wrEl) wrEl.textContent = s.winRate ?? '--';
    const trEl = document.getElementById('stat-trades');
    if (trEl) trEl.textContent = s.totalTrades ?? '--';
    const ddEl = document.getElementById('stat-drawdown');
    if (ddEl) ddEl.textContent = s.maxDrawdown ?? '--';

    const tbody = document.querySelector('#trade-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (report.trades) {
        report.trades.forEach(t => {
            const row = document.createElement('tr');
            const pnl = Number(t.pnl);
            const pnlNum = Number.isFinite(pnl) ? pnl : 0;
            row.innerHTML = `
                <td>${t.type}</td>
                <td>${fmtPrice(t.entry_price)}</td>
                <td>${t.exit_price != null && t.exit_price !== '' ? fmtPrice(t.exit_price) : '--'}</td>
                <td class="${pnlNum >= 0 ? 'pnl-up' : 'pnl-down'}">${fmtPnl(t.pnl)}</td>
                <td>${new Date(t.entry_time).toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata'})}</td>
                <td>${new Date(t.entry_time).toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata', hour12: false})}</td>
                <td>${t.exit_time ? new Date(t.exit_time).toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata', hour12: false}) : '--'}</td>
            `;
            tbody.prepend(row);
        });
    }
}

async function saveCurrentReport() {
    if (!lastBacktestReport) return;
    
    try {
        const res = await fetch('/api/reports/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_data: lastBacktestReport })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert('Report saved successfully!');
            document.getElementById('save-report-btn').classList.add('hidden');
        }
    } catch (err) {
        alert('Failed to save report');
    }
}

async function handleWalletAction(action) {
    const amount = parseFloat(document.getElementById('wallet-amount').value);
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    
    const reason = document.getElementById('wallet-note').value || (action === 'deposit' ? 'Manual Deposit' : 'Manual Withdrawal');
    
    try {
        const res = await fetch(`/api/wallet/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, reason })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        alert(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);
        document.getElementById('wallet-amount').value = '';
        document.getElementById('wallet-note').value = '';
        loadWallet();
        loadWalletHistory();
    } catch (err) {
        alert('Transaction Failed: ' + err.message);
    }
}

async function resetWallet() {
    if (!confirm("Are you sure you want to RESET the wallet? This will delete all history and set balance to 0.")) return;
    
    try {
        const res = await fetch('/api/wallet/reset', { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success') {
            alert('Wallet reset successfully!');
            loadWallet();
            loadWalletHistory();
        } else {
            throw new Error(data.error || 'Reset failed');
        }
    } catch (err) {
        alert('Failed to reset wallet: ' + err.message);
    }
}

async function toggleLive(active) {
    const strategyName = document.getElementById('strategy-select').value;
    if (active && !strategyName) return alert('Please select a strategy');

    if (active) {
        try {
            const res = await fetch('/api/live/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    strategy_name: strategyName,
                    lot_size: parseFloat(document.getElementById('live-size').value)
                })
            });
            if (!res.ok) throw new Error('API refused to start');
            
            isLive = true;
            tradeMarkers = [];
            document.querySelector('#trade-table tbody').innerHTML = '';
        } catch (err) {
            return alert('Failed to start live test: ' + err.message);
        }
    } else {
        await fetch('/api/live/stop', { method: 'POST' });
        isLive = false;
        alert('Live Test Session Ended.');
        fetchInitialData(); 
    }

    document.getElementById('start-live').classList.toggle('hidden', active);
    document.getElementById('stop-live').classList.toggle('hidden', !active);
    document.getElementById('live-pulse').classList.toggle('hidden', !active);
    document.getElementById('live-status-dot').style.background = active ? '#ef4444' : '#22c55e';
    document.getElementById('live-status-dot').style.boxShadow = active ? '0 0 5px #ef4444' : '0 0 5px #22c55e';
    document.getElementById('live-status-text').textContent = active ? `Live: ${strategyName}` : 'System Ready';
}

async function fetchInitialData() {
    try {
        const res = await fetch(`/api/history?symbol=BTCUSD&resolution=${currentResolution}`);
        const rawData = await res.json();
        
        const cleanData = rawData.filter(d => 
            d.time && isFinite(d.time) &&
            isFinite(d.open) && isFinite(d.high) && 
            isFinite(d.low) && isFinite(d.close)
        ).sort((a, b) => a.time - b.time);

        if (cleanData.length > 0) {
            candleSeries.setData(cleanData);
            chart.timeScale().fitContent();
        }
    } catch (err) {
        console.error("Error fetching initial data:", err);
    }
}


function renderActiveTrades(trades) {
    const container = document.getElementById('active-trades-container');
    const countEl = document.getElementById('active-trades-count');
    
    if (!container) return;
    
    countEl.textContent = `${trades.length} Open`;
    
    if (trades.length === 0) {
        container.innerHTML = '<div class="no-trades">No active trades</div>';
        return;
    }
    
    container.innerHTML = trades.map(t => {
        const u = Number(t.unrealized_pnl);
        const uTxt = Number.isFinite(u) ? `${u >= 0 ? '+' : ''}${u.toFixed(2)}` : '--';
        const uCls = Number.isFinite(u) ? (u >= 0 ? 'pnl-up' : 'pnl-down') : '';
        return `
        <div class="trade-card">
            <div class="trade-main">
                <div class="trade-header">
                    <span class="side-badge side-${(t.type || '').toLowerCase()}">${t.type}</span>
                    <strong>${t.symbol}</strong>
                    <small>${t.trade_type}</small>
                </div>
                <div class="trade-details">
                    <span>Entry: ${fmtPrice(t.entry_price)}</span>
                    <span>Size: ${t.size != null ? t.size : '--'}</span>
                </div>
                ${t.stop_loss || t.take_profit ? `
                    <div class="trade-details">
                        ${t.stop_loss ? `<span>SL: ${t.stop_loss}</span>` : ''}
                        ${t.take_profit ? `<span>TP: ${t.take_profit}</span>` : ''}
                    </div>
                ` : ''}
            </div>
            <div class="pnl-container">
                <div class="live-pnl ${uCls}">${uTxt}</div>
            </div>
        </div>`;
    }).join('');
}

async function loadTradeHistory() {
    try {
        const res = await fetch('/api/trade/history');
        const trades = await res.json();
        
        const tbody = document.querySelector('#trade-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        trades.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.type}</td>
                <td>${fmtPrice(t.entry_price)}</td>
                <td>${t.exit_price != null && t.exit_price !== '' ? fmtPrice(t.exit_price) : '--'}</td>
                <td class="${(Number.isFinite(Number(t.pnl)) ? Number(t.pnl) : 0) >= 0 ? 'pnl-up' : 'pnl-down'}">${fmtPnl(t.pnl)}</td>
                <td>${new Date(t.entry_time).toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata'})}</td>
                <td>${new Date(t.entry_time).toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata', hour12: false})}</td>
                <td>${t.exit_time ? new Date(t.exit_time).toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata', hour12: false}) : '--'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading trade history:", err);
    }
}

function updateInsightsTicker(msg) {
    try {
        const data = msg.data;
        if (!data) return;
        
        const lastPrice = parseFloat(data.mark_price || data.close || 0);
        if (!lastPrice || lastPrice <= 0) return;

        const priceEl = document.getElementById('insights-live-price');
        if (priceEl) priceEl.textContent = `$${lastPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

        const changeEl = document.getElementById('insights-live-change');
        if (changeEl && data.mark_change_24h !== undefined && data.mark_change_24h !== null) {
            const changePct = Number(data.mark_change_24h);
            if (Number.isFinite(changePct)) {
                const openPrice = Number(data.open || lastPrice);
                const changeAbs = lastPrice - (Number.isFinite(openPrice) ? openPrice : lastPrice);
                const sign = changePct >= 0 ? '+' : '';

                changeEl.textContent = `${sign}${changePct.toFixed(2)}% (${sign}$${Math.abs(changeAbs).toLocaleString(undefined, {minimumFractionDigits: 2})})`;
                changeEl.className = `change-val ${changePct >= 0 ? 'pnl-up' : 'pnl-down'}`;
            }
        }

        // Update insights chart if it exists and is visible
        if (insightsSeries && typeof insightsSeries.options === 'function') {
            const options = insightsSeries.options();
            if (options && options.visible) {
                const resolutionSeconds = 3600; 
                const candleTime = Math.floor(Date.now() / 1000 / resolutionSeconds) * resolutionSeconds;
                insightsSeries.update({
                    time: candleTime, open: lastPrice, high: lastPrice, low: lastPrice, close: lastPrice
                });
            }
        }
        
        if (insightsLineSeries && typeof insightsLineSeries.options === 'function') {
            const options = insightsLineSeries.options();
            if (options && options.visible) {
                const candleTime = Math.floor(Date.now() / 1000);
                insightsLineSeries.update({ time: candleTime, value: lastPrice });
            }
        }
    } catch (err) {
        // Silently catch to prevent WebSocket thread crash
        console.error("Error in updateInsightsTicker:", err);
    }
}

function initInsightsChart() {
    const container = document.getElementById('insights-chart');
    if (!container) return;

    const chartOptions = {
        width: container.clientWidth,
        height: container.clientHeight || 400,
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
        localization: { locale: 'en-IN' }
    };

    insightsChart = LightweightCharts.createChart(container, chartOptions);
    
    insightsSeries = insightsChart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });

    insightsLineSeries = insightsChart.addLineSeries({
        color: '#3b82f6', lineWidth: 3, visible: false
    });

    maSeries = insightsChart.addLineSeries({
        color: '#eab308', lineWidth: 1, title: 'MA(20)', visible: false
    });

    const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !entries[0].contentRect) return;
        const { width, height } = entries[0].contentRect;
        insightsChart.applyOptions({ width, height });
    });
    resizeObserver.observe(container);
}

async function fetchInsightsHistory() {
    try {
        const res = await fetch(`/api/history?symbol=BTCUSD&resolution=1h`);
        const data = await res.json();
        if (data.length > 0) {
            insightsSeries.setData(data);
            insightsLineSeries.setData(data.map(d => ({ time: d.time, value: d.close })));
            
            // Calculate MA(20)
            const maData = [];
            for (let i = 20; i < data.length; i++) {
                const slice = data.slice(i - 20, i);
                const sum = slice.reduce((a, b) => a + b.close, 0);
                maData.push({ time: data[i].time, value: sum / 20 });
            }
            maSeries.setData(maData);
            
            insightsChart.timeScale().fitContent();
        }
    } catch (err) {
        console.error("Error fetching insights history:", err);
    }
}

async function loadInsights() {
    try {
        const res = await fetch('/api/insights');
        const data = await res.json();
        
        // Update F&G
        document.getElementById('fng-value').textContent = data.fng.value;
        document.getElementById('fng-label').textContent = data.fng.label;
        document.getElementById('fng-gauge-fill').style.width = `${data.fng.value}%`;
        
        // Update ROI
        for (const [label, roi] of Object.entries(data.roi)) {
            const id = `roi-${label.toLowerCase().replace(' ', '-')}`;
            const el = document.getElementById(id);
            if (el) {
                const valEl = el.querySelector('.roi-val');
                valEl.textContent = `${roi.return_pct >= 0 ? '+' : ''}${roi.return_pct}%`;
                valEl.className = `roi-val ${roi.return_pct >= 0 ? 'pnl-up' : 'pnl-down'}`;
                el.querySelector('.roi-price').textContent = `${roi.start_date} @ $${roi.start_price.toLocaleString()}`;
            }
        }

        // Update Whale Alerts
        const whaleContainer = document.getElementById('whale-alerts-container');
        whaleContainer.innerHTML = data.whale_alerts.map(a => `
            <div class="whale-item impact-${a.impact.toLowerCase()}">
                <div class="whale-msg">${a.message}</div>
                <div class="whale-meta">Impact: ${a.impact} • ${a.time}</div>
            </div>
        `).join('');

        // Update Halving
        document.getElementById('halving-days').textContent = data.halving.days;
        document.getElementById('halving-hours').textContent = data.halving.hours;
        document.getElementById('halving-date-text').textContent = data.halving.date;

    } catch (err) {
        console.error("Error loading insights:", err);
    }
}

function toggleInsightsChartType(type) {
    if (type === 'candle') {
        insightsSeries.applyOptions({ visible: true });
        insightsLineSeries.applyOptions({ visible: false });
    } else {
        insightsSeries.applyOptions({ visible: false });
        insightsLineSeries.applyOptions({ visible: true });
    }
}

function calculatePL() {
    const amount = parseFloat(document.getElementById('calc-amount').value);
    const buyPrice = parseFloat(document.getElementById('calc-price').value);
    const currentPrice = parseFloat(document.getElementById('insights-live-price').textContent.replace('$', '').replace(/,/g, ''));

    if (!amount || !buyPrice || !currentPrice) return alert('Please enter valid numbers');

    const units = amount / buyPrice;
    const currentVal = units * currentPrice;
    const pnl = currentVal - amount;
    const roi = (pnl / amount) * 100;

    document.getElementById('calc-results').classList.remove('hidden');
    document.getElementById('calc-current-val').textContent = `$${currentVal.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    document.getElementById('calc-net-pnl').textContent = `$${pnl.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    document.getElementById('calc-net-pnl').className = pnl >= 0 ? 'pnl-up' : 'pnl-down';
    document.getElementById('calc-roi').textContent = `${roi >= 0 ? '+' : ''}${Number.isFinite(roi) ? roi.toFixed(2) : '--'}%`;
    document.getElementById('calc-roi').className = roi >= 0 ? 'pnl-up' : 'pnl-down';
}

function updateChartMarkers(activeTrades) {
    if (!candleSeries) return;
    
    // Clear old price lines
    activePriceLines.forEach(line => candleSeries.removePriceLine(line));
    activePriceLines = [];

    const resMap = {"5m": 300, "15m": 900, "1h": 3600};
    const resolutionSeconds = resMap[currentResolution] || 3600;

    // Convert active trades to markers
    const newMarkers = [];
    activeTrades.forEach(t => {
        const entryPx = Number(t.entry_price);
        if (!Number.isFinite(entryPx) || entryPx <= 0) return;

        const exactEntryTime = Math.floor(new Date(t.entry_time).getTime() / 1000);
        if (!Number.isFinite(exactEntryTime)) return;

        const candleAlignedTime = Math.floor(exactEntryTime / resolutionSeconds) * resolutionSeconds;

        const priceLine = candleSeries.createPriceLine({
            price: entryPx,
            color: t.type === 'BUY' ? '#22c55e' : '#ef4444',
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${t.type} @ ${entryPx.toFixed(2)}`,
        });
        activePriceLines.push(priceLine);

        newMarkers.push({
            time: candleAlignedTime,
            position: t.type === 'BUY' ? 'belowBar' : 'aboveBar',
            color: t.type === 'BUY' ? '#22c55e' : '#ef4444',
            shape: t.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `${t.type} Entry`
        });
    });

    candleSeries.setMarkers(newMarkers);
}

function resizeAnalyticsCharts() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            Object.values(analyticsCharts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    try {
                        chart.resize();
                    } catch (e) {
                        console.warn('Chart resize skipped', e);
                    }
                }
            });
        });
    });
}

const _chartAxisLight = {
    ticks: { color: '#94a3b8' },
    grid: { color: 'rgba(255,255,255,0.06)' },
    border: { color: 'rgba(255,255,255,0.1)' }
};

/**
 * Institutional Reporting Engine - Frontend Data Binding
 */
function renderDetailedReport(report) {
    if (!report || typeof report !== 'object') {
        console.warn('renderDetailedReport: no report');
        return;
    }
    console.log("DEBUG: Rendering Institutional Report", report);

    const perf = report.performance || {};
    const m = report.metrics || {};
    const netProfitRaw = Number(m.net_profit ?? perf.net_pnl ?? 0);
    const netProfit = Number.isFinite(netProfitRaw) ? netProfitRaw : 0;

    const netProfitEl = document.getElementById('adv-net-profit');
    if (netProfitEl) {
        netProfitEl.textContent = `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        netProfitEl.className = `value ${netProfit >= 0 ? 'pnl-up' : 'pnl-down'}`;
    }

    const returnPctEl = document.getElementById('adv-return-pct');
    if (returnPctEl) returnPctEl.textContent = m.return_pct ?? '--';

    const winRateEl = document.getElementById('adv-win-rate');
    if (winRateEl) winRateEl.textContent = m.win_rate ?? '--';

    const tradesEl = document.getElementById('adv-trades');
    if (tradesEl) tradesEl.textContent = `${m.total_trades ?? 0} Trades`;

    const pfEl = document.getElementById('adv-profit-factor');
    if (pfEl) pfEl.textContent = m.profit_factor ?? '--';

    const sharpeEl = document.getElementById('adv-sharpe');
    if (sharpeEl) sharpeEl.textContent = m.sharpe_ratio ?? '--';

    const riskFields = {
        'adv-max-dd': m.max_drawdown,
        'adv-avg-dd': m.avg_drawdown,
        'adv-recovery': m.recovery_factor,
        'adv-sortino': m.sortino_ratio,
        'adv-calmar': m.calmar_ratio
    };
    Object.entries(riskFields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val != null ? String(val) : '--';
    });

    const exp = m.expectancy;
    const efficiencyFields = {
        'adv-expectancy': exp != null && Number.isFinite(Number(exp)) ? Number(exp).toFixed(2) : '--',
        'adv-duration': m.avg_trade_duration,
        'adv-c-wins': m.consecutive_wins,
        'adv-c-losses': m.consecutive_losses,
        'adv-cagr': m.cagr
    };
    Object.entries(efficiencyFields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val != null ? String(val) : '--';
    });

    const gp = m.gross_profit;
    const gl = m.gross_loss;
    const profitFields = {
        'adv-gross-profit': gp != null ? `$${Number(gp).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--',
        'adv-gross-loss': gl != null ? `$${Number(gl).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--',
        'adv-max-win': m.largest_win != null ? `$${Number(m.largest_win).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--',
        'adv-max-loss': m.largest_loss != null ? `$${Number(m.largest_loss).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--',
        'adv-avg-profit': `$${Number(m.avg_profit_per_trade ?? 0).toFixed(2)}`
    };
    Object.entries(profitFields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    try {
        renderAnalyticsCharts(report);
    } catch (e) {
        console.error('Analytics charts failed', e);
    }
    try {
        renderDetailedJournal(report.trades || []);
    } catch (e) {
        console.error('Trade journal render failed', e);
    }

    const aiAccuracyBadge = document.getElementById('ai-accuracy-badge');
    if (!aiAccuracyBadge) return;

    const ai = report.ai_stats;
    if (ai && ai.accuracy_by_confidence && typeof ai.accuracy_by_confidence === 'object') {
        const buckets = ai.accuracy_by_confidence;
        const keys = Object.keys(buckets);
        const bestKey = keys[keys.length - 1];
        const accuracy = buckets[bestKey];
        if (accuracy !== undefined && Number.isFinite(Number(accuracy))) {
            aiAccuracyBadge.textContent = `${(Number(accuracy) * 100).toFixed(0)}% Accuracy`;
            return;
        }
    }
    if (ai && ai.status) {
        aiAccuracyBadge.textContent = String(ai.status);
    } else {
        aiAccuracyBadge.textContent = 'No AI trade metadata';
    }
}

function renderAnalyticsCharts(report) {
    const c = report.charts || {};

    Object.values(analyticsCharts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') chart.destroy();
    });
    analyticsCharts = {};

    const legendLight = { labels: { color: '#cbd5e1', boxWidth: 10 } };

    const tryChart = (key, fn) => {
        try {
            fn();
        } catch (e) {
            console.warn(`Analytics chart "${key}" failed`, e);
        }
    };

    tryChart('pnlDist', () => {
        const pnlDistCtx = document.getElementById('chart-pnl-dist');
        const clean = sanitizeChartJsCartesianData(c.pnl_dist);
        if (!pnlDistCtx || !clean || !clean.datasets || !clean.datasets.length) return;

        const fullLabels = clean.labels.map(l => String(l));
        const shortLabels = fullLabels.map((lab, i) => (lab.length > 16 ? `Bin ${i + 1}` : lab));

        const barDs = {
            ...clean.datasets[0],
            label: clean.datasets[0].label || 'Frequency',
            borderWidth: 1,
            borderColor: 'rgba(15, 23, 42, 0.75)',
            borderRadius: 4,
            borderSkipped: false,
        };

        analyticsCharts.pnlDist = new Chart(pnlDistCtx, {
            type: 'bar',
            data: { labels: shortLabels, datasets: [barDs] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title(items) {
                                const i = items[0].dataIndex;
                                return fullLabels[i] != null ? fullLabels[i] : items[0].label;
                            },
                            label(ctx) {
                                const v = ctx.raw;
                                return ` Count: ${v == null ? '0' : v}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        ..._chartAxisLight,
                        ticks: {
                            ..._chartAxisLight.ticks,
                            autoSkip: true,
                            maxRotation: 50,
                            minRotation: 0,
                            maxTicksLimit: 14,
                            font: { size: 10 },
                        },
                    },
                    y: {
                        ..._chartAxisLight,
                        beginAtZero: true,
                        ticks: {
                            ..._chartAxisLight.ticks,
                            precision: 0,
                            callback(v) {
                                return Number.isFinite(Number(v)) ? String(v) : '';
                            },
                        },
                    },
                },
                layout: { padding: { top: 6, right: 6, bottom: 4, left: 4 } },
            },
        });
    });

    tryChart('exits', () => {
        const exitsCtx = document.getElementById('chart-exits');
        if (!exitsCtx || !report.exits || !report.exits.exit_reason_counts) return;
        const exitData = report.exits.exit_reason_counts;
        const labels = Object.keys(exitData).map(k => {
            const s = String(k);
            return s.length > 28 ? `${s.slice(0, 26)}…` : s;
        });
        const keys = Object.keys(exitData);
        const vals = keys.map(k => {
            const n = Number(exitData[k]);
            return Number.isFinite(n) ? n : 0;
        });
        const sum = vals.reduce((a, b) => a + b, 0);
        if (sum <= 0) return;

        const palette = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7'];
        const colors = keys.map((_, i) => palette[i % palette.length]);

        analyticsCharts.exits = new Chart(exitsCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: vals,
                    backgroundColor: colors,
                    borderColor: 'rgba(15, 23, 42, 0.85)',
                    borderWidth: 2,
                    hoverOffset: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '52%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'center',
                        labels: {
                            ...legendLight.labels,
                            font: { size: 11 },
                            padding: 10,
                            usePointStyle: true,
                            pointStyle: 'circle',
                        },
                    },
                    tooltip: {
                        callbacks: {
                            title(items) {
                                return keys[items[0].dataIndex] || items[0].label;
                            },
                            label(ctx) {
                                const n = ctx.raw;
                                const pct = sum ? ((n / sum) * 100).toFixed(1) : '0';
                                return ` ${n} (${pct}%)`;
                            },
                        },
                    },
                },
                layout: { padding: { top: 4, right: 8, bottom: 4, left: 8 } },
            },
        });
    });

    tryChart('equity', () => {
        const equityCtx = document.getElementById('chart-equity-main');
        const clean = sanitizeChartJsCartesianData(c.equity_curve);
        if (!equityCtx || !clean) return;
        analyticsCharts.equity = new Chart(equityCtx, {
            type: 'line',
            data: clean,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', ...legendLight } },
                scales: {
                    x: { ..._chartAxisLight, ticks: { ..._chartAxisLight.ticks, maxTicksLimit: 12 } },
                    y: { ..._chartAxisLight }
                }
            }
        });
    });

    tryChart('monthly', () => {
        const monthlyCtx = document.getElementById('chart-monthly');
        const clean = sanitizeChartJsCartesianData(c.monthly_pnl);
        if (!monthlyCtx || !clean) return;
        analyticsCharts.monthly = new Chart(monthlyCtx, {
            type: 'bar',
            data: clean,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ..._chartAxisLight, ticks: { ..._chartAxisLight.ticks, maxRotation: 35 } },
                    y: { ..._chartAxisLight }
                }
            }
        });
    });

    tryChart('drawdown', () => {
        const ddCtx = document.getElementById('chart-drawdown-area');
        if (!ddCtx || !c.drawdown) return;
        const ddRaw = {
            labels: c.drawdown.labels,
            datasets: (c.drawdown.datasets || []).map(ds => ({ ...ds, fill: true }))
        };
        const clean = sanitizeChartJsCartesianData(ddRaw);
        if (!clean) return;
        analyticsCharts.drawdown = new Chart(ddCtx, {
            type: 'line',
            data: clean,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', ...legendLight } },
                scales: {
                    x: { ..._chartAxisLight, ticks: { ..._chartAxisLight.ticks, maxTicksLimit: 12 } },
                    y: { ..._chartAxisLight, reverse: true }
                }
            }
        });
    });

    const ai = report.ai_stats;
    tryChart('aiBuckets', () => {
        const ctx = document.getElementById('chart-ai-buckets');
        if (!ctx || !ai || !ai.accuracy_by_confidence) return;
        const labels = Object.keys(ai.accuracy_by_confidence);
        if (!labels.length) return;
        const vals = Object.values(ai.accuracy_by_confidence).map(v =>
            (typeof v === 'number' && Number.isFinite(v) ? v * 100 : 0));
        analyticsCharts.aiBuckets = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{ label: 'Accuracy %', data: vals, backgroundColor: '#3b82f6' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ..._chartAxisLight, ticks: { ..._chartAxisLight.ticks, maxRotation: 35 } },
                    y: { ..._chartAxisLight, max: 100, beginAtZero: true }
                }
            }
        });
    });

    tryChart('aiDist', () => {
        const ctx = document.getElementById('chart-ai-dist');
        if (!ctx || !ai || !ai.prediction_distribution) return;
        const dist = ai.prediction_distribution;
        const dlabels = Object.keys(dist);
        if (!dlabels.length) return;
        analyticsCharts.aiDist = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: dlabels,
                datasets: [{ data: Object.values(dist), backgroundColor: ['#22c55e', '#ef4444', '#eab308', '#3b82f6'] }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', ...legendLight } }
            }
        });
    });
}

function renderDetailedJournal(trades) {
    const tbody = document.querySelector('#advanced-journal-table tbody');
    if (!tbody) return;

    tbody.innerHTML = trades.map((t, i) => {
        const pnlVal = Number(t.pnl);
        const pnlNum = Number.isFinite(pnlVal) ? pnlVal : 0;
        const dur = Number(t.duration);
        const hours = Number.isFinite(dur) ? dur / 3600 : 0;
        return `
        <tr>
            <td>#${i + 1}</td>
            <td class="${t.type === 'BUY' ? 'pnl-up' : 'pnl-down'}">${t.type}</td>
            <td>${fmtPrice(t.entry_price)}</td>
            <td>${t.exit_price != null && t.exit_price !== '' ? fmtPrice(t.exit_price) : '--'}</td>
            <td>${t.size != null ? t.size : '--'}</td>
            <td class="${pnlNum >= 0 ? 'pnl-up' : 'pnl-down'}">${fmtPnl(t.pnl)}</td>
            <td>${hours.toFixed(1)}h</td>
            <td>${t.reason || 'Signal'}</td>
            <td>${t.ai_metadata && t.ai_metadata.confidence != null ? t.ai_metadata.confidence + '%' : '--'}</td>
        </tr>`;
    }).join('');
}

async function exportActiveReport(format) {
    if (!lastBacktestReport) return;
    
    const reportId = lastBacktestReport.id;
    if (!reportId) {
        alert("Please SAVE the report first to enable professional exports.");
        return;
    }

    window.location.href = `/api/reports/${reportId}/export/${format}`;
}
