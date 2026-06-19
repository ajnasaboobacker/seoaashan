import React, { useState, useEffect } from 'react';
import AuditView from './components/AuditView';
import PageView from './components/PageView';
import ContentView from './components/ContentView';
import DriftView from './components/DriftView';
import SpeedView from './components/SpeedView';
import SchemaView from './components/SchemaView';
import GeoView from './components/GeoView';
import SitemapView from './components/SitemapView';
import BacklinkView from './components/BacklinkView';
import KeywordView from './components/KeywordView';
import ClusterView from './components/ClusterView';
import LoginView from './components/LoginView';
import SettingsView from './components/SettingsView';
import MarketingHubView from './components/MarketingHubView';
import CalculatorView from './components/CalculatorView';
import ConsultantView from './components/ConsultantView';
import GuidelineBrowserView from './components/GuidelineBrowserView';
import ChecklistView from './components/ChecklistView';
import HelpView from './components/HelpView';
import { Shield, Sparkles, Terminal, FileCode, Clock, Code, Cpu, File, Link, Network, Search, Settings, LogOut, Database, User, Globe, CheckSquare, BookOpen, Brain, Calculator, HelpCircle } from 'lucide-react';

// Setup global fetch interceptor to inject JWT token into all /api requests automatically
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem('seo_session_token');
  if (token && typeof url === 'string' && url.startsWith('/api') && url !== '/api/config') {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  const response = await originalFetch(url, options);
  if (response.status === 401 && typeof url === 'string' && url.startsWith('/api') && url !== '/api/config') {
    localStorage.removeItem('seo_session_token');
    localStorage.removeItem('seo_user_email');
    localStorage.removeItem('seo_user_mode');
    window.location.reload();
  }
  return response;
};

export default function App() {
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('seo_session_token') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('seo_user_email') || '');
  const [userMode, setUserMode] = useState(localStorage.getItem('seo_user_mode') || '');
  const [view, setView] = useState('audit');

  const handleLoginSuccess = (token, email, mode) => {
    localStorage.setItem('seo_session_token', token);
    localStorage.setItem('seo_user_email', email);
    localStorage.setItem('seo_user_mode', mode);
    setSessionToken(token);
    setUserEmail(email);
    setUserMode(mode);
    setView('audit');
  };

  const handleLogout = () => {
    localStorage.removeItem('seo_session_token');
    localStorage.removeItem('seo_user_email');
    localStorage.removeItem('seo_user_mode');
    setSessionToken(null);
    setUserEmail('');
    setUserMode('');
  };

  if (!sessionToken) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>SEO AASHAN</h1>
          <span>UTILITY CONSOLE v2.0.0</span>
        </div>
        
        <nav className="nav-menu" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
          {/* 1. AUDITS & HYGIENE */}
          <div className="nav-section-title">AUDITS & HYGIENE</div>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'checklist' ? 'active' : ''}`}
              onClick={() => setView('checklist')}
            >
              <CheckSquare size={15} /> Active Checklist
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'guideline_browser' ? 'active' : ''}`}
              onClick={() => setView('guideline_browser')}
            >
              <BookOpen size={15} /> Spec Index
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'audit' ? 'active' : ''}`}
              onClick={() => setView('audit')}
            >
              <Terminal size={15} /> Crawl Audit
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'page' ? 'active' : ''}`}
              onClick={() => setView('page')}
            >
              <FileCode size={15} /> Tag Inspector
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'sitemap' ? 'active' : ''}`}
              onClick={() => setView('sitemap')}
            >
              <File size={15} /> Sitemap Utility
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'drift' ? 'active' : ''}`}
              onClick={() => setView('drift')}
            >
              <Shield size={15} /> Drift Tracker
            </button>
          </li>

          {/* 2. KEYWORDS & RESEARCH */}
          <div className="nav-section-title" style={{ marginTop: '8px' }}>KEYWORDS & RESEARCH</div>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'keyword' ? 'active' : ''}`}
              onClick={() => setView('keyword')}
            >
              <Search size={15} /> Keyword Planner
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'cluster' ? 'active' : ''}`}
              onClick={() => setView('cluster')}
            >
              <Network size={15} /> Topic Clustering
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'backlink' ? 'active' : ''}`}
              onClick={() => setView('backlink')}
            >
              <Link size={15} /> Backlinks
            </button>
          </li>

          {/* 3. CONTENT & AI SEARCH */}
          <div className="nav-section-title" style={{ marginTop: '8px' }}>CONTENT & AI SEARCH</div>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'consultant' ? 'active' : ''}`}
              onClick={() => setView('consultant')}
            >
              <Brain size={15} /> AI Consultant
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'content' ? 'active' : ''}`}
              onClick={() => setView('content')}
            >
              <Sparkles size={15} /> EEAT Scorer
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'geo' ? 'active' : ''}`}
              onClick={() => setView('geo')}
            >
              <Cpu size={15} /> GEO AI Search
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'schema' ? 'active' : ''}`}
              onClick={() => setView('schema')}
            >
              <Code size={15} /> Schema Hub
            </button>
          </li>

          {/* 4. SPEED & SUITE */}
          <div className="nav-section-title" style={{ marginTop: '8px' }}>SPEED & SUITE</div>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'speed' ? 'active' : ''}`}
              onClick={() => setView('speed')}
            >
              <Clock size={15} /> PageSpeed & CrUX
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'calculator' ? 'active' : ''}`}
              onClick={() => setView('calculator')}
            >
              <Calculator size={15} /> Weighted Calculator
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'marketing' ? 'active' : ''}`}
              onClick={() => setView('marketing')}
            >
              <Globe size={15} /> Marketing Suite
            </button>
          </li>
          <li className="nav-item" style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <button 
              className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
              onClick={() => setView('settings')}
            >
              <Settings size={15} /> Console Settings
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${view === 'help' ? 'active' : ''}`}
              onClick={() => setView('help')}
            >
              <HelpCircle size={15} /> Console Help
            </button>
          </li>
        </nav>

        <div className="sidebar-footer">
          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '4px' }}>
            ID // {userEmail}
          </div>
          <div>MODE // {userMode.toUpperCase()}</div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-content">
        {/* Top Status Bar */}
        <header className="top-status-bar">
          <span>
            <div className="status-active-node"></div>
            SYSTEM ONLINE // NODE v22.16.0
          </span>
          <span>
            INTERPRETER // PYTHON v3.13.13
          </span>
          <span>
            STATE // CALIBRATED
          </span>
        </header>

        {/* View Header */}
        <div className="view-header">
          <div>
            <h2>
              {view === 'checklist' && 'ACTIVE AUDIT PLAYGROUND'}
              {view === 'guideline_browser' && 'TECHNICAL SPECIFICATION INDEX'}
              {view === 'audit' && 'CRAWL AUDIT'}
              {view === 'page' && 'TAG INSPECTOR'}
              {view === 'content' && 'EEAT CONTENT QUALITY'}
              {view === 'consultant' && 'GEMINI SEO CONSULTANT'}
              {view === 'speed' && 'PAGESPEED & CRUX HISTORIES'}
              {view === 'calculator' && 'WEIGHTED CWV CALCULATOR'}
              {view === 'keyword' && 'KEYWORD PLANNER'}
              {view === 'cluster' && 'TOPIC CLUSTERING'}
              {view === 'schema' && 'SCHEMA HUB'}
              {view === 'geo' && 'GEO AI SEARCH CHECKER'}
              {view === 'sitemap' && 'XML SITEMAP INSPECTOR'}
              {view === 'backlink' && 'BACKLINKS INDEX CHECKER'}
              {view === 'drift' && 'DEPLOYMENT DRIFT TRACKER'}
              {view === 'marketing' && 'DIGITAL MARKETING SUITE'}
              {view === 'settings' && 'CONSOLE SETTINGS'}
              {view === 'help' && 'CONSOLE HELP MANUAL'}
            </h2>
            <p>
              {view === 'checklist' && 'Manage audit checkmarks dynamically, customize client severity rates, add notes, and compile reports.'}
              {view === 'guideline_browser' && 'Search standard guidelines technical taxonomy specs and copy Nginx/HTML repair blueprints.'}
              {view === 'audit' && 'Scan a domain, extract link indices, and audit against structural crawl guidelines.'}
              {view === 'page' && 'Inspect HTML document headings hierarchy, check missing image attributes, and extract schemas.'}
              {view === 'content' && 'Evaluate text files against Quality Rater Guidelines (QRG) low-value filler filters.'}
              {view === 'consultant' && 'Formulate customized regional CDNs, Geo routing, and Schema.org roadmaps using Gemini AI.'}
              {view === 'speed' && 'Fetch current PageSpeed scores alongside 25 weeks of historical Core Web Vitals timeseries.'}
              {view === 'calculator' && 'Calculate expected speed scores using weighted March 2024 Lighthouse algorithms (LCP 40%, INP 40%, CLS 20%).'}
              {view === 'keyword' && 'Query search volume, competition metrics, and bid costs alongside autocomplete suggestions.'}
              {view === 'cluster' && 'Group keywords into semantic silos, establish Pillar-Spoke structures, and map linking hierarchies.'}
              {view === 'schema' && 'Generate structured JSON-LD block codes and validate schemas for policy requirements.'}
              {view === 'geo' && 'Audit crawler accessibility, robots.txt directives, and passage-level citability thresholds.'}
              {view === 'sitemap' && 'Scan XML sitemaps to verify locator parameters and inspect modified dates.'}
              {view === 'backlink' && 'Verify referrers backlinks batch lists to check link existence and attributes.'}
              {view === 'drift' && 'Compare deployment snapshots against SQLite baseline records to identify SEO regression.'}
              {view === 'marketing' && 'Audit tech stacks, trace redirect hops, inspect SSL sockets, parse DNS security, and calculate page carbon scores.'}
              {view === 'settings' && 'Update Google API credentials and manage active tenant authentication keys.'}
              {view === 'help' && 'Read comprehensive descriptions of all console tools and launch utilities with single clicks.'}
            </p>
          </div>
        </div>

        {/* Dynamic Panel */}
        {view === 'checklist' && <ChecklistView />}
        {view === 'guideline_browser' && <GuidelineBrowserView />}
        {view === 'audit' && <AuditView />}
        {view === 'page' && <PageView />}
        {view === 'content' && <ContentView />}
        {view === 'consultant' && <ConsultantView />}
        {view === 'speed' && <SpeedView />}
        {view === 'calculator' && <CalculatorView />}
        {view === 'keyword' && <KeywordView />}
        {view === 'cluster' && <ClusterView />}
        {view === 'schema' && <SchemaView />}
        {view === 'geo' && <GeoView />}
        {view === 'sitemap' && <SitemapView />}
        {view === 'backlink' && <BacklinkView />}
        {view === 'drift' && <DriftView />}
        {view === 'marketing' && <MarketingHubView />}
        {view === 'settings' && (
          <SettingsView
            sessionToken={sessionToken}
            userEmail={userEmail}
            userMode={userMode}
            onLogout={handleLogout}
          />
        )}
        {view === 'help' && <HelpView onNavigate={(targetView) => setView(targetView)} />}
      </main>
    </div>
  );
}
