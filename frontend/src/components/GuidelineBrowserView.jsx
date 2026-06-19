import React, { useState } from 'react';
import { Search, Filter, Shield, Code, Copy, Check, Info, Server, HelpCircle, Terminal } from 'lucide-react';

const GUIDELINES_DATABASE = [
  // 1. Technical & Server Configuration
  {
    id: 'ttfb',
    track: 'Technical & Server',
    title: 'TTFB & Server Response Latency',
    criteria: 'Time to First Byte (TTFB) must be under 800ms (optimally < 200ms) by configuring server-side micro-caching or edge compute proxies.',
    severity: 'Critical',
    blueprint: `# Nginx FastCGI Micro-caching Config
fastcgi_cache_path /etc/nginx/cache levels=1:2 keys_zone=MYCACHE:100m max_size=1g inactive=60m use_temp_path=off;
server {
    set $skip_cache 0;
    if ($request_method = POST) { set $skip_cache 1; }
    if ($query_string != "") { set $skip_cache 1; }
    
    location ~ \.php$ {
        fastcgi_cache MYCACHE;
        fastcgi_cache_valid 200 301 302 5m;
        fastcgi_cache_bypass $skip_cache;
        fastcgi_no_cache $skip_cache;
        add_header X-FastCGI-Cache $upstream_cache_status;
    }
}`
  },
  {
    id: 'http_protocols',
    track: 'Technical & Server',
    title: 'HTTP/2 & HTTP/3 Protocol Support',
    criteria: 'Enforce dynamic multiplexed parallel streams to deliver site resources concurrently over single sockets.',
    severity: 'High',
    blueprint: `# Nginx HTTP/2 and HTTP/3 listen directives
server {
    listen 443 ssl;
    listen 443 http2; # HTTP/2 enablement
    listen 443 quic reuseport; # HTTP/3 enablement
    
    # Advertise HTTP/3 Alt-Svc header
    add_header Alt-Svc 'h3=":443"; ma=86400';
}`
  },
  {
    id: 'compression',
    track: 'Technical & Server',
    title: 'Brotli & Gzip Text Compression',
    criteria: 'Audit and apply dynamic or pre-compressed Brotli rules for HTML, JS, CSS, and SVG text content.',
    severity: 'Critical',
    blueprint: `# Nginx Brotli Dynamic Compression Configuration
brotli on;
brotli_comp_level 6;
brotli_buffers 16 8k;
brotli_min_length 20;
brotli_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/xml application/xml+rss application/json image/svg+xml;`
  },
  {
    id: 'cache_control',
    track: 'Technical & Server',
    title: 'Browser Cache-Control & ETags',
    criteria: 'Establish strict Cache-Control directives (immutable for 1 year on hashed static assets) and validate strong validation ETags.',
    severity: 'High',
    blueprint: `# Nginx Cache-Control configuration for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|webp)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}`
  },
  {
    id: 'dns_sec',
    track: 'Technical & Server',
    title: 'DNS Resolution & DNSSEC Verification',
    criteria: 'Check Anycast name server speed latency and verify DNSSEC verification signatures are active.',
    severity: 'Medium',
    blueprint: `# Bind9 DNSSEC config options
options {
    dnssec-validation auto;
    auth-nxdomain no;    # conform to RFC1035
    listen-on-v6 { any; };
};`
  },
  {
    id: 'cdn_edge',
    track: 'Technical & Server',
    title: 'Content Delivery Network (CDN)',
    criteria: 'Configure geo-routing cache headers at the edge to optimize round-trip time (RTT) globally.',
    severity: 'High',
    blueprint: `# Cloudflare Edge Cache TTL Header Override
add_header Cloudflare-CDN-Cache-Control "public, max-age=604800";
add_header CDN-Cache-Control "public, max-age=604800";`
  },

  // 2. SEO & Crawlability
  {
    id: 'robots_txt',
    track: 'SEO & Crawlability',
    title: 'Robots.txt Exclusions Validation',
    criteria: 'Validate that search crawlers are allowed access to key content while keeping admin/staging routes disallowed.',
    severity: 'Critical',
    blueprint: `# Standard Robots.txt Template
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /staging/
Disallow: /api/

Sitemap: https://yourdomain.com/sitemap.xml`
  },
  {
    id: 'sitemaps',
    track: 'SEO & Crawlability',
    title: 'XML Sitemaps Indexability & Coverage',
    criteria: 'Confirm XML sitemaps match standard structure protocol containing only 200 OK canonical routes.',
    severity: 'High',
    blueprint: `<!-- Standard Sitemap XML Format -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2026-06-19T00:00:00+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
  },
  {
    id: 'canonical',
    track: 'SEO & Crawlability',
    title: 'Canonical Tag Implementations',
    criteria: 'Self-referencing absolute canonical tags must exist on every indexable HTML page node.',
    severity: 'Critical',
    blueprint: `<!-- HTML Absolute Canonical Tag -->
<link rel="canonical" href="https://yourdomain.com/canonical-page-url" />`
  },
  {
    id: 'rendering',
    track: 'SEO & Crawlability',
    title: 'Rendering Architecture (SSR vs CSR)',
    criteria: 'Verify search crawlers receive immediate server-side text content (SSR) rather than empty javascript files.',
    severity: 'High',
    blueprint: `// Next.js (App Router) Enforce Server Components
export const dynamic = 'force-static'; // SSG or
export const revalidate = 3600; // ISR for SEO crawlers`
  },
  {
    id: 'clean_urls',
    track: 'SEO & Crawlability',
    title: 'Clean URL Structures',
    criteria: 'Maintain clean, human-readable directory structures and enforce trailing-slash redirects.',
    severity: 'Medium',
    blueprint: `# Nginx Remove Trailing Slashes Redirect
rewrite ^/(.*)/$ /$1 permanent;`
  },
  {
    id: 'meta_tags',
    track: 'SEO & Crawlability',
    title: 'Meta Title & Descriptions',
    criteria: 'Enforce optimal length limits to prevent SERP snippet truncations (Titles: 50-60 characters, Descriptions: 120-160 characters).',
    severity: 'High',
    blueprint: `<!-- Essential SEO Metadata Tags -->
<title>Optimize Page Title for Search Success (55 chars)</title>
<meta name="description" content="Write a custom description under 155 characters that drives clicks and encapsulates context details." />`
  },
  {
    id: 'headings',
    track: 'SEO & Crawlability',
    title: 'Logical Outline Hierarchy',
    criteria: 'Document headings must follow sequentially from H1 to H6 without skipping tags (e.g. H1 followed immediately by H3).',
    severity: 'Medium',
    blueprint: `<!-- Correct Heading Progression Structure -->
<h1>Main Page Theme</h1>
<h2>Section Title Heading</h2>
<h3>Detailed Sub-Topic Analysis</h3>`
  },
  {
    id: 'internal_links',
    track: 'SEO & Crawlability',
    title: 'Internal Linking & Crawl Depth',
    criteria: 'Crawl depth should remain under 3 clicks from index root nodes, using standard HTML anchor link formats.',
    severity: 'High',
    blueprint: `<!-- Valid Crawler-Friendly Anchor Link -->
<a href="/pricing-plan" class="btn">View Subscription Prices</a>`
  },
  {
    id: 'broken_links',
    track: 'SEO & Crawlability',
    title: 'Broken Links & Redirect Chains',
    criteria: 'Resolve dead links (404/5xx codes) and eliminate redundant multi-hop redirect loops.',
    severity: 'High',
    blueprint: `# Single Redirect rule in Nginx
rewrite ^/old-slug$ /new-slug permanent;`
  },

  // 3. Core Web Vitals & Speed
  {
    id: 'lcp',
    track: 'Core Web Vitals',
    title: 'Largest Contentful Paint (LCP)',
    criteria: 'Confirm top-fold hero layout images or text blocks render in under 2.5 seconds.',
    severity: 'Critical',
    blueprint: `<!-- LCP Image Performance attributes -->
<link rel="preload" fetchpriority="high" as="image" href="/hero-banner.webp" type="image/webp" />`
  },
  {
    id: 'inp',
    track: 'Core Web Vitals',
    title: 'Interaction to Next Paint (INP)',
    criteria: 'INP replaces FID. Measures interaction response. Ensure event loops execute under 200ms.',
    severity: 'Critical',
    blueprint: `// Defer complex processes using requestIdleCallback or setTimeout
function handleUserClick(e) {
  // 1. Instantly update visual state to green
  updateButtonStatusState();
  // 2. Yield process to keep main frame interactive
  setTimeout(() => {
    runHeavyCalculations(e);
  }, 0);
}`
  },
  {
    id: 'cls',
    track: 'Core Web Vitals',
    title: 'Cumulative Layout Shift (CLS)',
    criteria: 'Layout shifting layout ratio must be under 0.1 by allocating fixed image sizes and reserving dynamic block space.',
    severity: 'High',
    blueprint: `/* Always reserve aspect ratio space for layout items */
.hero-image {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
  content-visibility: auto;
}`
  },
  {
    id: 'crux_recon',
    track: 'Core Web Vitals',
    title: 'CrUX Field Data Reconciliation',
    criteria: 'Align local lighthouse parameters to Chrome User Experience (CrUX) field reports.',
    severity: 'Medium',
    blueprint: `// Dynamic CrUX metric check logic placeholder
// Field logs must match simulated speeds`
  },
  {
    id: 'connection_hints',
    track: 'Core Web Vitals',
    title: 'Early Connection Hinting',
    criteria: 'Preconnect to essential external domain hosts (CDN, Google Fonts, APIs) early in the head wrapper.',
    severity: 'Medium',
    blueprint: `<!-- Core Connection preconnect attributes -->
<link rel="preconnect" href="https://images.ctfassets.net" />
<link rel="dns-prefetch" href="https://images.ctfassets.net" />`
  },
  {
    id: 'fonts',
    track: 'Core Web Vitals',
    title: 'Font Render Blockers (FOUT/FOIT)',
    criteria: 'Verify text layout remains readable while custom fonts are loading by utilizing swap rules.',
    severity: 'High',
    blueprint: `/* Correct CSS font face configuration */
@font-face {
  font-family: 'Inter Custom';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap; /* Bypasses visual layout blocking */
}`
  },

  // 4. Structured Data & Semantics
  {
    id: 'schemas_ld',
    track: 'Structured Data',
    title: 'Dynamic JSON-LD Schemas',
    criteria: 'Add accurate JSON-LD schemas representing entities like LocalBusiness or FAQPage to secure rich result spots.',
    severity: 'High',
    blueprint: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How fast is SEO Aashan?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "SEO Aashan compiles structured checks instantly."
    }
  }]
}
</script>`
  },
  {
    id: 'html5_semantics',
    track: 'Structured Data',
    title: 'Semantic HTML5 Landmarks',
    criteria: 'Segment layout wrappers using HTML5 semantic elements (<header>, <nav>, <main>, <footer>).',
    severity: 'Medium',
    blueprint: `<!-- Valid Structural Semantic Framework -->
<header><nav><!-- Menu --></nav></header>
<main>
  <article>Content body...</article>
</main>
<footer><!-- Copyright --></footer>`
  },
  {
    id: 'og_tags',
    track: 'Structured Data',
    title: 'Open Graph (OG) Cards',
    criteria: 'Implement Open Graph tags to provide social preview content dynamically.',
    severity: 'Low',
    blueprint: `<!-- Essential social graph cards metadata -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Page Title Header" />
<meta property="og:description" content="Click details synopsis" />
<meta property="og:image" content="https://yourdomain.com/preview.png" />`
  },

  // 5. Accessibility
  {
    id: 'contrast',
    track: 'Accessibility',
    title: 'Color Contrast Ratios',
    criteria: 'Text elements must meet WCAG 2.2 AA standards maintaining contrast margins of at least 4.5:1.',
    severity: 'High',
    blueprint: `/* Correct visual contrast palette definitions */
:root {
  --bg-dark: #0d0e12;
  --text-high-contrast: #f1f3f6; /* Meets AAA contrast ratios */
  --text-muted: #9da8b6;        /* Meets AA contrast ratios */
}`
  },
  {
    id: 'keyboard_nav',
    track: 'Accessibility',
    title: 'Keyboard Navigation & Focus Traps',
    criteria: 'Interactive visual elements must be accessible via Tab keyboard navigation with focus outline indicators.',
    severity: 'High',
    blueprint: `/* Focus indicator outline helper class */
.interactive-btn:focus-visible {
  outline: 2px solid var(--neon-cyan);
  outline-offset: 4px;
}`
  },
  {
    id: 'aria_attributes',
    track: 'Accessibility',
    title: 'Screen Reader Attributes (ARIA)',
    criteria: 'Add aria-label strings to icon buttons and define current status roles on dynamic states.',
    severity: 'Medium',
    blueprint: `<!-- Button with Screen Reader label descriptor -->
<button aria-label="Close interactive modal menu" onClick={closeModal}>
  <svg><!-- Close Icon --></svg>
</button>`
  },
  {
    id: 'skip_link',
    track: 'Accessibility',
    title: 'Skip to Main Content Navigation',
    criteria: 'Provide a keyboard-focused skip link to bypass long header components instantly.',
    severity: 'Medium',
    blueprint: `<!-- Skip links markup structure -->
<a href="#main-content" class="skip-to-main">Skip to main content</a>
<main id="main-content" tabindex="-1">...</main>

<style>
.skip-to-main {
  position: absolute;
  top: -100px;
  left: 20px;
  background: var(--neon-cyan);
  color: #000;
  padding: 8px 12px;
  z-index: 1000;
  transition: top 0.2s;
}
.skip-to-main:focus {
  top: 20px;
}
</style>`
  },
  {
    id: 'form_labels',
    track: 'Accessibility',
    title: 'Form Association & Error Descriptors',
    criteria: 'Input elements must have explicit label links and describe active error fields using aria-describedby.',
    severity: 'High',
    blueprint: `<!-- Accessible Form Input Markup -->
<div class="form-group">
  <label for="user-email">Email Address</label>
  <input id="user-email" type="email" aria-describedby="email-error" />
  <span id="email-error" class="error-msg">Please input a valid email.</span>
</div>`
  },

  // 6. Mobile Responsiveness & GEO
  {
    id: 'viewport_scaling',
    track: 'Mobile & GEO',
    title: 'Fluid Scaling & Viewport Tag',
    criteria: 'Prevent horizontal overflow scroll limits by using dynamic layouts down to 320px screen widths.',
    severity: 'Critical',
    blueprint: `<!-- Required responsive viewport configuration -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
  },
  {
    id: 'touch_targets',
    track: 'Mobile & GEO',
    title: 'Tactile Touch Targets',
    criteria: 'Interactive targets on mobile layouts must be at least 44 x 44 CSS pixels wide.',
    severity: 'High',
    blueprint: `/* Enforce minimum touch size on button layouts */
.mobile-nav-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
}`
  },
  {
    id: 'hreflang',
    track: 'Mobile & GEO',
    title: 'Hreflang Regional Localization Tags',
    criteria: 'Add hreflang regional tags inside multi-locale websites to route visitors to matched regional content.',
    severity: 'High',
    blueprint: `<!-- Multi-locale Hreflang Tags example -->
<link rel="alternate" hreflang="en-us" href="https://yourdomain.com/us/" />
<link rel="alternate" hreflang="en-gb" href="https://yourdomain.com/uk/" />
<link rel="alternate" hreflang="x-default" href="https://yourdomain.com/" />`
  },
  {
    id: 'geo_routing',
    track: 'Mobile & GEO',
    title: 'Geo-Routing Server Redirect Maps',
    criteria: 'Implement server locale detection without blocking core United States crawlers.',
    severity: 'Medium',
    blueprint: `# Nginx GeoIP Country Routing block Example
geoip_country /usr/share/GeoIP/GeoIP.dat;
map $geoip_country_code $redirect_url {
    default https://yourdomain.com;
    UK      https://yourdomain.com/uk/;
    FR      https://yourdomain.com/fr/;
}`
  },

  // 7. Security & GDPR Privacy Protocols
  {
    id: 'security_headers',
    track: 'Security & Privacy',
    title: 'Critical HTTP Security Headers',
    criteria: 'Enforce strict security policies (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) to secure document loads.',
    severity: 'Critical',
    blueprint: `# Nginx Security Headers Configuration
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;`
  },
  {
    id: 'https_ssl',
    track: 'Security & Privacy',
    title: 'HTTPS & SSL Grade Validation',
    criteria: 'Redirect insecure traffic to secure HTTPS and ensure SSL uses modern SHA-256 keys.',
    severity: 'Critical',
    blueprint: `# Nginx HTTP to HTTPS global redirection rules
server {
    listen 80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}`
  },
  {
    id: 'cookies_consent',
    track: 'Security & Privacy',
    title: 'Consent Scripts & Secure Cookies',
    criteria: 'Configure cookie headers with Secure, HttpOnly, and SameSite flags, and load user privacy consent banners.',
    severity: 'High',
    blueprint: `# Nginx secure session cookie profile parameters
proxy_cookie_path / "/; HTTPOnly; Secure; SameSite=Strict";`
  }
];

export default function GuidelineBrowserView() {
  const [search, setSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tracks = ['All', 'Technical & Server', 'SEO & Crawlability', 'Core Web Vitals', 'Structured Data', 'Accessibility', 'Mobile & GEO', 'Security & Privacy'];
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filtered = GUIDELINES_DATABASE.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.criteria.toLowerCase().includes(search.toLowerCase()) ||
                          item.id.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = trackFilter === 'All' || item.track === trackFilter;
    const matchesSeverity = severityFilter === 'All' || item.severity === severityFilter;
    return matchesSearch && matchesTrack && matchesSeverity;
  });

  return (
    <div className="view-viewport" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and Filters Toolbar */}
      <div className="panel-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ flexGrow: 1, position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-text-dim)' }} />
            <input
              type="text"
              className="console-input"
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder="Search specs by keyword (e.g. INP, Nginx, Hreflang, CSP...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={12} style={{ color: 'var(--neon-cyan)' }} />
              <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', fontWeight: 'bold' }}>TRACK</span>
              <select
                className="console-input"
                style={{ padding: '6px 12px', width: '160px', fontSize: '11px' }}
                value={trackFilter}
                onChange={e => setTrackFilter(e.target.value)}
              >
                {tracks.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', fontWeight: 'bold' }}>SEVERITY</span>
              <select
                className="console-input"
                style={{ padding: '6px 12px', width: '110px', fontSize: '11px' }}
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                {severities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Grid listing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {filtered.map(item => {
          const isCritical = item.severity === 'Critical';
          const isHigh = item.severity === 'High';
          const isMedium = item.severity === 'Medium';
          const severityColor = isCritical ? 'var(--neon-red)' : isHigh ? 'var(--neon-amber)' : isMedium ? 'var(--neon-cyan)' : 'var(--color-text-dim)';

          return (
            <div key={item.id} className="panel-card animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              
              {/* Criteria details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                      {item.track} // SPECS INDEX
                    </span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--color-text-bright)', borderBottom: 'none', paddingBottom: 0 }}>
                      {item.title}
                    </h3>
                  </div>
                  <span 
                    className="tag-badge" 
                    style={{ 
                      background: 'var(--bg-console)', 
                      color: severityColor, 
                      borderColor: severityColor, 
                      border: '1px solid',
                      fontSize: '9px',
                      textShadow: `0 0 4px ${severityColor}` 
                    }}
                  >
                    {item.severity.toUpperCase()}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', margin: 0, lineHeight: '1.5' }}>
                  {item.criteria}
                </p>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-dim)', background: 'var(--bg-console)', padding: '8px', border: '1px solid var(--border-color)' }}>
                  <Info size={12} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                  <span>Use clipboard node blueprints on the right to implement repair rules in configurations or scripts.</span>
                </div>
              </div>

              {/* Code blueprint wrapper */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-console)', border: '1px solid var(--border-color)', borderBottom: 'none', padding: '6px 12px', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                    ACTION BLUEPRINT SPEC ({item.id})
                  </span>
                  <button
                    className="console-btn"
                    onClick={() => handleCopy(item.id, item.blueprint)}
                    style={{ padding: '3px 8px', fontSize: '9px', background: 'var(--bg-console)', border: '1px solid var(--border-color)' }}
                  >
                    {copiedId === item.id ? <Check size={10} style={{ color: 'var(--neon-green)' }} /> : <Copy size={10} />}
                    {copiedId === item.id ? ' COPIED' : ' COPY CODE'}
                  </button>
                </div>
                <div style={{ flexGrow: 1, margin: 0 }}>
                  <pre 
                    style={{ 
                      margin: 0, 
                      padding: '12px', 
                      background: '#07080b', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '0 0 4px 4px', 
                      fontSize: '10px', 
                      fontFamily: 'var(--font-mono)', 
                      overflowX: 'auto', 
                      color: 'var(--neon-green)',
                      whiteSpace: 'pre'
                    }}
                  >
                    {item.blueprint}
                  </pre>
                </div>
              </div>

            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="panel-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-dim)' }}>
            <HelpCircle size={32} style={{ marginBottom: '8px', color: 'var(--border-color)' }} />
            <div>No specification guidelines found matching your filters/queries.</div>
          </div>
        )}
      </div>

    </div>
  );
}
