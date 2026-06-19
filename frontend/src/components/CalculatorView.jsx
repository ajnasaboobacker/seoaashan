import React, { useState } from 'react';
import { ScoreGauge } from './Gauges';
import { Sliders, Clock, HelpCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CalculatorView() {
  const [lcp, setLcp] = useState(2.5); // seconds
  const [inp, setInp] = useState(200); // milliseconds
  const [cls, setCls] = useState(0.1); // ratio

  // LCP Score mapping (Lighthouse lognormal approximations)
  const getLcpScore = (val) => {
    if (val <= 1.2) return 100;
    if (val <= 2.5) {
      // Linear mapping 1.2s (100) to 2.5s (90)
      return Math.round(100 - ((val - 1.2) / 1.3) * 10);
    }
    if (val <= 4.0) {
      // Linear mapping 2.5s (90) to 4.0s (50)
      return Math.round(90 - ((val - 2.5) / 1.5) * 40);
    }
    // > 4.0s
    return Math.max(0, Math.round(50 - ((val - 4.0) / 4.0) * 50));
  };

  // INP Score mapping
  const getInpScore = (val) => {
    if (val <= 100) return 100;
    if (val <= 200) {
      // 100ms (100) to 200ms (90)
      return Math.round(100 - ((val - 100) / 100) * 10);
    }
    if (val <= 500) {
      // 200ms (90) to 500ms (50)
      return Math.round(90 - ((val - 200) / 300) * 40);
    }
    return Math.max(0, Math.round(50 - ((val - 500) / 500) * 50));
  };

  // CLS Score mapping
  const getClsScore = (val) => {
    if (val <= 0.05) return 100;
    if (val <= 0.1) {
      // 0.05 (100) to 0.1 (90)
      return Math.round(100 - ((val - 0.05) / 0.05) * 10);
    }
    if (val <= 0.25) {
      // 0.1 (90) to 0.25 (50)
      return Math.round(90 - ((val - 0.1) / 0.15) * 40);
    }
    return Math.max(0, Math.round(50 - ((val - 0.25) / 0.5) * 50));
  };

  const lcpScore = getLcpScore(lcp);
  const inpScore = getInpScore(inp);
  const clsScore = getClsScore(cls);

  // March 2024 weights: LCP (40%), INP (40%), CLS (20%)
  const weightedScore = Math.round(
    lcpScore * 0.4 +
    inpScore * 0.4 +
    clsScore * 0.2
  );

  const getMetricRating = (val, thresholds) => {
    if (val <= thresholds[0]) return { text: 'GOOD', color: 'var(--neon-green)' };
    if (val <= thresholds[1]) return { text: 'NEEDS IMPROVEMENT', color: 'var(--neon-amber)' };
    return { text: 'POOR', color: 'var(--neon-red)' };
  };

  const lcpRating = getMetricRating(lcp, [2.5, 4.0]);
  const inpRating = getMetricRating(inp, [200, 500]);
  const clsRating = getMetricRating(cls, [0.1, 0.25]);

  return (
    <div className="view-viewport" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
      
      {/* Inputs Form */}
      <div className="panel-card" style={{ height: 'fit-content' }}>
        <div className="panel-header">
          <span>SYNTHETIC PERFORMANCE INPUTS</span>
          <Sliders size={14} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
          
          {/* LCP Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>LARGEST CONTENTFUL PAINT (LCP)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: lcpRating.color, fontWeight: 'bold' }}>
                {lcp.toFixed(2)}s ({lcpRating.text})
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.05"
              value={lcp}
              onChange={e => setLcp(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: lcpRating.color }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-text-dim)' }}>
              <span>0.1s (Fast)</span>
              <span>2.5s (Limit)</span>
              <span>10.0s (Slow)</span>
            </div>
          </div>

          {/* INP Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>INTERACTION TO NEXT PAINT (INP)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: inpRating.color, fontWeight: 'bold' }}>
                {inp}ms ({inpRating.text})
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={inp}
              onChange={e => setInp(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: inpRating.color }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-text-dim)' }}>
              <span>10ms (Responsive)</span>
              <span>200ms (Limit)</span>
              <span>1000ms (Laggy)</span>
            </div>
          </div>

          {/* CLS Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>CUMULATIVE LAYOUT SHIFT (CLS)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: clsRating.color, fontWeight: 'bold' }}>
                {cls.toFixed(3)} ({clsRating.text})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.01"
              value={cls}
              onChange={e => setCls(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: clsRating.color }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-text-dim)' }}>
              <span>0.00 (Stable)</span>
              <span>0.10 (Limit)</span>
              <span>1.00 (Shifting)</span>
            </div>
          </div>

        </div>
      </div>

      {/* Results Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Core weighted score gauge card */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', padding: '20px' }}>
          <ScoreGauge score={weightedScore} label="Weighted CWV Index" />
          
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              MARCH 2024 LIGHTHOUSE ALGORITHM
            </div>
            <h3 style={{ fontSize: '16px', color: 'var(--color-text-bright)', margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Weighted CWV Score: <span style={{ color: weightedScore >= 90 ? 'var(--neon-green)' : weightedScore >= 50 ? 'var(--neon-amber)' : 'var(--neon-red)' }}>{weightedScore}/100</span>
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-dim)', margin: 0 }}>
              Calculates overall speed rating using the standard Google weight distributions (LCP: 40%, INP: 40%, CLS: 20%). This reflects the direct ranking impact on search algorithms.
            </p>
          </div>
        </div>

        {/* Detailed weight contribution breakdown */}
        <div className="panel-card">
          <div className="panel-header">
            <span>METRICS WEIGHT CONTRIBUTION</span>
            <Activity size={14} />
          </div>
          
          <table className="meta-table" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th>METRIC</th>
                <th>METRIC SCORE</th>
                <th>WEIGHT</th>
                <th style={{ textAlign: 'right' }}>CONTRIBUTION TO INDEX</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>Largest Contentful Paint (LCP)</td>
                <td style={{ color: lcpRating.color, fontWeight: 'bold' }}>{lcpScore}/100</td>
                <td style={{ color: 'var(--color-text-dim)' }}>40%</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{(lcpScore * 0.4).toFixed(1)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>Interaction to Next Paint (INP)</td>
                <td style={{ color: inpRating.color, fontWeight: 'bold' }}>{inpScore}/100</td>
                <td style={{ color: 'var(--color-text-dim)' }}>40%</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{(inpScore * 0.4).toFixed(1)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>Cumulative Layout Shift (CLS)</td>
                <td style={{ color: clsRating.color, fontWeight: 'bold' }}>{clsScore}/100</td>
                <td style={{ color: 'var(--color-text-dim)' }}>20%</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{(clsScore * 0.2).toFixed(1)}</td>
              </tr>
              <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 'bold' }}>
                <td>TOTAL CWV HEALTH INDEX</td>
                <td></td>
                <td style={{ color: 'var(--color-text-bright)' }}>100%</td>
                <td style={{ textAlign: 'right', color: 'var(--neon-green)', fontSize: '13px', textShadow: '0 0 6px var(--neon-green)' }}>
                  {weightedScore}/100
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informative Specs block */}
        <div className="panel-card" style={{ borderColor: 'var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: 'var(--neon-cyan)', fontWeight: 'bold', marginBottom: '8px' }}>
            <HelpCircle size={14} />
            <span>ALGORITHM THRESHOLDS & WEIGHT DETAILS</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-dim)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
            <strong>March 2024 Update:</strong> Google officially retired the First Input Delay (FID) metric, replacing it with <strong>Interaction to Next Paint (INP)</strong> as a Core Web Vital. INP measures the overall responsiveness of a page by auditing all user click, tap, and keyboard interactions.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
            <div style={{ background: 'var(--bg-console)', padding: '8px', fontSize: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--neon-green)' }}>LCP (40%)</div>
              <div>Good: &le; 2.5s</div>
              <div>Poor: &gt; 4.0s</div>
            </div>
            <div style={{ background: 'var(--bg-console)', padding: '8px', fontSize: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--neon-green)' }}>INP (40%)</div>
              <div>Good: &le; 200ms</div>
              <div>Poor: &gt; 500ms</div>
            </div>
            <div style={{ background: 'var(--bg-console)', padding: '8px', fontSize: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--neon-green)' }}>CLS (20%)</div>
              <div>Good: &le; 0.10</div>
              <div>Poor: &gt; 0.25</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
