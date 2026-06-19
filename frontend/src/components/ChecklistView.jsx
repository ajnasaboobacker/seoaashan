import React, { useState } from 'react';
import { CheckSquare, Square, FileText, ChevronDown, ChevronUp, Copy, Download, Check, AlertOctagon, HelpCircle, Activity, Info, Sliders } from 'lucide-react';
import { ScoreGauge } from './Gauges';

const INITIAL_ITEMS = [
  // 1. Technical & Server Configuration
  {
    id: 'ttfb',
    track: 'Technical & Server',
    title: 'TTFB & Server Response Latency',
    criteria: 'Document delivers under 800ms (optimally < 200ms). Check FastCGI caches and database queries.',
    diagnostic: 'curl -o /dev/null -w "Connect: %{time_connect} TTFB: %{time_starttransfer} Total: %{time_total}\\n" -s https://example.com',
    repair: 'Configure FastCGI caching in Nginx, enable Redis object caching, or upgrade hosting CPU plans.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'http_protocols',
    track: 'Technical & Server',
    title: 'HTTP/2 & HTTP/3 Protocol Support',
    criteria: 'Verify resource streams parallel multiplexing over single TCP socket nodes.',
    diagnostic: 'curl -I --http2 --http3 https://example.com',
    repair: 'Update Nginx configuration and set listen directives to support http2 and http3 (quic).',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'compression',
    track: 'Technical & Server',
    title: 'Brotli & Gzip Text Compression',
    criteria: 'Audit and apply dynamic or pre-compressed Brotli compression for text files.',
    diagnostic: 'curl -H "Accept-Encoding: br" -I https://example.com',
    repair: 'Install ngx_brotli module in Nginx and add brotli rules for application/json, text/css, etc.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'cache_control',
    track: 'Technical & Server',
    title: 'Browser Cache-Control & ETags',
    criteria: 'Verify strict lifetime Cache-Control headers (up to 1 year on hashed assets).',
    diagnostic: 'curl -I https://example.com/assets/index.js',
    repair: 'Set add_header Cache-Control "public, max-age=31536000, immutable" for static assets.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'dns_sec',
    track: 'Technical & Server',
    title: 'DNS Resolution & DNSSEC Verification',
    criteria: 'Confirm Anycast name server speed latency and verify DNSSEC security signatures.',
    diagnostic: 'dig +dnssec +multiline example.com',
    repair: 'Enable DNSSEC at your domain registrar and migrate to dynamic Anycast DNS (e.g. Cloudflare).',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'cdn_edge',
    track: 'Technical & Server',
    title: 'Content Delivery Network (CDN)',
    criteria: 'Measure round-trip-time (RTT) geographic cache efficiency at Edge servers.',
    diagnostic: 'curl -s -D - -o /dev/null https://example.com | grep -i x-cache',
    repair: 'Bind domain to Edge caches (Cloudflare, CloudFront) and configure static asset routing rules.',
    baseSeverity: 'High',
    weight: 7
  },

  // 2. SEO & Crawlability
  {
    id: 'robots_txt',
    track: 'SEO & Crawlability',
    title: 'Robots.txt Exclusions Validation',
    criteria: 'Validate search crawlers skip admin directories and discover XML sitemaps.',
    diagnostic: 'curl -s https://example.com/robots.txt',
    repair: 'Create clean robots.txt specifying correct Allow/Disallow pathways and absolute Sitemap links.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'sitemaps',
    track: 'SEO & Crawlability',
    title: 'XML Sitemaps Indexability & Coverage',
    criteria: 'Confirm XML sitemaps match format protocol containing only 200 OK canonical links.',
    diagnostic: 'curl -s https://example.com/sitemap.xml',
    repair: 'Automate sitemap rebuilds mapping active canonical URLs. Purge redirects/404s from feed.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'canonical',
    track: 'SEO & Crawlability',
    title: 'Canonical Tag Implementations',
    criteria: 'Self-referencing absolute canonical tags must exist on all dynamic routes.',
    diagnostic: 'Inspect DOM: document.querySelector(\'link[rel="canonical"]\')',
    repair: 'Inject <link rel="canonical" href={currentUrl} /> dynamic tags inside document heads.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'rendering',
    track: 'SEO & Crawlability',
    title: 'Rendering Architecture (SSR vs CSR)',
    criteria: 'Enforce Server-Side (SSR) layouts so search engines parse content without heavy JS execution.',
    diagnostic: 'curl -s https://example.com | grep "root-content-wrapper"',
    repair: 'Migrate React dynamic components to SSR (Next.js App Router, Astro, or Server Components).',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'clean_urls',
    track: 'SEO & Crawlability',
    title: 'Clean URL Structures',
    criteria: 'Clean directory structures with single trailing-slash redirects.',
    diagnostic: 'Test request redirects: curl -sI https://example.com/pricing/',
    repair: 'Set Nginx rewrites to strip unnecessary URL query parameters and redirect directories clean.',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'meta_tags',
    track: 'SEO & Crawlability',
    title: 'Meta Title & Descriptions',
    criteria: 'Title: 50-60 characters, Description: 120-160 characters to avoid SERP snippet truncations.',
    diagnostic: 'Inspect title tag and meta description lengths in the document DOM.',
    repair: 'Rewrite tags matching limits. Inject active keywords to enhance search click CTR.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'headings',
    track: 'SEO & Crawlability',
    title: 'Logical Outline Hierarchy',
    criteria: 'Enforce headings sequence (H1 to H6) to prevent skipping tag hierarchies.',
    diagnostic: 'Run outline crawl: document.querySelectorAll("h1, h2, h3, h4, h5, h6")',
    repair: 'Restructure header wrappers. Enforce single H1 tag representing page main theme.',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'internal_links',
    track: 'SEO & Crawlability',
    title: 'Internal Linking & Crawl Depth',
    criteria: 'Important pages must render within 3 clicks from index root nodes using standard anchors.',
    diagnostic: 'Map anchor depth: document.querySelectorAll("a[href]")',
    repair: 'Introduce contextual inter-linking networks, HTML footer directories, and canonical tags.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'broken_links',
    track: 'SEO & Crawlability',
    title: 'Broken Links & Redirect Chains',
    criteria: 'Zero 404 links and no redundant multi-hop redirect pathways.',
    diagnostic: 'Run link checker tool. Audit crawl response pathways.',
    repair: 'Correct target href properties. Set direct redirects to canonical locations.',
    baseSeverity: 'High',
    weight: 7
  },

  // 3. Core Web Vitals & Speed
  {
    id: 'lcp',
    track: 'Core Web Vitals',
    title: 'Largest Contentful Paint (LCP)',
    criteria: 'Ensure top hero image banners or text block elements render in under 2.5 seconds.',
    diagnostic: 'Inspect Chrome DevTools Performance panel for LCP indicator element.',
    repair: 'Add fetchpriority="high" preload attributes to hero image elements. Lazy load bottom fold assets.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'inp',
    track: 'Core Web Vitals',
    title: 'Interaction to Next Paint (INP)',
    criteria: 'Replaces FID. Ensure responsiveness delays execute under 200ms across click and keyboard events.',
    diagnostic: 'Measure INP using Chrome UX Report APIs or Lighthouse user flows.',
    repair: 'Yield JavaScript rendering to main thread using setTimeout or scheduler.yield API wrappers.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'cls',
    track: 'Core Web Vitals',
    title: 'Cumulative Layout Shift (CLS)',
    criteria: 'Keep layout shift rating under 0.1 by reserving layout spaces for dynamic frames.',
    diagnostic: 'Audit CLS shift regions using Lighthouse or Performance Shift layout markers.',
    repair: 'Set exact width/height attributes on media or bind layout using aspect-ratio rules.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'crux_recon',
    track: 'Core Web Vitals',
    title: 'CrUX Field Data Reconciliation',
    criteria: 'Reconcile local lab tests with CrUX field data records.',
    diagnostic: 'Compare synthetic values to real-world user metrics on GSC Speed panels.',
    repair: 'Audit real user network contexts, geo locations, and device ratios to solve latency gaps.',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'connection_hints',
    track: 'Core Web Vitals',
    title: 'Early Connection Hinting',
    criteria: 'Preconnect / dns-prefetch to critical static resources early in execution.',
    diagnostic: 'Inspect DOM headers for <link rel="preconnect" ... /> nodes.',
    repair: 'Embed DNS prefetch and preconnect tags targeting payment processors, CDN assets, and analytics APIs.',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'fonts',
    track: 'Core Web Vitals',
    title: 'Font Render Blockers (FOUT/FOIT)',
    criteria: 'Prevent text layout flash failures using font-display: swap overrides.',
    diagnostic: 'Audit Font metrics in Google PageSpeed reports.',
    repair: 'Set font-display: swap in custom css @font-face rules. Preload critical woff2 layout files.',
    baseSeverity: 'High',
    weight: 7
  },

  // 4. Structured Data & Semantics
  {
    id: 'schemas_ld',
    track: 'Structured Data',
    title: 'Dynamic JSON-LD Schemas',
    criteria: 'Generate correct JSON-LD structured schemas to claim rich snippet listings.',
    diagnostic: 'Parse page JSON-LD block nodes. Validate via Schema.org validator.',
    repair: 'Automate structured data assembly. Incorporate LocalBusiness, FAQPage, or Breadcrumb models.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'html5_semantics',
    track: 'Structured Data',
    title: 'Semantic HTML5 Landmarks',
    criteria: 'Organize DOM trees using structural tags like header, nav, main, footer.',
    diagnostic: 'Map structural HTML document flow.',
    repair: 'Replace generic div containers with semantic markers: <header>, <nav>, <main>, <footer>.',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'og_tags',
    track: 'Structured Data',
    title: 'Open Graph (OG) Cards',
    criteria: 'Implement Open Graph tags for optimal card visual displays when URLs are shared.',
    diagnostic: 'Test social parsers: curl -s https://example.com | grep og:',
    repair: 'Embed og:title, og:image, og:description metadata tags inside index wrapper headers.',
    baseSeverity: 'Low',
    weight: 2
  },

  // 5. Accessibility
  {
    id: 'contrast',
    track: 'Accessibility',
    title: 'Color Contrast Ratios',
    criteria: 'Ensure high-contrast readability matching WCAG 2.2 standards (minimum 4.5:1 ratio).',
    diagnostic: 'Run Lighthouse Accessibility check or inspect contrast ratios in CSS rules.',
    repair: 'Recalibrate background and text hex values to meet readability standards.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'keyboard_nav',
    track: 'Accessibility',
    title: 'Keyboard Navigation & Focus Traps',
    criteria: 'Tab controls must follow document flow with clear focus visual rings.',
    diagnostic: 'Tab index scan: document.querySelectorAll("[tabindex]")',
    repair: 'Set standard tabIndex coordinates. Apply outlines targeting focus state classes.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'aria_attributes',
    track: 'Accessibility',
    title: 'Screen Reader Attributes (ARIA)',
    criteria: 'Ensure accessibility markers exist on buttons, controls, and dialog structures.',
    diagnostic: 'Check for aria-label properties on functional icon buttons.',
    repair: 'Apply correct aria-label, role, and screen reader text blocks dynamically.',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'skip_link',
    track: 'Accessibility',
    title: 'Skip to Main Content Navigation',
    criteria: 'Provide a keyboard-focused skip link to bypass long navigation templates.',
    diagnostic: 'Verify document has active skip to main content anchor links.',
    repair: 'Add absolute skip link layout. Set CSS to hide it until focused by user Tab keyboards.',
    baseSeverity: 'Medium',
    weight: 4
  },
  {
    id: 'form_labels',
    track: 'Accessibility',
    title: 'Form Association & Error Descriptors',
    criteria: 'Inputs must map to label identifiers and link errors using aria-describedby.',
    diagnostic: 'Audit label association and error messaging containers in DOM.',
    repair: 'Assign explicit label wrapper for ids. Inject aria-describedby referring to live error notes.',
    baseSeverity: 'High',
    weight: 7
  },

  // 6. Mobile Responsiveness & GEO
  {
    id: 'viewport_scaling',
    track: 'Mobile & GEO',
    title: 'Fluid Scaling & Viewport Tag',
    criteria: 'Establish dynamic layout sizing down to 320px minimum wrapper bounds.',
    diagnostic: 'Check viewport tag node: document.querySelector(\'meta[name="viewport"]\')',
    repair: 'Insert standard metadata viewports. Remove rules setting hard overflow limits.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'touch_targets',
    track: 'Mobile & GEO',
    title: 'Tactile Touch Targets',
    criteria: 'Ensure interactive touch elements measure 44 x 44 CSS pixels minimum spacing.',
    diagnostic: 'Verify sizes and margins on dynamic button wrappers.',
    repair: 'Set CSS padding guidelines and margins to enlarge buttons on mobile view grids.',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'hreflang',
    track: 'Mobile & GEO',
    title: 'Hreflang Regional Localization Tags',
    criteria: 'Incorporate hreflang tags for multi-language layouts.',
    diagnostic: 'Audit DOM: document.querySelectorAll(\'link[hreflang]\')',
    repair: 'Setup hreflang tags inside header blocks map locales dynamically (e.g. en-US, de-DE).',
    baseSeverity: 'High',
    weight: 7
  },
  {
    id: 'geo_routing',
    track: 'Mobile & GEO',
    title: 'Geo-Routing Server Redirect Maps',
    criteria: 'Route clients correctly without blocking standard US crawler networks.',
    diagnostic: 'Audit requests with location headers: curl -H "Accept-Language: fr-FR" -I https://example.com',
    repair: 'Bypass location redirects for search crawler user-agent tags in configuration routers.',
    baseSeverity: 'Medium',
    weight: 4
  },

  // 7. Security & GDPR Privacy Protocols
  {
    id: 'security_headers',
    track: 'Security & Privacy',
    title: 'Critical HTTP Security Headers',
    criteria: 'Set security policies (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) correctly.',
    diagnostic: 'curl -I https://example.com | grep -E -i "(content-security-policy|strict-transport-security)"',
    repair: 'Inject HTTP security directives in Nginx, Cloudflare rules, or server routing middleware.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'https_ssl',
    track: 'Security & Privacy',
    title: 'HTTPS & SSL Grade Validation',
    criteria: 'Enforce HTTP to HTTPS redirects and ensure SSL configurations use modern SHA-256 signatures.',
    diagnostic: 'Test handshake: curl -Iv https://example.com 2>&1 | grep "SSL connection"',
    repair: 'Setup global rewrite routing HTTP traffic to HTTPS. Disable deprecated TLS 1.0/1.1 protocols.',
    baseSeverity: 'Critical',
    weight: 10
  },
  {
    id: 'cookies_consent',
    track: 'Security & Privacy',
    title: 'Consent Scripts & Secure Cookies',
    criteria: 'Configure cookie headers with Secure/HttpOnly/SameSite flags and run consent banners.',
    diagnostic: 'curl -I https://example.com | grep -i "set-cookie"',
    repair: 'Apply cookie directives inside sessions. Setup consent validation triggers.',
    baseSeverity: 'High',
    weight: 7
  }
];

export default function ChecklistView() {
  const [items, setItems] = useState(
    INITIAL_ITEMS.map((item) => ({
      ...item,
      checked: true,
      clientSeverity: item.baseSeverity,
      failureNotes: ''
    }))
  );

  const [filterTrack, setFilterTrack] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [copied, setCopied] = useState(false);

  const tracks = ['All', 'Technical & Server', 'SEO & Crawlability', 'Core Web Vitals', 'Structured Data', 'Accessibility', 'Mobile & GEO', 'Security & Privacy'];

  // Score Calculation
  const totalPossibleWeight = items.reduce((acc, item) => acc + item.weight, 0);
  const earnedWeight = items.reduce((acc, item) => acc + (item.checked ? item.weight : 0), 0);
  const healthScore = totalPossibleWeight > 0 ? Math.round((earnedWeight / totalPossibleWeight) * 100) : 100;

  const handleCheckToggle = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextChecked = !item.checked;
          return {
            ...item,
            checked: nextChecked,
            failureNotes: nextChecked ? '' : item.failureNotes || `Observed anomaly in testing ${item.title.toLowerCase()}.`
          };
        }
        return item;
      })
    );
  };

  const handleNotesChange = (id, val) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, failureNotes: val } : item))
    );
  };

  const handleSeverityChange = (id, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // Adjust weight based on custom client severity
          const weightMap = { Critical: 10, High: 7, Medium: 4, Low: 2 };
          return { ...item, clientSeverity: val, weight: weightMap[val] || 4 };
        }
        return item;
      })
    );
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCompileReport = () => {
    const failedItems = items.filter((item) => !item.checked);
    const passedItems = items.filter((item) => item.checked);

    let md = `# SEO Audit Compliance Report
**Generated On**: ${new Date().toLocaleDateString()}
**Overall Health Score**: ${healthScore}/100

---

## Executive Summary
This compliance report compiles the active status of the workspace technical taxonomy. The target site scored **${healthScore}/100** indicating overall technical maturity. We have identified **${failedItems.length}** actionable improvements required to meet standard guidelines.

---

## Action Items (Failed Audits: ${failedItems.length})
`;

    if (failedItems.length === 0) {
      md += `\n*No action items identified. The site is in full compliance with the inspected technical criteria.*\n`;
    } else {
      failedItems.forEach((f) => {
        md += `\n### [${f.clientSeverity.toUpperCase()}] ${f.title}
- **Track**: ${f.track}
- **Criteria Description**: ${f.criteria}
- **Observation Notes**: ${f.failureNotes || 'Observed failure under inspection.'}
- **Diagnostic Instruction**: 
  \`\`\`bash
  ${f.diagnostic}
  \`\`\`
- **Recommended Repair Action**:
  ${f.repair}
`;
      });
    }

    md += `\n---

## Passed Audits (${passedItems.length})
`;

    passedItems.forEach((p) => {
      md += `- [PASS] **${p.title}** (${p.track})\n`;
    });

    md += `\n\n*SEO Audit Report generated via SEO Aashan Playground Console.*`;
    setReportMarkdown(md);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([reportMarkdown], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "seo_audit_compliance_report.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredItems = items.filter((item) => {
    const matchesTrack = filterTrack === 'All' || item.track === filterTrack;
    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Passed' && item.checked) ||
      (filterStatus === 'Failed' && !item.checked);
    return matchesTrack && matchesStatus;
  });

  return (
    <div className="view-viewport" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      
      {/* Active board checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Controls and Score */}
        <div className="panel-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '16px' }}>
          <ScoreGauge score={healthScore} label="Compliance Index" />
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--color-text-bright)', borderBottom: 'none', paddingBottom: 0 }}>
              Live Health Score: <span style={{ color: healthScore >= 90 ? 'var(--neon-green)' : healthScore >= 50 ? 'var(--neon-amber)' : 'var(--neon-red)' }}>{healthScore}%</span>
            </h3>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-dim)' }}>
              Checkmarks indicate passed audits. Unchecking a spec marks it as a failure, lowering the score according to weight, and prompts you to specify observation notes.
            </p>
          </div>
        </div>

        {/* Toolbar Filters */}
        <div className="panel-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <Sliders size={12} style={{ color: 'var(--neon-cyan)' }} />
              <span style={{ color: 'var(--color-text-dim)', fontWeight: 'bold' }}>TRACK</span>
              <select
                className="console-input"
                style={{ padding: '4px 8px', fontSize: '11px', width: '130px' }}
                value={filterTrack}
                onChange={e => setFilterTrack(e.target.value)}
              >
                {tracks.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-dim)', fontWeight: 'bold' }}>STATUS</span>
              <select
                className="console-input"
                style={{ padding: '4px 8px', fontSize: '11px', width: '90px' }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            
            <button
              className="console-btn"
              onClick={handleCompileReport}
              style={{ background: 'var(--neon-green)', marginLeft: 'auto', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold' }}
            >
              <FileText size={12} /> COMPILE REPORT (.md)
            </button>
          </div>
        </div>

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredItems.map((item) => {
            const isCritical = item.clientSeverity === 'Critical';
            const isHigh = item.clientSeverity === 'High';
            const isMedium = item.clientSeverity === 'Medium';
            const sevColor = isCritical ? 'var(--neon-red)' : isHigh ? 'var(--neon-amber)' : isMedium ? 'var(--neon-cyan)' : 'var(--color-text-dim)';

            return (
              <div 
                key={item.id} 
                className="panel-card animate-fade"
                style={{ 
                  padding: '12px', 
                  borderLeft: `3px solid ${item.checked ? 'var(--neon-green)' : 'var(--neon-red)'}`,
                  borderColor: item.checked ? 'var(--border-color)' : 'var(--neon-red)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <button 
                    onClick={() => handleCheckToggle(item.id)}
                    style={{ background: 'none', border: 'none', padding: 0, margin: '2px 0 0 0', cursor: 'pointer', color: item.checked ? 'var(--neon-green)' : 'var(--color-text-dim)' }}
                  >
                    {item.checked ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>

                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.track} // {item.id.toUpperCase()}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: sevColor, fontWeight: 'bold' }}>{item.clientSeverity.toUpperCase()}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>w:{item.weight}</span>
                      </div>
                    </div>

                    <h4 style={{ margin: '2px 0 6px 0', fontSize: '13px', color: item.checked ? 'var(--color-text-bright)' : 'var(--neon-red)', borderBottom: 'none', paddingBottom: 0 }}>
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Edit options if failed */}
                {!item.checked && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', background: 'rgba(255,0,0,0.02)', border: '1px dashed rgba(255,0,0,0.2)', borderRadius: '4px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'var(--neon-red)', fontWeight: 'bold' }}>AUDIT FAILURE NOTES</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>SEVERITY OVERRIDE:</span>
                        <select
                          className="console-input"
                          style={{ padding: '2px 4px', fontSize: '9px', width: '80px', height: '18px' }}
                          value={item.clientSeverity}
                          onChange={(e) => handleSeverityChange(item.id, e.target.value)}
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="console-input"
                      style={{ padding: '6px', fontSize: '11px', width: '100%', borderColor: 'var(--neon-red)' }}
                      placeholder="Specify failure anomalies, e.g. INP value is 450ms..."
                      value={item.failureNotes}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    />
                  </div>
                )}

                {/* Drawer Toggle */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button 
                    className="console-btn"
                    onClick={() => toggleExpand(item.id)}
                    style={{ padding: '3px 8px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-console)', border: '1px solid var(--border-color)' }}
                  >
                    {expandedId === item.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    <span>{expandedId === item.id ? 'HIDE SPECS' : 'SHOW SPECS'}</span>
                  </button>
                </div>

                {/* Drawer spec panel */}
                {expandedId === item.id && (
                  <div className="animate-fade" style={{ marginTop: '8px', padding: '10px', background: '#090a0f', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>SPECIFICATION CRITERIA</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-bright)' }}>{item.criteria}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>DIAGNOSTIC INSTRUCTION</div>
                      <pre style={{ margin: '4px 0 0 0', padding: '6px', background: 'var(--bg-console)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '9px', fontFamily: 'var(--font-mono)', overflowX: 'auto', color: 'var(--neon-green)', whiteSpace: 'pre' }}>
                        {item.diagnostic}
                      </pre>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>RECOMMENDED REPAIR EXAMPLES</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>{item.repair}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Report preview compiler */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="panel-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
          <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            <span>REPORT MARKDOWN COMPILER</span>
            {reportMarkdown && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="console-btn" onClick={handleCopyReport} style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--bg-console)', border: '1px solid var(--border-color)' }}>
                  {copied ? <Check size={11} style={{ color: 'var(--neon-green)' }} /> : <Copy size={11} />}
                  {copied ? ' COPIED' : ' COPY REPORT'}
                </button>
                <button className="console-btn" onClick={handleDownloadReport} style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--bg-console)', border: '1px solid var(--border-color)' }}>
                  <Download size={11} /> DOWNLOAD REPORT
                </button>
              </div>
            )}
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-console)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
            {!reportMarkdown ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px' }}>
                <Info size={40} style={{ color: 'var(--border-color)', marginBottom: '12px' }} />
                <h4 style={{ color: 'var(--color-text-bright)', margin: '0 0 8px 0' }}>Report Empty</h4>
                <p style={{ fontSize: '11px', margin: 0 }}>Click the "COMPILE REPORT (.md)" button above once you have finished checking items to generate a dynamic Markdown audit summary report.</p>
              </div>
            ) : (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '1.6', color: 'var(--color-text-bright)' }}>
                {reportMarkdown}
              </pre>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
