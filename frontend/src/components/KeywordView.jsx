import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, FileSpreadsheet, Info, DollarSign, BarChart2 } from 'lucide-react';

export default function KeywordView() {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('ideas'); // 'ideas' or 'volume'
  const [language, setLanguage] = useState('1000'); // default English
  const [location, setLocation] = useState('2840'); // default US

  const runKeywordPlanner = async (e) => {
    e.preventDefault();
    if (!seed) return;

    setLoading(true);
    setError('');
    setResults(null);

    const endpoint = mode === 'ideas' ? '/api/keywords/ideas' : '/api/keywords/volume';
    const body = mode === 'ideas' 
      ? { seed, language, location } 
      : { keywords: seed, language, location };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to complete keyword check');
      setResults(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionColor = (comp) => {
    if (!comp) return 'var(--color-text-dim)';
    const compUpper = comp.toUpperCase();
    if (compUpper.includes('HIGH')) return 'var(--neon-red)';
    if (compUpper.includes('MEDIUM') || compUpper.includes('WARN')) return 'var(--neon-amber)';
    return 'var(--neon-green)';
  };

  return (
    <div className="view-viewport">
      {/* Settings form */}
      <form className="console-form" onSubmit={runKeywordPlanner}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {/* Mode Switcher */}
          <div className="input-group" style={{ flex: '1 1 200px' }}>
            <label>PLANNING MODE</label>
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <button
                type="button"
                className={`nav-btn`}
                style={{ flex: 1, padding: '8px', border: 'none', background: mode === 'ideas' ? 'var(--bg-active)' : 'transparent', color: mode === 'ideas' ? 'var(--color-text-bright)' : 'var(--color-text-dim)', borderRadius: 0 }}
                onClick={() => setMode('ideas')}
              >
                Keyword Ideas
              </button>
              <button
                type="button"
                className={`nav-btn`}
                style={{ flex: 1, padding: '8px', border: 'none', background: mode === 'volume' ? 'var(--bg-active)' : 'transparent', color: mode === 'volume' ? 'var(--color-text-bright)' : 'var(--color-text-dim)', borderRadius: 0 }}
                onClick={() => setMode('volume')}
              >
                Volume Lookup
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="input-group" style={{ flex: '1 1 150px' }}>
            <label>GEO TARGETING</label>
            <select 
              className="console-input" 
              value={location} 
              onChange={e => setLocation(e.target.value)}
              style={{ width: '100%', height: '36px' }}
            >
              <option value="2840">United States</option>
              <option value="2082">United Kingdom</option>
              <option value="2124">Canada</option>
              <option value="2036">Australia</option>
              <option value="2276">Germany</option>
              <option value="2250">France</option>
            </select>
          </div>

          {/* Language */}
          <div className="input-group" style={{ flex: '1 1 150px' }}>
            <label>LANGUAGE</label>
            <select 
              className="console-input" 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              style={{ width: '100%', height: '36px' }}
            >
              <option value="1000">English</option>
              <option value="1014">Spanish</option>
              <option value="1001">German</option>
              <option value="1002">French</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>{mode === 'ideas' ? 'SEED KEYWORD' : 'COMMA-SEPARATED KEYWORDS'}</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="console-input"
              placeholder={mode === 'ideas' ? "e.g., seo tools, local business crm" : "e.g., seo audit, search traffic, backlinks index"}
              value={seed}
              onChange={e => setSeed(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="console-btn" disabled={loading} style={{ flexShrink: 0 }}>
              <Play size={14} /> {loading ? 'FETCHING...' : 'DISCOVER KEYWORDS'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="panel-card" style={{ borderColor: 'var(--neon-red)' }}>
          <span className="glow-red" style={{ fontWeight: 'bold' }}>ERROR: {error}</span>
        </div>
      )}

      {/* Configuration Instructions Guide */}
      {!results && !loading && (
        <div className="panel-card animate-fade">
          <div className="panel-header">
            <span>GOOGLE ADS API INTEGRATION</span>
            <Info size={14} />
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-dim)' }}>
            This panel uses Google Ads API criteria to retrieve authentic search metrics. If credentials are not configured, the utility console will **gracefully fall back** to using scraped autocomplete suggestions from Google Suggest.
          </p>
          <div style={{ marginTop: '12px', background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)', fontSize: '11px', fontFamily: 'monospace' }}>
            <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Setup credentials at:</span> ~/.config/claude-seo/google-api.json
            <br />
            {"{\n  \"ads_developer_token\": \"YOUR_DEV_TOKEN\",\n  \"ads_customer_id\": \"123-456-7890\"\n}"}
          </div>
        </div>
      )}

      {results && (
        <div className="dashboard-grid animate-fade">
          {/* Fallback Mode Indicator Alert */}
          {results.fallback && (
            <div className="panel-card" style={{ gridColumn: 'span 2', borderColor: 'var(--neon-amber)', background: 'rgba(245, 158, 11, 0.05)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <AlertCircle size={16} className="glow-amber" />
                <div>
                  <span className="glow-amber" style={{ fontWeight: 'bold', fontSize: '13px' }}>FALLBACK MODE ACTIVE</span>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-dim)', margin: '4px 0 0 0' }}>
                    Google Ads API client was not loaded (Missing developer token). Showing autocomplete search terms from Google Suggest with simulated volumes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table list */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>KEYWORD DISCOVERY METRICS RESULTS</span>
              <FileSpreadsheet size={14} />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>KEYWORD</th>
                    <th>AVG. MONTHLY SEARCHES</th>
                    <th>COMPETITION</th>
                    <th>TOP OF PAGE BID (LOW)</th>
                    <th>TOP OF PAGE BID (HIGH)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Handle 'ideas' return or 'volume' return */}
                  {(mode === 'ideas' ? results.ideas : results.keywords || []).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                        {item.keyword}
                      </td>
                      <td style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                        {item.avg_monthly_searches ? item.avg_monthly_searches.toLocaleString() : 'N/A'}
                      </td>
                      <td>
                        <span style={{ color: getCompetitionColor(item.competition), fontWeight: 'bold' }}>
                          {item.competition || 'UNSPECIFIED'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-dim)' }}>
                        {item.low_top_of_page_bid ? `$${Number(item.low_top_of_page_bid).toFixed(2)}` : 'N/A'}
                      </td>
                      <td style={{ color: 'var(--color-text-dim)' }}>
                        {item.high_top_of_page_bid ? `$${Number(item.high_top_of_page_bid).toFixed(2)}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {((mode === 'ideas' ? results.ideas : results.keywords) || []).length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>No keyword results discovered.</td>
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
