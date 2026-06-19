import React from 'react';
import { HelpCircle, Terminal, FileCode, File, Shield, Search, Network, Link, Sparkles, Cpu, Code, Clock, Calculator, Globe, Brain, HelpCircle as HelpIcon, ArrowRight } from 'lucide-react';

export default function HelpView({ onNavigate }) {
  const categories = [
    {
      title: 'AUDITS & HYGIENE',
      color: 'var(--neon-green)',
      items: [
        {
          id: 'checklist',
          name: 'Active Checklist',
          icon: <HelpCircle size={18} />,
          desc: 'Interactive 7-track audit board tracking 35 core technical rules. Computes live compliance percentages and compiles Markdown (.md) reports.'
        },
        {
          id: 'guideline_browser',
          name: 'Spec Index',
          icon: <Terminal size={18} />,
          desc: 'Searchable technical directory. Filter items by track or severity and copy server configuration codes (Nginx caching, compression).'
        },
        {
          id: 'audit',
          name: 'Crawl Audit',
          icon: <Terminal size={18} />,
          desc: 'Crawls domains (up to 500 pages) checking for structural compliance. Displays dual dashboards: High-level Client and detailed Analyst consoles.'
        },
        {
          id: 'page',
          name: 'Tag Inspector',
          icon: <FileCode size={18} />,
          desc: 'Inspects heading hierarchy progression (H1-H6), image alt attributes, canonical declarations, and structural page details.'
        },
        {
          id: 'sitemap',
          name: 'Sitemap Utility',
          icon: <File size={18} />,
          desc: 'Downloads and inspects XML sitemap indexes. Validates link responsiveness and checks latest modification timestamps.'
        },
        {
          id: 'drift',
          name: 'Drift Tracker',
          icon: <Shield size={18} />,
          desc: 'Stores page status snapshots in SQLite database to track changes over time and flag critical SEO regressions.'
        }
      ]
    },
    {
      title: 'KEYWORDS & RESEARCH',
      color: 'var(--neon-cyan)',
      items: [
        {
          id: 'keyword',
          name: 'Keyword Planner',
          icon: <Search size={18} />,
          desc: 'Retrieves keyword search volumes, competitiveness levels, CPC estimates, and real-time autocomplete suggestions.'
        },
        {
          id: 'cluster',
          name: 'Topic Clustering',
          icon: <Network size={18} />,
          desc: 'Groups keywords semantically by SERP result overlap and outlines optimized Pillar-and-Spoke linking outlines.'
        },
        {
          id: 'backlink',
          name: 'Backlinks Check',
          icon: <Link size={18} />,
          desc: 'Verifies external backlinks by crawling referrer URLs to confirm linking status, anchor texts, and dofollow attributes.'
        }
      ]
    },
    {
      title: 'CONTENT & AI SEARCH',
      color: 'var(--neon-amber)',
      items: [
        {
          id: 'consultant',
          name: 'AI Consultant',
          icon: <Brain size={18} />,
          desc: 'Leverages Gemini-3.5-flash to formulate customized diagnostic roadmaps, CDN cache settings, and Schema layouts.'
        },
        {
          id: 'content',
          name: 'EEAT Scorer',
          icon: <Sparkles size={18} />,
          desc: 'Evaluates copy readability and E-E-A-T credentials against Google Quality Rater standards, identifying low-value text blocks.'
        },
        {
          id: 'geo',
          name: 'GEO AI Search',
          icon: <Cpu size={18} />,
          desc: 'Audits optimization for LLM engines. Checks crawler robots rules, the presence of llms.txt, and passage-level keywords.'
        },
        {
          id: 'schema',
          name: 'Schema Hub',
          icon: <Code size={18} />,
          desc: 'Generates structured JSON-LD code templates (LocalBusiness, FAQPage, Breadcrumb) and validates syntax requirements.'
        }
      ]
    },
    {
      title: 'SPEED & SUITE',
      color: 'var(--neon-red)',
      items: [
        {
          id: 'speed',
          name: 'PageSpeed & CrUX',
          icon: <Clock size={18} />,
          desc: 'Loads real user metrics and PageSpeed score targets from Google alongside 25 weeks of historical user speed charts.'
        },
        {
          id: 'calculator',
          name: 'Weighted Calculator',
          icon: <Calculator size={18} />,
          desc: 'Calculates performance score metrics according to weighted March 2024 standards (40% LCP, 40% INP, 20% CLS).'
        },
        {
          id: 'marketing',
          name: 'Marketing Suite',
          icon: <Globe size={18} />,
          desc: 'Diagnoses domain technical setups: tech stack audits, HTTP redirect paths, SSL certificates, DNSSEC settings, and carbon calculators.'
        }
      ]
    }
  ];

  return (
    <div className="view-viewport animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Introduction Card */}
      <div className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
        <HelpIcon size={40} style={{ color: 'var(--neon-green)', flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: '0 0 6px 0', borderBottom: 'none', paddingBottom: 0, color: 'var(--color-text-bright)' }}>
            SEOAashan Console Help Manual
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-dim)', lineHeight: '1.6' }}>
            Welcome to the diagnostic help console. Below is an interactive catalog describing every utility integrated within this terminal workspace. Click on the action button at the bottom of any panel card to open the tool immediately.
          </p>
        </div>
      </div>

      {/* Grid of categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {categories.map((cat, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: cat.color, borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', letterSpacing: '1.5px' }}>
              {cat.title}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {cat.items.map((item) => (
                <div 
                  key={item.id} 
                  className="panel-card" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    minHeight: '160px',
                    borderColor: 'var(--border-color)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    padding: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.boxShadow = `0 0 8px ${cat.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ color: cat.color }}>{item.icon}</div>
                      <h4 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0, fontSize: '13px', color: 'var(--color-text-bright)' }}>
                        {item.name}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-dim)', lineHeight: '1.5' }}>
                      {item.desc}
                    </p>
                  </div>

                  <button 
                    className="console-btn"
                    onClick={() => onNavigate(item.id)}
                    style={{ 
                      marginTop: '16px', 
                      fontSize: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '4px 10px',
                      background: 'var(--bg-console)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--color-text-bright)'
                    }}
                  >
                    <span>LAUNCH UTILITY</span>
                    <ArrowRight size={10} style={{ color: cat.color }} />
                  </button>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
