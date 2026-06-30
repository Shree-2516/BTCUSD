import React, { useState, useEffect } from 'react';
import NewsCard from '../../../components/news/NewsCard';

const LiveNewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/news/latest?limit=50');
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(articles.length / itemsPerPage);
  const currentArticles = articles.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      color: '#f8fafc'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Live News Feed
        </h2>
        <button 
          onClick={fetchNews}
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Refresh Feed
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading latest news...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>Error: {error}</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentArticles.map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', alignItems: 'center' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ background: 'transparent', border: '1px solid #475569', color: '#f8fafc', padding: '8px 16px', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ color: '#94a3b8' }}>Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ background: 'transparent', border: '1px solid #475569', color: '#f8fafc', padding: '8px 16px', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiveNewsPage;

