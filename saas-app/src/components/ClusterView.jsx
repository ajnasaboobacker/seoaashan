import React, { useState } from 'react';
import { Play, Network, Info, Link2, BookOpen, AlertTriangle } from 'lucide-react';

export default function ClusterView() {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  const runClustering = async (e) => {
    e.preventDefault();
    if (!seed) return;

    setLoading(true);
    setError('');
    setPlan(null);
    setSelectedNode(null);

    try {
      const response = await fetch('/api/cluster/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to generate cluster plan');
      setPlan(res);
      // Select the pillar node by default
      setSelectedNode({
        type: 'pillar',
        title: res.pillar.title,
        keyword: res.pillar.keyword,
        volume: res.pillar.volume,
        template: res.pillar.template,
        wordCount: res.pillar.wordCount,
        url: res.pillar.url,
        intent: 'Informational (Broad)'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIntentColor = (intent) => {
    if (!intent) return 'var(--neon-cyan)';
    const intentUpper = intent.toUpperCase();
    if (intentUpper.includes('COMM')) return 'var(--neon-amber)';
    if (intentUpper.includes('TRANS')) return 'var(--neon-red)';
    if (intentUpper.includes('NAV')) return 'var(--neon-blue)';
    return 'var(--neon-green)';
  };

  // Helper to construct coordinates for nodes dynamically
  const renderVisualMap = () => {
    if (!plan) return null;

    const width = 850;
    const height = 450;

    // Pillar node coordinates
    const pillarX = 80;
    const pillarY = height / 2;

    const clusters = plan.clusters;
    const numClusters = clusters.length;

    // Calculate cluster node coordinates
    const clusterNodes = [];
    const spokeNodes = [];
    const connectionLines = [];

    // Layout cluster nodes vertically spaced in column 2
    const col2X = 320;
    const clusterSpacing = height / (numClusters + 1);

    clusters.forEach((cluster, cIdx) => {
      const cY = clusterSpacing * (cIdx + 1);
      clusterNodes.push({
        id: `cluster-${cIdx}`,
        label: cluster.name.replace(' Optimization', ''),
        cx: col2X,
        cy: cY,
        color: 'var(--neon-amber)',
        data: cluster
      });

      // Draw line from Pillar to this Cluster Node
      connectionLines.push({
        id: `line-pillar-cluster-${cIdx}`,
        x1: pillarX,
        y1: pillarY,
        x2: col2X,
        y2: cY,
        color: 'rgba(255, 255, 255, 0.12)',
        dasharray: '5,5'
      });

      // Layout Spoke nodes in column 3
      const col3X = 640;
      const spokes = cluster.posts;
      const numSpokes = spokes.length;
      
      // Vertical bounds for this cluster's spokes centered around cluster cY
      const spokeSpan = 90;
      const spokeStart = cY - (spokeSpan / 2);
      const spokeSpacing = numSpokes > 1 ? spokeSpan / (numSpokes - 1) : 0;

      spokes.forEach((spoke, sIdx) => {
        const sY = numSpokes > 1 ? spokeStart + (spokeSpacing * sIdx) : cY;
        const nodeColor = getIntentColor(spoke.intent);
        
        spokeNodes.push({
          id: `spoke-${cIdx}-${sIdx}`,
          label: spoke.keyword,
          cx: col3X,
          cy: sY,
          color: nodeColor,
          data: { ...spoke, type: 'spoke', clusterName: cluster.name }
        });

        // Draw line from Cluster to this Spoke Node
        connectionLines.push({
          id: `line-cluster-${cIdx}-spoke-${sIdx}`,
          x1: col2X,
          y1: cY,
          x2: col3X,
          y2: sY,
          color: 'rgba(255, 255, 255, 0.08)',
          dasharray: '2,2'
        });
      });
    });

    return (
      <div className="panel-card" style={{ gridColumn: 'span 2', background: 'var(--bg-card)' }}>
        <div className="panel-header">
          <span>SEMANTIC HUB-AND-SPOKE CONTENT MAP</span>
          <Network size={14} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'auto' }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ minWidth: '800px' }}>
            {/* Connection Lines */}
            {connectionLines.map(line => (
              <line
                key={line.id}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.color}
                strokeWidth="1.5"
                strokeDasharray={line.dasharray}
              />
            ))}

            {/* Pillar Node */}
            <g 
              style={{ cursor: 'pointer' }} 
              onClick={() => setSelectedNode({
                type: 'pillar',
                title: plan.pillar.title,
                keyword: plan.pillar.keyword,
                volume: plan.pillar.volume,
                template: plan.pillar.template,
                wordCount: plan.pillar.wordCount,
                url: plan.pillar.url,
                intent: 'Informational (Broad)'
              })}
            >
              <circle
                cx={pillarX}
                cy={pillarY}
                r="30"
                fill="var(--bg-card)"
                stroke="var(--neon-cyan)"
                strokeWidth="3"
                style={{ filter: 'drop-shadow(0px 0px 8px rgba(0, 242, 254, 0.4))' }}
              />
              <text
                x={pillarX}
                y={pillarY + 5}
                textAnchor="middle"
                fill="var(--color-text-bright)"
                fontSize="10px"
                fontWeight="bold"
              >
                HUB
              </text>
              <text
                x={pillarX}
                y={pillarY + 45}
                textAnchor="middle"
                fill="var(--neon-cyan)"
                fontSize="11px"
                fontWeight="bold"
              >
                {plan.pillar.keyword.toUpperCase()}
              </text>
            </g>

            {/* Cluster Nodes */}
            {clusterNodes.map(node => (
              <g 
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedNode({
                  type: 'cluster',
                  name: node.data.name,
                  postsCount: node.data.posts.length,
                  spokesList: node.data.posts
                })}
              >
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="18"
                  fill="var(--bg-card)"
                  stroke={node.color}
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0px 0px 6px rgba(245, 158, 11, 0.3))' }}
                />
                <text
                  x={node.cx}
                  y={node.cy - 25}
                  textAnchor="middle"
                  fill="var(--color-text-bright)"
                  fontSize="10px"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
              </g>
            ))}

            {/* Spoke Nodes */}
            {spokeNodes.map(node => (
              <g 
                key={node.id} 
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedNode({
                  type: 'spoke',
                  title: node.data.title,
                  keyword: node.data.keyword,
                  volume: node.data.volume,
                  template: node.data.template,
                  wordCount: node.data.wordCount,
                  url: node.data.url,
                  intent: node.data.intent,
                  clusterName: node.data.clusterName
                })}
              >
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="9"
                  fill={node.color}
                  stroke="var(--bg-card)"
                  strokeWidth="1.5"
                  style={{ filter: `drop-shadow(0px 0px 4px ${node.color})` }}
                />
                <text
                  x={node.cx + 15}
                  y={node.cy + 3}
                  textAnchor="start"
                  fill="var(--color-text-dim)"
                  fontSize="9px"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="view-viewport">
      {/* Cluster planner launcher Form */}
      <form className="console-form" onSubmit={runClustering}>
        <div className="input-group">
          <label>ENTER SEED TOPIC KEYWORD</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="console-input"
              placeholder="e.g., real estate CRM, weight loss tips, artificial intelligence"
              value={seed}
              onChange={e => setSeed(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="console-btn" disabled={loading} style={{ flexShrink: 0 }}>
              <Play size={14} /> {loading ? 'CLUSTERING...' : 'BUILD CONTENT CLUSTER'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="panel-card" style={{ borderColor: 'var(--neon-red)' }}>
          <span className="glow-red" style={{ fontWeight: 'bold' }}>ERROR: {error}</span>
        </div>
      )}

      {/* Intro details */}
      {!plan && !loading && (
        <div className="panel-card animate-fade">
          <div className="panel-header">
            <span>SEMANTIC CLUSTERING WORKFLOW</span>
            <Network size={14} />
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-dim)' }}>
            Topic clustering groups search keywords into thematic silos according to **search intent and lexical overlapping**. 
            This builds a structured roadmap of content (one primary **Hub Pillar Page** linked to multiple **Spokes**) preventing search cannibalization and optimizing organic authority.
          </p>
        </div>
      )}

      {plan && (
        <div className="dashboard-grid animate-fade">
          {/* Main Visual Map Canvas */}
          {renderVisualMap()}

          {/* Sidebar breakdown details */}
          <div className="panel-card">
            <div className="panel-header">
              <span>SELECTED NODE DETAILS</span>
              <BookOpen size={14} />
            </div>

            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-console)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                {selectedNode.type === 'cluster' ? (
                  <>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>CATEGORY SILO</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--neon-amber)' }}>{selectedNode.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>SPOKES PLANNED</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{selectedNode.postsCount} posts</div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-dim)', marginBottom: '6px' }}>SPOKES LIST:</div>
                      {selectedNode.spokesList.map((p, idx) => (
                        <div key={idx} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ color: 'var(--color-text-bright)' }}>{p.keyword}</span>
                          <span style={{ color: getIntentColor(p.intent) }}>{p.intent}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>TYPE / ROLE</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: selectedNode.type === 'pillar' ? 'var(--neon-cyan)' : 'var(--neon-green)' }}>
                        {selectedNode.type.toUpperCase()} PAGE
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>TARGET KEYWORD</div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>{selectedNode.keyword}</div>
                    </div>
                    {selectedNode.clusterName && (
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>PARENT CLUSTER</div>
                        <div style={{ fontSize: '13px', color: 'var(--neon-amber)' }}>{selectedNode.clusterName}</div>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>EST. VOLUME</div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-bright)' }}>{selectedNode.volume.toLocaleString()} / mo</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>INTENT</div>
                        <div style={{ fontSize: '14px', color: getIntentColor(selectedNode.intent) }}>{selectedNode.intent}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>TEMPLATE</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-bright)' }}>{selectedNode.template}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>TARGET WORDCOUNT</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-bright)' }}>{selectedNode.wordCount} words</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>RECOMMENDED URL</div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>{selectedNode.url}</div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className="glow-amber" style={{ fontSize: '12px' }}>Click on any node in the map to view detailed metadata parameters.</span>
            )}
          </div>

          {/* Internal link matrix */}
          <div className="panel-card">
            <div className="panel-header">
              <span>INTERNAL LINK MATRIX SCHEMAS</span>
              <Link2 size={14} />
            </div>

            <div style={{ maxHeight: '310px', overflowY: 'auto' }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>FROM (SOURCE)</th>
                    <th>TO (TARGET)</th>
                    <th>ANCHOR TEXT</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.links.map((link, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: link.from.includes('pillar') ? 'var(--neon-cyan)' : 'var(--color-text-bright)' }}>
                        {link.from}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: link.to.includes('pillar') ? 'var(--neon-cyan)' : 'var(--color-text-bright)' }}>
                        {link.to}
                      </td>
                      <td style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--neon-green)' }}>
                        "{link.anchor}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
