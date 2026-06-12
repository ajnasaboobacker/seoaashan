import React, { useState } from 'react';
import { Shield, GitCommit, GitCompare, RefreshCw, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function DriftView() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  const addLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, isError }]);
  };

  const loadHistory = async (targetUrl) => {
    try {
      const response = await fetch(`/api/drift/history?url=${encodeURIComponent(targetUrl)}`);
      const res = await response.json();
      if (response.ok) {
        setHistory(res);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const captureBaseline = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setCompareResult(null);
    setLogs([]);
    addLog(`Capturing new baseline checkpoint for: ${url}`);

    try {
      const response = await fetch('/api/drift/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, skipCwv: true })
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to capture baseline');
      
      addLog(`Success: Captured baseline #${res.baseline_id}. Title: "${res.summary.title}"`);
      await loadHistory(url);
    } catch (err) {
      setError(err.message);
      addLog(`ERROR: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    if (!url) return;

    setLoading(true);
    setError('');
    setCompareResult(null);
    setLogs([]);
    addLog(`Comparing live state against latest baseline for: ${url}`);

    try {
      const response = await fetch('/api/drift/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, skipCwv: true })
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to run comparison');

      addLog(`Comparison complete. Detected changes: ${res.summary.triggered}`);
      setCompareResult(res);
      await loadHistory(url);
    } catch (err) {
      setError(err.message);
      addLog(`ERROR: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-viewport">
      <form className="console-form" onSubmit={captureBaseline}>
        <div className="input-group">
          <label>URL TO TRACK</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="console-input"
              placeholder="https://example.com/pricing"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                setCompareResult(null);
                setHistory(null);
              }}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="console-btn"
              onClick={() => loadHistory(url)}
              disabled={loading || !url}
              style={{ background: 'var(--bg-console)', color: 'var(--neon-cyan)', border: '1px solid var(--border-color)' }}
            >
              <RefreshCw size={14} /> HISTORY
            </button>
            <button type="submit" className="console-btn" disabled={loading} style={{ background: 'var(--neon-amber)' }}>
              <GitCommit size={14} /> CAPTURE BASELINE
            </button>
            <button type="button" className="console-btn" onClick={runComparison} disabled={loading || !url}>
              <GitCompare size={14} /> RUN COMPARISON
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="panel-card" style={{ borderColor: 'var(--neon-red)' }}>
          <span className="glow-red" style={{ fontWeight: 'bold' }}>ERROR: {error}</span>
        </div>
      )}

      {logs.length > 0 && (
        <div className="terminal-console" style={{ height: '100px' }}>
          {logs.map((log, index) => (
            <div key={index} className="terminal-line">
              <span className="time">[{log.timestamp}]</span>
              <span style={{ color: log.isError ? 'var(--neon-red)' : 'var(--neon-green)' }}>{log.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Diffs Panel */}
      {compareResult && (
        <div className="dashboard-grid animate-fade">
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>COMPARISON DELTA REPORT // BASELINE #{compareResult.baseline_id}</span>
              <GitCompare size={14} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--neon-red)' }}>CRITICAL CHANGES</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{compareResult.summary.critical}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--neon-amber)' }}>WARNING ACCENTS</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{compareResult.summary.warning}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--neon-cyan)' }}>INFO DRIFTS</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{compareResult.summary.info}</div>
              </div>
            </div>

            <div className="findings-list" style={{ marginTop: '12px' }}>
              {compareResult.triggered_findings.map((f, idx) => (
                <div key={idx} className={`finding-row ${f.severity}`}>
                  <h4>
                    <AlertOctagon size={13} style={{ color: f.severity === 'CRITICAL' ? 'var(--neon-red)' : 'var(--neon-amber)' }} />
                    {f.rule.replace(/_/g, ' ')}
                  </h4>
                  <p>{f.message}</p>
                  {(f.old_value || f.new_value) && (
                    <div className="finding-diff">
                      <span className="old">WAS: {String(f.old_value)}</span>
                      <span className="new">IS: {String(f.new_value)}</span>
                    </div>
                  )}
                </div>
              ))}
              {compareResult.triggered_findings.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-green)', padding: '10px 0' }}>
                  <CheckCircle2 size={16} />
                  <span>No delta detected. Current live deployment matches captured baseline exactly.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Log */}
      {history && history.baselines.length > 0 && (
        <div className="panel-card animate-fade">
          <div className="panel-header">
            <span>HISTORICAL CHECKPOINTS ({history.baselines.length})</span>
            <Shield size={14} />
          </div>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <table className="meta-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TIMESTAMP (UTC)</th>
                  <th>TITLE STATE</th>
                  <th>SCHEMAS</th>
                  <th>HTTP STATUS</th>
                </tr>
              </thead>
              <tbody>
                {history.baselines.map((b, idx) => (
                  <tr key={idx}>
                    <td>#{b.id}</td>
                    <td style={{ color: 'var(--color-text-bright)' }}>{new Date(b.timestamp).toLocaleString()}</td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</td>
                    <td><span className="tag-badge cyan">{b.schema_hash ? 'HASH DETECTED' : 'NONE'}</span></td>
                    <td style={{ color: b.status_code === 200 ? 'var(--neon-green)' : 'var(--neon-red)' }}>{b.status_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
