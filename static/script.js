let chart, candleSeries;
let insightsChart, insightsSeries, insightsLineSeries, maSeries;
let ws;
let isLive = false;
let currentResolution = "1h";
let tradeMarkers = [];
let lastBacktestReport = null;
let activePriceLines = [];
let insightsInitialLoad = false;

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
        document.getElementById('wallet-balance').textContent = data.balance.toFixed(2);
        
        const pageBalance = document.getElementById('wallet-page-balance');
        if (pageBalance) pageBalance.textContent = data.balance.toFixed(2);
        
        const availBalance = document.getElementById('wallet-available-balance');
        if (availBalance) availBalance.textContent = data.available_balance.toFixed(2);
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
                    <td>${t.amount.toFixed(2)}</td>
                    <td>${t.balance_after.toFixed(2)}</td>
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
                row.innerHTML = `
                    <td>${r.created_at}</td>
                    <td>${r.strategy_name}</td>
                    <td class="${r.net_pnl >= 0 ? 'pnl-up' : 'pnl-down'}">${r.net_pnl.toFixed(2)}</td>
                    <td>${r.win_rate}%</td>
                    <td>${r.total_trades}</td>
                    <td>${r.max_drawdown || '--'}</td>
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
        displayReport(report);
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
    if (changeEl && data.mark_change_24h !== undefined) {
        const changePct = parseFloat(data.mark_change_24h);
        const sign = changePct >= 0 ? '+' : '';
        changeEl.textContent = `${sign}${changePct.toFixed(2)}%`;
        changeEl.className = `change ${changePct >= 0 ? 'pnl-up' : 'pnl-down'}`;
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
            <td>${trade.price ? trade.price.toFixed(2) : '--'}</td>
            <td>${trade.exit_price ? trade.exit_price.toFixed(2) : '--'}</td>
            <td class="${pnl >= 0 ? 'pnl-up' : 'pnl-down'}">${pnl.toFixed(2)}</td>
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
            document.getElementById('manual-params').classList.add('hidden');
            
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

    // Live Test
    document.getElementById('start-live').addEventListener('click', () => toggleLive(true));
    document.getElementById('stop-live').addEventListener('click', () => toggleLive(false));

    // Manual Trade
    document.getElementById('manual-buy').addEventListener('click', () => openManualTrade('BUY'));
    document.getElementById('manual-sell').addEventListener('click', () => openManualTrade('SELL'));
    
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

    // Initial trades load
    loadTradeHistory();
}

function switchView(view) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${view}`).classList.add('active');

    const dashboard = document.querySelector('.dashboard-grid');
    const walletView = document.getElementById('view-wallet');
    const reportsView = document.getElementById('view-reports');
    const insightsView = document.getElementById('view-insights');

    dashboard.classList.add('hidden');
    walletView.classList.add('hidden');
    reportsView.classList.add('hidden');
    insightsView.classList.add('hidden');

    if (view === 'dashboard') {
        dashboard.classList.remove('hidden');
    } else if (view === 'wallet') {
        walletView.classList.remove('hidden');
        loadWalletHistory();
    } else if (view === 'reports') {
        reportsView.classList.remove('hidden');
        loadReports();
        loadTradeHistory();
    } else if (view === 'insights') {
        insightsView.classList.remove('hidden');
        loadInsights();
        if (!insightsInitialLoad) {
            fetchInsightsHistory();
            insightsInitialLoad = true;
        }
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
        const report = await res.json();
        if (report.error) throw new Error(report.error);
        
        lastBacktestReport = report;
        displayReport(report);
        document.getElementById('save-report-btn').classList.remove('hidden');
    } catch (err) {
        alert('Backtest Failed: ' + err.message);
    } finally {
        loader.classList.add('hidden');
    }
}

function displayReport(report) {
    document.getElementById('stat-pnl').textContent = report.net_pnl.toFixed(2);
    document.getElementById('stat-pnl').className = report.net_pnl >= 0 ? 'pnl-up' : 'pnl-down';
    document.getElementById('stat-winrate').textContent = report.win_rate;
    document.getElementById('stat-trades').textContent = report.total_trades;
    document.getElementById('stat-drawdown').textContent = report.max_drawdown;

    const tbody = document.querySelector('#trade-table tbody');
    tbody.innerHTML = '';
    if (report.trades) {
        report.trades.forEach(t => {
            const row = document.createElement('tr');
            const pnl = t.pnl || 0;
            row.innerHTML = `
                <td>${t.type}</td>
                <td>${t.entry_price.toFixed(2)}</td>
                <td>${t.exit_price ? t.exit_price.toFixed(2) : '--'}</td>
                <td class="${pnl >= 0 ? 'pnl-up' : 'pnl-down'}">${pnl.toFixed(2)}</td>
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

async function openManualTrade(side) {
    const sizeVal = document.getElementById('manual-size').value;
    const slVal = document.getElementById('manual-sl').value;
    const tpVal = document.getElementById('manual-tp').value;

    const size = parseFloat(sizeVal);
    const sl = slVal ? parseFloat(slVal) : null;
    const tp = tpVal ? parseFloat(tpVal) : null;

    if (!size || size <= 0) return alert('Please enter a valid size');

    try {
        const res = await fetch('/api/trade/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ side, size, stop_loss: sl, take_profit: tp })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        alert(`Manual ${side} trade opened!`);
        loadWallet();
    } catch (err) {
        alert('Trade Failed: ' + err.message);
    }
}

async function closeTrade(tradeId) {
    try {
        const res = await fetch('/api/trade/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trade_id: tradeId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        alert('Trade closed successfully!');
        loadWallet();
        loadTradeHistory();
    } catch (err) {
        alert('Failed to close trade: ' + err.message);
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
    
    container.innerHTML = trades.map(t => `
        <div class="trade-card">
            <div class="trade-main">
                <div class="trade-header">
                    <span class="side-badge side-${t.type.toLowerCase()}">${t.type}</span>
                    <strong>${t.symbol}</strong>
                    <small>${t.trade_type}</small>
                </div>
                <div class="trade-details">
                    <span>Entry: ${t.entry_price.toFixed(2)}</span>
                    <span>Size: ${t.size}</span>
                </div>
                ${t.stop_loss || t.take_profit ? `
                    <div class="trade-details">
                        ${t.stop_loss ? `<span>SL: ${t.stop_loss}</span>` : ''}
                        ${t.take_profit ? `<span>TP: ${t.take_profit}</span>` : ''}
                    </div>
                ` : ''}
            </div>
            <div class="pnl-container">
                <div class="live-pnl ${t.unrealized_pnl >= 0 ? 'pnl-up' : 'pnl-down'}">
                    ${t.unrealized_pnl >= 0 ? '+' : ''}${t.unrealized_pnl.toFixed(2)}
                </div>
                <button class="btn-close-trade" onclick="closeTrade(${t.id})">Close Position</button>
            </div>
        </div>
    `).join('');
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
                <td>${t.type} <small>(${t.trade_type})</small></td>
                <td>${t.entry_price.toFixed(2)}</td>
                <td>${t.exit_price ? t.exit_price.toFixed(2) : '--'}</td>
                <td class="${t.pnl >= 0 ? 'pnl-up' : 'pnl-down'}">${t.pnl.toFixed(2)}</td>
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
    const data = msg.data;
    if (!data) return;
    
    const lastPrice = parseFloat(data.mark_price || data.close || 0);
    if (!lastPrice || lastPrice <= 0) return;

    const priceEl = document.getElementById('insights-live-price');
    if (priceEl) priceEl.textContent = `$${lastPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    const changeEl = document.getElementById('insights-live-change');
    if (changeEl && data.mark_change_24h !== undefined) {
        const changePct = parseFloat(data.mark_change_24h);
        const openPrice = parseFloat(data.open || lastPrice);
        const changeAbs = lastPrice - openPrice;
        const sign = changePct >= 0 ? '+' : '';
        
        changeEl.textContent = `${sign}${changePct.toFixed(2)}% (${sign}$${Math.abs(changeAbs).toLocaleString(undefined, {minimumFractionDigits: 2})})`;
        changeEl.className = `change-val ${changePct >= 0 ? 'pnl-up' : 'pnl-down'}`;
    }

    // Update insights chart if it exists
    if (insightsSeries && insightsSeries.visible()) {
        const resolutionSeconds = 3600; 
        const candleTime = Math.floor(Date.now() / 1000 / resolutionSeconds) * resolutionSeconds;
        insightsSeries.update({
            time: candleTime,
            open: lastPrice,
            high: lastPrice,
            low: lastPrice,
            close: lastPrice
        });
    }
    if (insightsLineSeries && insightsLineSeries.visible()) {
        const candleTime = Math.floor(Date.now() / 1000);
        insightsLineSeries.update({
            time: candleTime,
            value: lastPrice
        });
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
    document.getElementById('calc-roi').textContent = `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`;
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
    const newMarkers = activeTrades.map(t => {
        const exactEntryTime = Math.floor(new Date(t.entry_time).getTime() / 1000);
        // Align marker with the candle start time for precise placement
        const candleAlignedTime = Math.floor(exactEntryTime / resolutionSeconds) * resolutionSeconds;
        
        // Add exact price line
        const priceLine = candleSeries.createPriceLine({
            price: t.entry_price,
            color: t.type === 'BUY' ? '#22c55e' : '#ef4444',
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${t.type} @ ${t.entry_price.toFixed(2)}`,
        });
        activePriceLines.push(priceLine);

        return {
            time: candleAlignedTime,
            position: t.type === 'BUY' ? 'belowBar' : 'aboveBar',
            color: t.type === 'BUY' ? '#22c55e' : '#ef4444',
            shape: t.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `${t.type} Entry`
        };
    });
    
    candleSeries.setMarkers(newMarkers);
}
