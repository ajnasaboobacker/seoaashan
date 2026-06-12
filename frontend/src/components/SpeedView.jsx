import React, { useState } from 'react';
import { ScoreGauge, MetricPill } from './Gauges';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Gauge, Clock, Sliders, AlertCircle, Sparkles } from 'lucide-react';

export default function SpeedView() {
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState('mobile'); // 'mobile' or 'desktop'
  const [loading, setLoading] = useState(false);
  const [psiData, setPsiData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState('');

  const fetchSpeedData = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setPsiData(null);
    setHistoryData(null);

    try {
      // 1. Run PSI Lab Check
      const psiResponse = await fetch('/api/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, strategy })
      });
      const psiRes = await psiResponse.json();
      if (!psiResponse.ok) throw new Error(psiRes.error || 'Failed to complete lab audit');
      
      if (psiRes.error) {
        throw new Error(psiRes.error);
      }
      const strategyData = psiRes.psi?.[strategy] || psiRes;
      if (strategyData && strategyData.error) {
        throw new Error(strategyData.error);
      }
      
      setPsiData(strategyData);

      // 2. Fetch CrUX History
      const histResponse = await fetch('/api/crux-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const histRes = await histResponse.json();
      if (histResponse.ok && !histRes.error) {
        setHistoryData(histRes);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!historyData || !historyData.collection_periods) return [];
    
    return historyData.collection_periods.map((period, idx) => {
      const point = { name: period.last.substring(5) }; // MM-DD
      
      if (historyData.metrics.largest_contentful_paint) {
        point.LCP = historyData.metrics.largest_contentful_paint.p75_values[idx] / 1000; // secs
      }
      if (historyData.metrics.interaction_to_next_paint) {
        point.INP = historyData.metrics.interaction_to_next_paint.p75_values[idx]; // ms
      }
      if (historyData.metrics.cumulative_layout_shift) {
        point.CLS = historyData.metrics.cumulative_layout_shift.p75_values[idx]; // ratio
      }
      
      return point;
    });
  };

  return (
    <div className="view-viewport">
      <form className="console-form" onSubmit={fetchSpeedData}>
        <div className="form-row">
          <div className="input-group" style={{ flexGrow: 2 }}>
            <label>URL TO ANALYZE PAGESPEED</label>
            <input
              type="text"
              className="console-input"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label>DEVICE STRATEGY</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '45px' }}>
              <button
                type="button"
                className={`console-btn ${strategy === 'mobile' ? 'active' : ''}`}
                style={{
                  background: strategy === 'mobile' ? 'var(--neon-green)' : 'var(--bg-console)',
                  color: strategy === 'mobile' ? 'var(--bg-core)' : 'var(--color-text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  fontSize: '11px'
                }}
                onClick={() => setStrategy('mobile')}
                disabled={loading}
              >
                MOBILE
              </button>
              <button
                type="button"
                className={`console-btn ${strategy === 'desktop' ? 'active' : ''}`}
                style={{
                  background: strategy === 'desktop' ? 'var(--neon-green)' : 'var(--bg-console)',
                  color: strategy === 'desktop' ? 'var(--bg-core)' : 'var(--color-text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  fontSize: '11px'
                }}
                onClick={() => setStrategy('desktop')}
                disabled={loading}
              >
                DESKTOP
              </button>
            </div>
          </div>
        </div>
        
        <button type="submit" className="console-btn" disabled={loading}>
          <Clock size={14} /> {loading ? 'SCANNIN...' : 'RUN SPEED AUDIT'}
        </button>
      </form>

      {error && (
        <div className="panel-card" style={{ borderColor: 'var(--neon-red)' }}>
          <span className="glow-red" style={{ fontWeight: 'bold' }}>ERROR: {error}</span>
        </div>
      )}

      {psiData && (
        <div className="dashboard-grid animate-fade">
          {/* Lighthouse Category Scores */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>LIGHTHOUSE LAB AUDIT CATEGORIES ({strategy.toUpperCase()})</span>
              <Gauge size={14} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
              <ScoreGauge score={psiData.lighthouse_scores?.performance || 0} label="Performance" />
              <ScoreGauge score={psiData.lighthouse_scores?.accessibility || 0} label="Accessibility" />
              <ScoreGauge score={psiData.lighthouse_scores?.['best-practices'] || 0} label="Best Practices" />
              <ScoreGauge score={psiData.lighthouse_scores?.seo || 0} label="SEO Checks" />
            </div>
          </div>

          {/* CWV Metrics List */}
          <div className="panel-card">
            <div className="panel-header">
              <span>CORE WEB VITALS (PSI FIELD DATA)</span>
              <Sparkles size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {Object.entries(psiData.field_metrics || {}).map(([key, data]) => (
                <MetricPill
                  key={key}
                  label={key.replace('url_', '').replace(/_/g, ' ')}
                  value={data.p75 + (key.includes('shift') ? '' : 'ms')}
                  rating={data.rating}
                />
              ))}
              {(!psiData.field_metrics || Object.keys(psiData.field_metrics).length === 0) && (
                <span className="glow-amber" style={{ fontSize: '12px' }}>
                  No historical field data discovered for this URL.
                </span>
              )}
            </div>
          </div>

          {/* Performance Opportunities */}
          <div className="panel-card">
            <div className="panel-header">
              <span>SPEED OPPORTUNITIES</span>
              <Sliders size={14} />
            </div>
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {psiData.opportunities?.slice(0, 5).map((opp, idx) => (
                <div key={idx} style={{ padding: '8px', borderLeft: '3px solid var(--neon-amber)', background: 'var(--bg-console)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-bright)' }}>{opp.title}</span>
                    <span className="glow-amber">-{opp.savings_ms}ms</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '4px' }}>{opp.description}</p>
                </div>
              ))}
              {(!psiData.opportunities || psiData.opportunities.length === 0) && (
                <span className="glow-green">Lighthouse reports zero major savings opportunities.</span>
              )}
            </div>
          </div>

          {/* Recharts CrUX Timeseries Diagram */}
          {historyData && (
            <div className="panel-card" style={{ gridColumn: 'span 2' }}>
              <div className="panel-header">
                <span>HISTORICAL CORE WEB VITALS TRENDS (25 WEEKS TIMESERIES)</span>
              </div>
              <div style={{ width: '100%', height: 260, marginTop: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--color-text-dim)" style={{ fontSize: '10px' }} />
                    <YAxis stroke="var(--color-text-dim)" style={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-console)', borderColor: 'var(--border-color)' }} />
                    <Line type="monotone" dataKey="LCP" stroke="var(--neon-green)" activeDot={{ r: 8 }} name="LCP (sec)" />
                    <Line type="monotone" dataKey="CLS" stroke="var(--neon-cyan)" name="CLS Ratio" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
