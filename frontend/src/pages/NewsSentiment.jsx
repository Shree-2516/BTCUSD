import React, { useState, useEffect } from 'react';

const NewsSentiment = () => {
  const [summary, setSummary] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const [resSum, resArt] = await Promise.all([
          fetch('/api/news/sentiment'),
          fetch('/api/news/latest?limit=50')
        ]);
        if (resSum.ok) {
          setSummary(await resSum.json());
        }
        if (resArt.ok) {
          setArticles(await resArt.json());
        }
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const signal = summary?.signal?.toUpperCase() || 'NEUTRAL';
  let sigColor = '#94a3b8';
  let sigBg = 'rgba(148, 163, 184, 0.2)';
  if (signal === 'POSITIVE') {
    sigColor = '#22c55e';
    sigBg = 'rgba(34, 197, 94, 0.2)';
  } else if (signal === 'NEGATIVE') {
    sigColor = '#ef4444';
    sigBg = 'rgba(239, 68, 68, 0.2)';
  }

  return (
    <div className="w-full">
      <style>{`
        .news-summary-content img {
          max-width: 120px !important;
          height: auto !important;
          border-radius: 6px;
          margin-left: 12px;
          margin-bottom: 8px;
        }
        .news-summary-content p {
          margin: 0 0 8px 0;
        }
      `}</style>
      <div className="news-container" style={{ padding: '24px' }}>
        
        {/* Header Row showing Latest Market Signal */}
        <div className="insights-header-row" style={{ marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="card glass news-signal-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '320px', flex: 1 }}>
            <h3>NEWS SENTIMENT SIGNAL</h3>
            <div className="sentiment-indicator" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <div className="signal-badge" style={{ fontSize: '24px', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', textTransform: 'uppercase', backgroundColor: sigBg, color: sigColor, border: `1px solid ${sigColor}`, width: 'fit-content' }}>
                {loading ? '...' : signal}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>Confidence: {(summary?.confidence || 0).toFixed(0)}%</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aggregate BTC sentiment</span>
              </div>
            </div>
          </div>
          
          <div className="card glass news-stats-card" style={{ padding: '24px', flex: 2, minWidth: '400px' }}>
            <h3>Article Sentiment Breakdown</h3>
            <div className="news-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
              <div className="metric-item card glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                <label style={{ color: '#22c55e', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Positive News</label>
                <span style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#22c55e' }}>{summary?.positive_news ?? '--'}</span>
              </div>
              <div className="metric-item card glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                <label style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Neutral News</label>
                <span style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#94a3b8' }}>{summary?.neutral_news ?? '--'}</span>
              </div>
              <div className="metric-item card glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                <label style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Negative News</label>
                <span style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#ef4444' }}>{summary?.negative_news ?? '--'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* News Table */}
        <section className="card glass news-list-section" style={{ padding: '24px' }}>
          <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 600 }}>Latest BTC News & Sentiment</h3>
            <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              {articles.length} Articles
            </span>
          </div>
          
          <div className="table-container" style={{ overflowX: 'auto', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)' }}>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', width: '18%' }}>Published At</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', width: '50%' }}>Article</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', width: '14%' }}>Source</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', width: '10%' }}>Sentiment</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', width: '8%' }}>Conf.</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading news articles...</td>
                  </tr>
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No articles found.</td>
                  </tr>
                ) : (
                  articles.map((art, idx) => {
                    let dateStr = art.published_at;
                    if (dateStr) {
                      try {
                        const d = new Date(dateStr);
                        dateStr = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                      } catch(e) {}
                    }
                    const sent = (art.sentiment || 'NEUTRAL').toUpperCase();
                    let badgeColor = '#94a3b8';
                    let bgCol = 'rgba(148, 163, 184, 0.1)';
                    if (sent === 'POSITIVE') {
                      badgeColor = '#22c55e';
                      bgCol = 'rgba(34, 197, 94, 0.1)';
                    } else if (sent === 'NEGATIVE') {
                      badgeColor = '#ef4444';
                      bgCol = 'rgba(239, 68, 68, 0.1)';
                    }
                    return (
                      <tr key={art.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>{dateStr}</td>
                        <td style={{ padding: '16px' }}>
                          {art.url ? (
                            <a href={art.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{art.title}</a>
                          ) : (
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{art.title}</span>
                          )}
                          {art.summary && <div className="news-summary-content" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }} dangerouslySetInnerHTML={{ __html: art.summary }} />}
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>{art.source}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ color: badgeColor, border: `1px solid ${badgeColor}`, background: bgCol, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                            {sent}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {art.confidence != null ? `${(art.confidence * 100).toFixed(0)}%` : '--'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default NewsSentiment;
