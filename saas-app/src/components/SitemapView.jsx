import React, { useState } from 'react';
import { Play, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SitemapView() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const checkSitemap = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await fetch('/api/sitemap/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to check sitemap');
      if (!res.ok) throw new Error(res.error || 'Invalid XML sitemap layout');
      setReport(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-viewport">
      <form className="console-form" onSubmit={checkSitemap}>
        <div className="input-group">
          <label>XML SITEMAP URL</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="console-input"
              placeholder="https://example.com/sitemap.xml"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="console-btn" disabled={loading} style={{ flexShrink: 0 }}>
              <Play size={14} /> {loading ? 'PARSING...' : 'INSPECT SITEMAP'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="panel-card" style={{ borderColor: 'var(--neon-red)' }}>
          <span className="glow-red" style={{ fontWeight: 'bold' }}>ERROR: {error}</span>
        </div>
      )}

      {report && (
        <div className="dashboard-grid animate-fade">
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>SITEMAP STRUCTURAL ANALYSIS</span>
              <FileCode size={14} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>TOTAL URL COUNT</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{report.urls.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>LIMIT COMPLIANCE</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: report.urls.length < 50000 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                  {report.urls.length < 50000 ? 'VALID (<50k)' : 'OVER LIMIT'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>SITEMAP STATUS</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>PARSED</div>
              </div>
            </div>

            <div style={{ marginTop: '16px', maxHeight: '250px', overflowY: 'auto' }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>INDEX</th>
                    <th>URL LOC</th>
                    <th>LAST MODIFIED</th>
                  </tr>
                </thead>
                <tbody>
                  {report.urls.map((item, idx) => (
                    <tr key={idx}>
                      <td>#{idx + 1}</td>
                      <td style={{ color: 'var(--color-text-bright)', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.loc}
                      </td>
                      <td style={{ color: 'var(--neon-cyan)' }}>{item.lastmod || 'N/A'}</td>
                    </tr>
                  ))}
                  {report.urls.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center' }}>No location URLs parsed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
