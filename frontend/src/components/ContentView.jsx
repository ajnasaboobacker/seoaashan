import React, { useState } from 'react';
import { ScoreGauge } from './Gauges';
import { Play, Sparkles, BookOpen, AlertCircle, FileText } from 'lucide-react';

export default function ContentView() {
  const [tab, setTab] = useState('text'); // 'text' or 'url'
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runAnalysis = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const payload = tab === 'text' ? { text } : { url };

    try {
      const response = await fetch('/api/content-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to analyze content');
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-viewport">
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-console)', padding: '8px 16px' }}>
        <button
          className={`nav-btn ${tab === 'text' ? 'active' : ''}`}
          onClick={() => { setTab('text'); setResult(null); }}
          style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
        >
          DIRECT TEXT BLOCK
        </button>
        <button
          className={`nav-btn ${tab === 'url' ? 'active' : ''}`}
          onClick={() => { setTab('url'); setResult(null); }}
          style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
        >
          ANALYZE VIA URL
        </button>
      </div>

      <form className="console-form" onSubmit={runAnalysis}>
        {tab === 'text' ? (
          <div className="input-group">
            <label>PASTE CONTENT OR BLOG POST TEXT</label>
            <textarea
              className="console-input"
              rows={8}
              placeholder="In today's fast-paced world, it is important to note that content marketing is a game-changer. Let's delve into the rich tapestry of search engine optimizations..."
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={loading}
              style={{ minHeight: '140px', resize: 'vertical' }}
              required
            />
          </div>
        ) : (
          <div className="input-group">
            <label>TARGET PAGE URL</label>
            <input
              type="text"
              className="console-input"
              placeholder="https://example.com/some-article"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        )}

        <button type="submit" className="console-btn" disabled={loading}>
          <Sparkles size={14} /> {loading ? 'SCORING CONTENT...' : 'EVALUATE E-E-A-T QUALITY'}
        </button>
      </form>

      {error && (
        <div className="panel-card" style={{ borderColor: 'var(--neon-red)' }}>
          <span className="glow-red" style={{ fontWeight: 'bold' }}>ERROR: {error}</span>
        </div>
      )}

      {result && (
        <div className="dashboard-grid animate-fade">
          {/* Quality Gauges Row */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>QRG QUALITY GAUGES</span>
              <BookOpen size={14} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '24px', padding: '10px 0' }}>
              <ScoreGauge score={result.data.overall_quality} label="Overall E-E-A-T" />
              <ScoreGauge score={result.data.ai_pattern_score} label="AI Phrasings" max={100} />
              <ScoreGauge score={result.data.filler_score} label="Filler Content" max={100} />
              <ScoreGauge score={Math.round(result.data.information_density * 100)} label="Info Density" />
            </div>

            {result.data.flags.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-dim)', alignSelf: 'center' }}>ADVISORY FLAGS:</span>
                {result.data.flags.map((flag, idx) => (
                  <span key={idx} className={`tag-badge ${['filler', 'ai-patterns', 'repetitive', 'thin-content'].includes(flag) ? 'red' : 'amber'}`}>
                    {flag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--neon-green)', fontSize: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                ✓ Clean scan: Content complies fully with Quality Rater guidelines.
              </div>
            )}
          </div>

          {/* AI Pattern Detections */}
          <div className="panel-card">
            <div className="panel-header">
              <span>LLM-TYPICAL PHRASINGS MATCHED ({result.data.matches.ai_patterns.length})</span>
              <AlertCircle size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                These patterns occur disproportionately in ChatGPT / Claude outputs compared to human writing:
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {result.data.matches.ai_patterns.map((word, idx) => (
                  <span key={idx} className="tag-badge amber">{word}</span>
                ))}
                {result.data.matches.ai_patterns.length === 0 && (
                  <span className="glow-green" style={{ fontSize: '12px' }}>No matches found. Wording appears organic.</span>
                )}
              </div>
            </div>
          </div>

          {/* Filler Word Detections */}
          <div className="panel-card">
            <div className="panel-header">
              <span>FILLER AND PADDING PHRASES ({result.data.matches.filler.length})</span>
              <FileText size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                Google Rater Guidelines §4.6 flag these transitions as adding "little-to-no real value":
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {result.data.matches.filler.map((word, idx) => (
                  <span key={idx} className="tag-badge red">{word}</span>
                ))}
                {result.data.matches.filler.length === 0 && (
                  <span className="glow-green" style={{ fontSize: '12px' }}>No low-value filler padding detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
