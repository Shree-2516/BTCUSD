import React from 'react';

const TransactionRow = ({ tx }) => {
  const isCredit = tx.type === 'CREDIT' || tx.type === 'DEPOSIT' || tx.amount > 0;
  const isSettle = tx.type === 'SETTLEMENT';
  const isMargin = tx.type === 'MARGIN_BLOCK';
  
  let color = isCredit ? '#10b981' : '#ef4444';
  if (isSettle) color = tx.amount >= 0 ? '#10b981' : '#ef4444';
  if (isMargin) color = '#f59e0b';
  
  const sign = (isCredit || (isSettle && tx.amount >= 0)) ? '+' : '';

  return (
    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <td style={{ padding: '16px 0', color: '#94a3b8', fontSize: '13px' }}>{tx.timestamp}</td>
      <td style={{ padding: '16px 0' }}>
        <span style={{
          backgroundColor: `${color}20`,
          color: color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {tx.type}
        </span>
      </td>
      <td style={{ padding: '16px 0', color: '#cbd5e1' }}>{tx.reason || '-'}</td>
      <td style={{ padding: '16px 0', fontWeight: 'bold', color: color, textAlign: 'right' }}>
        {sign}${Math.abs(tx.amount || 0).toFixed(2)}
      </td>
      <td style={{ padding: '16px 0', textAlign: 'right', color: '#94a3b8' }}>
        ${parseFloat(tx.balance_after || 0).toFixed(2)}
      </td>
    </tr>
  );
};

export default TransactionRow;
