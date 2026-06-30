import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { useDashboardStore } from '../store/dashboardStore';

const MainChart = ({ chartType = 'candle' }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const liveCandleRef = useRef(null);
  const { historyData, currentPrice } = useDashboardStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(55, 65, 81, 0.5)' },
        horzLines: { color: 'rgba(55, 65, 81, 0.5)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
          });
        }
      },
      localization: {
        locale: 'en-IN',
        timeFormatter: (time) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
          });
        }
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      visible: chartType === 'candle',
    });

    const lineSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      visible: chartType === 'line',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    lineSeriesRef.current = lineSeries;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); // Only create chart once

  useEffect(() => {
    if (seriesRef.current && lineSeriesRef.current) {
      seriesRef.current.applyOptions({ visible: chartType === 'candle' });
      lineSeriesRef.current.applyOptions({ visible: chartType === 'line' });
    }
  }, [chartType]);

  useEffect(() => {
    if (seriesRef.current && lineSeriesRef.current && historyData?.length) {
      seriesRef.current.setData(historyData);
      
      const lineData = historyData.map(d => ({ time: d.time, value: d.close }));
      lineSeriesRef.current.setData(lineData);

      // Initialize the live candle reference with the last historical candle
      liveCandleRef.current = { ...historyData[historyData.length - 1] };
      
      // Auto-fit the chart data to view to make candles look fatter like Delta
      chartRef.current.timeScale().fitContent();
    }
  }, [historyData]);

  useEffect(() => {
    if (seriesRef.current && currentPrice && liveCandleRef.current) {
      const newPrice = currentPrice.price || currentPrice.close;
      
      if (newPrice) {
        // Accumulate high and low properly without reverting to unmutated historyData
        liveCandleRef.current.high = Math.max(liveCandleRef.current.high, newPrice);
        liveCandleRef.current.low = Math.min(liveCandleRef.current.low, newPrice);
        liveCandleRef.current.close = newPrice;
        
        seriesRef.current.update(liveCandleRef.current);
        lineSeriesRef.current.update({ time: liveCandleRef.current.time, value: newPrice });
      }
    }
  }, [currentPrice]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />;
};

export default MainChart;
