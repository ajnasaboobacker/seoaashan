import React, { useState } from 'react';
import { Play, Link, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';

export default function BacklinkView() {
  const [targetUrl, setTargetUrl] = useState('');
  const [sourcesList, setSourcesList] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const runBacklinkCheck = async (e) => {
    e.preventDefault();
    if (!targetUrl || !sourcesList) return;

    setLoading(true);
    setError('');
    setReport(null);

    // Format list of links
    const linksArray = sourcesList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5)
      .map(url => ({ source_url: url }));

    try {
      const response = await fetch('/api/backlinks/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetUrl, links: linksArray })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to verify backlinks');
      setReport(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-viewport">
      <form className="console-form" onSubmit={runBacklinkCheck}>
        <div className="form-row">
          <div className="input-group">
            <label>YOUR TARGET WEBSITE URL</label>
            <input
              type="text"
              className="console-input"
              placeholder="https://example.com"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="input-group">
          <label>REFERRING BLOGS OR BACKLINK SOURCES (ONE PER LINE)</label>
          <textarea
            className="console-input"
            rows={5}
            placeholder="https://blog.partner.org/seo-tips&#10;https://forum.industry.com/t/best-tools"
            value={sourcesList}
            onChange={e => setSourcesList(e.target.value)}
            disabled={loading}
            style={{ resize: 'vertical' }}
            required
          />
        </div>
        <button type="submit" className="console-btn" disabled={loading}>
          <Play size={14} /> {loading ? 'CRAWLING SOURCES...' : 'VERIFY BACKLINKS'}
        </button>
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
              <span>BACKLINK INDEX VERIFICATION</span>
              <Link size={14} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>TOTAL INDEXED</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{report.summary.total}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--neon-green)' }}>VERIFIED</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--neon-green)' }}>{report.summary.verified}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--neon-red)' }}>LOST (404 / REMOVED)</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--neon-red)' }}>
                  {report.summary.lost + report.summary.link_removed}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--neon-amber)' }}>JS UNVERIFIABLE</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--neon-amber)' }}>{report.summary.unverifiable_js}</div>
              </div>
            </div>

            <div style={{ marginTop: '16px', maxHeight: '250px', overflowY: 'auto' }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>REFERRING SOURCE</th>
                    <th>STATUS</th>
                    <th>ANCHOR TEXT</th>
                    <th>REL ATTRIBUTES</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((r, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--color-text-bright)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.source_url}
                      </td>
                      <td>
                        <span className={`tag-badge ${r.status === 'verified' ? 'green' : r.status === 'unverifiable_js' ? 'amber' : 'red'}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontStyle: 'italic' }}>
                        {r.anchor_text || '-'}
                      </td>
                      <td>
                        {r.rel_attributes.map((rel, id) => (
                          <span key={id} className={`tag-badge ${rel === 'follow' ? 'green' : 'amber'}`} style={{ marginRight: '4px' }}>
                            {rel}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
