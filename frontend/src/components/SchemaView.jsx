import React, { useState } from 'react';
import { Play, Code, CheckCircle, AlertOctagon, Copy } from 'lucide-react';

export default function SchemaView() {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' or 'validator'
  const [kind, setKind] = useState('profile');
  const [formParams, setFormParams] = useState({
    name: '', url: '', description: '', sameAs: '', knowsAbout: '', worksFor: '',
    merchant: '', orderUrl: '',
    provider: '', start: new Date().toISOString().slice(0, 16), partySize: '2',
    headline: '', author: '', likes: '',
    addressStreet: '', addressCity: '', addressZip: '', phone: '',
    latitude: '', longitude: '', priceRange: '$$', openingHours: 'Mo-Fr 09:00-17:00'
  });
  const [faqPairs, setFaqPairs] = useState([{ question: '', answer: '' }]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: '', url: '' }]);
  const [generatedJson, setGeneratedJson] = useState('');
  const [validateJson, setValidateJson] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleParamChange = (name, value) => {
    setFormParams(prev => ({ ...prev, [name]: value }));
  };

  const runGenerator = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGeneratedJson('');

    // Prepare parameters based on Schema kind
    let params = {};
    if (kind === 'profile') {
      params = {
        name: formParams.name,
        url: formParams.url,
        description: formParams.description,
        sameAs: formParams.sameAs ? formParams.sameAs.split(',').map(s => s.trim()) : [],
        knowsAbout: formParams.knowsAbout ? formParams.knowsAbout.split(',').map(s => s.trim()) : [],
        worksFor: formParams.worksFor
      };
    } else if (kind === 'order') {
      params = {
        merchant: formParams.merchant,
        orderUrl: formParams.orderUrl
      };
    } else if (kind === 'reservation') {
      params = {
        provider: formParams.provider,
        start: formParams.start,
        partySize: formParams.partySize
      };
    } else if (kind === 'discussion') {
      params = {
        headline: formParams.headline,
        author: formParams.author,
        url: formParams.url,
        date: new Date().toISOString()
      };
    } else if (kind === 'local_business') {
      params = {
        name: formParams.name,
        addressStreet: formParams.addressStreet,
        addressCity: formParams.addressCity,
        addressZip: formParams.addressZip,
        phone: formParams.phone,
        latitude: formParams.latitude ? parseFloat(formParams.latitude) : undefined,
        longitude: formParams.longitude ? parseFloat(formParams.longitude) : undefined,
        priceRange: formParams.priceRange,
        openingHours: formParams.openingHours
      };
    } else if (kind === 'faq') {
      params = {
        questions: faqPairs.map(f => f.question).filter(q => q.trim() !== ''),
        answers: faqPairs.map(f => f.answer).filter(a => a.trim() !== '')
      };
    } else if (kind === 'breadcrumb') {
      params = {
        names: breadcrumbs.map(b => b.name).filter(n => n.trim() !== ''),
        urls: breadcrumbs.map(b => b.url).filter(u => u.trim() !== '')
      };
    }

    try {
      const response = await fetch('/api/schema/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, params })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to generate');
      setGeneratedJson(JSON.stringify(res.schema, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runValidator = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationResult(null);

    try {
      const response = await fetch('/api/schema/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: validateJson })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to validate');
      setValidationResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="view-viewport">
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-console)', padding: '8px 16px' }}>
        <button
          className={`nav-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => { setActiveTab('generator'); setError(''); }}
          style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
        >
          JSON-LD GENERATOR
        </button>
        <button
          className={`nav-btn ${activeTab === 'validator' ? 'active' : ''}`}
          onClick={() => { setActiveTab('validator'); setError(''); }}
          style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
        >
          MERCHANT SCHEMAS VALIDATOR
        </button>
      </div>

      {activeTab === 'generator' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Generator Form */}
          <form className="console-form" onSubmit={runGenerator}>
            <div className="input-group">
              <label>SCHEMA TYPE</label>
              <select
                className="console-input"
                value={kind}
                onChange={e => setKind(e.target.value)}
                disabled={loading}
              >
                <option value="profile">ProfilePage (Knowledge Graph sameAs)</option>
                <option value="order">OrderAction (Potential online order action)</option>
                <option value="reservation">Reservation (Restaurant booking)</option>
                <option value="discussion">DiscussionForumPosting (Forum community)</option>
                <option value="local_business">LocalBusiness (Address &amp; Geocoordinates)</option>
                <option value="faq">FAQPage (Q&amp;A List)</option>
                <option value="breadcrumb">BreadcrumbList (Hierarchy Navigation)</option>
              </select>
            </div>

            {/* Profile Fields */}
            {kind === 'profile' && (
              <>
                <div className="form-row">
                  <div className="input-group">
                    <label>PERSON NAME</label>
                    <input type="text" className="console-input" value={formParams.name} onChange={e => handleParamChange('name', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>PROFILE URL</label>
                    <input type="text" className="console-input" value={formParams.url} onChange={e => handleParamChange('url', e.target.value)} required />
                  </div>
                </div>
                <div className="input-group">
                  <label>BIO DESCRIPTION</label>
                  <input type="text" className="console-input" value={formParams.description} onChange={e => handleParamChange('description', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>KNOWLEDGE GRAPH ENTITY LINKS (SAMEAS - COMMA SEPARATED)</label>
                  <input type="text" className="console-input" placeholder="e.g. https://linkedin.com/in/user, https://wikipedia.org/wiki/Entity" value={formParams.sameAs} onChange={e => handleParamChange('sameAs', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>TOPICS OF EXPERTISE (KNOWSABOUT - COMMA SEPARATED)</label>
                  <input type="text" className="console-input" placeholder="SEO, Machine Learning, Web Core Vitals" value={formParams.knowsAbout} onChange={e => handleParamChange('knowsAbout', e.target.value)} />
                </div>
              </>
            )}

            {/* Order Action Fields */}
            {kind === 'order' && (
              <div className="form-row">
                <div className="input-group">
                  <label>MERCHANT NAME</label>
                  <input type="text" className="console-input" value={formParams.merchant} onChange={e => handleParamChange('merchant', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>ONLINE ORDER URL</label>
                  <input type="text" className="console-input" value={formParams.orderUrl} onChange={e => handleParamChange('orderUrl', e.target.value)} required />
                </div>
              </div>
            )}

            {/* Reservation Fields */}
            {kind === 'reservation' && (
              <>
                <div className="input-group">
                  <label>ESTABLISHMENT PROVIDER</label>
                  <input type="text" className="console-input" value={formParams.provider} onChange={e => handleParamChange('provider', e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>START TIME</label>
                    <input type="datetime-local" className="console-input" value={formParams.start} onChange={e => handleParamChange('start', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>PARTY SIZE</label>
                    <input type="number" className="console-input" value={formParams.partySize} onChange={e => handleParamChange('partySize', e.target.value)} required />
                  </div>
                </div>
              </>
            )}

            {/* Discussion Forum Fields */}
            {kind === 'discussion' && (
              <>
                <div className="input-group">
                  <label>DISCUSSION HEADLINE</label>
                  <input type="text" className="console-input" value={formParams.headline} onChange={e => handleParamChange('headline', e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>AUTHOR USERNAME</label>
                    <input type="text" className="console-input" value={formParams.author} onChange={e => handleParamChange('author', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>DISCUSSION PATH URL</label>
                    <input type="text" className="console-input" value={formParams.url} onChange={e => handleParamChange('url', e.target.value)} required />
                  </div>
                </div>
              </>
            )}

            {/* Local Business Fields */}
            {kind === 'local_business' && (
              <>
                <div className="form-row">
                  <div className="input-group">
                    <label>BUSINESS NAME</label>
                    <input type="text" className="console-input" value={formParams.name} onChange={e => handleParamChange('name', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>TELEPHONE</label>
                    <input type="text" className="console-input" placeholder="e.g. +1-555-555-5555" value={formParams.phone} onChange={e => handleParamChange('phone', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label>STREET ADDRESS</label>
                  <input type="text" className="console-input" placeholder="e.g. 1600 Amphitheatre Pkwy" value={formParams.addressStreet} onChange={e => handleParamChange('addressStreet', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>CITY / LOCALITY</label>
                    <input type="text" className="console-input" placeholder="e.g. Mountain View" value={formParams.addressCity} onChange={e => handleParamChange('addressCity', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>POSTAL / ZIP CODE</label>
                    <input type="text" className="console-input" placeholder="e.g. 94043" value={formParams.addressZip} onChange={e => handleParamChange('addressZip', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>LATITUDE</label>
                    <input type="number" step="any" className="console-input" placeholder="e.g. 37.422" value={formParams.latitude} onChange={e => handleParamChange('latitude', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>LONGITUDE</label>
                    <input type="number" step="any" className="console-input" placeholder="e.g. -122.084" value={formParams.longitude} onChange={e => handleParamChange('longitude', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>PRICE RANGE</label>
                    <input type="text" className="console-input" placeholder="e.g. $$, $$$" value={formParams.priceRange} onChange={e => handleParamChange('priceRange', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>OPENING HOURS</label>
                    <input type="text" className="console-input" placeholder="e.g. Mo-Fr 09:00-17:00" value={formParams.openingHours} onChange={e => handleParamChange('openingHours', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* FAQ Fields */}
            {kind === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--color-text-dim)', letterSpacing: '0.05em' }}>FAQ QUESTION & ANSWER LIST</label>
                {faqPairs.map((pair, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Q&A PAIR #{idx + 1}</span>
                      {faqPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFaqPairs(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: 'none', color: 'var(--neon-red)', fontSize: '9px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                        >
                          [REMOVE]
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        className="console-input"
                        placeholder="Question"
                        value={pair.question}
                        onChange={e => {
                          const val = e.target.value;
                          setFaqPairs(prev => prev.map((p, i) => i === idx ? { ...p, question: val } : p));
                        }}
                        required
                      />
                      <textarea
                        className="console-input"
                        placeholder="Answer text"
                        rows={2}
                        value={pair.answer}
                        onChange={e => {
                          const val = e.target.value;
                          setFaqPairs(prev => prev.map((p, i) => i === idx ? { ...p, answer: val } : p));
                        }}
                        required
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFaqPairs(prev => [...prev, { question: '', answer: '' }])}
                  className="console-btn"
                  style={{ background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--color-text-bright)', padding: '6px', fontSize: '11px', textTransform: 'uppercase' }}
                >
                  + Add Q&amp;A Pair
                </button>
              </div>
            )}

            {/* Breadcrumb Fields */}
            {kind === 'breadcrumb' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--color-text-dim)', letterSpacing: '0.05em' }}>BREADCRUMB STEPS HIERARCHY</label>
                {breadcrumbs.map((b, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-console)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>STEP #{idx + 1}</span>
                      {breadcrumbs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBreadcrumbs(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: 'none', color: 'var(--neon-red)', fontSize: '9px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                        >
                          [REMOVE]
                        </button>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="input-group">
                        <input
                          type="text"
                          className="console-input"
                          placeholder="Label (e.g. Products)"
                          value={b.name}
                          onChange={e => {
                            const val = e.target.value;
                            setBreadcrumbs(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                          }}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <input
                          type="text"
                          className="console-input"
                          placeholder="URL Path (e.g. /products)"
                          value={b.url}
                          onChange={e => {
                            const val = e.target.value;
                            setBreadcrumbs(prev => prev.map((item, i) => i === idx ? { ...item, url: val } : item));
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setBreadcrumbs(prev => [...prev, { name: '', url: '' }])}
                  className="console-btn"
                  style={{ background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--color-text-bright)', padding: '6px', fontSize: '11px', textTransform: 'uppercase' }}
                >
                  + Add Breadcrumb Step
                </button>
              </div>
            )}

            <button type="submit" className="console-btn" disabled={loading} style={{ marginTop: '16px' }}>
              <Play size={14} /> {loading ? 'GENERATING...' : 'GENERATE JSON-LD'}
            </button>
          </form>

          {/* Generated Code display */}
          <div className="panel-card">
            <div className="panel-header">
              <span>GENERATED PAYLOAD</span>
              {generatedJson && (
                <button onClick={copyToClipboard} style={{ background: 'transparent', border: 'none', color: copied ? 'var(--neon-green)' : 'var(--color-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                  <Copy size={12} /> {copied ? 'COPIED!' : 'COPY'}
                </button>
              )}
            </div>
            <pre style={{ background: '#070a0b', border: '1px solid var(--border-color)', padding: '12px', fontSize: '11px', overflow: 'auto', flexGrow: 1, maxHeight: '350px', color: 'var(--neon-cyan)' }}>
              {generatedJson || 'Parameters template ready. Click generate to construct block...'}
            </pre>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Validator form */}
          <form className="console-form" onSubmit={runValidator}>
            <div className="input-group">
              <label>PASTE JSON-LD SCHEMA SCRIPT BLOCK</label>
              <textarea
                className="console-input"
                rows={12}
                placeholder='{ "@context": "https://schema.org", "@type": "Product", "name": "Variant Jacket" }'
                value={validateJson}
                onChange={e => setValidateJson(e.target.value)}
                style={{ resize: 'vertical', minHeight: '220px' }}
                disabled={loading}
                required
              />
            </div>
            <button type="submit" className="console-btn" disabled={loading}>
              <Code size={14} /> {loading ? 'AUDITING...' : 'VALIDATE MERCHANT SCHEMAS'}
            </button>
          </form>

          {/* Validation Results card */}
          <div className="panel-card">
            <div className="panel-header">
              <span>VALIDATION POLICY ANALYSIS</span>
            </div>
            
            {validationResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>MERCHANT ELIGIBILITY:</div>
                  <span className={`tag-badge ${validationResult.ok ? 'green' : 'red'}`}>
                    {validationResult.ok ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: 'var(--bg-console)', padding: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--neon-red)' }}>CRITICAL</div>
                    <div style={{ fontWeight: 'bold' }}>{validationResult.summary.critical}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--neon-red)' }}>HIGH</div>
                    <div style={{ fontWeight: 'bold' }}>{validationResult.summary.high}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--neon-amber)' }}>MEDIUM</div>
                    <div style={{ fontWeight: 'bold' }}>{validationResult.summary.medium}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--neon-cyan)' }}>INFO</div>
                    <div style={{ fontWeight: 'bold' }}>{validationResult.summary.info}</div>
                  </div>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {validationResult.findings.map((f, idx) => (
                    <div key={idx} style={{ padding: '6px 10px', borderLeft: '3px solid var(--border-color)', background: 'var(--bg-console)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }} className={f.severity === 'Critical' || f.severity === 'High' ? 'glow-red' : 'glow-amber'}>
                          {f.severity}
                        </span>
                        <span style={{ color: 'var(--color-text-dim)' }}>{f.rule}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-main)' }}>{f.message}</p>
                    </div>
                  ))}
                  {validationResult.findings.length === 0 && (
                    <div className="glow-green" style={{ fontSize: '12px' }}>✓ 0 issues found. Structured data is fully compliant.</div>
                  )}
                </div>
              </div>
            ) : (
              <span style={{ color: 'var(--color-text-dim)', fontSize: '12px' }}>
                Paste JSON-LD block and hit validate to inspect policy findings.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
