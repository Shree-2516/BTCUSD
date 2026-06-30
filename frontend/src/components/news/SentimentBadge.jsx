import React from 'react';

const SentimentBadge = ({ sentiment, confidence }) => {
  let bgColor = 'rgba(148, 163, 184, 0.2)';
  let color = '#94a3b8';
  let text = 'NEUTRAL';

  if (sentiment === 'POSITIVE' || sentiment === 'BULLISH') {
    bgColor = 'rgba(34, 197, 94, 0.2)';
    color = '#22c55e';
    text = 'POSITIVE';
  } else if (sentiment === 'NEGATIVE' || sentiment === 'BEARISH') {
    bgColor = 'rgba(239, 68, 68, 0.2)';
    color = '#ef4444';
    text = 'NEGATIVE';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      borderRadius: '12px',
      backgroundColor: bgColor,
      color: color,
      fontSize: '12px',
      fontWeight: '600',
      letterSpacing: '0.05em'
    }}>
      {text} 
      {confidence && <span style={{ opacity: 0.8 }}>({Math.round(confidence)}%)</span>}
    </div>
  );
};

export default SentimentBadge;
