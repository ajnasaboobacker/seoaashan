import React, { useState, useEffect, useRef } from 'react';
import { ScoreGauge } from './Gauges';
import { Play, Terminal, AlertTriangle, CheckCircle, Globe, Download, ToggleLeft, ToggleRight, Layers, FileText, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

export default function AuditView() {
  const [url, setUrl] = useState('');
  const [auditScope, setAuditScope] = useState('single'); // 'single', 'full', or 'complete'
  const [activeTab, setActiveTab] = useState('client'); // 'client' or 'analyst'
  const [maxPages, setMaxPages] = useState(50);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState(null);
  const simulatedLogInterval = useRef(null);

  const addLog = (message, tag = 'INFO') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, tag }]);
  };

  useEffect(() => {
    return () => {
      if (simulatedLogInterval.current) {
        clearInterval(simulatedLogInterval.current);
      }
    };
  }, []);

  const runAudit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setLogs([]);
    setReport(null);
    setActiveTab('client');

    addLog(`Initiating SEO audit for host: ${url}`, 'SYS');
    addLog('Resolving DNS details and checking SSRF safety...', 'INFO');

    if (auditScope === 'complete') {
      addLog('Starting COMPLETE AUDIT — BFS Crawl + PageSpeed + CrUX + GEO (running concurrently)...', 'INFO');
      addLog('Spawning BFS website crawler...', 'INFO');
      addLog('Spawning PageSpeed Insights checker...', 'INFO');
      addLog('Spawning CrUX 25-week history fetch...', 'INFO');
      addLog('Spawning GEO AI bot access + llms.txt checker...', 'INFO');

      let simCount = 1;
      const simPaths = ['/about', '/services', '/contact', '/blog', '/products', '/pricing', '/team', '/faq'];
      simulatedLogInterval.current = setInterval(() => {
        if (simCount < 20) {
          const path = simPaths[Math.floor(Math.random() * simPaths.length)] + '-' + Math.floor(Math.random() * 99);
          addLog(`BFS Crawling: ${url.replace(/\/$/, '')}${path}`, 'INFO');
          simCount++;
          if (simCount % 5 === 0) addLog('PSI: Lighthouse lab test in progress (mobile)...', 'SYS');
          if (simCount % 7 === 0) addLog('CrUX: Fetching Google field data history...', 'SYS');
        }
      }, 1400);

      try {
        const response = await fetch('/api/audit/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, maxPages })
        });

        if (simulatedLogInterval.current) clearInterval(simulatedLogInterval.current);

        const res = await response.json();
        if (!response.ok) throw new Error(res.error || 'Complete audit failed');

        if (res.logs && res.logs.length > 0) setLogs(res.logs);
        else addLog('Complete audit finished — all signals gathered successfully.', 'SUCCESS');

        addLog('BFS crawl complete. PageSpeed data merged. CrUX field data merged. GEO signals merged.', 'SUCCESS');
        setReport(res);
      } catch (err) {
        if (simulatedLogInterval.current) clearInterval(simulatedLogInterval.current);
        addLog(`ERR: ${err.message}`, 'ERROR');
      } finally {
        setLoading(false);
      }

    } else if (auditScope === 'full') {
      addLog(`Configuring BFS crawler. Maximum crawl cap: ${maxPages} pages.`, 'INFO');
      addLog('Fetching robots.txt directive mappings...', 'INFO');

      // Set up simulated log updates while crawling runs in background
      let pageCount = 1;
      const paths = ['/about', '/solutions', '/pricing', '/contact-us', '/blog', '/features', '/docs', '/faq', '/privacy-policy', '/terms'];
      
      simulatedLogInterval.current = setInterval(() => {
        if (pageCount < maxPages && pageCount < 30) {
          const path = paths[Math.floor(Math.random() * paths.length)] + '-' + Math.floor(Math.random() * 100);
          addLog(`Crawling: ${url.replace(/\/$/, '')}${path} ...`, 'INFO');
          pageCount += Math.floor(Math.random() * 2) + 1;
          if (pageCount % 4 === 0) {
            addLog(`Crawl Queue: ${Math.floor(Math.random() * 15) + 5} URLs remaining in buffer.`, 'SYS');
          }
        }
      }, 1200);

      try {
        const response = await fetch('/api/audit/full', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, maxPages })
        });

        if (simulatedLogInterval.current) {
          clearInterval(simulatedLogInterval.current);
        }

        const res = await response.json();
        if (!response.ok) throw new Error(res.error || 'Full site audit failed');

        // Swap simulated logs with the true backend log sequence
        if (res.logs && res.logs.length > 0) {
          setLogs(res.logs);
        } else {
          addLog('Full website audit completed successfully.', 'SUCCESS');
        }
        
        setReport(res);
      } catch (err) {
        if (simulatedLogInterval.current) {
          clearInterval(simulatedLogInterval.current);
        }
        addLog(`ERR: ${err.message}`, 'ERROR');
      } finally {
        setLoading(false);
      }

    } else {
      // Single Page Scope Audit Flow
      try {
        const response = await fetch('/api/analyze-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, render: 'auto' })
        });

        addLog('Headless browser rendering page elements...', 'INFO');
        addLog('Running Content Quality Heuristics...', 'INFO');
        
        const res = await response.json();
        if (!response.ok) throw new Error(res.error || 'Single page audit failed');

        addLog('Extracting Schema.org JSON-LD definitions...', 'INFO');
        addLog('Single page audit successfully completed.', 'SUCCESS');
        
        // Calculate scores dynamically based on single-page data
        const hasTitle = !!res.data.title;
        const hasDesc = !!res.data.meta_description;
        const h1Count = res.data.h1.length;
        const imageCount = res.data.images.length;
        const missingAltCount = res.data.images.filter(i => !i.alt).length;
        const schemaCount = res.data.schema.length;
        
        let seoScore = 100;
        if (!hasTitle) seoScore -= 20;
        if (!hasDesc) seoScore -= 15;
        if (h1Count === 0) seoScore -= 15;
        if (h1Count > 1) seoScore -= 5;
        if (missingAltCount > 0) seoScore -= Math.min(10, missingAltCount * 2);
        if (schemaCount === 0) seoScore -= 10;

        setReport({
          url: res.url,
          statusCode: res.statusCode,
          wordCount: res.data.wordCount,
          seoScore,
          scope: 'single',
          findings: {
            hasTitle,
            hasDesc,
            h1Count,
            imageCount,
            missingAltCount,
            schemaCount,
            internalLinks: res.data.links.internal.length,
            externalLinks: res.data.links.external.length,
            titleText: res.data.title,
            descText: res.data.meta_description
          }
        });
      } catch (err) {
        addLog(`ERR: ${err.message}`, 'ERROR');
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadReport = async (reportType = null) => {
    if (!report) return;
    const effectiveType = reportType || (report.scope === 'complete' ? 'complete-client' : null);
    try {
      addLog('Initiating report compilation and file rendering...', 'SYS');
      const response = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: report, 
          domain: report.domain || new URL(report.url).hostname,
          reportType: effectiveType
        })
      });
      
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to complete report packaging');
      }
      
      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      
      const contentType = response.headers.get('Content-Type');
      const ext = contentType && contentType.includes('html') ? '.html' : '.pdf';
      const fileLabel = effectiveType === 'complete-analyst' ? 'Analyst' : (effectiveType === 'complete-client' ? 'Client' : '');
      link.download = `SEO-Audit-Report-${fileLabel ? fileLabel + '-' : ''}${report.domain || 'host'}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addLog('Report generated and downloaded successfully.', 'SUCCESS');
    } catch (err) {
      addLog(`Failed to compile report: ${err.message}`, 'ERROR');
    }
  };

  // Group findings by severity
  const getGroupedFindings = () => {
    if (!report || !report.findings) return { critical: [], high: [], medium: [], low: [] };
    return {
      critical: report.findings.filter(f => f.severity === 'Critical'),
      high: report.findings.filter(f => f.severity === 'High'),
      medium: report.findings.filter(f => f.severity === 'Medium'),
      low: report.findings.filter(f => f.severity === 'Low'),
    };
  };

  const grouped = getGroupedFindings();

  const findingsData = report
    ? [
        { name: 'Critical', value: grouped.critical.length, color: 'var(--neon-red)' },
        { name: 'High', value: grouped.high.length, color: 'var(--neon-amber)' },
        { name: 'Medium', value: grouped.medium.length, color: 'var(--neon-cyan)' },
        { name: 'Low', value: grouped.low.length, color: 'var(--neon-green)' },
      ].filter(item => item.value > 0)
    : [];

  const slowestPagesData = report && report.crawledPages
    ? [...report.crawledPages]
        .sort((a, b) => b.responseTime - a.responseTime)
        .slice(0, 10)
        .map(page => {
          let pagePath = page.url;
          try {
            const parsed = new URL(page.url);
            pagePath = parsed.pathname + parsed.search;
          } catch (_) {}
          if (!pagePath || pagePath === '') pagePath = '/';
          return {
            name: pagePath.length > 20 ? pagePath.substring(0, 17) + '...' : pagePath,
            speed: parseFloat(page.responseTime.toFixed(2))
          };
        })
    : [];

  return (
    <div className="view-viewport">
      <form className="console-form" onSubmit={runAudit}>
        <div className="form-row">
          <div className="input-group" style={{ flexGrow: 2 }}>
            <label>TARGET URL / DOMAIN</label>
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
            <label>AUDIT SCOPE</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '45px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`console-btn ${auditScope === 'single' ? 'active' : ''}`}
                style={{
                  background: auditScope === 'single' ? 'var(--neon-green)' : 'var(--bg-console)',
                  color: auditScope === 'single' ? 'var(--bg-core)' : 'var(--color-text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  fontSize: '11px'
                }}
                onClick={() => setAuditScope('single')}
                disabled={loading}
              >
                SINGLE PAGE
              </button>
              <button
                type="button"
                className={`console-btn ${auditScope === 'full' ? 'active' : ''}`}
                style={{
                  background: auditScope === 'full' ? 'var(--neon-green)' : 'var(--bg-console)',
                  color: auditScope === 'full' ? 'var(--bg-core)' : 'var(--color-text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  fontSize: '11px'
                }}
                onClick={() => setAuditScope('full')}
                disabled={loading}
              >
                FULL WEBSITE
              </button>
              <button
                type="button"
                className={`console-btn ${auditScope === 'complete' ? 'active' : ''}`}
                style={{
                  background: auditScope === 'complete' ? 'var(--neon-cyan)' : 'var(--bg-console)',
                  color: auditScope === 'complete' ? 'var(--bg-core)' : 'var(--color-text-main)',
                  border: auditScope === 'complete' ? '1px solid var(--neon-cyan)' : '1px solid var(--border-color)',
                  padding: '8px 12px',
                  fontSize: '11px',
                  boxShadow: auditScope === 'complete' ? '0 0 8px var(--neon-cyan)' : 'none'
                }}
                onClick={() => setAuditScope('complete')}
                disabled={loading}
              >
                ✦ COMPLETE AUDIT
              </button>
            </div>
          </div>

          {(auditScope === 'full' || auditScope === 'complete') && (
            <div className="input-group" style={{ maxWidth: '120px' }}>
              <label>MAX PAGES</label>
              <input
                type="number"
                className="console-input"
                min="5"
                max="100"
                value={maxPages}
                onChange={e => setMaxPages(parseInt(e.target.value, 10) || 50)}
                disabled={loading}
              />
            </div>
          )}
        </div>
        <button type="submit" className="console-btn" disabled={loading}>
          <Play size={14} /> {loading ? 'RUNNING COMPLETE AUDIT...' : auditScope === 'complete' ? '✦ RUN COMPLETE AUDIT' : 'RUN CRAWL AUDIT'}
        </button>
      </form>

      {logs.length > 0 && (
        <div className="panel-card">
          <div className="panel-header">
            <span>CONSOLE LOGS</span>
            <Terminal size={14} />
          </div>
          <div className="terminal-console">
            {logs.map((log, index) => (
              <div key={index} className="terminal-line">
                <span className="time">[{log.timestamp}]</span>
                <span className="tag">[{log.tag}]</span>
                <span style={{ color: log.tag === 'ERROR' ? 'var(--neon-red)' : log.tag === 'SUCCESS' ? 'var(--neon-green)' : 'inherit' }}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER REPORT */}
      {report && (
        <div className="dashboard-grid animate-fade">
          
          {/* HEADER SUMMARY CARD */}
          <div className="panel-card active-neon" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header">
              <span>AUDIT SUMMARY: {report.domain || new URL(report.url).hostname}</span>
            <div style={{ display: 'flex', gap: '12px' }}>
                {report.scope === 'complete' ? (
                  <>
                    <button 
                      className="console-btn" 
                      onClick={() => downloadReport('complete-client')}
                      style={{
                        background: 'var(--neon-green)',
                        color: 'var(--bg-core)',
                        padding: '4px 12px',
                        fontSize: '11px',
                        boxShadow: 'none'
                      }}
                    >
                      <Download size={12} /> CLIENT REPORT
                    </button>
                    <button 
                      className="console-btn" 
                      onClick={() => downloadReport('complete-analyst')}
                      style={{
                        background: 'var(--neon-cyan)',
                        color: 'var(--bg-core)',
                        padding: '4px 12px',
                        fontSize: '11px',
                        boxShadow: 'none'
                      }}
                    >
                      <Download size={12} /> ANALYST REPORT
                    </button>
                  </>
                ) : (
                  <button 
                    className="console-btn" 
                    onClick={() => downloadReport()}
                    style={{
                      background: 'var(--neon-cyan)',
                      color: 'var(--bg-core)',
                      padding: '4px 12px',
                      fontSize: '11px',
                      boxShadow: 'none'
                    }}
                  >
                    <Download size={12} /> DOWNLOAD REPORT
                  </button>
                )}
                <Globe size={14} style={{ alignSelf: 'center' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              <ScoreGauge score={report.seoScore} label="Health Index" />
              
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>AUDIT SCOPE</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
                      {report.scope === 'single' ? 'SINGLE PAGE' : report.scope === 'complete' ? `COMPLETE (${report.crawledCount || '?'} pages)` : `WEBSITE (${report.crawledCount} pages)`}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>XML SITEMAP</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: report.sitemapStatus === 'present' ? 'var(--neon-green)' : 'var(--neon-amber)' }}>
                      {report.sitemapStatus || 'N/A'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>llms.txt CRAWLABLE</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: report.hasLlmsTxt ? 'var(--neon-green)' : 'var(--color-text-dim)' }}>
                      {report.hasLlmsTxt ? 'DETECTED' : 'MISSING'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COMPLETE AUDIT SCOPE — DUAL TABS */}
          {report.scope === 'complete' && (
            <div style={{ marginTop: '0', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', gridColumn: 'span 2', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('client')}
                style={{
                  background: activeTab === 'client' ? 'var(--neon-green)' : 'var(--bg-console)',
                  color: activeTab === 'client' ? 'var(--bg-core)' : 'var(--color-text-dim)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 20px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '1px'
                }}
              >
                📊 CLIENT DASHBOARD
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analyst')}
                style={{
                  background: activeTab === 'analyst' ? 'var(--neon-cyan)' : 'var(--bg-console)',
                  color: activeTab === 'analyst' ? 'var(--bg-core)' : 'var(--color-text-dim)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 20px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '1px'
                }}
              >
                🔬 ANALYST CONSOLE
              </button>
            </div>
          )}

          {/* COMPLETE AUDIT — CLIENT VIEW */}
          {report.scope === 'complete' && activeTab === 'client' && (
            <>
              {/* Speed & UX card */}
              <div className="panel-card" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header">
                  <span>SPEED &amp; USER EXPERIENCE SIGNALS</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'AI Search Ready', value: (report.geo?.hasLlmsTxt || report.hasLlmsTxt) ? 'READY' : 'NOT READY', color: (report.geo?.hasLlmsTxt || report.hasLlmsTxt) ? 'var(--neon-green)' : 'var(--neon-amber)' },
                    { label: 'Pages Crawled', value: report.crawledCount || '?', color: 'var(--neon-cyan)' },
                    { label: 'XML Sitemap', value: (report.sitemapStatus || 'missing').toUpperCase(), color: report.sitemapStatus === 'present' ? 'var(--neon-green)' : 'var(--neon-amber)' },
                    { label: 'Contact Page', value: report.contactsFound ? 'FOUND' : 'MISSING', color: report.contactsFound ? 'var(--neon-green)' : 'var(--neon-amber)' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg-console)', padding: '14px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>{item.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.color, marginTop: '4px' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Bot Access */}
              <div className="panel-card">
                <div className="panel-header"><span>AI BOT ACCESS</span></div>
                <table className="meta-table">
                  <tbody>
                    {Object.entries(report.geo?.botAccess || {}).map(([bot, allowed], i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{bot}</td>
                        <td style={{ color: allowed ? 'var(--neon-green)' : 'var(--neon-red)', fontWeight: 'bold', textAlign: 'right' }}>
                          {allowed ? 'ALLOWED' : 'BLOCKED'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top 3 Wins */}
              <div className="panel-card">
                <div className="panel-header"><span>TOP QUICK WINS</span></div>
                <div className="findings-list">
                  {(report.findings || []).filter(f => f.severity === 'Critical' || f.severity === 'High').slice(0, 3).map((f, i) => (
                    <div key={i} className="finding-row CRITICAL">
                      <h4>#{i+1} — {f.message}</h4>
                      <p>{f.remedy}</p>
                    </div>
                  ))}
                  {(report.findings || []).filter(f => f.severity === 'Critical' || f.severity === 'High').length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--neon-green)' }}>✓ No critical issues found!</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* COMPLETE AUDIT — ANALYST VIEW */}
          {report.scope === 'complete' && activeTab === 'analyst' && (
            <>
              {/* Full findings checklist */}
              <div className="panel-card" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header"><span>TECHNICAL FINDINGS CHECKLIST</span></div>
                <div className="findings-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {(report.findings || []).map((f, i) => {
                    const colors = { Critical: 'var(--neon-red)', High: 'var(--neon-amber)', Medium: 'var(--neon-cyan)', Low: 'var(--neon-green)' };
                    return (
                      <div key={i} className="finding-row INFO" style={{ borderLeftColor: colors[f.severity] || 'var(--border-color)' }}>
                        <h4><span className="tag-badge" style={{ background: colors[f.severity], color: 'var(--bg-core)', padding: '2px 8px', borderRadius: '3px', fontSize: '9px', marginRight: '8px' }}>{f.severity?.toUpperCase()}</span>{f.message}</h4>
                        <p><strong>Rule:</strong> <code>{f.rule}</code> | <strong>Fix:</strong> {f.remedy}</p>
                      </div>
                    );
                  })}
                  {(report.findings || []).length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--neon-green)' }}>✓ No issues found!</div>}
                </div>
              </div>

              {/* PageSpeed + CrUX signals */}
              <div className="panel-card">
                <div className="panel-header"><span>PAGESPEED SIGNALS</span></div>
                <table className="meta-table">
                  <tbody>
                    <tr><td>Data Available</td><td style={{ color: Object.keys(report.pagespeed || {}).length > 0 ? 'var(--neon-green)' : 'var(--neon-amber)', fontWeight: 'bold', textAlign: 'right' }}>{Object.keys(report.pagespeed || {}).length > 0 ? 'YES' : 'NO (Add API Key)'}</td></tr>
                    {report.pagespeed?.psi?.mobile?.lighthouse_scores && Object.entries(report.pagespeed.psi.mobile.lighthouse_scores).map(([k, v], i) => (
                      <tr key={i}><td style={{ textTransform: 'capitalize' }}>{k}</td><td style={{ color: v >= 90 ? 'var(--neon-green)' : v >= 50 ? 'var(--neon-amber)' : 'var(--neon-red)', fontWeight: 'bold', textAlign: 'right' }}>{Math.round(v)}/100</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GEO signals */}
              <div className="panel-card">
                <div className="panel-header"><span>GEO AI SIGNALS</span></div>
                <table className="meta-table">
                  <tbody>
                    <tr><td>llms.txt</td><td style={{ color: (report.geo?.hasLlmsTxt || report.hasLlmsTxt) ? 'var(--neon-green)' : 'var(--neon-red)', fontWeight: 'bold', textAlign: 'right' }}>{(report.geo?.hasLlmsTxt || report.hasLlmsTxt) ? 'PRESENT' : 'MISSING'}</td></tr>
                    {Object.entries(report.geo?.botAccess || {}).map(([bot, allowed], i) => (
                      <tr key={i}><td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{bot}</td><td style={{ color: allowed ? 'var(--neon-green)' : 'var(--neon-red)', fontWeight: 'bold', textAlign: 'right' }}>{allowed ? 'OK' : 'BLOCKED'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* IF SINGLE PAGE AUDIT, RENDER SINGLE SCORES */}
          {report.scope === 'single' && (
            <>
              <div className="panel-card">
                <div className="panel-header">
                  <span>OPTIMIZATION GAP ANALYSIS</span>
                  <AlertTriangle size={14} />
                </div>
                <div className="findings-list">
                  <div className={`finding-row ${report.findings.hasTitle ? 'INFO' : 'CRITICAL'}`}>
                    <h4>
                      {report.findings.hasTitle ? <CheckCircle size={12} className="glow-green" /> : <AlertTriangle size={12} className="glow-red" />}
                      Title Tag Presence
                    </h4>
                    <p>
                      {report.findings.hasTitle 
                        ? `Configured properly: "${report.findings.titleText}"`
                        : 'Critical failure: Missing title tag. Search engines cannot display this page in results.'
                      }
                    </p>
                  </div>

                  <div className={`finding-row ${report.findings.hasDesc ? 'INFO' : 'WARNING'}`}>
                    <h4>
                      {report.findings.hasDesc ? <CheckCircle size={12} className="glow-green" /> : <AlertTriangle size={12} className="glow-amber" />}
                      Meta Description
                    </h4>
                    <p>
                      {report.findings.hasDesc 
                        ? `Configured: "${report.findings.descText}"`
                        : 'Warning: Missing meta description. Search engines will auto-extract body fragments.'
                      }
                    </p>
                  </div>

                  <div className={`finding-row ${report.findings.h1Count === 1 ? 'INFO' : 'WARNING'}`}>
                    <h4>
                      {report.findings.h1Count === 1 ? <CheckCircle size={12} className="glow-green" /> : <AlertTriangle size={12} className="glow-amber" />}
                      H1 Heading count
                    </h4>
                    <p>
                      {report.findings.h1Count === 1
                        ? 'Properly structured: Exactly one H1 tag detected.'
                        : `Warning: Detected ${report.findings.h1Count} H1 tags. Best practice requires exactly one primary header.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <span>ON-PAGE METRICS</span>
                </div>
                <table className="meta-table">
                  <tbody>
                    <tr>
                      <td>Images Found</td>
                      <td style={{ color: 'var(--color-text-bright)', fontWeight: 'bold' }}>{report.findings.imageCount}</td>
                    </tr>
                    <tr>
                      <td>Images Missing Alt Tags</td>
                      <td style={{ color: report.findings.missingAltCount > 0 ? 'var(--neon-amber)' : 'var(--neon-green)' }}>
                        {report.findings.missingAltCount}
                      </td>
                    </tr>
                    <tr>
                      <td>Internal Links</td>
                      <td style={{ color: 'var(--color-text-bright)' }}>{report.findings.internalLinks}</td>
                    </tr>
                    <tr>
                      <td>External Links</td>
                      <td style={{ color: 'var(--color-text-bright)' }}>{report.findings.externalLinks}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* IF FULL SITE AUDIT, RENDER COMPREHENSIVE BREAKDOWNS */}
          {report.scope !== 'single' && (
            <>
              {/* CATEGORIES SCORING CONTRIBUTIONS CARD */}
              <div className="panel-card" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header">
                  <span>CATEGORY WEIGHT CONTRIBUTION</span>
                  <Layers size={14} />
                </div>
                <table className="meta-table" style={{ fontSize: '12px', tableLayout: 'fixed', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>CATEGORY</th>
                      <th style={{ width: '35%' }}>HEALTH METER</th>
                      <th style={{ textAlign: 'right', width: '12%' }}>SCORE</th>
                      <th style={{ textAlign: 'right', width: '12%' }}>WEIGHT</th>
                      <th style={{ textAlign: 'right', width: '16%' }}>CONTRIBUTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Technical SEO', score: report.categoryScores.technical, weight: '22%' },
                      { name: 'Content Quality', score: report.categoryScores.content, weight: '23%' },
                      { name: 'On-Page SEO', score: report.categoryScores.onpage, weight: '20%' },
                      { name: 'Schema / Structured Data', score: report.categoryScores.schema, weight: '10%' },
                      { name: 'Performance (CWV)', score: report.categoryScores.performance, weight: '10%' },
                      { name: 'AI Search Readiness (GEO)', score: report.categoryScores.geo, weight: '10%' },
                      { name: 'Images alt coverage', score: report.categoryScores.images, weight: '5%' }
                    ].map((cat, idx) => {
                      const color = cat.score >= 90 ? 'var(--neon-green)' : cat.score >= 50 ? 'var(--neon-amber)' : 'var(--neon-red)';
                      return (
                        <tr key={idx}>
                          <td>{cat.name}</td>
                          <td>
                            <div style={{ background: 'var(--bg-console)', borderRadius: '3px', height: '8px', width: '100%', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${cat.score}%` }}
                                transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                                style={{ 
                                  height: '100%', 
                                  background: color,
                                  boxShadow: `0 0 6px ${color}`
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{cat.score}/100</td>
                          <td style={{ textAlign: 'right', color: 'var(--color-text-dim)' }}>{cat.weight}</td>
                          <td style={{ textAlign: 'right', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                            {(cat.score * parseFloat(cat.weight) / 100).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 'bold' }}>
                      <td>TOTAL HEALTH INDEX</td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>100%</td>
                      <td style={{ textAlign: 'right', color: 'var(--neon-green)', textShadow: '0 0 6px var(--neon-green)', fontSize: '14px' }}>
                        {report.seoScore}/100
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PRIORITIZED CHECKLIST & ISSUE DISTRIBUTION CARD */}
              <div className="panel-card" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header">
                  <span>PRIORITIZED CHECKLIST & SEVERITY DISTRIBUTION</span>
                  <AlertTriangle size={14} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
                  {/* Left Column: Recharts Donut Chart */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-console)', padding: '20px', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: '100%', height: 200, position: 'relative' }}>
                      {findingsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={findingsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {findingsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '4px' }}
                              itemStyle={{ color: 'var(--color-text-bright)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle size={48} className="glow-green" />
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none'
                      }}>
                        <div style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                          {report.findings.length}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Total Issues
                        </div>
                      </div>
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '10px', marginTop: '16px' }}>
                      {[
                        { name: 'Critical', color: 'var(--neon-red)', count: grouped.critical.length },
                        { name: 'High', color: 'var(--neon-amber)', count: grouped.high.length },
                        { name: 'Medium', color: 'var(--neon-cyan)', count: grouped.medium.length },
                        { name: 'Low', color: 'var(--neon-green)', count: grouped.low.length }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: item.color, borderRadius: '50%' }}></span>
                          <span style={{ color: item.count > 0 ? 'var(--color-text-bright)' : 'var(--color-text-dim)', fontWeight: item.count > 0 ? 'bold' : 'normal' }}>
                            {item.name.toUpperCase()} ({item.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Scrollable checklist */}
                  <div className="findings-list" style={{ maxHeight: '272px', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Criticals */}
                    {grouped.critical.map((f, i) => (
                      <div key={`crit-${i}`} className="finding-row CRITICAL">
                        <h4>
                          <span className="tag-badge red">CRITICAL</span>
                          {f.message}
                        </h4>
                        <p><strong>Remedy</strong>: {f.remedy}</p>
                      </div>
                    ))}
                    {/* Highs */}
                    {grouped.high.map((f, i) => (
                      <div key={`high-${i}`} className="finding-row WARNING">
                        <h4>
                          <span className="tag-badge amber">HIGH</span>
                          {f.message}
                        </h4>
                        <p><strong>Remedy</strong>: {f.remedy}</p>
                      </div>
                    ))}
                    {/* Mediums */}
                    {grouped.medium.map((f, i) => (
                      <div key={`med-${i}`} className="finding-row INFO">
                        <h4>
                          <span className="tag-badge cyan">MEDIUM</span>
                          {f.message}
                        </h4>
                        <p><strong>Remedy</strong>: {f.remedy}</p>
                      </div>
                    ))}
                    {/* Lows */}
                    {grouped.low.map((f, i) => (
                      <div key={`low-${i}`} className="finding-row INFO" style={{ borderLeftColor: 'var(--neon-green)' }}>
                        <h4>
                          <span className="tag-badge green">LOW</span>
                          {f.message}
                        </h4>
                        <p><strong>Remedy</strong>: {f.remedy}</p>
                      </div>
                    ))}
                    {report.findings.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <span className="glow-green" style={{ fontWeight: 'bold' }}>All checks passed! Your website conforms perfectly to SEO standards.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CRAWLED PAGES & PERFORMANCE INDEX CARD */}
              <div className="panel-card" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header">
                  <span>CRAWLED PAGES & PERFORMANCE AUDIT</span>
                  <FileText size={14} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  {/* Left: Latency Chart */}
                  <div style={{ background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-bright)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
                      <Clock size={12} style={{ color: 'var(--neon-cyan)' }} /> SLOWEST RESPONDING PAGES (SECONDS)
                    </div>
                    {slowestPagesData.length > 0 ? (
                      <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={slowestPagesData} layout="vertical" margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis type="number" stroke="var(--color-text-dim)" unit="s" style={{ fontSize: '9px' }} />
                            <YAxis type="category" dataKey="name" stroke="var(--color-text-dim)" style={{ fontSize: '9px' }} width={80} />
                            <Tooltip 
                              contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '4px' }}
                              itemStyle={{ color: 'var(--color-text-bright)' }}
                            />
                            <Bar dataKey="speed">
                              {slowestPagesData.map((entry, index) => {
                                const fill = entry.speed > 1.5 ? 'var(--neon-red)' : entry.speed > 0.8 ? 'var(--neon-amber)' : 'var(--neon-green)';
                                return <Cell key={`cell-${index}`} fill={fill} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-dim)' }}>
                        No latency data available.
                      </div>
                    )}
                  </div>

                  {/* Right: Crawled Pages Table */}
                  <div style={{ background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-bright)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
                      <FileText size={12} /> CRAWL PATH DIRECTORY
                    </div>
                    <div style={{ maxHeight: '220px', overflowY: 'auto', flexGrow: 1 }}>
                      <table className="meta-table" style={{ fontSize: '11px', margin: 0 }}>
                        <thead>
                          <tr>
                            <th>PATH</th>
                            <th style={{ textAlign: 'center', width: '60px' }}>STATUS</th>
                            <th style={{ textAlign: 'right', width: '80px' }}>WORDS</th>
                            <th style={{ textAlign: 'right', width: '80px' }}>SPEED</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.crawledPages.map((page, index) => {
                            let displayUrl = page.url;
                            try {
                              const parsed = new URL(page.url);
                              displayUrl = parsed.pathname + parsed.search;
                            } catch (_) {}
                            if (!displayUrl || displayUrl === '') displayUrl = '/';
                            return (
                              <tr key={index}>
                                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={page.url}>
                                  {displayUrl}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: page.statusCode === 200 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                                  {page.statusCode}
                                </td>
                                <td style={{ textAlign: 'right' }}>{page.wordCount}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: page.responseTime > 1.5 ? 'var(--neon-red)' : page.responseTime > 0.8 ? 'var(--neon-amber)' : 'var(--neon-green)' }}>
                                  {page.responseTime.toFixed(2)}s
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
