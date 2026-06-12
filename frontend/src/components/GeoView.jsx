import React, { useState } from 'react';
import { Play, ShieldAlert, Cpu, Eye, FileText, CheckCircle } from 'lucide-react';

export default function GeoView() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const runGeoCheck = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('/api/geo/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to complete GEO audit');
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-viewport">
      <form className="console-form" onSubmit={runGeoCheck}>
        <div className="input-group">
          <label>URL FOR AI SEARCH OPTIMIZATION (GEO) AUDIT</label>
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
              <Cpu size={14} /> {loading ? 'AUDITING...' : 'RUN GEO SCAN'}
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
          {/* AI Crawler Status Card */}
          <div className="panel-card">
            <div className="panel-header">
              <span>AI CRAWLER ROBOTS.TXT ACCESS</span>
              <ShieldAlert size={14} />
            </div>
            <table className="meta-table">
              <thead>
                <tr>
                  <th>CRAWLER BOT</th>
                  <th>ACCESS CONTROL STATUS</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.botAccess).map(([bot, allowed]) => (
                  <tr key={bot}>
                    <td>{bot}</td>
                    <td>
                      <span className={`tag-badge ${allowed ? 'green' : 'red'}`}>
                        {allowed ? 'ALLOWED' : 'BLOCKED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* llms.txt status and template */}
          <div className="panel-card">
            <div className="panel-header">
              <span>LLMS.TXT DEFINITION CLARITY</span>
              <FileText size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>FILE DETECTED:</div>
                <span className={`tag-badge ${data.hasLlmsTxt ? 'green' : 'amber'}`}>
                  {data.hasLlmsTxt ? 'FOUND (/llms.txt)' : 'MISSING'}
                </span>
              </div>
              
              {!data.hasLlmsTxt && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--neon-amber)', fontWeight: 'bold' }}>RECOMMENDED TEMPLATE SCRAP:</div>
                  <pre style={{ background: '#070a0b', border: '1px solid var(--border-color)', padding: '10px', fontSize: '10px', overflow: 'auto', maxHeight: '110px', color: 'var(--neon-cyan)' }}>
{`# ${new URL(data.url).hostname}
> AI agent metadata scaffolding.

## Navigation
- [/] Homepage
${data.headings.slice(0, 3).map(h => `- [${h}](/#)`).join('\n')}`}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Passage-level Citability list */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>PASSAGE-LEVEL CITABILITY (OPTIMAL TARGET: 134-167 WORDS)</span>
              <Eye size={14} />
            </div>
            
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.citabilityPassages.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px',
                    borderLeft: `3px solid ${p.citable ? 'var(--neon-green)' : 'var(--border-color)'}`,
                    background: 'var(--bg-console)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>
                    <span>PASSAGE #{idx + 1}</span>
                    <span className={p.citable ? 'glow-green' : ''}>
                      {p.wordCount} words {p.citable ? '(CITABLE RANGE)' : '(OUT OF RANGE)'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-main)' }}>"{p.text}"</p>
                </div>
              ))}
              {data.citabilityPassages.length === 0 && (
                <span className="glow-amber">No descriptive text passages found on this page.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
