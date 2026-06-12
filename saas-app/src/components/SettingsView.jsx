import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Key, Shield, User, Database, AlertCircle, LogOut } from 'lucide-react';

export default function SettingsView({ sessionToken, userEmail, userMode, onLogout }) {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [adsDevToken, setAdsDevToken] = useState('');
  const [adsCustomerId, setAdsCustomerId] = useState('');
  const [adsLoginId, setAdsLoginId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings/load');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load credentials');
      
      const creds = data.credentials || {};
      setGoogleApiKey(creds.googleApiKey || '');
      setAdsDevToken(creds.adsDevToken || '');
      setAdsCustomerId(creds.adsCustomerId || '');
      setAdsLoginId(creds.adsLoginId || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
      setMessage({ type: 'error', text: `Failed to load settings: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: {
            googleApiKey,
            adsDevToken,
            adsCustomerId,
            adsLoginId
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save credentials');

      setMessage({
        type: 'success',
        text: `SETTINGS PERSISTED SUCCESSFULLY // STATUS: ${data.status.toUpperCase()}`
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage({ type: 'error', text: `Failed to save settings: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="view-viewport">
      <div className="dashboard-grid">
        {/* Sync & Tenant Profile Card */}
        <div className="panel-card active-neon">
          <div className="panel-header">
            <span>SECURE PROFILES DEPLOYMENT</span>
            <Shield size={16} className="glow-green" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'var(--border-color)',
                padding: '10px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={20} className="glow-cyan" />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                  Authenticated Identity
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                  {userEmail}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'var(--border-color)',
                padding: '10px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={20} className="glow-green" />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                  Persistence Mode
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--neon-green)' }}>
                  {userMode === 'insforge' ? 'INSFORGE CLOUD POSTGRES SYNCED' : 'LOCAL CACHED GUEST GATES'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', lineHeight: '1.4', marginBottom: '16px' }}>
                Your configurations are isolated using secure tenant variables. In cloud mode, credentials are fully encrypted and synced. In local mode, credentials are stored in a private configuration file in your user cache.
              </p>
              
              <button
                type="button"
                className="console-btn"
                onClick={onLogout}
                style={{
                  background: 'var(--neon-red-bg)',
                  color: 'var(--neon-red)',
                  border: '1px solid rgba(255, 60, 92, 0.3)',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--neon-red)';
                  e.currentTarget.style.color = 'var(--bg-core)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--neon-red-bg)';
                  e.currentTarget.style.color = 'var(--neon-red)';
                }}
              >
                <LogOut size={14} /> TERMINATE SESSION
              </button>
            </div>
          </div>
        </div>

        {/* Credentials Editor Card */}
        <div className="panel-card" style={{ gridColumn: 'span 2' }}>
          <div className="panel-header">
            <span>API ACCESS KEYS CONFIGURATION</span>
            <Key size={16} className="glow-amber" />
          </div>

          {message.text && (
            <div style={{
              background: message.type === 'error' ? 'var(--neon-red-bg)' : 'var(--neon-green-bg)',
              border: `1px solid ${message.type === 'error' ? 'var(--neon-red)' : 'var(--neon-green)'}`,
              color: message.type === 'error' ? 'var(--neon-red)' : 'var(--neon-green)',
              padding: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px' }}>
              <RefreshCw size={16} className="glow-green" style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>RETRIEVING CLIENT PROFILE...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="console-form" style={{ border: 'none', padding: 0 }}>
              <div className="input-group">
                <label>Google API Key (PageSpeed / CrUX / Search)</label>
                <input
                  type="password"
                  className="console-input"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
                <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>
                  Used to execute PageSpeed Insights v5 audits and CrUX history reports.
                </span>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Google Ads Developer Token</label>
                  <input
                    type="password"
                    className="console-input"
                    value={adsDevToken}
                    onChange={(e) => setAdsDevToken(e.target.value)}
                    placeholder="Ads Developer Token"
                  />
                </div>

                <div className="input-group">
                  <label>Google Ads Customer ID</label>
                  <input
                    type="text"
                    className="console-input"
                    value={adsCustomerId}
                    onChange={(e) => setAdsCustomerId(e.target.value)}
                    placeholder="123-456-7890"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Google Ads Login Customer ID</label>
                <input
                  type="text"
                  className="console-input"
                  value={adsLoginId}
                  onChange={(e) => setAdsLoginId(e.target.value)}
                  placeholder="Manager Account ID (if using MCC login)"
                />
                <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>
                  Required if your Developer Token is linked to a Google Ads Manager account.
                </span>
              </div>

              <button
                type="submit"
                className="console-btn"
                disabled={saving}
                style={{ alignSelf: 'flex-start', marginTop: '10px' }}
              >
                <Save size={14} /> {saving ? 'PERSISTING CREDENTIALS...' : 'COMMIT CONFIG CHANGES'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
