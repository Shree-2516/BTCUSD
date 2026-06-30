import React from 'react';
import SentimentBadge from './SentimentBadge';

const NewsCard = ({ article }) => {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      marginBottom: '16px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }}
    onClick={() => window.open(article.url, '_blank')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', flex: 1, paddingRight: '16px' }}>
          {article.title}
        </h3>
        <SentimentBadge sentiment={article.sentiment} confidence={article.confidence} />
      </div>
      
      {article.summary && (
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.summary}
        </p>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
        <span>{article.source}</span>
        <span>{new Date(article.published_at).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default NewsCard;
