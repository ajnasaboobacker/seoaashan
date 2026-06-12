#!/usr/bin/env python3
"""
Full Website SEO Audit Crawler and Orchestrator.
Crawls internal pages BFS-style, respects robots.txt, parses tags, runs audit rules,
scores categories according to seo-audit/SKILL.md, and generates report formats.

Usage:
    python scripts/full_website_audit.py https://example.com --max-pages 50 --json
"""

import argparse
import json
import os
import sys
import time
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

# Resolve path to include script dependencies
_SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, _SCRIPTS_DIR)

try:
    from fetch_page import fetch_page
    from parse_html import parse_html
    from google_auth import validate_url
    from schema_ecommerce_validate import validate as validate_schema
except ImportError as e:
    print(f"Error importing dependencies: {e}", file=sys.stderr)
    sys.exit(1)


class WebsiteAuditor:
    def __init__(self, start_url: str, max_pages: int = 50):
        if "://" not in start_url:
            start_url = f"https://{start_url}"
        self.start_url = start_url
        self.max_pages = max_pages
        parsed = urlparse(start_url)
        self.domain = parsed.netloc.lower()
        self.base_host = self.domain
        self.origin = f"{parsed.scheme}://{parsed.netloc}"
        
        # Robots.txt handler
        self.rp = RobotFileParser()
        self.rp.parse([]) # Initialize as allowing all by default
        self.rp.set_url(urljoin(self.origin, "/robots.txt"))
        
        self.crawled_pages = {}
        self.logs = []
        self.contacts_found = False
        self.privacy_found = False
        self.sitemap_url = None
        self.sitemap_status = "missing"
        self.has_llms_txt = False

    def log(self, message: str, tag: str = "INFO"):
        timestamp = time.strftime("%H:%M:%S")
        log_line = f"[{timestamp}] [{tag}] {message}"
        print(log_line, file=sys.stderr)
        self.logs.append({"timestamp": timestamp, "message": message, "tag": tag})

    def run(self) -> dict:
        self.log(f"Initiating SEO audit for host: {self.start_url}", "SYS")
        
        # SSRF checks
        if not validate_url(self.start_url):
            self.log("URL rejected by safety filters (SSRF protection).", "ERROR")
            return {"error": "SSRF Block: URL is not a public host"}

        # 1. Fetch robots.txt & load rules
        self.log("Resolving robots.txt details...", "INFO")
        try:
            robots_resp = fetch_page(urljoin(self.origin, "/robots.txt"), timeout=10)
            if robots_resp.get("status_code") == 200 and robots_resp.get("content"):
                self.rp.parse(robots_resp["content"].splitlines())
                self.log("robots.txt loaded and parsed successfully.", "INFO")
                # Look for Sitemap directive in robots.txt content
                for line in robots_resp["content"].splitlines():
                    if line.lower().startswith("sitemap:"):
                        self.sitemap_url = line[8:].strip()
                        self.sitemap_status = "present"
                        self.log(f"Discovered sitemap URL in robots.txt: {self.sitemap_url}", "INFO")
            else:
                self.log("No robots.txt found. Proceeding with default crawl permissions.", "WARN")
        except Exception as e:
            self.log(f"Failed to fetch robots.txt: {e}", "WARN")

        # 2. Check sitemap directly if not in robots.txt
        if not self.sitemap_url:
            self.log("Probing sitemap.xml fallback URLs...", "INFO")
            try:
                sitemap_probe = fetch_page(urljoin(self.origin, "/sitemap.xml"), timeout=10)
                if sitemap_probe.get("status_code") == 200:
                    self.sitemap_url = urljoin(self.origin, "/sitemap.xml")
                    self.sitemap_status = "present"
                    self.log(f"Discovered sitemap at standard location: {self.sitemap_url}", "INFO")
            except Exception:
                pass

        # 3. Probe llms.txt
        self.log("Probing domain llms.txt accessibility...", "INFO")
        try:
            llms_probe = fetch_page(urljoin(self.origin, "/llms.txt"), timeout=10)
            if llms_probe.get("status_code") == 200 and llms_probe.get("content"):
                if "404" not in llms_probe["content"] and len(llms_probe["content"].strip()) > 5:
                    self.has_llms_txt = True
                    self.log("llms.txt configuration file discovered.", "INFO")
        except Exception:
            pass

        # 4. Crawl internal pages BFS-style
        queue = [self.start_url]
        visited = set()
        
        self.log(f"Starting BFS crawl queue. Cap limit: {self.max_pages} pages.", "INFO")
        
        while queue and len(self.crawled_pages) < self.max_pages:
            current_url = queue.pop(0)
            
            # Normalize
            parsed_curr = urlparse(current_url)
            norm_url = f"{parsed_curr.scheme}://{parsed_curr.netloc}{parsed_curr.path}"
            
            if norm_url in visited:
                continue
            visited.add(norm_url)

            # Check robots.txt permissions
            if not self.rp.can_fetch("ClaudeSEO/2.0", norm_url):
                self.log(f"Skipped {norm_url} (blocked by robots.txt directives).", "WARN")
                continue

            self.log(f"Crawling: {norm_url} ...", "INFO")
            start_time = time.time()
            try:
                resp = fetch_page(norm_url, timeout=15)
                elapsed = time.time() - start_time
                status_code = resp.get("status_code")
                
                if status_code is None:
                    self.log(f"Network error crawling {norm_url}: {resp.get('error')}", "WARN")
                    self.crawled_pages[norm_url] = {
                        "status_code": 0,
                        "error": resp.get("error") or "Network connection failed",
                        "response_time": elapsed,
                        "data": {}
                    }
                    continue
                
                if status_code != 200:
                    self.log(f"Crawled {norm_url} returned status code: {status_code}", "WARN")
                    self.crawled_pages[norm_url] = {
                        "status_code": status_code,
                        "error": f"HTTP status error: {status_code}",
                        "response_time": elapsed,
                        "data": {}
                    }
                    continue

                content = resp.get("content") or ""
                parsed_data = parse_html(content, norm_url)
                
                # Update E-E-A-T flags
                path_lower = parsed_curr.path.lower()
                if any(x in path_lower for x in ("contact", "support", "location")):
                    self.contacts_found = True
                if any(x in path_lower for x in ("privacy", "policy", "terms", "legal")):
                    self.privacy_found = True

                self.crawled_pages[norm_url] = {
                    "status_code": status_code,
                    "error": None,
                    "response_time": elapsed,
                    "data": parsed_data
                }

                # Link extraction
                internal_links = parsed_data.get("links", {}).get("internal", [])
                for link in internal_links:
                    href = link.get("href")
                    if not href:
                        continue
                    parsed_link = urlparse(href)
                    # Only stay on domain
                    if parsed_link.netloc.lower() == self.base_host:
                        clean_link = f"{parsed_link.scheme}://{parsed_link.netloc}{parsed_link.path}"
                        if clean_link not in visited and clean_link not in queue:
                            queue.append(clean_link)
                            
            except Exception as e:
                self.log(f"Error analyzing {norm_url}: {e}", "WARN")
                self.crawled_pages[norm_url] = {
                    "status_code": 0,
                    "error": str(e),
                    "response_time": 0,
                    "data": {}
                }

        self.log(f"Crawl completed. Crawled {len(self.crawled_pages)} total pages.", "SUCCESS")
        
        # 5. Run Audit Scoring & Findings Compiler
        return self.compile_report()

    def compile_report(self) -> dict:
        findings = []
        
        # Scoring categories out of 100
        scores = {
            "technical": 100,
            "content": 100,
            "onpage": 100,
            "schema": 100,
            "performance": 100,
            "geo": 100,
            "images": 100
        }

        # --- TECHNICAL SEO RULES (22% weight) ---
        # 1. Sitemap existence
        if self.sitemap_status == "missing":
            findings.append({
                "category": "Technical SEO",
                "severity": "Medium",
                "rule": "missing-xml-sitemap",
                "message": "XML Sitemap is missing or not registered in robots.txt. Google may take longer to discover content.",
                "remedy": "Create an xml sitemap at /sitemap.xml and add a 'Sitemap: <url>' line to your robots.txt file."
            })
            scores["technical"] -= 15

        # 2. Page canonicals & redirects
        canonical_missing_count = 0
        non_self_canonical_count = 0
        for url, p in self.crawled_pages.items():
            if p["error"]:
                continue
            canonical = p["data"].get("canonical")
            if not canonical:
                canonical_missing_count += 1
            elif canonical.strip() != url.strip():
                non_self_canonical_count += 1

        if canonical_missing_count > 0:
            findings.append({
                "category": "Technical SEO",
                "severity": "High",
                "rule": "missing-canonical",
                "message": f"Canonical tag is missing on {canonical_missing_count} pages.",
                "remedy": "Add self-referencing rel='canonical' tags to all indexable page headers."
            })
            scores["technical"] -= min(15, canonical_missing_count * 3)

        if non_self_canonical_count > 0:
            findings.append({
                "category": "Technical SEO",
                "severity": "Low",
                "rule": "non-self-canonical",
                "message": f"Detected non-self-referencing canonical links on {non_self_canonical_count} pages.",
                "remedy": "Verify that non-self canonical references correspond to real duplicates or consolidation strategies."
            })
            scores["technical"] -= min(10, non_self_canonical_count * 2)

        # 3. Security headers check on homepage
        homepage_data = self.crawled_pages.get(self.start_url) or next(iter(self.crawled_pages.values()), None)
        if homepage_data and homepage_data.get("headers"):
            headers = homepage_data["headers"]
            missing_sec_headers = []
            if "Strict-Transport-Security" not in headers:
                missing_sec_headers.append("HSTS")
            if "Content-Security-Policy" not in headers:
                missing_sec_headers.append("CSP")
            if "X-Content-Type-Options" not in headers:
                missing_sec_headers.append("X-Content-Type")

            if missing_sec_headers:
                findings.append({
                    "category": "Technical SEO",
                    "severity": "Low",
                    "rule": "missing-security-headers",
                    "message": f"Missing security headers: {', '.join(missing_sec_headers)}.",
                    "remedy": "Configure HTTP response headers on the host server to declare CSP rules and HSTS flags."
                })
                scores["technical"] -= len(missing_sec_headers) * 3

        # --- CONTENT QUALITY RULES (23% weight) ---
        # 1. Thin content
        thin_count = 0
        for url, p in self.crawled_pages.items():
            if p["error"]:
                continue
            words = p["data"].get("word_count", 0)
            if words < 250:
                thin_count += 1

        if thin_count > 0:
            findings.append({
                "category": "Content Quality",
                "severity": "High",
                "rule": "thin-content",
                "message": f"Detected thin content (< 250 words) on {thin_count} pages.",
                "remedy": "Enhance text copywriting with helpful paragraphs, lists, and citations addressing user intent."
            })
            scores["content"] -= min(25, thin_count * 5)

        # 2. E-E-A-T trust signals (Contact & Privacy pages)
        if not self.contacts_found:
            findings.append({
                "category": "Content Quality",
                "severity": "Medium",
                "rule": "missing-contact-info",
                "message": "No explicit contact or local service channels found in crawled URLs.",
                "remedy": "Publish a dedicated Contact page with phone number, email, and location context to unblock E-E-A-T credibility."
            })
            scores["content"] -= 10

        if not self.privacy_found:
            findings.append({
                "category": "Content Quality",
                "severity": "Medium",
                "rule": "missing-privacy-policy",
                "message": "No privacy policy page detected in sitemap / crawl paths.",
                "remedy": "Implement a Privacy Policy or Terms of Service page linked from the global footer."
            })
            scores["content"] -= 10

        # --- ON-PAGE SEO RULES (20% weight) ---
        missing_titles = 0
        missing_descs = 0
        missing_h1 = 0
        multiple_h1 = 0
        for url, p in self.crawled_pages.items():
            if p["error"]:
                continue
            data = p["data"]
            if not data.get("title"):
                missing_titles += 1
            if not data.get("meta_description"):
                missing_descs += 1
            h1s = data.get("h1", [])
            if len(h1s) == 0:
                missing_h1 += 1
            elif len(h1s) > 1:
                multiple_h1 += 1

        if missing_titles > 0:
            findings.append({
                "category": "On-Page SEO",
                "severity": "Critical",
                "rule": "missing-title",
                "message": f"Title tag is completely missing on {missing_titles} pages.",
                "remedy": "Verify header templates and add keyword-optimized title attributes (<title> tag) to indexable pages."
            })
            scores["onpage"] -= min(20, missing_titles * 5)

        if missing_descs > 0:
            findings.append({
                "category": "On-Page SEO",
                "severity": "High",
                "rule": "missing-description",
                "message": f"Meta description is missing on {missing_descs} pages.",
                "remedy": "Compose descriptive, CTA-friendly meta descriptions (120-160 characters) to boost click-through rates."
            })
            scores["onpage"] -= min(15, missing_descs * 3)

        if missing_h1 > 0:
            findings.append({
                "category": "On-Page SEO",
                "severity": "High",
                "rule": "missing-h1",
                "message": f"Primary heading (H1) is missing on {missing_h1} pages.",
                "remedy": "Incorporate exactly one H1 header wrapping the primary keyword or topic statement."
            })
            scores["onpage"] -= min(15, missing_h1 * 3)

        if multiple_h1 > 0:
            findings.append({
                "category": "On-Page SEO",
                "severity": "Medium",
                "rule": "multiple-h1",
                "message": f"Detected multiple H1 tags on {multiple_h1} pages.",
                "remedy": "Convert secondary H1 tags to H2/H3 elements, keeping only one unique H1 per page."
            })
            scores["onpage"] -= min(10, multiple_h1 * 2)

        # --- SCHEMA / STRUCTURED DATA RULES (10% weight) ---
        schema_missing_count = 0
        merchant_issues_count = 0
        
        for url, p in self.crawled_pages.items():
            if p["error"]:
                continue
            schemas = p["data"].get("schema", [])
            if not schemas:
                schema_missing_count += 1
            else:
                # Run local merchant validate rules on schemas found
                validation = validate_schema(schemas)
                if not validation["ok"]:
                    merchant_issues_count += len(validation["findings"])

        if schema_missing_count > 0:
            findings.append({
                "category": "Schema / Structured Data",
                "severity": "Medium",
                "rule": "missing-schema",
                "message": f"No Schema.org markup found on {schema_missing_count} pages.",
                "remedy": "Implement LocalBusiness, Organization, Article, or Product schemas using JSON-LD script blocks."
            })
            scores["schema"] -= min(20, schema_missing_count * 4)

        if merchant_issues_count > 0:
            findings.append({
                "category": "Schema / Structured Data",
                "severity": "High",
                "rule": "merchant-listing-errors",
                "message": f"Discovered {merchant_issues_count} Google Merchant listing policy errors in schema markups.",
                "remedy": "Add missing returns policies (hasMerchantReturnPolicy) and shipping costs (shippingDetails) fields."
            })
            scores["schema"] -= min(20, merchant_issues_count * 2)

        # --- PERFORMANCE / RESPONSE TIME RULES (10% weight) ---
        valid_speeds = [p["response_time"] for p in self.crawled_pages.values() if p["response_time"] > 0]
        if valid_speeds:
            avg_speed = sum(valid_speeds) / len(valid_speeds)
            if avg_speed > 2.0:
                findings.append({
                    "category": "Performance (CWV)",
                    "severity": "High",
                    "rule": "slow-response-time",
                    "message": f"Average server response time is slow ({avg_speed:.2f} seconds).",
                    "remedy": "Configure database indexing, enable server caching layers, or migrate to a CDN edge node."
                })
                scores["performance"] = 50
            elif avg_speed > 1.0:
                findings.append({
                    "category": "Performance (CWV)",
                    "severity": "Medium",
                    "rule": "moderate-response-time",
                    "message": f"Average server response time is moderate ({avg_speed:.2f} seconds).",
                    "remedy": "Compress script assets, defer non-essential blocks, and audit database queries."
                })
                scores["performance"] = 75
            else:
                scores["performance"] = 100
        else:
            scores["performance"] = 100

        # --- GEO / AI SEARCH READINESS (10% weight) ---
        # 1. AI bot blocking checks
        crawlers = ["GPTBot", "ClaudeBot", "PerplexityBot"]
        blocked_bots = []
        for bot in crawlers:
            if not self.rp.can_fetch(bot, self.start_url):
                blocked_bots.append(bot)

        if blocked_bots:
            findings.append({
                "category": "AI Search Readiness",
                "severity": "High",
                "rule": "blocked-ai-crawlers",
                "message": f"Robots.txt blocks AI search agents: {', '.join(blocked_bots)}.",
                "remedy": "Remove disallow directives blocking AI bot search agents, enabling them to index your brand data."
            })
            scores["geo"] -= len(blocked_bots) * 15

        # 2. llms.txt validation
        if not self.has_llms_txt:
            findings.append({
                "category": "AI Search Readiness",
                "severity": "Low",
                "rule": "missing-llms-txt",
                "message": "No /llms.txt content catalog found at root.",
                "remedy": "Provide a /llms.txt file listing links, documentation maps, and clean markdown for LLMs."
            })
            scores["geo"] -= 10

        # --- IMAGES ALT CHECKS (5% weight) ---
        total_images = 0
        missing_alt_images = 0
        for url, p in self.crawled_pages.items():
            if p["error"]:
                continue
            imgs = p["data"].get("images", [])
            total_images += len(imgs)
            missing_alt_images += len([i for i in imgs if not i.get("alt")])

        if total_images > 0:
            alt_ratio = (total_images - missing_alt_images) / total_images
            scores["images"] = int(alt_ratio * 100)
            if missing_alt_images > 0:
                findings.append({
                    "category": "Images",
                    "severity": "Medium",
                    "rule": "missing-image-alt",
                    "message": f"Found {missing_alt_images} images missing descriptive alt tags.",
                    "remedy": "Add descriptive alt attributes describing structural contents to all image elements."
                })
        else:
            scores["images"] = 100

        # Bound scores to 0 - 100
        for key in scores:
            scores[key] = max(0, min(100, scores[key]))

        # Calculate Overall Health Index based on weights
        health_index = round(
            scores["technical"] * 0.22 +
            scores["content"] * 0.23 +
            scores["onpage"] * 0.20 +
            scores["schema"] * 0.10 +
            scores["performance"] * 0.10 +
            scores["geo"] * 0.10 +
            scores["images"] * 0.05
        )

        return {
            "url": self.start_url,
            "domain": self.domain,
            "seoScore": health_index,
            "categoryScores": scores,
            "findings": findings,
            "crawledCount": len(self.crawled_pages),
            "contactsFound": self.contacts_found,
            "privacyFound": self.privacy_found,
            "sitemapStatus": self.sitemap_status,
            "hasLlmsTxt": self.has_llms_txt,
            "crawledPages": [
                {
                    "url": u,
                    "statusCode": p["status_code"],
                    "error": p["error"],
                    "wordCount": p["data"].get("word_count", 0) if not p["error"] else 0,
                    "title": p["data"].get("title", "") if not p["error"] else "",
                    "responseTime": p["responseTime"] if "responseTime" in p else p.get("response_time", 0)
                } for u, p in self.crawled_pages.items()
            ],
            "logs": self.logs
        }


def get_markdown_progress_bar(score: int) -> str:
    """Generate a visual text block progress bar for markdown tables."""
    total_blocks = 10
    filled_blocks = int(round(score / 10))
    if score >= 90:
        char = "🟩"
    elif score >= 50:
        char = "🟨"
    else:
        char = "🟥"
    bar = char * filled_blocks + "⬜" * (total_blocks - filled_blocks)
    return f"`{bar}` **{score}/100**"


def generate_markdown_report(report_data: dict, filepath: str):
    """Generates the FULL-AUDIT-REPORT.md document matching seo-audit/SKILL.md specs."""
    lines = []
    lines.append(f"# Full SEO Audit Report: {report_data['url']}")
    lines.append("")
    lines.append("## Executive Summary")
    
    total_bar = get_markdown_progress_bar(report_data['seoScore'])
    lines.append(f"- **SEO Health Index**: {total_bar}")
    lines.append(f"- **Domain Audited**: `{report_data['domain']}`")
    lines.append(f"- **Pages Crawled**: `{report_data['crawledCount']}`")
    lines.append(f"- **XML Sitemap**: `{report_data['sitemapStatus']}`")
    lines.append(f"- **llms.txt Availability**: `{'Found' if report_data['hasLlmsTxt'] else 'Missing'}`")
    lines.append("")
    
    # Categories Breakdown Table
    lines.append("### Category Scores Breakdown")
    lines.append("| Category | Health Meter / Score | Weight | Weighted Score |")
    lines.append("|---|---|---|---|")
    w_contrib = [
        ("Technical SEO", report_data['categoryScores']['technical'], "22%"),
        ("Content Quality", report_data['categoryScores']['content'], "23%"),
        ("On-Page SEO", report_data['categoryScores']['onpage'], "20%"),
        ("Schema / Structured Data", report_data['categoryScores']['schema'], "10%"),
        ("Performance (CWV)", report_data['categoryScores']['performance'], "10%"),
        ("AI Search Readiness", report_data['categoryScores']['geo'], "10%"),
        ("Images alt coverage", report_data['categoryScores']['images'], "5%"),
    ]
    for cat, score, w in w_contrib:
        val = score * float(w.replace("%", "")) / 100
        bar = get_markdown_progress_bar(score)
        lines.append(f"| {cat} | {bar} | {w} | {val:.2f} |")
    lines.append(f"| **Overall Health Index** | {total_bar} | **100%** | **{report_data['seoScore']}/100** |")
    lines.append("")
    
    # Embedded category score breakdown chart
    try:
        from pathlib import Path
        # Import chart rendering function from google_report.py dynamically
        from google_report import chart_crawl_categories
        
        charts_dir = Path(os.path.dirname(filepath))
        chart_path = chart_crawl_categories(report_data, charts_dir)
        if chart_path and os.path.exists(chart_path):
            rel_chart_name = os.path.basename(chart_path)
            lines.append("### Category Health Breakdown Chart")
            lines.append(f"![Category Health Breakdown]({rel_chart_name})")
            lines.append("")
    except Exception as e:
        print(f"Note: matplotlib chart was not embedded in markdown: {e}", file=sys.stderr)

    # Priority checklist
    lines.append("## Prioritized Findings")
    lines.append("")
    
    criticals = [f for f in report_data["findings"] if f["severity"] == "Critical"]
    highs = [f for f in report_data["findings"] if f["severity"] == "High"]
    mediums = [f for f in report_data["findings"] if f["severity"] == "Medium"]
    lows = [f for f in report_data["findings"] if f["severity"] == "Low"]

    lines.append("### 🔴 Critical Findings")
    if criticals:
        for idx, f in enumerate(criticals, 1):
            lines.append(f"#### {idx}. [{f['rule']}] {f['message']}")
            lines.append(f"* **Category**: {f['category']}")
            lines.append(f"* **Remedy**: {f['remedy']}")
            lines.append("")
    else:
        lines.append("_No critical findings detected._\n")

    lines.append("### 🟠 High Priority Actions")
    if highs:
        for idx, f in enumerate(highs, 1):
            lines.append(f"#### {idx}. [{f['rule']}] {f['message']}")
            lines.append(f"* **Category**: {f['category']}")
            lines.append(f"* **Remedy**: {f['remedy']}")
            lines.append("")
    else:
        lines.append("_No high priority findings detected._\n")

    lines.append("### 🟡 Medium Priority Tasks")
    if mediums:
        for idx, f in enumerate(mediums, 1):
            lines.append(f"#### {idx}. [{f['rule']}] {f['message']}")
            lines.append(f"* **Category**: {f['category']}")
            lines.append(f"* **Remedy**: {f['remedy']}")
            lines.append("")
    else:
        lines.append("_No medium priority findings detected._\n")

    lines.append("### 🟢 Low Priority / Opportunities")
    if lows:
        for idx, f in enumerate(lows, 1):
            lines.append(f"#### {idx}. [{f['rule']}] {f['message']}")
            lines.append(f"* **Category**: {f['category']}")
            lines.append(f"* **Remedy**: {f['remedy']}")
            lines.append("")
    else:
        lines.append("_No low priority findings detected._\n")

    # Crawled pages overview
    lines.append("---")
    lines.append("## Crawled Pages Index")
    lines.append("")
    lines.append("| Page URL | Status Code | Word Count | Title | Response Time |")
    lines.append("|---|---|---|---|---|")
    for page in report_data["crawledPages"][:30]:
        lines.append(f"| `{page['url']}` | {page['statusCode']} | {page['wordCount']} | {page['title']} | {page['responseTime']:.2f}s |")
    if len(report_data["crawledPages"]) > 30:
        lines.append(f"| ... and {len(report_data['crawledPages']) - 30} more pages crawled. | | | | |")
    lines.append("")
    
    # Community footer
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("Built by agricidaniel — Join the AI Marketing Hub community")
    lines.append("🆓 Free  → https://www.skool.com/ai-marketing-hub")
    lines.append("⚡ Pro   → https://www.skool.com/ai-marketing-hub-pro")
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Save file
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
    except Exception as e:
        print(f"Error saving report markdown: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Full website SEO auditor crawler")
    parser.add_argument("url", help="Start URL to crawl")
    parser.add_argument("--max-pages", type=int, default=50, help="BFS crawl page limit")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--output", help="Optional path to save report markdown")
    args = parser.parse_args()

    auditor = WebsiteAuditor(args.url, max_pages=args.max_pages)
    report = auditor.run()

    if args.output:
        generate_markdown_report(report, args.output)
    elif not args.json:
        # Default save location
        scratch_dir = os.path.dirname(args.output) if args.output else os.path.join(os.path.dirname(_SCRIPTS_DIR), "saas-app", "dist")
        if not os.path.exists(scratch_dir):
            os.makedirs(scratch_dir, exist_ok=True)
        generate_markdown_report(report, os.path.join(scratch_dir, "FULL-AUDIT-REPORT.md"))

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"Health Score: {report.get('seoScore')}/100")
        print(f"Crawled: {report.get('crawledCount')} pages")
        print(f"Findings found: {len(report.get('findings', []))}")


if __name__ == "__main__":
    main()
