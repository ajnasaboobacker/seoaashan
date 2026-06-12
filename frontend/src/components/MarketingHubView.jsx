import React, { useState } from 'react';
import { 
  Globe, Share2, Mail, Shield, Lock, AlertOctagon, CheckCircle2, 
  RefreshCw, Layers, Layout, AlertTriangle, ArrowRight, ExternalLink,
  Activity, Server, Cpu, Sparkles, AlertCircle, HelpCircle
} from 'lucide-react';

export default function MarketingHubView() {
  const [url, setUrl] = useState('');
  const [dkimSelector, setDkimSelector] = useState('default');
  const [activeTab, setActiveTab] = useState('tech'); // tech, social, dns, eco
  const [socialPlatform, setSocialPlatform] = useState('facebook'); // facebook, twitter, linkedin
  const [socialTheme, setSocialTheme] = useState('dark'); // light, dark
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Individual tool states
  const [techData, setTechData] = useState(null);
  const [redirectData, setRedirectData] = useState(null);
  const [sslData, setSslData] = useState(null);
  const [socialData, setSocialData] = useState(null);
  const [dnsData, setDnsData] = useState(null);
  const [carbonData, setCarbonData] = useState(null);

  const addLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, isError }]);
  };

  const runFullSuite = async (e) => {
    if (e) e.preventDefault();
    if (!url) return;

    setLoading(true);
    setLogs([]);
    addLog(`INITIALIZING MARKETING SUITE AUDIT FOR: ${url}`);

    // Extract domain for DNS queries
    let domain = url;
    try {
      if (url.includes('://')) {
        domain = new URL(url).hostname;
      }
    } catch (_) {}

    // Reset previous audit data
    setTechData(null);
    setRedirectData(null);
    setSslData(null);
    setSocialData(null);
    setDnsData(null);
    setCarbonData(null);

    // Call endpoints concurrently
    const tasks = [
      // 1. Tech Stack
      (async () => {
        addLog(`[Tech Stack] Initializing fingerprinter query...`);
        try {
          const res = await fetch('/api/marketing/tech-stack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          setTechData(data);
          addLog(`[Tech Stack] Complete. Detected ${data.technologies?.length || 0} signature tags.`);
        } catch (err) {
          addLog(`[Tech Stack] ERROR: ${err.message}`, true);
        }
      })(),

      // 2. Redirect Chains
      (async () => {
        addLog(`[Redirect Tracer] Scanning redirect status hops...`);
        try {
          const res = await fetch('/api/marketing/redirect-chain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          setRedirectData(data);
          addLog(`[Redirect Tracer] Complete. Hops detected: ${data.hopCount}`);
        } catch (err) {
          addLog(`[Redirect Tracer] ERROR: ${err.message}`, true);
        }
      })(),

      // 3. SSL Inspector
      (async () => {
        addLog(`[SSL Certificate] Initializing port 443 socket connection...`);
        try {
          const res = await fetch('/api/marketing/ssl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          setSslData(data);
          addLog(`[SSL Certificate] Complete. Expiry: ${data.daysRemaining} days remaining.`);
        } catch (err) {
          addLog(`[SSL Certificate] ERROR: ${err.message}`, true);
        }
      })(),

      // 4. Social Tags
      (async () => {
        addLog(`[Social Inspector] Scraping OG/Twitter metadata...`);
        try {
          const res = await fetch('/api/marketing/social-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          setSocialData(data);
          addLog(`[Social Inspector] Complete. Scraped preview images and properties.`);
        } catch (err) {
          addLog(`[Social Inspector] ERROR: ${err.message}`, true);
        }
      })(),

      // 5. DNS Records
      (async () => {
        addLog(`[DNS Deliverability] Resolving TXT records for ${domain}...`);
        try {
          const res = await fetch('/api/marketing/dns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, dkimSelector })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          setDnsData(data);
          addLog(`[DNS Deliverability] Complete. SPF/DMARC status parsed.`);
        } catch (err) {
          addLog(`[DNS Deliverability] ERROR: ${err.message}`, true);
        }
      })(),

      // 6. Carbon Score
      (async () => {
        addLog(`[Carbon Calculator] Auditing green indicators & page size weight...`);
        try {
          const res = await fetch('/api/marketing/carbon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          setCarbonData(data);
          addLog(`[Carbon Calculator] Complete. Score loaded.`);
        } catch (err) {
          addLog(`[Carbon Calculator] ERROR: ${err.message}`, true);
        }
      })()
    ];

    await Promise.all(tasks);
    addLog(`MARKETING SUITE AUDIT COMPLETE // SYSTEM RESTING`);
    setLoading(false);
  };

  // Helper to compute Carbon Grade (A+ to F)
  const getCarbonGrade = (co2) => {
    if (!co2) return 'N/A';
    if (co2 < 0.1) return 'A+';
    if (co2 < 0.18) return 'A';
    if (co2 < 0.3) return 'B';
    if (co2 < 0.5) return 'C';
    if (co2 < 0.8) return 'D';
    if (co2 < 1.3) return 'E';
    return 'F';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'var(--neon-green)';
    if (grade.startsWith('B')) return 'var(--neon-cyan)';
    if (grade.startsWith('C') || grade.startsWith('D')) return 'var(--neon-amber)';
    return 'var(--neon-red)';
  };

  return (
    <div className="view-viewport">
      {/* Search Console Input Block */}
      <form className="console-form" onSubmit={runFullSuite}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-dim)' }}>
            <span>SUITE TARGET CONFIGURATION</span>
            <span>NO API KEYS REQUIRED</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="url"
              className="console-input"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
              required
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-console)', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>DKIM SELECTOR:</span>
              <input
                type="text"
                value={dkimSelector}
                onChange={e => setDkimSelector(e.target.value)}
                disabled={loading}
                style={{ background: 'transparent', border: 'none', color: 'var(--neon-cyan)', width: '70px', outline: 'none', fontStyle: 'monospace' }}
              />
            </div>
            <button type="submit" className="console-btn" disabled={loading} style={{ background: 'var(--neon-green)', color: 'var(--bg-core)', fontWeight: 'bold' }}>
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} 
              {loading ? 'AUDITING...' : 'RUN FULL SUITE AUDIT'}
            </button>
          </div>
        </div>
      </form>

      {/* Terminal Log Console */}
      {logs.length > 0 && (
        <div className="terminal-console" style={{ height: '110px', marginBottom: '16px' }}>
          {logs.map((log, index) => (
            <div key={index} className="terminal-line">
              <span className="time">[{log.timestamp}]</span>
              <span style={{ color: log.isError ? 'var(--neon-red)' : log.message.includes('Complete') ? 'var(--neon-cyan)' : 'var(--color-text-main)' }}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--border-color)', marginBottom: '16px' }}>
        <button 
          className={`nav-btn ${activeTab === 'tech' ? 'active' : ''}`}
          onClick={() => setActiveTab('tech')}
          style={{ borderBottom: activeTab === 'tech' ? '2px solid var(--neon-cyan)' : 'none', padding: '10px 16px', borderRadius: '4px 4px 0 0' }}
        >
          <Layers size={14} /> TECH & SECURITY
        </button>
        <button 
          className={`nav-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
          style={{ borderBottom: activeTab === 'social' ? '2px solid var(--neon-cyan)' : 'none', padding: '10px 16px', borderRadius: '4px 4px 0 0' }}
        >
          <Share2 size={14} /> SOCIAL OG PREVIEW
        </button>
        <button 
          className={`nav-btn ${activeTab === 'dns' ? 'active' : ''}`}
          onClick={() => setActiveTab('dns')}
          style={{ borderBottom: activeTab === 'dns' ? '2px solid var(--neon-cyan)' : 'none', padding: '10px 16px', borderRadius: '4px 4px 0 0' }}
        >
          <Mail size={14} /> DNS & DELIVERABILITY
        </button>
        <button 
          className={`nav-btn ${activeTab === 'eco' ? 'active' : ''}`}
          onClick={() => setActiveTab('eco')}
          style={{ borderBottom: activeTab === 'eco' ? '2px solid var(--neon-cyan)' : 'none', padding: '10px 16px', borderRadius: '4px 4px 0 0' }}
        >
          <Globe size={14} /> SUSTAINABILITY (CO2)
        </button>
      </div>

      {/* TAB 1: TECH & SECURITY */}
      {activeTab === 'tech' && (
        <div className="dashboard-grid animate-fade">
          
          {/* Tech Stack Card */}
          <div className="panel-card">
            <div className="panel-header">
              <span>CMS & STACK FINGERPRINTER</span>
              <Cpu size={14} />
            </div>
            
            {techData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: 'var(--color-text-dim)' }}>SERVER ENGINE:</span> <span style={{ color: 'var(--color-text-bright)' }}>{techData.headers?.server}</span></div>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: 'var(--color-text-dim)' }}>POWERED BY:</span> <span style={{ color: 'var(--color-text-bright)' }}>{techData.headers?.['x-powered-by']}</span></div>
                  <div><span style={{ color: 'var(--color-text-dim)' }}>CACHE:</span> <span style={{ color: 'var(--color-text-bright)', wordBreak: 'break-all' }}>{techData.headers?.['cache-control']}</span></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>SIGNATURE FINGERPRINTS DETECTED ({techData.technologies?.length || 0})</span>
                  {techData.technologies && techData.technologies.length > 0 ? (
                    techData.technologies.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-console)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Server size={12} style={{ color: 'var(--neon-cyan)' }} />
                          <span style={{ color: 'var(--color-text-bright)', fontWeight: 'bold' }}>{t.name}</span>
                          <span className="tag-badge cyan" style={{ fontSize: '9px' }}>{t.category}</span>
                        </div>
                        <span style={{ color: 'var(--neon-green)', fontSize: '11px' }}>{t.confidence}% MATCH</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', border: '1px dashed var(--border-color)', color: 'var(--color-text-dim)', textAlign: 'center' }}>
                      No technology signatures match the audit crawler patterns.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Audit running...' : 'Submit URL above to scan the target stack fingerprint.'}
              </div>
            )}
          </div>

          {/* SSL Certificate Card */}
          <div className="panel-card">
            <div className="panel-header">
              <span>SSL/TLS SOCKET INSPECTOR</span>
              <Lock size={14} />
            </div>

            {sslData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={15} style={{ color: sslData.checks.expired ? 'var(--neon-red)' : 'var(--neon-green)' }} />
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-text-bright)' }}>
                      {sslData.checks.expired ? 'ENCRYPTION EXPIRED' : 'ENCRYPTION ACTIVE'}
                    </span>
                  </div>
                  <span className={`tag-badge ${sslData.checks.expired ? 'red' : 'green'}`}>
                    {sslData.daysRemaining} DAYS LEFT
                  </span>
                </div>

                <div style={{ background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><span style={{ color: 'var(--color-text-dim)' }}>COMMON NAME (CN):</span> <span style={{ color: 'var(--color-text-bright)' }}>{sslData.subject?.CN}</span></div>
                  <div><span style={{ color: 'var(--color-text-dim)' }}>ORGANIZATION:</span> <span style={{ color: 'var(--color-text-bright)' }}>{sslData.subject?.O || 'None'}</span></div>
                  <div><span style={{ color: 'var(--color-text-dim)' }}>ISSUER:</span> <span style={{ color: 'var(--neon-cyan)' }}>{sslData.issuer?.CN || sslData.issuer?.O}</span></div>
                  <div><span style={{ color: 'var(--color-text-dim)' }}>VALID TO:</span> <span style={{ color: 'var(--color-text-bright)' }}>{new Date(sslData.valid_to).toLocaleDateString()}</span></div>
                  <div><span style={{ color: 'var(--color-text-dim)' }}>KEY LENGTH:</span> <span style={{ color: 'var(--color-text-bright)' }}>{sslData.keyBits} bits</span></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>SECURITY CHECKS</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-core)', fontSize: '12px' }}>
                    <span>Key Size Strength (&ge; 2048)</span>
                    <span style={{ color: sslData.checks.keyLengthOk ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                      {sslData.checks.keyLengthOk ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-core)', fontSize: '12px' }}>
                    <span>Expired Verification</span>
                    <span style={{ color: !sslData.checks.expired ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                      {!sslData.checks.expired ? 'PASS' : 'EXPIRED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-core)', fontSize: '12px' }}>
                    <span>Self-Signed Warning Check</span>
                    <span style={{ color: !sslData.checks.selfSigned ? 'var(--neon-green)' : 'var(--neon-amber)' }}>
                      {!sslData.checks.selfSigned ? 'PASS' : 'SELF-SIGNED'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Audit running...' : 'Submit URL above to inspect active SSL/TLS parameters.'}
              </div>
            )}
          </div>

          {/* Redirect Chains Card */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>REDIRECT HOP CHAIN TRACER</span>
              <Activity size={14} />
            </div>

            {redirectData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '12px' }}>
                    AUDITED URL: <span style={{ color: 'var(--color-text-bright)' }}>{redirectData.startUrl}</span>
                  </span>
                  <span className={`tag-badge ${redirectData.hopCount > 2 ? 'amber' : 'green'}`}>
                    {redirectData.hopCount} REDIRECT HOPS
                  </span>
                </div>

                {redirectData.warning && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 12px', background: 'var(--neon-amber-bg)', border: '1px solid var(--neon-amber)', borderRadius: '4px', color: 'var(--neon-amber)', fontSize: '12px' }}>
                    <AlertTriangle size={14} />
                    <span>{redirectData.warning}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', paddingLeft: '8px' }}>
                  {redirectData.chain.map((hop, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: hop.status === 200 ? 'var(--neon-green-bg)' : 'var(--neon-amber-bg)', 
                          border: `1px solid ${hop.status === 200 ? 'var(--neon-green)' : 'var(--neon-amber)'}`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: hop.status === 200 ? 'var(--neon-green)' : 'var(--neon-amber)'
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--color-text-bright)', wordBreak: 'break-all', fontSize: '13px' }}>{hop.url}</span>
                            <span style={{ 
                              color: hop.status === 200 ? 'var(--neon-green)' : 'var(--neon-amber)', 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              HTTP {hop.status || 'ERROR'} {hop.statusText}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {idx < redirectData.chain.length - 1 && (
                        <div style={{ 
                          borderLeft: '1px dashed var(--border-color)', 
                          marginLeft: '12px', 
                          height: '20px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          paddingLeft: '14px' 
                        }}>
                          <ArrowRight size={10} style={{ transform: 'rotate(90deg)', color: 'var(--color-text-dim)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Audit running...' : 'Submit URL above to trace HTTP status loops and hops.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL OG PREVIEW */}
      {activeTab === 'social' && (
        <div className="dashboard-grid animate-fade">
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>SOCIAL GRAPH TAGS & RICH RESULT PREVIEW</span>
              <Share2 size={14} />
            </div>

            {socialData ? (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
                
                {/* Meta details column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>SCRAPED META VALUES</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>OG TITLE</div>
                      <div style={{ color: 'var(--color-text-bright)', fontSize: '12px', fontWeight: 'bold' }}>{socialData.tags['og:title'] || 'Missing'}</div>
                    </div>
                    <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>OG DESCRIPTION</div>
                      <div style={{ color: 'var(--color-text-main)', fontSize: '11px' }}>{socialData.tags['og:description'] || 'Missing'}</div>
                    </div>
                    <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>OG IMAGE URL</div>
                      <div style={{ color: 'var(--neon-cyan)', fontSize: '10px', wordBreak: 'break-all', textDecoration: 'underline' }}>{socialData.tags['og:image'] || 'Missing'}</div>
                    </div>
                    <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>SITE NAME</div>
                      <div style={{ color: 'var(--color-text-bright)', fontSize: '12px' }}>{socialData.tags['og:site_name'] || 'Missing'}</div>
                    </div>
                  </div>
                </div>

                {/* Live Mockup Column */}
                <div>
                  {/* Platform and Theme Selector */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => setSocialPlatform('facebook')}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '11px', 
                          background: socialPlatform === 'facebook' ? '#1877F2' : 'var(--bg-console)', 
                          color: socialPlatform === 'facebook' ? '#fff' : 'var(--color-text-main)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        FACEBOOK POST
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSocialPlatform('twitter')}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '11px', 
                          background: socialPlatform === 'twitter' ? '#fff' : 'var(--bg-console)', 
                          color: socialPlatform === 'twitter' ? '#000' : 'var(--color-text-main)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        X / TWITTER CARD
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSocialPlatform('linkedin')}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '11px', 
                          background: socialPlatform === 'linkedin' ? '#0A66C2' : 'var(--bg-console)', 
                          color: socialPlatform === 'linkedin' ? '#fff' : 'var(--color-text-main)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        LINKEDIN IN-FEED
                      </button>
                    </div>

                    {/* Feed Mode Toggle (Light/Dark) */}
                    {socialPlatform !== 'twitter' && (
                      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-console)', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSocialTheme('light')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '10px',
                            background: socialTheme === 'light' ? 'var(--border-color)' : 'transparent',
                            color: socialTheme === 'light' ? 'var(--color-text-bright)' : 'var(--color-text-dim)',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '3px'
                          }}
                        >
                          LIGHT FEED
                        </button>
                        <button
                          type="button"
                          onClick={() => setSocialTheme('dark')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '10px',
                            background: socialTheme === 'dark' ? 'var(--border-color)' : 'transparent',
                            color: socialTheme === 'dark' ? 'var(--color-text-bright)' : 'var(--color-text-dim)',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '3px'
                          }}
                        >
                          DARK FEED
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Facebook Mockup */}
                  {socialPlatform === 'facebook' && (
                    <div style={{ 
                      background: socialTheme === 'dark' ? '#242526' : '#fff', 
                      color: socialTheme === 'dark' ? '#e4e6eb' : '#1c1e21', 
                      border: `1px solid ${socialTheme === 'dark' ? '#3e4042' : '#dddfe2'}`, 
                      borderRadius: '8px', 
                      maxWidth: '520px', 
                      fontFamily: 'Helvetica, Arial, sans-serif', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: socialTheme === 'dark' ? '#3e4042' : '#dddfe2' }}></div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: socialTheme === 'dark' ? '#e4e6eb' : '#050505' }}>SEO Aashan Engine</div>
                          <div style={{ fontSize: '11px', color: socialTheme === 'dark' ? '#b0b3b8' : '#65676b' }}>Sponsored // Global Reach</div>
                        </div>
                      </div>
                      <div style={{ padding: '0 12px 12px', fontSize: '13px' }}>
                        Scan results generated. Check this link metadata tags.
                      </div>
                      {socialData.tags['og:image'] ? (
                        <img src={socialData.tags['og:image']} alt="OG Preview" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '240px', 
                          background: socialTheme === 'dark' ? '#18191a' : '#f2f3f5', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--neon-amber)',
                          borderBottom: `1px solid ${socialTheme === 'dark' ? '#3e4042' : '#e5e5e5'}`,
                          padding: '20px',
                          textAlign: 'center'
                        }}>
                          <AlertTriangle size={20} style={{ marginBottom: '6px' }} />
                          <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING og:image ]</span>
                          <span style={{ fontSize: '9px', color: 'var(--color-text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>Facebook will crawl page content for generic fallback images.</span>
                        </div>
                      )}
                      <div style={{ 
                        background: socialTheme === 'dark' ? '#18191a' : '#f0f2f5', 
                        padding: '10px 12px', 
                        borderTop: `1px solid ${socialTheme === 'dark' ? '#3e4042' : '#e5e5e5'}` 
                      }}>
                        <div style={{ fontSize: '11px', color: socialTheme === 'dark' ? '#b0b3b8' : '#65676b', textTransform: 'uppercase' }}>
                          {socialData.tags['og:site_name'] || new URL(url).hostname}
                        </div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '14px', 
                          margin: '4px 0', 
                          color: socialTheme === 'dark' ? '#e4e6eb' : '#1c1e21', 
                          textOverflow: 'ellipsis', 
                          overflow: 'hidden', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {socialData.tags['og:title'] ? (
                            socialData.tags['og:title']
                          ) : (
                            <span style={{ color: 'var(--neon-red)', fontStyle: 'italic', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING og:title ]</span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: socialTheme === 'dark' ? '#b0b3b8' : '#65676b', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden', 
                          height: '32px' 
                        }}>
                          {socialData.tags['og:description'] ? (
                            socialData.tags['og:description']
                          ) : (
                            <span style={{ color: 'var(--neon-amber)', fontStyle: 'italic', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING og:description OR META DESCRIPTION ]</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* X / Twitter Mockup */}
                  {socialPlatform === 'twitter' && (
                    <div style={{ background: '#000000', color: '#e7e9ea', border: '1px solid #2f3336', borderRadius: '16px', maxWidth: '500px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto', overflow: 'hidden' }}>
                      {socialData.tags['twitter:image'] ? (
                        <img src={socialData.tags['twitter:image']} alt="Twitter Card" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '240px', 
                          background: '#15202b', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--neon-amber)',
                          borderBottom: '1px solid #2f3336',
                          padding: '20px',
                          textAlign: 'center'
                        }}>
                          <AlertTriangle size={20} style={{ marginBottom: '6px' }} />
                          <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING twitter:image ]</span>
                          <span style={{ fontSize: '9px', color: 'var(--color-text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>Twitter/X feed will show text-only link preview cards.</span>
                        </div>
                      )}
                      <div style={{ padding: '12px', borderTop: '1px solid #2f3336' }}>
                        <div style={{ fontSize: '12px', color: '#71767b' }}>{new URL(url).hostname}</div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', margin: '4px 0 2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {socialData.tags['twitter:title'] || socialData.tags['og:title'] ? (
                            socialData.tags['twitter:title'] || socialData.tags['og:title']
                          ) : (
                            <span style={{ color: 'var(--neon-red)', fontStyle: 'italic', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING twitter:title / og:title ]</span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#71767b', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden', 
                          height: '36px' 
                        }}>
                          {socialData.tags['twitter:description'] || socialData.tags['og:description'] ? (
                            socialData.tags['twitter:description'] || socialData.tags['og:description']
                          ) : (
                            <span style={{ color: 'var(--neon-amber)', fontStyle: 'italic', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING twitter:description / og:description ]</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LinkedIn Mockup */}
                  {socialPlatform === 'linkedin' && (
                    <div style={{ 
                      background: socialTheme === 'dark' ? '#1d2226' : '#fff', 
                      color: socialTheme === 'dark' ? '#f8f9fa' : '#000000e6', 
                      border: `1px solid ${socialTheme === 'dark' ? '#2f3336' : '#e0e0e0'}`, 
                      borderRadius: '8px', 
                      maxWidth: '520px', 
                      fontFamily: '-apple-system, system-ui, sans-serif', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: socialTheme === 'dark' ? '#2f3336' : '#e0e0e0' }}></div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: socialTheme === 'dark' ? '#f8f9fa' : '#000000e6' }}>Global Marketing Audit</div>
                          <div style={{ fontSize: '12px', color: socialTheme === 'dark' ? '#ffffff99' : '#00000099' }}>12,840 followers // Recommended</div>
                        </div>
                      </div>
                      {socialData.tags['og:image'] ? (
                        <img src={socialData.tags['og:image']} alt="LinkedIn card" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '250px', 
                          background: socialTheme === 'dark' ? '#1d2226' : '#f3f6f8', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--neon-amber)',
                          borderBottom: `1px solid ${socialTheme === 'dark' ? '#2f3336' : '#e0e0e0'}`,
                          padding: '20px',
                          textAlign: 'center'
                        }}>
                          <AlertTriangle size={20} style={{ marginBottom: '6px' }} />
                          <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING og:image ]</span>
                          <span style={{ fontSize: '9px', color: 'var(--color-text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>LinkedIn will fallback to default system icons or blank spaces.</span>
                        </div>
                      )}
                      <div style={{ padding: '12px', background: socialTheme === 'dark' ? '#1d2226' : '#f3f6f8' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '14px', 
                          color: socialTheme === 'dark' ? '#f8f9fa' : '#000000e6', 
                          marginBottom: '4px', 
                          textOverflow: 'ellipsis', 
                          overflow: 'hidden', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {socialData.tags['og:title'] ? (
                            socialData.tags['og:title']
                          ) : (
                            <span style={{ color: 'var(--neon-red)', fontStyle: 'italic', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>[ ✕ WARNING: MISSING og:title ]</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: socialTheme === 'dark' ? '#ffffff99' : '#00000099' }}>
                          {new URL(url).hostname}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Audit running...' : 'Submit URL above to scrape metadata and render social preview cards.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DNS & DELIVERABILITY */}
      {activeTab === 'dns' && (
        <div className="dashboard-grid animate-fade">
          
          {/* SPF Validator */}
          <div className="panel-card">
            <div className="panel-header">
              <span>SPF SENDER POLICY FRAMEWORK</span>
              <Mail size={14} />
            </div>

            {dnsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                    STATUS: {dnsData.spf.status.toUpperCase()}
                  </span>
                  <span className={`tag-badge ${dnsData.spf.status === 'valid' ? 'green' : 'red'}`}>
                    {dnsData.spf.status === 'valid' ? 'ACTIVE' : 'MISSING'}
                  </span>
                </div>

                {dnsData.spf.record ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)', fontSize: '11px', wordBreak: 'break-all', fontStyle: 'monospace', color: 'var(--neon-green)' }}>
                      {dnsData.spf.record}
                    </div>

                    {dnsData.spf.warnings.map((w, idx) => (
                      <div key={idx} style={{ color: 'var(--neon-red)', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <AlertCircle size={12} />
                        <span>{w}</span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>PARSED MECHANISMS:</span>
                      {dnsData.spf.mechanisms.map((mech, idx) => (
                        <div key={idx} style={{ display: 'flex', justify: 'space-between', padding: '6px 8px', background: 'var(--bg-core)', fontSize: '11px' }}>
                          <span style={{ color: 'var(--neon-cyan)' }}>{mech.type}</span>
                          <span style={{ color: 'var(--color-text-bright)' }}>{mech.value}</span>
                        </div>
                      ))}
                      {dnsData.spf.all && (
                        <div style={{ display: 'flex', justify: 'space-between', padding: '6px 8px', background: 'var(--bg-console)', border: '1px solid var(--border-color)', fontSize: '11px' }}>
                          <span style={{ color: 'var(--neon-amber)' }}>fallback (all)</span>
                          <span style={{ color: 'var(--color-text-bright)' }}>{dnsData.spf.all}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', border: '1px dashed var(--neon-red)', color: 'var(--neon-red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={14} />
                    <span>No SPF TXT record was resolved for this domain. Email spoofing is highly possible.</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Audit running...' : 'Submit domain above to parse SPF policies.'}
              </div>
            )}
          </div>

          {/* DMARC Policy Analyzer */}
          <div className="panel-card">
            <div className="panel-header">
              <span>DMARC DOMAIN AUTHENTICATION</span>
              <Shield size={14} />
            </div>

            {dnsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                    STATUS: {dnsData.dmarc.status.toUpperCase()}
                  </span>
                  <span className={`tag-badge ${dnsData.dmarc.status === 'valid' ? 'green' : 'red'}`}>
                    {dnsData.dmarc.status === 'valid' ? 'ALIGNED' : 'MISSING'}
                  </span>
                </div>

                {dnsData.dmarc.record ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)', fontSize: '11px', wordBreak: 'break-all', fontStyle: 'monospace', color: 'var(--neon-green)' }}>
                      {dnsData.dmarc.record}
                    </div>

                    {dnsData.dmarc.warnings.map((w, idx) => (
                      <div key={idx} style={{ color: 'var(--neon-amber)', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <AlertCircle size={12} />
                        <span>{w}</span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>DMARC POLICIES DECLARED:</span>
                      {Object.entries(dnsData.dmarc.tags).map(([tag, val], idx) => (
                        <div key={idx} style={{ display: 'flex', justify: 'space-between', padding: '6px 8px', background: 'var(--bg-core)', fontSize: '11px' }}>
                          <span style={{ color: 'var(--neon-cyan)' }}>{tag} (Tag)</span>
                          <span style={{ color: 'var(--color-text-bright)' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', border: '1px dashed var(--neon-red)', color: 'var(--neon-red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={14} />
                    <span>DMARC record is missing. Spoofed emails will not be monitored or blocked.</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Audit running...' : 'Submit domain above to retrieve DMARC parameters.'}
              </div>
            )}
          </div>

          {/* DKIM Verification */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>DKIM SELECTOR RESOLVER</span>
              <Mail size={14} />
            </div>

            {dnsData ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px' }}>
                    QUERY SELECTOR: <span style={{ color: 'var(--neon-cyan)' }}>{dnsData.dkim.selector}._domainkey.{dnsData.domain}</span>
                  </span>
                  <span className={`tag-badge ${dnsData.dkim.status === 'valid' ? 'green' : 'amber'}`}>
                    {dnsData.dkim.status === 'valid' ? 'VERIFIED PUBLIC KEY FOUND' : 'NOT FOUND IN SELECTOR'}
                  </span>
                </div>

                {dnsData.dkim.record ? (
                  <div style={{ background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)', fontSize: '11px', wordBreak: 'break-all', fontStyle: 'monospace', color: 'var(--neon-cyan)' }}>
                    {dnsData.dkim.record}
                  </div>
                ) : (
                  <div style={{ padding: '12px', border: '1px dashed var(--border-color)', color: 'var(--color-text-dim)', fontSize: '12px' }}>
                    No public key returned for selector: "{dnsData.dkim.selector}". Make sure you typed the correct selector (e.g. "google", "default", "s1", "mandrill").
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Querying selector...' : 'Submit target domain and selector parameter above to resolve public key.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SUSTAINABILITY */}
      {activeTab === 'eco' && (
        <div className="dashboard-grid animate-fade">
          
          {/* Carbon gauge card */}
          <div className="panel-card">
            <div className="panel-header">
              <span>PAGE CARBON EMISSIONS</span>
              <Globe size={14} />
            </div>

            {carbonData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '10px 0' }}>
                <div style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '50%', border: '6px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>EMISSIONS</span>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                    {carbonData.co2Grams.toFixed(3)}g
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>CO2 / VIEW</span>
                  
                  {/* Grade Badge absolute positioned */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    right: '-10px', 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-card)', 
                    border: `2px solid ${getGradeColor(getCarbonGrade(carbonData.co2Grams))}`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold', 
                    color: getGradeColor(getCarbonGrade(carbonData.co2Grams)),
                    fontSize: '13px'
                  }}>
                    {getCarbonGrade(carbonData.co2Grams)}
                  </div>
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span>HOSTING STATE:</span> 
                    <span style={{ color: carbonData.renewable ? 'var(--neon-green)' : 'var(--neon-amber)', fontWeight: 'bold' }}>
                      {carbonData.renewable ? '♻ RENEWABLE HOST' : '⚡ GRID POWERED'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                    SOURCE: {carbonData.source === 'api' ? 'WebsiteCarbon API Live Data' : 'Page Weight Assessment Estimator'}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Calculating...' : 'Submit URL above to query page weight carbon emissions.'}
              </div>
            )}
          </div>

          {/* Environmental Equivalents */}
          <div className="panel-card">
            <div className="panel-header">
              <span>ENVIRONMENTAL EQUIVALENCE DIRECTIVES</span>
              <Globe size={14} />
            </div>

            {carbonData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                  ESTIMATED IMPACT BASED ON 10,000 MONTHLY VIEWS ({(carbonData.co2Grams * 10000 * 12 / 1000).toFixed(1)}kg CO2/YEAR)
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '24px' }}>🌳</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                        {Math.max(1, Math.round((carbonData.co2Grams * 10000 * 12) / 22000))} Trees / Year
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Equivalent number of fully grown trees required to absorb this CO2.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '24px' }}>🚗</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                        {Math.round((carbonData.co2Grams * 10000 * 12) / 404)} Miles / Year
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Equivalent distance driven in a standard gasoline internal combustion vehicle.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '24px' }}>💡</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                        {(carbonData.energy * 10000 * 12).toFixed(1)} kWh / Year
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Total grid electricity consumed transferring these resources over network.</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                {loading ? 'Calculating...' : 'Submit URL above to translate page weight to eco impact.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
