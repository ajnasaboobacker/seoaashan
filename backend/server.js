import express from 'express';
import cors from 'cors';
import { execFile, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import dns from 'dns';
import tls from 'tls';
import { saveCredentials, loadCredentials, verifySession, getInsforgeClient, isCloudEnabled } from './db.js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPTS_DIR = path.resolve(__dirname, './scripts');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static assets in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const PORT = process.env.PORT || 4000;
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

// Helper to run python script with args, stdin, and dynamic env variables injection
function runPythonScript(scriptName, args, stdinContent = null, customEnv = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    const cmdArgs = [scriptPath, ...args];
    
    const child = execFile(PYTHON_PATH, cmdArgs, { 
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, ...customEnv, PYTHONIOENCODING: 'utf-8' }
    }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr, stdout });
      } else {
        resolve({ stdout, stderr });
      }
    });

    if (stdinContent !== null && child.stdin) {
      child.stdin.write(stdinContent);
      child.stdin.end();
    }
  });
}

// User session auth & credentials middleware
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // Default to Guest Tenant if no header is present
    req.userId = 'local_guest_user';
    req.userMode = 'guest';
    req.credentials = await loadCredentials(req.userId);
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const session = await verifySession(token);
    req.userId = session.userId;
    req.userMode = session.mode;
    req.credentials = await loadCredentials(session.userId);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized session credentials', details: err.message });
  }
}

// Helper to compile dynamic env overrides from loaded user credentials
function getCustomEnv(req) {
  const creds = req.credentials || {};
  return {
    GOOGLE_API_KEY: creds.googleApiKey || process.env.GOOGLE_API_KEY || '',
    GOOGLE_ADS_DEVELOPER_TOKEN: creds.adsDevToken || '',
    GOOGLE_ADS_CUSTOMER_ID: creds.adsCustomerId || '',
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: creds.adsLoginId || ''
  };
}

// Helper to validate url
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Get config (public)
app.get('/api/config', (req, res) => {
  res.json({
    cloudEnabled: isCloudEnabled(),
    insforgeUrl: process.env.INSFORGE_URL || '',
    insforgeAnonKey: process.env.INSFORGE_ANON_KEY || ''
  });
});

// ─── Trending Keywords (public, no auth) ────────────────────────────────────
// Fetches live Google Trends RSS, extracts titles, enriches with curated SEO
// fallback list. Cache result for 30 minutes to avoid hammering Google.
const TRENDING_CACHE = { data: null, fetchedAt: 0, TTL_MS: 30 * 60 * 1000 };

const SEO_FALLBACK_KEYWORDS = [
  'core web vitals 2025', 'ai overviews optimization', 'e-e-a-t signals',
  'zero-click searches', 'semantic search intent', 'helpful content update',
  'schema markup trends', 'local pack optimization', 'voice search seo',
  'generative engine optimization', 'topical authority clusters',
  'page experience signals', 'indexing budget management', 'multivector embeddings',
  'knowledge graph entities', 'featured snippet capture', 'crawl depth optimization',
  'google helpful content', 'ai search citations', 'site authority score',
  'passage-level indexing', 'entity seo strategy', 'YMYL content guidelines',
  'product review guidelines', 'merchant center listing', 'hreflang best practices',
  'international seo signals', 'link velocity trends', 'disavow file audit',
  'core algorithm update', 'structured data markup', 'webp image seo',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchGoogleTrends(geo = 'US') {
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOAashanBot/1.0)' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Trends RSS ${res.status}`);
  const xml = await res.text();

  // Extract <title> tags (skip first — it's the feed title)
  const matches = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/gi)];
  const titles = matches.slice(1).map(m => m[1].trim().toLowerCase());
  return titles.filter(t => t.length > 2 && t.length < 60);
}

app.get('/api/trending', async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (TRENDING_CACHE.data && now - TRENDING_CACHE.fetchedAt < TRENDING_CACHE.TTL_MS) {
      return res.json({ source: 'cache', keywords: TRENDING_CACHE.data });
    }

    // Try Google Trends RSS (US + global mashup)
    let live = [];
    try {
      const [us, gb] = await Promise.allSettled([
        fetchGoogleTrends('US'),
        fetchGoogleTrends('GB'),
      ]);
      if (us.status === 'fulfilled') live.push(...us.value);
      if (gb.status === 'fulfilled') live.push(...gb.value);
    } catch (_) { /* fallthrough to curated list */ }

    // Merge: up to 10 live trends + rest from shuffled SEO curated list
    const liveSlice    = [...new Set(live)].slice(0, 10);
    const curatedSlice = shuffle(SEO_FALLBACK_KEYWORDS).slice(0, 22 - liveSlice.length);
    const merged       = [...liveSlice, ...curatedSlice];

    TRENDING_CACHE.data      = merged;
    TRENDING_CACHE.fetchedAt = now;

    res.json({ source: live.length > 0 ? 'live' : 'curated', keywords: merged });
  } catch (err) {
    // Always return something usable
    res.json({ source: 'fallback', keywords: shuffle(SEO_FALLBACK_KEYWORDS).slice(0, 20) });
  }
});

// Settings save (authenticated)
app.post('/api/settings/save', requireAuth, async (req, res) => {
  try {
    const { credentials } = req.body;
    if (!credentials) {
      return res.status(400).json({ error: 'Credentials object is required' });
    }
    const result = await saveCredentials(req.userId, credentials);
    res.json({ status: 'ok', ...result });
  } catch (err) {
    console.error('Error saving credentials:', err);
    res.status(500).json({ error: err.message || 'Failed to save credentials' });
  }
});

// Settings load (authenticated)
app.get('/api/settings/load', requireAuth, async (req, res) => {
  try {
    const credentials = await loadCredentials(req.userId);
    res.json({ status: 'ok', credentials });
  } catch (err) {
    console.error('Error loading credentials:', err);
    res.status(500).json({ error: err.message || 'Failed to load credentials' });
  }
});

// Apply requireAuth middleware to protect all other /api endpoints
app.use('/api', requireAuth);

// 1. Analyze single page
app.post('/api/analyze-page', async (req, res) => {
  const { url, render = 'auto' } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    // Step 1: Fetch raw page HTML
    const fetchResult = await runPythonScript('fetch_page.py', [url, '--render', render], null, getCustomEnv(req));
    const htmlContent = fetchResult.stdout;

    // Extract status code and redirects from stderr log
    const statusMatch = fetchResult.stderr.match(/Status:\s*(\d+)/);
    const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 200;
    
    // Step 2: Parse HTML
    const parseResult = await runPythonScript('parse_html.py', ['--url', url, '--json'], htmlContent, getCustomEnv(req));
    const parsedData = JSON.parse(parseResult.stdout);

    res.json({
      status: 'ok',
      statusCode,
      url,
      renderMode: render,
      data: parsedData
    });
  } catch (err) {
    console.error('Error analyzing page:', err);
    res.status(500).json({ 
      error: err.error?.message || 'Failed to analyze page',
      details: err.stderr || err.toString()
    });
  }
});

// 2. Content quality checker
app.post('/api/content-quality', async (req, res) => {
  const { text, url } = req.body;
  
  try {
    let targetText = text;

    if (url) {
      if (!isValidUrl(url)) {
        return res.status(400).json({ error: 'Valid URL is required' });
      }
      // Fetch HTML first
      const fetchResult = await runPythonScript('fetch_page.py', [url, '--render', 'auto'], null, getCustomEnv(req));
      const html = fetchResult.stdout;
      
      // Inline Python snippet to extract clean body text using BeautifulSoup
      const extractTextSnippet = `
import sys
from bs4 import BeautifulSoup
soup = BeautifulSoup(sys.stdin.read(), "html.parser")
for s in soup(["script", "style", "nav", "footer", "header"]):
    s.decompose()
text = soup.get_text(separator=" ", strip=True)
print(text)
`;
      const extractResult = await new Promise((resolve, reject) => {
        const py = execFile(PYTHON_PATH, ['-c', extractTextSnippet], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
          if (err) reject(err);
          else resolve(stdout);
        });
        py.stdin.write(html);
        py.stdin.end();
      });
      targetText = extractResult;
    }

    if (!targetText || targetText.trim() === '') {
      return res.status(400).json({ error: 'Content text or URL is required' });
    }

    // Run content quality script
    const qualityResult = await runPythonScript('content_quality.py', ['--json'], targetText, getCustomEnv(req));
    const parsedData = JSON.parse(qualityResult.stdout);

    res.json({
      status: 'ok',
      textPreview: targetText.slice(0, 1000) + (targetText.length > 1000 ? '...' : ''),
      wordCount: targetText.split(/\s+/).filter(Boolean).length,
      data: parsedData
    });
  } catch (err) {
    console.error('Error scoring content:', err);
    res.status(500).json({ 
      error: 'Failed to run content quality checker',
      details: err.stderr || err.toString()
    });
  }
});

// 3. PageSpeed Insights & CWV
app.post('/api/pagespeed', async (req, res) => {
  const { url, strategy = 'both' } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    let stdout;
    try {
      const pagespeedResult = await runPythonScript('pagespeed_check.py', [url, '--strategy', strategy, '--json'], null, getCustomEnv(req));
      stdout = pagespeedResult.stdout;
    } catch (err) {
      if (err.stdout) {
        stdout = err.stdout;
      } else {
        throw err;
      }
    }
    const parsedData = JSON.parse(stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error fetching PageSpeed:', err);
    res.status(500).json({ 
      error: 'Failed to complete PageSpeed Insights check',
      details: err.stderr || err.toString() || (err.error && err.error.message)
    });
  }
});

// 4. Schema markup generator
app.post('/api/schema/generate', async (req, res) => {
  const { kind, params = {} } = req.body;
  if (!kind) {
    return res.status(400).json({ error: 'Schema kind is required' });
  }

  // Map incoming params object to CLI arguments array
  const args = [kind];
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      const cliKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      if (Array.isArray(val)) {
        args.push(cliKey, ...val.map(String));
      } else {
        args.push(cliKey, String(val));
      }
    }
  });

  try {
    const schemaResult = await runPythonScript('schema_generate.py', args, null, getCustomEnv(req));
    const parsedData = JSON.parse(schemaResult.stdout);
    res.json({ status: 'ok', schema: parsedData });
  } catch (err) {
    console.error('Error generating schema:', err);
    res.status(500).json({ 
      error: 'Failed to generate schema',
      details: err.stderr || err.toString()
    });
  }
});

// 5. SEO Drift Baseline and Comparisons
app.post('/api/drift/baseline', async (req, res) => {
  const { url, skipCwv = true } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  const args = [url];
  if (skipCwv) args.push('--skip-cwv');

  try {
    const baselineResult = await runPythonScript('drift_baseline.py', args, null, getCustomEnv(req));
    const parsedData = JSON.parse(baselineResult.stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error capturing baseline:', err);
    res.status(500).json({ 
      error: 'Failed to capture drift baseline',
      details: err.stderr || err.toString()
    });
  }
});

app.post('/api/drift/compare', async (req, res) => {
  const { url, skipCwv = true, baselineId } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  const args = [url];
  if (skipCwv) args.push('--skip-cwv');
  if (baselineId) args.push('--baseline-id', String(baselineId));

  try {
    const compareResult = await runPythonScript('drift_compare.py', args, null, getCustomEnv(req));
    const parsedData = JSON.parse(compareResult.stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error running drift comparison:', err);
    res.status(500).json({ 
      error: 'Failed to complete drift comparison',
      details: err.stderr || err.toString()
    });
  }
});

app.get('/api/drift/history', async (req, res) => {
  const { url } = req.query;
  if (!url || !isValidUrl(url.toString())) {
    return res.status(400).json({ error: 'Valid URL parameter is required' });
  }

  try {
    const historyResult = await runPythonScript('drift_history.py', [url.toString()], null, getCustomEnv(req));
    const parsedData = JSON.parse(historyResult.stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error loading history:', err);
    res.status(500).json({ 
      error: 'Failed to load drift history',
      details: err.stderr || err.toString()
    });
  }
});

// 6. CrUX History trends
app.post('/api/crux-history', async (req, res) => {
  const { url, formFactor } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  const args = [url];
  if (formFactor) args.push('--form-factor', formFactor);
  args.push('--json');

  try {
    const cruxHistoryResult = await runPythonScript('crux_history.py', args, null, getCustomEnv(req));
    const parsedData = JSON.parse(cruxHistoryResult.stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error fetching CrUX history:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve CrUX timeseries metrics',
      details: err.stderr || err.toString()
    });
  }
});

// 7. Schema policy validator
app.post('/api/schema/validate', async (req, res) => {
  const { schema } = req.body;
  if (!schema) {
    return res.status(400).json({ error: 'Schema JSON string is required' });
  }

  try {
    let stdout;
    try {
      const validateResult = await runPythonScript('schema_ecommerce_validate.py', ['-', '--json'], schema, getCustomEnv(req));
      stdout = validateResult.stdout;
    } catch (err) {
      if (err.stdout) {
        stdout = err.stdout;
      } else {
        if (err.stderr && err.stderr.includes('invalid JSON')) {
          return res.status(400).json({
            ok: false,
            findings: [
              {
                severity: "Critical",
                rule: "invalid-json-syntax",
                message: err.stderr.trim()
              }
            ],
            summary: {
              critical: 1,
              high: 0,
              medium: 0,
              info: 0
            }
          });
        }
        throw err;
      }
    }
    const parsedData = JSON.parse(stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error validating schema:', err);
    res.status(500).json({ 
      error: 'Failed to validate schema policy requirements',
      details: err.stderr || err.toString() || (err.error && err.error.message)
    });
  }
});

// 8. Backlink bulk verification
app.post('/api/backlinks/verify', async (req, res) => {
  const { target, links } = req.body;
  if (!target || !isValidUrl(target)) {
    return res.status(400).json({ error: 'Valid target URL is required' });
  }
  if (!links || !Array.isArray(links)) {
    return res.status(400).json({ error: 'Links array is required' });
  }

  try {
    const payload = JSON.stringify(links);
    const verifyResult = await runPythonScript('verify_backlinks.py', ['--target', target, '--links', '-', '--json'], payload, getCustomEnv(req));
    const parsedData = JSON.parse(verifyResult.stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error verifying backlinks:', err);
    res.status(500).json({ 
      error: 'Failed to verify backlink index status',
      details: err.stderr || err.toString()
    });
  }
});

// 9. Sitemap validator
app.post('/api/sitemap/check', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid sitemap URL is required' });
  }

  try {
    // Fetch XML using fetch_page.py
    const fetchResult = await runPythonScript('fetch_page.py', [url], null, getCustomEnv(req));
    const xmlContent = fetchResult.stdout;

    // Inline Python snippet to parse Sitemap tags safely
    const parseSnippet = `
import sys, json, xml.etree.ElementTree as ET
try:
    content = sys.stdin.read()
    root = ET.fromstring(content)
    # Handle namespaces dynamically
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"
    
    urls = []
    for url_node in root.findall(f".//{ns}url"):
        loc = url_node.find(f"{ns}loc")
        lastmod = url_node.find(f"{ns}lastmod")
        urls.append({
            "loc": loc.text if loc is not None else "",
            "lastmod": lastmod.text if lastmod is not None else ""
        })
    print(json.dumps({"ok": True, "urls": urls}))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`;
    const parseResult = await new Promise((resolve, reject) => {
      const child = execFile(PYTHON_PATH, ['-c', parseSnippet], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(stdout);
      });
      child.stdin.write(xmlContent);
      child.stdin.end();
    });

    const parsedData = JSON.parse(parseResult);
    res.json(parsedData);
  } catch (err) {
    console.error('Error parsing sitemap:', err);
    res.status(500).json({ 
      error: 'Failed to validate XML sitemap structure',
      details: err.stderr || err.toString()
    });
  }
});

// 10. GEO search engine optimization checker
app.post('/api/geo/check', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    // Step 1: Parse the page layout via analyze-page flow
    const pageResult = await runPythonScript('fetch_page.py', [url, '--render', 'auto'], null, getCustomEnv(req));
    const html = pageResult.stdout;
    const parseResult = await runPythonScript('parse_html.py', ['--url', url, '--json'], html, getCustomEnv(req));
    const parsedData = JSON.parse(parseResult.stdout);

    // Step 2: Fetch robots.txt and llms.txt of the domain
    const targetUrlObj = new URL(url);
    const origin = targetUrlObj.origin;
    
    const robotsResult = await runPythonScript('fetch_page.py', [`${origin}/robots.txt`], null, getCustomEnv(req)).catch(() => ({ stdout: '' }));
    const llmsResult = await runPythonScript('fetch_page.py', [`${origin}/llms.txt`], null, getCustomEnv(req)).catch(() => ({ stdout: '' }));

    const robotsTxt = robotsResult.stdout || '';
    const llmsTxt = llmsResult.stdout || '';
    
    // Parse robots.txt for AI bots access rules
    const crawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot'];
    const botAccess = {};
    crawlers.forEach(bot => {
      const botRegex = new RegExp(`User-agent:\\s*\\*?\\s*${bot}[\\s\\S]*?(?:User-agent:|$)`, 'i');
      const match = robotsTxt.match(botRegex);
      if (match) {
        botAccess[bot] = !match[0].match(/Disallow:\s*\/\s*$/i);
      } else {
        botAccess[bot] = true; // Default is allowed unless disallowed
      }
    });

    // Score citability (optimal 134-167 words per paragraph block)
    const textSnippet = `
import sys
from bs4 import BeautifulSoup
soup = BeautifulSoup(sys.stdin.read(), "html.parser")
for s in soup(["script", "style", "nav", "footer", "header"]):
    s.decompose()
paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")]
print(json.dumps(paragraphs))
`;
    const paragraphsRaw = await new Promise((resolve) => {
      const child = execFile(PYTHON_PATH, ['-c', textSnippet], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        if (err) resolve('[]');
        else resolve(stdout);
      });
      child.stdin.write(html);
      child.stdin.end();
    });
    
    const paragraphs = JSON.parse(paragraphsRaw);
    const citabilityPassages = paragraphs.map(p => {
      const wordCount = p.split(/\s+/).filter(Boolean).length;
      return {
        text: p.slice(0, 150) + (p.length > 150 ? '...' : ''),
        wordCount,
        citable: wordCount >= 134 && wordCount <= 167
      };
    });

    res.json({
      status: 'ok',
      url,
      botAccess,
      hasLlmsTxt: llmsTxt.trim().length > 0 && !llmsTxt.includes('404'),
      citabilityPassages: citabilityPassages.filter(p => p.wordCount > 10),
      headings: parsedData.h1.concat(parsedData.h2)
    });
  } catch (err) {
    console.error('Error running GEO audit:', err);
    res.status(500).json({ 
      error: 'Failed to run GEO accessibility checks',
      details: err.stderr || err.toString()
    });
  }
});

// 11. Full website audit crawler
app.post('/api/audit/full', async (req, res) => {
  const { url, maxPages = 50 } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    const result = await runPythonScript('full_website_audit.py', [url, '--max-pages', String(maxPages), '--json'], null, getCustomEnv(req));
    const parsedData = JSON.parse(result.stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error running full site audit:', err);
    res.status(500).json({ 
      error: 'Failed to run full website audit',
      details: err.stderr || err.toString() || (err.error && err.error.message)
    });
  }
});

// 11b. Complete multi-signal audit (BFS crawl + PageSpeed + CrUX + GEO)
app.post('/api/audit/complete', async (req, res) => {
  const { url, maxPages = 30 } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  const customEnv = getCustomEnv(req);

  try {
    // Run all audits concurrently — failure of any one should not block the rest
    const [crawlResult, pagespeedResult, cruxResult, geoResult] = await Promise.allSettled([
      // 1. Full BFS crawl
      runPythonScript('full_website_audit.py', [url, '--max-pages', String(maxPages), '--json'], null, customEnv),
      // 2. PageSpeed Insights (mobile + desktop)
      runPythonScript('pagespeed_check.py', [url, '--strategy', 'both', '--json'], null, customEnv)
        .catch(err => err.stdout ? { stdout: err.stdout } : Promise.reject(err)),
      // 3. CrUX 25-week history
      runPythonScript('crux_history.py', [url, '--json'], null, customEnv),
      // 4. GEO check: fetch robots.txt, llms.txt, parse paragraphs
      (async () => {
        const origin = new URL(url).origin;
        const [robotsRes, llmsRes, pageRes] = await Promise.allSettled([
          runPythonScript('fetch_page.py', [`${origin}/robots.txt`], null, customEnv),
          runPythonScript('fetch_page.py', [`${origin}/llms.txt`],   null, customEnv),
          runPythonScript('fetch_page.py', [url, '--render', 'auto'], null, customEnv),
        ]);
        const robotsTxt = robotsRes.status === 'fulfilled' ? robotsRes.value.stdout : '';
        const llmsTxt   = llmsRes.status   === 'fulfilled' ? llmsRes.value.stdout   : '';
        const html      = pageRes.status   === 'fulfilled' ? pageRes.value.stdout   : '';

        const crawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot'];
        const botAccess = {};
        crawlers.forEach(bot => {
          const m = robotsTxt.match(new RegExp(`User-agent:\\s*\\*?\\s*${bot}[\\s\\S]*?(?:User-agent:|$)`, 'i'));
          botAccess[bot] = m ? !m[0].match(/Disallow:\s*\/\s*$/i) : true;
        });
        return JSON.stringify({
          botAccess,
          hasLlmsTxt: llmsTxt.trim().length > 0 && !llmsTxt.includes('404'),
          htmlLength: html.length
        });
      })()
    ]);

    // Parse results — use safe empty fallbacks on failures
    let crawlData = {};
    if (crawlResult.status === 'fulfilled') {
      try { crawlData = JSON.parse(crawlResult.value.stdout); } catch (_) {}
    } else {
      console.error('Complete audit – crawl failed:', crawlResult.reason?.stderr || crawlResult.reason);
    }

    let pagespeedData = {};
    if (pagespeedResult.status === 'fulfilled') {
      try { pagespeedData = JSON.parse(pagespeedResult.value.stdout); } catch (_) {}
    } else {
      console.error('Complete audit – pagespeed failed:', pagespeedResult.reason?.stderr || pagespeedResult.reason);
    }

    let cruxData = {};
    if (cruxResult.status === 'fulfilled') {
      try { cruxData = JSON.parse(cruxResult.value.stdout); } catch (_) {}
    } else {
      console.error('Complete audit – crux failed:', cruxResult.reason?.stderr || cruxResult.reason);
    }

    let geoData = {};
    if (geoResult.status === 'fulfilled') {
      try { geoData = JSON.parse(geoResult.value); } catch (_) {}
    } else {
      console.error('Complete audit – geo failed:', geoResult.reason?.stderr || geoResult.reason);
    }

    // Merge into unified payload
    res.json({
      status: 'ok',
      scope: 'complete',
      url,
      domain: new URL(url).hostname,
      // Crawl fields (pass-through)
      ...crawlData,
      // Enrichment fields
      pagespeed: pagespeedData,
      crux: cruxData,
      geo: geoData,
    });
  } catch (err) {
    console.error('Error running complete audit:', err);
    res.status(500).json({
      error: 'Failed to run complete audit',
      details: err.stderr || err.toString() || (err.error && err.error.message)
    });
  }
});

// 12. Full site report PDF/HTML compiler
app.post('/api/report/pdf', async (req, res) => {
  const { data, domain } = req.body;
  if (!domain || !data) {
    return res.status(400).json({ error: 'Domain and report data are required' });
  }

  const outputDir = path.resolve(__dirname);
  let reportType = 'full';
  if (data.scope === 'single') {
    reportType = 'crawl-single';
  } else if (data.scope === 'complete' && req.body.reportType === 'complete-client') {
    reportType = 'complete-client';
  } else if (data.scope === 'complete' && req.body.reportType === 'complete-analyst') {
    reportType = 'complete-analyst';
  } else if (data.crawledPages) {
    reportType = 'crawl-full';
  }
  const args = ['--type', reportType, '--domain', domain, '--output-dir', outputDir, '--json'];

  try {
    const payload = JSON.stringify(data);
    const reportResult = await runPythonScript('google_report.py', args, payload, getCustomEnv(req));
    const parsedRes = JSON.parse(reportResult.stdout);
    
    if (parsedRes.files && parsedRes.files.length > 0) {
      const generatedFilePath = path.resolve(parsedRes.files[0]);
      const isHtml = generatedFilePath.endsWith('.html');
      
      res.setHeader('Content-Type', isHtml ? 'text/html' : 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(generatedFilePath)}"`);
      
      res.sendFile(generatedFilePath, (err) => {
        // Clean up file after sending
        fs.unlink(generatedFilePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temp report file:', unlinkErr);
        });
        if (err && !res.headersSent) {
          console.error('Error sending report file:', err);
          res.status(500).end();
        }
      });
    } else {
      throw new Error(parsedRes.error || 'No report files were generated');
    }
  } catch (err) {
    console.error('Error generating PDF report:', err);
    res.status(500).json({ 
      error: 'Failed to compile report PDF/HTML',
      details: err.stderr || err.toString() || (err.error && err.error.message)
    });
  }
});

// 13. Topic Cluster Planner
app.post('/api/cluster/plan', async (req, res) => {
  const { seed } = req.body;
  if (!seed || seed.trim() === '') {
    return res.status(400).json({ error: 'Seed keyword is required' });
  }

  try {
    const result = await runPythonScript('cluster_keywords.py', [seed, '--json'], null, getCustomEnv(req));
    const parsedData = JSON.parse(result.stdout);
    res.json(parsedData);
  } catch (err) {
    console.error('Error running topic clustering:', err);
    res.status(500).json({ 
      error: 'Failed to generate topic clusters',
      details: err.stderr || err.toString()
    });
  }
});

// 14. Keyword Ideas Discovery
app.post('/api/keywords/ideas', async (req, res) => {
  const { seed, language = '1000', location = '2840' } = req.body;
  if (!seed || seed.trim() === '') {
    return res.status(400).json({ error: 'Seed keyword is required' });
  }

  try {
    let stdout;
    try {
      const result = await runPythonScript('keyword_planner.py', ['ideas', seed, '--language', language, '--location', location, '--json'], null, getCustomEnv(req));
      stdout = result.stdout;
    } catch (err) {
      if (err.stdout) {
        stdout = err.stdout;
      } else {
        throw err;
      }
    }
    const parsedData = JSON.parse(stdout);
    if (parsedData.error) {
      throw new Error(parsedData.error);
    }
    res.json(parsedData);
  } catch (err) {
    console.log('Keyword planner API failed or credentials missing. Running suggest complete fallback...');
    try {
      const fallbackRes = await runPythonScript('cluster_keywords.py', [seed, '--json'], null, getCustomEnv(req));
      const clusterPlan = JSON.parse(fallbackRes.stdout);
      const ideas = [];
      
      // Extract keywords from the cluster plan
      ideas.push({
        keyword: clusterPlan.pillar.keyword,
        avg_monthly_searches: clusterPlan.pillar.volume,
        competition: "MEDIUM",
        low_top_of_page_bid: 0.85,
        high_top_of_page_bid: 2.10
      });
      
      clusterPlan.clusters.forEach(c => {
        c.posts.forEach(p => {
          ideas.push({
            keyword: p.keyword,
            avg_monthly_searches: p.volume,
            competition: p.intent === 'Commercial' || p.intent === 'Transactional' ? 'HIGH' : 'LOW',
            low_top_of_page_bid: p.intent === 'Transactional' ? 1.50 : 0.40,
            high_top_of_page_bid: p.intent === 'Transactional' ? 4.20 : 1.10
          });
        });
      });
      
      res.json({
        seed_keywords: [seed],
        ideas: ideas.sort((a, b) => b.avg_monthly_searches - a.avg_monthly_searches),
        fallback: true,
        error: err.message || err.toString()
      });
    } catch (fallbackErr) {
      res.status(500).json({ 
        error: 'Failed to retrieve keyword ideas and suggestions fallback failed',
        details: fallbackErr.toString()
      });
    }
  }
});

// 15. Keyword Volumes Metrics
app.post('/api/keywords/volume', async (req, res) => {
  const { keywords, language = '1000', location = '2840' } = req.body;
  if (!keywords || keywords.trim() === '') {
    return res.status(400).json({ error: 'Keywords are required' });
  }

  try {
    let stdout;
    try {
      const result = await runPythonScript('keyword_planner.py', ['volume', keywords, '--language', language, '--location', location, '--json'], null, getCustomEnv(req));
      stdout = result.stdout;
    } catch (err) {
      if (err.stdout) {
        stdout = err.stdout;
      } else {
        throw err;
      }
    }
    const parsedData = JSON.parse(stdout);
    if (parsedData.error) {
      throw new Error(parsedData.error);
    }
    res.json(parsedData);
  } catch (err) {
    console.log('Keyword volume query failed. Running suggest lookup fallback...');
    try {
      const kwList = keywords.split(',').map(k => k.trim());
      const kwResults = kwList.map((k, i) => ({
        keyword: k,
        avg_monthly_searches: Math.max(50, 2000 - k.length * 25 - i * 100),
        competition: k.length % 2 === 0 ? "HIGH" : "LOW",
        low_top_of_page_bid: 0.65,
        high_top_of_page_bid: 1.85
      }));
      res.json({
        keywords: kwResults,
        fallback: true,
        error: err.message || err.toString()
      });
    } catch (fallbackErr) {
      res.status(500).json({ 
        error: 'Failed to retrieve keyword volumes',
        details: fallbackErr.toString()
      });
    }
  }
});

// ─── Digital Marketing Suite Endpoints ─────────────────────────────────────

// 1. Tech Stack Fingerprinter
app.post('/api/marketing/tech-stack', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  try {
    const fetchResult = await runPythonScript('fetch_page.py', [url, '--render', 'auto'], null, getCustomEnv(req));
    const html = fetchResult.stdout;
    
    let headers = {};
    try {
      const headResponse = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(5000)
      });
      headResponse.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
    } catch (e) {
      // Fallback if HEAD fails
    }

    const tech = [];
    
    // CMS Check
    if (html.includes('wp-content') || html.includes('wp-includes') || headers['x-redirect-by']?.includes('wordpress')) {
      tech.push({ name: 'WordPress', category: 'CMS', icon: 'Wordpress', confidence: 100 });
    }
    if (html.includes('cdn.shopify.com') || html.includes('shopify-checkout')) {
      tech.push({ name: 'Shopify', category: 'CMS', icon: 'ShoppingBag', confidence: 100 });
    }
    if (html.includes('id="___gatsby"') || html.includes('gatsby-image')) {
      tech.push({ name: 'Gatsby', category: 'Static Site Generator', icon: 'Zap', confidence: 100 });
    }
    
    // JS Frameworks
    if (html.includes('_next/static') || html.includes('id="__next"')) {
      tech.push({ name: 'Next.js', category: 'JavaScript Framework', icon: 'Code', confidence: 100 });
    }
    if (html.includes('data-reactroot') || html.includes('_next/static') || html.includes('react-dom')) {
      tech.push({ name: 'React', category: 'JavaScript Library', icon: 'Cpu', confidence: 95 });
    }
    if (html.includes('vue.js') || html.includes('v-') || html.includes('__vue__')) {
      tech.push({ name: 'Vue.js', category: 'JavaScript Framework', icon: 'Code', confidence: 90 });
    }
    if (html.includes('svelte-') || html.includes('svelte.js')) {
      tech.push({ name: 'Svelte', category: 'JavaScript Framework', icon: 'Code', confidence: 90 });
    }
    if (html.includes('angular') || html.includes('ng-version') || html.includes('ng-app')) {
      tech.push({ name: 'Angular', category: 'JavaScript Framework', icon: 'Code', confidence: 95 });
    }
    
    // Styling
    if (html.includes('tailwind') || html.includes('tw-') || html.includes('tailwind.config')) {
      tech.push({ name: 'Tailwind CSS', category: 'Styling', icon: 'Palette', confidence: 80 });
    }
    if (html.includes('bootstrap.min.css') || html.includes('bootstrap.css') || html.includes('class="row"') || html.includes('class="col-')) {
      tech.push({ name: 'Bootstrap', category: 'Styling', icon: 'Palette', confidence: 80 });
    }
    
    // CDN & DNS / Server
    if (headers['server']?.includes('cloudflare') || headers['cf-ray']) {
      tech.push({ name: 'Cloudflare', category: 'CDN & Security', icon: 'Shield', confidence: 100 });
    }
    if (headers['server']?.includes('nginx')) {
      tech.push({ name: 'Nginx', category: 'Web Server', icon: 'Server', confidence: 95 });
    }
    if (headers['server']?.includes('apache')) {
      tech.push({ name: 'Apache', category: 'Web Server', icon: 'Server', confidence: 95 });
    }
    if (headers['x-powered-by']?.includes('express') || headers['x-powered-by']?.includes('node')) {
      tech.push({ name: 'Express / Node.js', category: 'Backend Framework', icon: 'Server', confidence: 90 });
    }
    
    // Analytics & Marketing
    if (html.includes('googletagmanager.com/gtag/js') || html.includes('ga.js') || html.includes('google-analytics')) {
      tech.push({ name: 'Google Analytics', category: 'Analytics', icon: 'BarChart2', confidence: 100 });
    }
    if (html.includes('facebook.net/en_us/fbevents.js') || html.includes('fbq(')) {
      tech.push({ name: 'Facebook Pixel', category: 'Marketing', icon: 'Share2', confidence: 100 });
    }
    if (html.includes('hotjar.js') || html.includes('hj(')) {
      tech.push({ name: 'Hotjar', category: 'Analytics', icon: 'BarChart2', confidence: 100 });
    }

    res.json({
      status: 'ok',
      url,
      headers: {
        server: headers['server'] || 'Unknown',
        'x-powered-by': headers['x-powered-by'] || 'Undisclosed',
        'cache-control': headers['cache-control'] || 'No instructions'
      },
      technologies: tech
    });
  } catch (err) {
    console.error('Error fingerprinting technology:', err);
    res.status(500).json({ 
      error: 'Failed to fingerprint website technology stack',
      details: err.stderr || err.toString()
    });
  }
});

// 2. Redirect Chain Tracer
app.post('/api/marketing/redirect-chain', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  try {
    const chain = [];
    let currentUrl = url;
    let redirectCount = 0;
    const maxRedirects = 10;
    
    while (redirectCount < maxRedirects) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
      });
      
      const hop = {
        url: currentUrl,
        status: response.status,
        statusText: response.statusText,
        location: response.headers.get('location') || null
      };
      
      chain.push(hop);
      
      if (response.status >= 300 && response.status < 400 && hop.location) {
        const nextUrl = new URL(hop.location, currentUrl).toString();
        
        if (chain.some(h => h.url === nextUrl)) {
          chain.push({
            url: nextUrl,
            status: 0,
            statusText: 'CRAWL ERROR // Circular Redirect Detected',
            location: null
          });
          break;
        }
        
        currentUrl = nextUrl;
        redirectCount++;
      } else {
        break;
      }
    }
    
    res.json({
      startUrl: url,
      hopCount: chain.length - 1,
      chain,
      warning: chain.length > 3 ? 'Excessive redirect hops (> 2 hops) detected. Recommend flattening.' : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Redirect tracing failed', details: err.message || err.toString() });
  }
});

// 3. SSL Certificate Inspector
app.post('/api/marketing/ssl', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port || 443;
    
    const options = {
      servername: hostname,
      rejectUnauthorized: false,
    };
    
    const socket = tls.connect(port, hostname, options, () => {
      const cert = socket.getPeerCertificate(true);
      socket.end();
      
      if (!cert || Object.keys(cert).length === 0) {
        return res.status(404).json({ error: 'No certificate found on this host' });
      }
      
      const now = new Date();
      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      const daysRemaining = Math.max(0, Math.floor((validTo - now) / (1000 * 60 * 60 * 24)));
      const isExpired = now > validTo;
      const isTooClose = daysRemaining < 30;
      
      const checks = {
        expired: isExpired,
        expiringSoon: isTooClose && !isExpired,
        keyLengthOk: cert.bits ? cert.bits >= 2048 : true,
        selfSigned: cert.issuer && cert.subject && cert.issuer.CN === cert.subject.CN
      };
      
      res.json({
        hostname,
        port,
        subject: {
          CN: cert.subject.CN,
          O: cert.subject.O,
          OU: cert.subject.OU,
          C: cert.subject.C
        },
        issuer: {
          CN: cert.issuer.CN,
          O: cert.issuer.O,
          C: cert.issuer.C
        },
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
        fingerprint256: cert.fingerprint256,
        serialNumber: cert.serialNumber,
        keyBits: cert.bits,
        daysRemaining,
        checks
      });
    });
    
    socket.on('error', (err) => {
      res.status(500).json({ error: 'SSL/TLS connection failed', details: err.message });
    });
    
    socket.setTimeout(8000);
    socket.on('timeout', () => {
      socket.destroy();
      res.status(504).json({ error: 'Connection to host timed out' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect SSL Certificate', details: err.toString() });
  }
});

// 4. Social & Meta tag extractor
app.post('/api/marketing/social-tags', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  try {
    const fetchResult = await runPythonScript('fetch_page.py', [url, '--render', 'auto'], null, getCustomEnv(req));
    const html = fetchResult.stdout;
    
    const parseSnippet = `
import sys
import json
from bs4 import BeautifulSoup

soup = BeautifulSoup(sys.stdin.read(), "html.parser")
tags = {}

for meta in soup.find_all("meta"):
    name = meta.get("name") or meta.get("property")
    content = meta.get("content")
    if name and content:
        tags[name.lower()] = content

title_tag = soup.find("title")
title = title_tag.get_text() if title_tag else ""
desc_meta = soup.find("meta", attrs={"name": "description"})
desc = desc_meta.get("content") if desc_meta else ""

results = {
    "og:title": tags.get("og:title") or title,
    "og:description": tags.get("og:description") or desc,
    "og:image": tags.get("og:image") or "",
    "og:url": tags.get("og:url") or "",
    "og:site_name": tags.get("og:site_name") or "",
    "twitter:card": tags.get("twitter:card") or "summary_large_image",
    "twitter:title": tags.get("twitter:title") or tags.get("og:title") or title,
    "twitter:description": tags.get("twitter:description") or tags.get("og:description") or desc,
    "twitter:image": tags.get("twitter:image") or tags.get("og:image") or "",
    "meta_title": title,
    "meta_description": desc
}

print(json.dumps(results))
`;

    const parseResult = await new Promise((resolve, reject) => {
      const py = execFile(PYTHON_PATH, ['-c', parseSnippet], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(stdout);
      });
      py.stdin.write(html);
      py.stdin.end();
    });
    
    const parsedData = JSON.parse(parseResult);
    res.json({
      status: 'ok',
      url,
      tags: parsedData
    });
  } catch (err) {
    console.error('Error extracting social tags:', err);
    res.status(500).json({ 
      error: 'Failed to extract social preview metadata tags',
      details: err.stderr || err.toString()
    });
  }
});

// 5. DNS SPF/DKIM/DMARC resolver
app.post('/api/marketing/dns', async (req, res) => {
  const { domain, dkimSelector = 'default' } = req.body;
  if (!domain || domain.trim() === '') {
    return res.status(400).json({ error: 'Domain is required' });
  }
  
  let cleanDomain = domain.trim().toLowerCase();
  try {
    if (cleanDomain.includes('://')) {
      cleanDomain = new URL(cleanDomain).hostname;
    }
  } catch (e) {
    // Keep as is
  }
  
  const results = {
    domain: cleanDomain,
    spf: { status: 'missing', record: null, mechanisms: [], warnings: [] },
    dmarc: { status: 'missing', record: null, tags: {}, warnings: [] },
    dkim: { status: 'missing', record: null, selector: dkimSelector, warnings: [] }
  };
  
  try {
    // 1. Resolve SPF
    try {
      const txtRecords = await dns.promises.resolveTxt(cleanDomain);
      const spfRecordArray = txtRecords.find(records => records.some(r => r.startsWith('v=spf1')));
      if (spfRecordArray) {
        const spfRecord = spfRecordArray.join('');
        results.spf.status = 'valid';
        results.spf.record = spfRecord;
        
        const parts = spfRecord.split(/\s+/);
        const mechanisms = [];
        parts.forEach(part => {
          if (part.startsWith('include:')) {
            mechanisms.push({ type: 'include', value: part.substring(8) });
          } else if (part.startsWith('ip4:')) {
            mechanisms.push({ type: 'ip4', value: part.substring(4) });
          } else if (part.startsWith('ip6:')) {
            mechanisms.push({ type: 'ip6', value: part.substring(4) });
          } else if (part.startsWith('a') || part.startsWith('+a') || part.startsWith('mx') || part.startsWith('+mx') || part.startsWith('ptr') || part.startsWith('exists')) {
            mechanisms.push({ type: 'mechanism', value: part });
          } else if (part.endsWith('all')) {
            results.spf.all = part;
            if (part === '+all') {
              results.spf.warnings.push("SPF contains '+all' which permits anyone to send mail from this domain.");
            }
          }
        });
        results.spf.mechanisms = mechanisms;
      }
    } catch (e) {
      if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') {
        results.spf.warnings.push(`SPF lookup error: ${e.message}`);
      }
    }
    
    // 2. Resolve DMARC
    try {
      const dmarcTxt = await dns.promises.resolveTxt(`_dmarc.${cleanDomain}`);
      const dmarcRecordArray = dmarcTxt.find(records => records.some(r => r.startsWith('v=DMARC1')));
      if (dmarcRecordArray) {
        const dmarcRecord = dmarcRecordArray.join('');
        results.dmarc.status = 'valid';
        results.dmarc.record = dmarcRecord;
        
        const tags = {};
        dmarcRecord.split(';').forEach(part => {
          const index = part.indexOf('=');
          if (index !== -1) {
            const key = part.substring(0, index).trim();
            const val = part.substring(index + 1).trim();
            tags[key] = val;
          }
        });
        results.dmarc.tags = tags;
        
        if (tags.p === 'none') {
          results.dmarc.warnings.push("DMARC policy 'p=none' provides monitoring but does not block spoofed emails.");
        }
      }
    } catch (e) {
      if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') {
        results.dmarc.warnings.push(`DMARC lookup error: ${e.message}`);
      }
    }
    
    // 3. Resolve DKIM
    try {
      const dkimTxt = await dns.promises.resolveTxt(`${dkimSelector}._domainkey.${cleanDomain}`);
      const dkimRecordArray = dkimTxt.find(records => records.some(r => r.startsWith('v=DKIM1') || r.includes('k=rsa') || r.includes('p=')));
      if (dkimRecordArray) {
        results.dkim.status = 'valid';
        results.dkim.record = dkimRecordArray.join('');
      }
    } catch (e) {
      if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') {
        results.dkim.warnings.push(`DKIM lookup error for selector '${dkimSelector}': ${e.message}`);
      }
    }
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'DNS Lookup failed', details: err.toString() });
  }
});

// 6. Carbon score checker
app.post('/api/marketing/carbon', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  try {
    const cleanUrl = url.trim();
    const apiUrl = `https://api.websitecarbon.com/site?url=${encodeURIComponent(cleanUrl)}`;
    
    let carbonData = null;
    try {
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOAashanCarbonCheck/1.0)' },
        signal: AbortSignal.timeout(6000)
      });
      if (response.ok) {
        carbonData = await response.json();
      }
    } catch (e) {
      // Fallback
    }
    
    if (carbonData && !carbonData.error) {
      res.json({
        url: cleanUrl,
        co2Grams: carbonData.statistics.co2.grid.grams,
        renewable: carbonData.green === true,
        bytes: carbonData.bytes,
        energy: carbonData.statistics.energy,
        source: 'api'
      });
    } else {
      const fetchResult = await runPythonScript('fetch_page.py', [cleanUrl], null, getCustomEnv(req));
      const html = fetchResult.stdout;
      const htmlBytes = Buffer.byteLength(html, 'utf8');
      
      const totalBytes = htmlBytes + (1.8 * 1024 * 1024);
      const sizeGb = totalBytes / (1024 * 1024 * 1024);
      const kwh = sizeGb * 0.81;
      const co2Grams = kwh * 442;
      
      res.json({
        url: cleanUrl,
        co2Grams: parseFloat(co2Grams.toFixed(4)),
        renewable: false,
        bytes: totalBytes,
        energy: kwh,
        source: 'estimate'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Carbon audit check failed', details: err.toString() });
  }
});

// 7. Gemini AI SEO Consultant
app.post('/api/consultant', requireAuth, async (req, res) => {
  const { vertical, demographics, anomalies, clientProblems } = req.body;
  if (!vertical || !demographics || !anomalies) {
    return res.status(400).json({ error: 'Vertical, target demographics, and observed anomalies are required.' });
  }

  const creds = req.credentials || {};
  const apiKey = creds.googleApiKey || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Google API key is not configured. Please set it in Console Settings.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Senior SEO Consultant. Solve specific client problems by tailoring a diagnostic roadmap to the following business details:
- **Business Vertical**: ${vertical}
- **Target Demographics**: ${demographics}
- **Observed Anomalies**: ${anomalies}
- **Specific Client Problems/Context**: ${clientProblems || 'None provided'}

Provide a comprehensive, custom diagnostic roadmap.
Your response MUST be formatted in clean Markdown and cover:
1. **Executive Summary**: Analysis of the observed anomalies and their impact on this specific vertical.
2. **Custom Audit Check Priorities**: Formulate custom priority checkmarks (e.g. Critical, High, Medium, Low) suited for this client.
3. **Regional CDN & GEO Localization Strategy**: Specific content delivery network and regional SEO recommendations optimized for the target demographics.
4. **Recommended Schema.org Models**: Specific schema models that will help rich snippet eligibility for this client (e.g., LocalBusiness, FAQPage, Product, BreadcrumbList, etc.).
5. **Actionable Blueprints & Diagnostic Instructions**: Provide concrete examples (e.g. Nginx rules, headers, or HTML script blocks) to fix these issues.

Write a clear, structured, developer-focused guide.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (err) {
    res.status(500).json({ error: 'Gemini API invocation failed', details: err.toString() });
  }
});

// Wildcard fallback to index.html for React routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start listening
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`CLAUDE SEO // INDUSTRIAL UTILITY BACKEND`);
    console.log(`PORT: ${PORT}`);
    console.log(`SCRIPTS: ${SCRIPTS_DIR}`);
    console.log(`=========================================`);
  });
}

export default app;
