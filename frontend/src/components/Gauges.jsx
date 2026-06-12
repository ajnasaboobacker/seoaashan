import React from 'react';

export function ScoreGauge({ score = 0, label = "SCORE", max = 100 }) {
  const normalizedScore = Math.min(Math.max(score, 0), max);
  const percentage = normalizedScore / max;
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage * circumference);

  // Set color dynamically based on standard score thresholds
  let strokeColor = 'var(--neon-red)';
  let glowClass = 'glow-red';
  if (normalizedScore >= 90) {
    strokeColor = 'var(--neon-green)';
    glowClass = 'glow-green';
  } else if (normalizedScore >= 50) {
    strokeColor = 'var(--neon-amber)';
    glowClass = 'glow-amber';
  }

  return (
    <div className="gauge-wrapper">
      <svg className="gauge-svg" width="100" height="100">
        <circle
          className="gauge-bg"
          cx="50"
          cy="50"
          r={radius}
        />
        <circle
          className="gauge-value-arc"
          cx="50"
          cy="50"
          r={radius}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="gauge-label">
        <span className={`gauge-num ${glowClass}`}>{normalizedScore}</span>
        <span className="gauge-txt">{label}</span>
      </div>
    </div>
  );
}

export function MetricPill({ value, rating, label }) {
  let themeClass = 'tag-badge cyan';
  if (rating === 'good') themeClass = 'tag-badge green';
  if (rating === 'needs-improvement') themeClass = 'tag-badge amber';
  if (rating === 'poor') themeClass = 'tag-badge red';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '11px', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{value}</span>
        <span className={themeClass}>{rating}</span>
      </div>
    </div>
  );
}
