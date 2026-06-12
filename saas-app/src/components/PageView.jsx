import React, { useState } from 'react';
import { Play, FileText, Image, Code, Eye } from 'lucide-react';

export default function PageView() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const inspectPage = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('/api/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, render: 'auto' })
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to inspect page');
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-viewport">
      <form className="console-form" onSubmit={inspectPage}>
        <div className="input-group">
          <label>URL TO INSPECT</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="console-input"
              placeholder="https://example.com/blog-post"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="console-btn" disabled={loading} style={{ flexShrink: 0 }}>
              <Play size={14} /> {loading ? 'FETCHING...' : 'INSPECT'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="panel-card" style={{ borderColor: 'var(--neon-red)' }}>
          <span className="glow-red" style={{ fontWeight: 'bold' }}>ERROR: {error}</span>
        </div>
      )}

      {data && (
        <div className="dashboard-grid animate-fade">
          {/* Metadata Card */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>META HEADERS</span>
              <FileText size={14} />
            </div>
            <table className="meta-table">
              <tbody>
                <tr>
                  <td style={{ width: '180px', color: 'var(--color-text-dim)' }}>TITLE</td>
                  <td style={{ color: 'var(--color-text-bright)' }}>{data.title || <span className="glow-red">None</span>}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--color-text-dim)' }}>DESCRIPTION</td>
                  <td style={{ color: 'var(--color-text-bright)' }}>{data.meta_description || <span className="glow-amber">None</span>}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--color-text-dim)' }}>CANONICAL</td>
                  <td style={{ color: 'var(--neon-cyan)' }}>{data.canonical || <span className="glow-amber">None</span>}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--color-text-dim)' }}>ROBOTS</td>
                  <td>{data.meta_robots ? <span className="tag-badge green">{data.meta_robots}</span> : <span className="tag-badge amber">None</span>}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Outline / Hierarchy Card */}
          <div className="panel-card">
            <div className="panel-header">
              <span>HEADINGS OUTLINE</span>
              <Code size={14} />
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.h1.map((h, i) => (
                <div key={`h1-${i}`} style={{ color: 'var(--neon-green)', fontWeight: 'bold', paddingLeft: '0px' }}>
                  H1 // {h}
                </div>
              ))}
              {data.h2.map((h, i) => (
                <div key={`h2-${i}`} style={{ color: 'var(--color-text-bright)', paddingLeft: '16px' }}>
                  H2 // {h}
                </div>
              ))}
              {data.h3.map((h, i) => (
                <div key={`h3-${i}`} style={{ color: 'var(--color-text-main)', paddingLeft: '32px', fontSize: '12px' }}>
                  H3 // {h}
                </div>
              ))}
              {data.h1.length === 0 && data.h2.length === 0 && data.h3.length === 0 && (
                <span className="glow-red">No headings outline detected on this page.</span>
              )}
            </div>
          </div>

          {/* Social Previews Card */}
          <div className="panel-card">
            <div className="panel-header">
              <span>SOCIAL GRAPH CARD</span>
              <Eye size={14} />
            </div>
            <div style={{ background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--neon-amber)', fontWeight: 'bold' }}>OPENGRAPH PREVIEW</div>
              <div style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{data.open_graph['og:title'] || data.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-main)' }}>{data.open_graph['og:description'] || data.meta_description}</div>
              <div style={{ fontSize: '11px', color: 'var(--neon-cyan)' }}>{data.open_graph['og:url'] || url}</div>
              {data.open_graph['og:image'] && (
                <div style={{ border: '1px solid var(--border-color)', overflow: 'hidden', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={data.open_graph['og:image']} alt="OG Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>

          {/* Images Lazy-loading Card */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>IMAGE TAG AUDITS</span>
              <Image size={14} />
            </div>
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>IMAGE SRC</th>
                    <th>ALT TAG</th>
                    <th>LAZY METHOD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.images.map((img, i) => (
                    <tr key={i}>
                      <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--neon-cyan)' }}>
                        {img.src}
                      </td>
                      <td>
                        {img.alt ? (
                          <span style={{ color: 'var(--color-text-bright)' }}>{img.alt}</span>
                        ) : (
                          <span className="tag-badge red">Missing Alt</span>
                        )}
                      </td>
                      <td>
                        <span className={`tag-badge ${img.lazy_method === 'none' ? 'amber' : 'green'}`}>
                          {img.lazy_method}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.images.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center' }}>No image tags found.</td>
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
