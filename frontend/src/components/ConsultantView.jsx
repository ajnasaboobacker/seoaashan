import React, { useState } from 'react';
import { Sparkles, Cpu, Globe, AlertTriangle, FileText, Copy, Download, Check, Terminal } from 'lucide-react';

export default function ConsultantView() {
  const [vertical, setVertical] = useState('Shopify E-Commerce');
  const [demographics, setDemographics] = useState('Global Audience');
  const [anomalies, setAnomalies] = useState('Slow INP responsiveness on product pages, mobile LCP score above 3.8 seconds, high cart abandonment rates.');
  const [clientProblems, setClientProblems] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [statusLogs, setStatusLogs] = useState([]);

  const addLog = (msg) => {
    setStatusLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roadmap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([roadmap], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${vertical.toLowerCase().replace(/[^a-z0-9]/g, '_')}_seo_roadmap.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRoadmap('');
    setStatusLogs([]);

    addLog("Initializing Gemini SEO Consultation Node...");
    addLog("Resolving user auth session credentials...");
    addLog("Vertical selected: " + vertical);
    addLog("Demographics targeted: " + demographics);

    try {
      addLog("Sending prompt envelope to Gemini-3.5-Flash model...");
      const response = await fetch('/api/consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical, demographics, anomalies, clientProblems })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server connection error during consult execution');
      }

      addLog("Roadmap received! Building local view structures...");
      setRoadmap(data.result);
      addLog("Roadmap successfully compiled and finalized.");
    } catch (err) {
      setError(err.message);
      addLog("ERROR: Consult thread crashed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-viewport" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
      
      {/* Input panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <form className="panel-card" onSubmit={handleSubmit}>
          <div className="panel-header">
            <span>CONSULTANT PARAMETERS</span>
            <Sparkles size={14} style={{ color: 'var(--neon-green)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            
            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>BUSINESS VERTICAL</label>
              <select 
                className="console-input"
                value={vertical} 
                onChange={(e) => setVertical(e.target.value)}
                disabled={loading}
              >
                <option value="Shopify E-Commerce">Shopify E-Commerce</option>
                <option value="SaaS Platform">SaaS Platform</option>
                <option value="Content Engine / Blog">Content Engine / Blog</option>
                <option value="Local Business / Brick-and-Mortar">Local Business / Brick-and-Mortar</option>
                <option value="B2B Enterprise / Agency">B2B Enterprise / Agency</option>
              </select>
            </div>

            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>TARGET DEMOGRAPHIC</label>
              <select 
                className="console-input"
                value={demographics} 
                onChange={(e) => setDemographics(e.target.value)}
                disabled={loading}
              >
                <option value="Global Audience">Global Audience</option>
                <option value="United States (US)">United States (US)</option>
                <option value="European Union (EU)">European Union (EU)</option>
                <option value="Asia Pacific (APAC)">Asia Pacific (APAC)</option>
                <option value="Local City/State Focus">Local City/State Focus</option>
              </select>
            </div>

            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>OBSERVED ANOMALIES</label>
              <textarea
                className="console-input"
                rows="4"
                value={anomalies}
                onChange={(e) => setAnomalies(e.target.value)}
                placeholder="Describe current speed issues, search ranking drops, index warnings..."
                disabled={loading}
                required
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', resize: 'vertical' }}
              />
            </div>

            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>ADDITIONAL CONTEXT / PROBLEMS (OPTIONAL)</label>
              <textarea
                className="console-input"
                rows="3"
                value={clientProblems}
                onChange={(e) => setClientProblems(e.target.value)}
                placeholder="Mention specific competitors, CMS setup (e.g. Next.js, Webflow), target keywords, etc."
                disabled={loading}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              className="console-btn" 
              disabled={loading} 
              style={{ background: 'var(--neon-green)', width: '100%', marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}
            >
              <Cpu size={14} /> GENERATE AUDIT ROADMAP
            </button>
          </div>
        </form>

        {/* Live console logs */}
        {statusLogs.length > 0 && (
          <div className="panel-card">
            <div className="panel-header">
              <span>CONSULTANT PROCESS MONITOR</span>
              <Terminal size={14} />
            </div>
            <div className="terminal-console" style={{ height: '140px', overflowY: 'auto' }}>
              {statusLogs.map((log, idx) => (
                <div key={idx} className="terminal-line" style={{ fontSize: '10px' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Output Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="panel-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
          <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            <span>DIAGNOSTIC ROADMAP</span>
            {roadmap && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="console-btn" onClick={handleCopy} style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--bg-console)', border: '1px solid var(--border-color)' }}>
                  {copied ? <Check size={11} style={{ color: 'var(--neon-green)' }} /> : <Copy size={11} />}
                  {copied ? ' COPIED' : ' COPY'}
                </button>
                <button className="console-btn" onClick={handleDownload} style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--bg-console)', border: '1px solid var(--border-color)' }}>
                  <Download size={11} /> DOWNLOAD
                </button>
              </div>
            )}
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-console)', border: '1px solid var(--border-color)', borderRadius: '4px', position: 'relative' }}>
            {error && (
              <div style={{ display: 'flex', gap: '10px', color: 'var(--neon-red)', fontSize: '12px', border: '1px solid var(--neon-red)', padding: '12px', borderRadius: '4px', background: 'rgba(255,0,0,0.05)' }}>
                <AlertTriangle size={16} />
                <div>
                  <strong>Audit Consult failed:</strong> {error}
                  <div style={{ marginTop: '8px', color: 'var(--color-text-dim)', fontSize: '10px' }}>
                    Make sure you have set a valid Gemini API Key in the <strong>Console Settings</strong> panel or set a local environment variable.
                  </div>
                </div>
              </div>
            )}

            {!roadmap && !loading && !error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px' }}>
                <Globe size={40} style={{ color: 'var(--border-color)', marginBottom: '12px' }} />
                <h4 style={{ color: 'var(--color-text-bright)', margin: '0 0 8px 0' }}>Consultant Idle</h4>
                <p style={{ fontSize: '11px', margin: 0 }}>Configure the business parameters on the left and start the AI engine to generate your customized diagnostic audit roadmap.</p>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--neon-green)' }}>
                <div className="status-active-node" style={{ width: '20px', height: '20px', animation: 'ping 1.5s infinite', background: 'var(--neon-green)', borderRadius: '50%', marginBottom: '16px' }}></div>
                <span>Gemini API thinking... compiling strategic indices...</span>
              </div>
            )}

            {roadmap && (
              <div className="markdown-output" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '1.6', color: 'var(--color-text-bright)' }}>
                {roadmap}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
