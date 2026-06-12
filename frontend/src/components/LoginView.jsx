import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion, AnimatePresence, useMotionValue, useTransform,
  animate, useAnimation, useSpring,
} from 'framer-motion';
import {
  Shield, Key, Mail, Terminal, AlertCircle, ArrowRight,
  Activity, Zap, MapPin, Eye, EyeOff, ChevronLeft,
  Lock, CheckCircle, Wifi,
} from 'lucide-react';
import { createClient } from '@insforge/sdk';

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════
const THEMES = {
  matrix: { id:'matrix', label:'MATRIX', primary:'#00ff66', secondary:'#00f0ff', bgConsole:'#0e1214', border:'#1e2629' },
  cyber:  { id:'cyber',  label:'CYBER',  primary:'#00f0ff', secondary:'#bf5fff', bgConsole:'#08101a', border:'#1a2535' },
  retro:  { id:'retro',  label:'RETRO',  primary:'#ffb700', secondary:'#ff6a00', bgConsole:'#110e00', border:'#2a2200' },
};

const BOOT_LINES = [
  'INITIALIZING SEO ENGINE v4.1.0...',
  'LOADING NEURAL RANK MODULES...',
  'CONNECTING TO AUDIT SUBSYSTEM...',
  'SECURITY INTERFACE READY.',
];

const SERP_KEYWORDS = [
  'core web vitals 2025', 'ai overviews optimization', 'e-e-a-t signals',
  'zero-click searches', 'semantic search intent', 'helpful content update',
  'schema markup trends', 'local pack optimization', 'voice search seo',
  'generative engine optimization', 'topical authority clusters',
  'page experience signals', 'indexing budget management', 'multivector embeddings',
  'knowledge graph entities', 'featured snippet capture', 'crawl depth seo',
];

const AUTH_STEPS = [
  'CONNECTING TO AUTH GATEWAY...',
  'VALIDATING CREDENTIALS...',
  'FETCHING USER PROFILE...',
  'LOADING WORKSPACE...',
  'ACCESS GRANTED ✓',
];

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!';

// ═══════════════════════════════════════════════════════════════
//  HOOK: SOUND FX (Web Audio API)
// ═══════════════════════════════════════════════════════════════
function useSoundFX() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const tone = (freq, dur = 0.1, type = 'sine', vol = 0.07) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch (_) {}
  };

  return {
    focus:   () => tone(880, 0.06, 'sine', 0.04),
    click:   () => tone(1200, 0.04, 'square', 0.03),
    error:   () => { tone(180, 0.25, 'sawtooth', 0.1); setTimeout(() => tone(140, 0.3, 'sawtooth', 0.07), 170); },
    success: () => [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.1), i * 80)),
  };
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: PARTICLE CANVAS
// ═══════════════════════════════════════════════════════════════
function ParticleField({ primaryColor }) {
  const canvasRef = useRef(null);
  const colorRef  = useRef(primaryColor);
  useEffect(() => { colorRef.current = primaryColor; }, [primaryColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.4, a: Math.random() * 0.5 + 0.1,
    }));

    const hex2 = (n) => Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const c = colorRef.current;

      ctx.strokeStyle = 'rgba(30,38,41,0.45)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = c + hex2(p.a * 255);
        ctx.shadowColor = c; ctx.shadowBlur = 6;
        ctx.fill(); ctx.shadowBlur = 0;
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[j].x - p.x, dy = pts[j].y - p.y, d = Math.sqrt(dx*dx+dy*dy);
          if (d < 95) {
            ctx.beginPath();
            ctx.strokeStyle = c + hex2(0.09 * (1-d/95) * 255);
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />;
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: SCRAMBLE TEXT REVEAL
// ═══════════════════════════════════════════════════════════════
function ScrambleText({ text, delay = 400 }) {
  const [out, setOut] = useState(text.replace(/\S/g, SCRAMBLE_CHARS[0]));
  useEffect(() => {
    const timer = setTimeout(() => {
      let iter = 0;
      const iv = setInterval(() => {
        setOut(text.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < iter) return text[i];
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join(''));
        iter += 0.38;
        if (iter > text.length) clearInterval(iv);
      }, 42);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);
  return <span>{out}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: FOCUS SCRAMBLE TEXT (triggers on input focus)
// ═══════════════════════════════════════════════════════════════
function FocusedScrambleText({ text, isFocused }) {
  const [out, setOut] = useState(text);
  const prevFocused = useRef(isFocused);
  
  useEffect(() => {
    if (isFocused && !prevFocused.current) {
      let iter = 0;
      const iv = setInterval(() => {
        setOut(text.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < iter) return text[i];
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join(''));
        iter += 0.5;
        if (iter > text.length) {
          clearInterval(iv);
          setOut(text);
        }
      }, 30);
      return () => clearInterval(iv);
    }
    prevFocused.current = isFocused;
  }, [isFocused, text]);

  return <span>{out}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: GLITCH TEXT (periodic)
// ═══════════════════════════════════════════════════════════════
function GlitchText({ text }) {
  const [g, setG] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setG(true);
      setTimeout(() => setG(false), 160);
    }, 5000 + Math.random() * 4000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{ position:'relative', display:'inline-block' }}>
      {text}
      {g && <>
        <span style={{ position:'absolute', top:0, left:0, color:'#00f0ff', clipPath:'polygon(0 25%,100% 25%,100% 48%,0 48%)', transform:'translateX(-3px)', opacity:0.85 }}>{text}</span>
        <span style={{ position:'absolute', top:0, left:0, color:'#ff3c5c', clipPath:'polygon(0 60%,100% 60%,100% 80%,0 80%)', transform:'translateX(3px)',  opacity:0.85 }}>{text}</span>
      </>}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════
function AnimatedCounter({ value, suffix = '' }) {
  const mv = useMotionValue(0);
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    const c = animate(mv, value, { duration: 2.4, ease: 'easeOut' });
    const u = mv.on('change', v => setDisp(Math.floor(v)));
    return () => { c.stop(); u(); };
  }, [value, mv]);
  return <span>{disp.toLocaleString()}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: TYPING LINE
// ═══════════════════════════════════════════════════════════════
function TypingLine({ lines, speed = 42 }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState([]);
  useEffect(() => {
    if (lineIdx >= lines.length) return;
    if (charIdx <= lines[lineIdx].length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setDone(d => [...d, lines[lineIdx]]); setLineIdx(i => i+1); setCharIdx(0); }, 360);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, lines, speed]);
  const cur = lineIdx < lines.length ? lines[lineIdx].slice(0, charIdx) : null;
  return (
    <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', lineHeight:'1.9' }}>
      {done.map((l, i) => <div key={i} style={{ color:'var(--color-text-dim)' }}><span style={{ color:'var(--neon-green)' }}>{'>'}</span> {l}</div>)}
      {cur !== null && (
        <div>
          <span style={{ color:'var(--neon-green)' }}>{'>'}</span> {cur}
          <motion.span animate={{ opacity:[1,0] }} transition={{ duration:0.8, repeat:Infinity }}>▋</motion.span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: SCANLINE SWEEP (neon laser)
// ═══════════════════════════════════════════════════════════════
function ScanlineOverlay({ color }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:20 }}>
      <motion.div
        style={{ 
          position:'absolute', 
          left:0, 
          right:0, 
          height:'2px', 
          background:`linear-gradient(90deg,transparent,${color},transparent)`,
          boxShadow: `0 0 8px ${color}, 0 0 14px ${color}`,
          opacity: 0.65
        }}
        animate={{ top:['-4px','104%'] }}
        transition={{ duration:4.8, repeat:Infinity, ease:'easeInOut', repeatDelay:3.2 }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: CORNER BRACKETS
// ═══════════════════════════════════════════════════════════════
function CornerBrackets({ color, size = 14, isHovered = false }) {
  const b = `2px solid ${color}`;
  const s = { position:'absolute', width:size, height:size, pointerEvents:'none' };
  const offset = isHovered ? -5 : 0;
  const glow = isHovered ? `0 0 12px ${color}` : 'none';
  return (
    <>
      <motion.div animate={{ top: offset, left: offset, boxShadow: glow }} transition={{ type: 'spring', damping: 15, stiffness: 200 }} style={{ ...s, top:0, left:0, borderTop:b, borderLeft:b }} />
      <motion.div animate={{ top: offset, right: offset, boxShadow: glow }} transition={{ type: 'spring', damping: 15, stiffness: 200 }} style={{ ...s, top:0, right:0, borderTop:b, borderRight:b }} />
      <motion.div animate={{ bottom: offset, left: offset, boxShadow: glow }} transition={{ type: 'spring', damping: 15, stiffness: 200 }} style={{ ...s, bottom:0, left:0, borderBottom:b, borderLeft:b }} />
      <motion.div animate={{ bottom: offset, right: offset, boxShadow: glow }} transition={{ type: 'spring', damping: 15, stiffness: 200 }} style={{ ...s, bottom:0, right:0, borderBottom:b, borderRight:b }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: NOISE GRAIN TEXTURE
// ═══════════════════════════════════════════════════════════════
function NoiseTexture() {
  return (
    <>
      <svg width="0" height="0" style={{ position:'absolute' }}>
        <filter id="grain-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>
      <div style={{ position:'absolute', inset:0, zIndex:2, opacity:0.038, background:'white', filter:'url(#grain-noise)', pointerEvents:'none' }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: SERP KEYWORD TICKER  (live from /api/trending)
// ═══════════════════════════════════════════════════════════════
function SERPTicker({ primary }) {
  const [keywords, setKeywords] = useState(SERP_KEYWORDS); // start with local fallback
  const [source,   setSource]   = useState('loading');
  const [key,      setKey]      = useState(0); // bump to restart marquee animation

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/trending');
      const json = await res.json();
      if (json.keywords?.length > 0) {
        setKeywords(json.keywords);
        setSource(json.source);   // 'live' | 'curated' | 'cache' | 'fallback'
        setKey(k => k + 1);       // restart marquee so new words are visible immediately
      }
    } catch (_) {
      setSource('offline');
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30 * 60 * 1000); // refresh every 30 min
    return () => clearInterval(iv);
  }, [load]);

  const items = [...keywords, ...keywords]; // double for seamless loop

  const sourceLabel = source === 'live'    ? '◉ LIVE'
                    : source === 'cache'   ? '◎ CACHED'
                    : source === 'loading' ? '… LOADING'
                    : source === 'offline' ? '✕ OFFLINE'
                    : '◈ CURATED';

  const sourceColor = source === 'live'    ? '#00ff66'
                    : source === 'offline' ? '#ff3c5c'
                    : primary;

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, height:'28px', zIndex:10, overflow:'hidden', background:'rgba(6,9,10,0.85)', backdropFilter:'blur(4px)', borderBottom:`1px solid ${primary}22`, display:'flex', alignItems:'center' }}>

      {/* Brand label */}
      <div style={{ fontSize:'10px', color:primary, fontFamily:'var(--font-mono)', padding:'0 14px', whiteSpace:'nowrap', flexShrink:0, borderRight:`1px solid ${primary}30`, marginRight:'14px', display:'flex', alignItems:'center', gap:'5px' }}>
        <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ duration:1.5, repeat:Infinity }}>
          <Zap size={9} />
        </motion.div>
        TRENDING
      </div>

      {/* Source badge */}
      <motion.div
        key={source}
        initial={{ opacity:0, scale:0.8 }}
        animate={{ opacity:1, scale:1 }}
        style={{ fontSize:'9px', color:sourceColor, fontFamily:'var(--font-mono)', whiteSpace:'nowrap', flexShrink:0, marginRight:'12px', letterSpacing:'0.05em' }}
      >
        {sourceLabel}
      </motion.div>

      {/* Scrolling keywords */}
      <div style={{ overflow:'hidden', flex:1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.6 }}
          >
            <motion.div
              animate={{ x:['0%','-50%'] }}
              transition={{ duration: Math.max(20, keywords.length * 2.5), repeat:Infinity, ease:'linear' }}
              style={{ display:'flex', gap:'36px', whiteSpace:'nowrap' }}
            >
              {items.map((kw, i) => (
                <span key={i} style={{ fontSize:'10px', color:'var(--color-text-dim)', textTransform:'uppercase' }}>
                  <span style={{ color:primary, marginRight:'7px' }}>◈</span>{kw}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: API HEALTH PING
// ═══════════════════════════════════════════════════════════════
function ApiHealthPing({ primary }) {
  const [ms, setMs] = useState(null);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const ping = async () => {
      try {
        const t0 = performance.now();
        await fetch('/api/config');
        const latency = Math.round(performance.now() - t0);
        setMs(latency);
        setStatus(latency < 120 ? 'good' : latency < 350 ? 'fair' : 'slow');
      } catch { setStatus('error'); }
    };
    ping();
    const iv = setInterval(ping, 10000);
    return () => clearInterval(iv);
  }, []);

  const color = status === 'good' ? '#00ff66' : status === 'fair' ? '#ffb700' : status === 'error' ? '#ff3c5c' : '#5c7573';

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.3 }}
      style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'10px', color:'var(--color-text-dim)' }}
    >
      <Wifi size={9} style={{ color }} />
      <span>API</span>
      <span style={{ fontWeight:700, color, fontFamily:'var(--font-mono)' }}>
        {status === 'checking' ? '...' : status === 'error' ? 'ERR' : `${ms}ms`}
      </span>
      <motion.div style={{ width:6, height:6, borderRadius:'50%', background:color }}
        animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: GEO DETECTOR
// ═══════════════════════════════════════════════════════════════
function GeoDetector({ primary }) {
  const [geo, setGeo] = useState(null);
  useEffect(() => {
    fetch('https://ipwho.is/')
      .then(r => r.json())
      .then(d => { if (d.success !== false) setGeo({ city: d.city || '—', country: d.country || '—', flag: d.flag?.emoji || '🌐' }); })
      .catch(() => {});
  }, []);
  if (!geo) return null;
  return (
    <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:2, duration:0.5 }}
      style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', color:'var(--color-text-dim)' }}
    >
      <MapPin size={9} style={{ color:primary }} />
      <span>{geo.flag} {geo.city}, {geo.country}</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: PASSWORD STRENGTH METER
// ═══════════════════════════════════════════════════════════════
function PasswordStrength({ password, primary }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ['','WEAK','FAIR','STRONG','FORTRESS'][score];
  const color = ['','#ff3c5c','#ffb700','#00ff66', primary][score];
  if (!password) return null;
  return (
    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.3 }}>
      <div style={{ display:'flex', gap:'4px', marginBottom:'5px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:'3px', background:'var(--border-color)', overflow:'hidden' }}>
            <motion.div
              animate={{ width: score >= i ? '100%' : '0%', backgroundColor: color }}
              transition={{ duration:0.35, ease:'easeOut' }}
              style={{ height:'100%' }}
            />
          </div>
        ))}
      </div>
      <div style={{ fontSize:'10px', color, textTransform:'uppercase', letterSpacing:'0.06em' }}>
        PASSKEY STRENGTH: {label}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: AUTH PROGRESS STEPS
// ═══════════════════════════════════════════════════════════════
function AuthProgress({ step }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}
      style={{ padding:'14px 14px 14px 20px', background:'rgba(0,0,0,0.45)', border:'1px solid var(--border-color)', marginBottom:'16px', position:'relative' }}
    >
      <div style={{ position: 'absolute', left: '25px', top: '22px', bottom: '22px', width: '2px', background: 'var(--border-color)', zIndex: 0 }} />
      <motion.div
        initial={{ height: '0%' }}
        animate={{ height: `${(step / (AUTH_STEPS.length - 1)) * 100}%` }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ position: 'absolute', left: '25px', top: '22px', bottom: '22px', width: '2px', background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)', transformOrigin: 'top', zIndex: 1 }}
      />
      {AUTH_STEPS.map((label, i) => (
        <motion.div key={i} animate={{ opacity: i <= step ? 1 : 0.22 }}
          style={{ display:'flex', alignItems:'center', gap:'12px', padding:'6px 0', fontSize:'11px', fontFamily:'var(--font-mono)', position:'relative', zIndex: 2 }}
        >
          <div style={{ width:12, height:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'var(--bg-console)' }}>
            {i < step ? (
              <CheckCircle size={12} style={{ color:'#00ff66', flexShrink:0 }} />
            ) : i === step ? (
              <motion.div animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:'linear' }} style={{ display: 'inline-flex' }}>
                <Activity size={12} style={{ color:'var(--neon-cyan)', flexShrink:0 }} />
              </motion.div>
            ) : (
              <div style={{ width:8, height:8, borderRadius:'50%', border:'1px solid var(--border-color)', background:'var(--bg-console)', flexShrink:0 }} />
            )}
          </div>
          <span style={{ color: i <= step ? 'var(--color-text-main)' : 'var(--color-text-dim)' }}>{label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: FORGOT PASSWORD SLIDE PANEL
// ═══════════════════════════════════════════════════════════════
function ForgotPasswordPanel({ onClose, primary, sfx }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetHovered, setResetHovered] = useState(false);
  return (
    <motion.div
      initial={{ x:'110%' }}
      animate={{ x:'0%' }}
      exit={{ x:'110%' }}
      transition={{ type:'spring', damping:28, stiffness:280 }}
      style={{ position:'absolute', inset:0, background:'var(--bg-console)', zIndex:50, padding:'32px', display:'flex', flexDirection:'column', overflow:'hidden' }}
    >
      <NoiseTexture />
      <motion.button onClick={() => { sfx.click(); onClose(); }} whileHover={{ x:-4 }}
        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-dim)', display:'flex', alignItems:'center', gap:'6px', fontFamily:'var(--font-mono)', fontSize:'11px', textTransform:'uppercase', marginBottom:'28px', padding:0 }}
      >
        <ChevronLeft size={13}/> BACK TO LOGIN
      </motion.button>

      <div style={{ display:'flex', alignItems:'center', gap:'10px', fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:700, color:'var(--color-text-bright)', textTransform:'uppercase', marginBottom:'8px' }}>
        <Lock size={18} style={{ color:primary }}/> RESET ACCESS
      </div>
      <div style={{ fontSize:'11px', color:'var(--color-text-dim)', marginBottom:'28px', textTransform:'uppercase' }}>
        ENTER EMAIL TO RECEIVE PASSKEY RESET LINK
      </div>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="input-group" style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'11px', color:'var(--color-text-dim)', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                <Mail size={11}/> Email Address
              </label>
              <input className="console-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="administrator@domain.com" onFocus={() => sfx.focus()} style={{ width:'100%' }} />
            </div>
            <motion.button 
              onMouseEnter={() => setResetHovered(true)}
              onMouseLeave={() => setResetHovered(false)}
              whileHover={{ scale:1.02, boxShadow:`0 0 20px ${primary}55` }} 
              whileTap={{ scale:0.97 }}
              onClick={() => { if (email) { sfx.success(); setSent(true); } }}
              style={{ background:primary, color:'#090c0d', border:'none', padding:'13px 24px', fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'13px', textTransform:'uppercase', cursor:'pointer', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
            >
              TRANSMIT RESET LINK{" "}
              <motion.span
                animate={resetHovered ? { x: [0, 5, 0] } : { x: 0 }}
                transition={resetHovered ? { repeat: Infinity, duration: 0.8, ease: 'easeInOut' } : {}}
                style={{ display: 'inline-flex' }}
              >
                <ArrowRight size={14}/>
              </motion.span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="sent" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:'center', padding:'28px 0' }}>
            <motion.div animate={{ scale:[1,1.25,1] }} transition={{ duration:0.55 }} style={{ marginBottom:'16px' }}>
              <CheckCircle size={44} style={{ color:primary }} />
            </motion.div>
            <div style={{ color:'var(--color-text-bright)', fontSize:'14px', textTransform:'uppercase', marginBottom:'8px', fontFamily:'var(--font-display)', fontWeight:700 }}>LINK TRANSMITTED</div>
            <div style={{ color:'var(--color-text-dim)', fontSize:'11px' }}>Check your inbox for reset instructions.</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex:1 }}/>
      <div style={{ fontSize:'10px', color:'var(--color-text-dim)', textAlign:'center', paddingTop:'16px', borderTop:'1px solid var(--border-color)' }}>
        SECURITY PROTOCOL SEC-409 // SINGLE-USE TOKENS EXPIRE IN 15MIN
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT: THEME SWITCHER
// ═══════════════════════════════════════════════════════════════
function ThemeSwitcher({ current, onChange, sfx }) {
  return (
    <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} transition={{ delay:1.1 }}
      style={{ position:'fixed', top:'36px', right:'24px', zIndex:10, display:'flex', gap:'10px', alignItems:'center' }}
    >
      <span style={{ fontSize:'9px', color:'var(--color-text-dim)', textTransform:'uppercase', letterSpacing:'0.1em' }}>THEME</span>
      {Object.values(THEMES).map(t => (
        <motion.button key={t.id}
          whileHover={{ scale:1.3 }} whileTap={{ scale:0.85 }}
          onClick={() => { onChange(t.id); sfx.click(); }}
          title={t.label}
          style={{ width:14, height:14, borderRadius:'50%', background:t.primary, border: current === t.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent', cursor:'pointer', padding:0, boxShadow: current === t.id ? `0 0 10px ${t.primary}` : 'none', transition:'box-shadow 0.2s' }}
        />
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════
const containerV = { hidden:{ opacity:0 }, visible:{ opacity:1, transition:{ staggerChildren:0.09, delayChildren:0.2 } } };
const itemV      = { hidden:{ opacity:0, y:22, filter:'blur(6px)' }, visible:{ opacity:1, y:0, filter:'blur(0px)', transition:{ duration:0.45, ease:'easeOut' } } };

// ═══════════════════════════════════════════════════════════════
//  MAIN: LOGIN VIEW
// ═══════════════════════════════════════════════════════════════
export default function LoginView({ onLoginSuccess }) {
  const [email,       setEmail]       = useState(() => localStorage.getItem('seo_remember') || '');
  const [password,    setPassword]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [authStep,    setAuthStep]    = useState(0);
  const [error,       setError]       = useState('');
  const [config,      setConfig]      = useState({ cloudEnabled:false, insforgeUrl:'', insforgeAnonKey:'' });
  const [mode,        setMode]        = useState('signin');
  const [focusedField,setFocusedField]= useState(null);
  const [showPass,    setShowPass]    = useState(false);
  const [rememberMe,  setRememberMe]  = useState(!!localStorage.getItem('seo_remember'));
  const [showForgot,  setShowForgot]  = useState(false);
  const [themeId,     setThemeId]     = useState('matrix');
  const [logoHovered, setLogoHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [guestHovered, setGuestHovered] = useState(false);

  const controls = useAnimation();
  const cardRef  = useRef(null);
  const sfx      = useSoundFX();
  const theme    = THEMES[themeId];

  // 3-D mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rawRX  = useTransform(mouseY, [-240, 240], [ 7, -7]);
  const rawRY  = useTransform(mouseX, [-240, 240], [-7,  7]);
  const rotX   = useSpring(rawRX, { damping:26, stiffness:200 });
  const rotY   = useSpring(rawRY, { damping:26, stiffness:200 });

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width  / 2);
    mouseY.set(e.clientY - rect.top  - rect.height / 2);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    animate(mouseX, 0, { duration:0.6, ease:'easeOut' });
    animate(mouseY, 0, { duration:0.6, ease:'easeOut' });
  }, [mouseX, mouseY]);

  // Shake card on error
  const prevError = useRef('');
  useEffect(() => {
    if (error && error !== prevError.current) {
      prevError.current = error;
      sfx.error();
      controls.start({ x:[0,-14,14,-10,10,-6,6,-2,2,0], transition:{ duration:0.5, ease:'easeInOut' } })
        .then(() => controls.set({ x:0 }));
    }
  }, [error, controls, sfx]);

  // Fetch config
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => setConfig(d))
      .catch(() => setError('CRITICAL // FAILED TO CONTACT BACKEND CONFIG SERVICE'));
  }, []);

  // Simulate auth progress steps
  const runProgress = useCallback(async () => {
    for (let i = 0; i < AUTH_STEPS.length - 1; i++) {
      setAuthStep(i);
      await new Promise(r => setTimeout(r, 550 + Math.random() * 380));
    }
    setAuthStep(AUTH_STEPS.length - 1);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('INPUT ERROR // EMAIL AND PASSWORD REQUIRED'); return; }
    setLoading(true);
    setAuthStep(0);
    setError('');
    runProgress();
    if (rememberMe) localStorage.setItem('seo_remember', email);
    else localStorage.removeItem('seo_remember');
    try {
      if (config.cloudEnabled) {
        const ig = createClient({ baseUrl:config.insforgeUrl, anonKey:config.insforgeAnonKey });
        if (mode === 'signup') {
          const { error: suErr } = await ig.auth.signUp({ email, password });
          if (suErr) throw suErr;
          const { data: sd, error: siErr } = await ig.auth.signInWithPassword({ email, password });
          if (siErr) throw siErr;
          if (sd?.accessToken) { sfx.success(); onLoginSuccess(sd.accessToken, email, 'insforge'); }
          else setError('REGISTRATION COMPLETED. INITIATE MANUAL SIGN IN.');
        } else {
          const { data, error: siErr } = await ig.auth.signInWithPassword({ email, password });
          if (siErr) throw siErr;
          if (data?.accessToken) { sfx.success(); onLoginSuccess(data.accessToken, email, 'insforge'); }
          else throw new Error('No access token returned');
        }
      } else {
        await new Promise(r => setTimeout(r, 2400));
        setError('CLOUD INTERFACE UNAVAILABLE. CONTACT SYSTEM ADMINISTRATOR.');
      }
    } catch (err) {
      setError(`AUTHENTICATION_ERROR // ${(err.message || String(err)).toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ position:'relative', minHeight:'100vh', overflow:'hidden' }}>

      {/* ── Animated Background ── */}
      <ParticleField primaryColor={theme.primary} />

      {/* Soft radial glow behind card */}
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'750px', height:'750px', borderRadius:'50%', background:`radial-gradient(circle,${theme.primary}07 0%,transparent 68%)`, pointerEvents:'none', zIndex:1 }} />

      {/* ── Peripheral UI ── */}
      <SERPTicker primary={theme.primary} />
      <ThemeSwitcher current={themeId} onChange={setThemeId} sfx={sfx} />

      {/* Stats — top left */}
      <motion.div initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }} transition={{ delay:1.1, duration:0.6 }}
        style={{ position:'fixed', top:'52px', left:'24px', zIndex:10, display:'flex', gap:'30px' }}
      >
        {[{l:'DOMAINS AUDITED',v:14820,s:'+'},{l:'ISSUES FOUND',v:98340,s:'+'},{l:'UPTIME',v:99,s:'%'}].map(({l,v,s}) => (
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:700, color:theme.primary }}>
              <AnimatedCounter value={v} suffix={s}/>
            </div>
            <div style={{ fontSize:'9px', color:'var(--color-text-dim)', textTransform:'uppercase', marginTop:'3px', letterSpacing:'0.06em' }}>{l}</div>
          </div>
        ))}
      </motion.div>

      {/* Boot log — bottom left */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
        style={{ position:'fixed', bottom:'24px', left:'24px', zIndex:10, maxWidth:'340px' }}
      >
        <TypingLine lines={BOOT_LINES} speed={38} />
      </motion.div>

      {/* System status — bottom right */}
      <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ delay:1, duration:0.6 }}
        style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:10, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'9px' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'11px', color:'var(--color-text-dim)' }}>
          <motion.div style={{ width:7, height:7, borderRadius:'50%', background:theme.primary }}
            animate={{ scale:[1,1.6,1], opacity:[1,0.4,1] }} transition={{ duration:2, repeat:Infinity }}
          />
          SYSTEM ONLINE // ALL NODES NOMINAL
        </div>
        <ApiHealthPing primary={theme.primary} />
        <GeoDetector primary={theme.primary} />
      </motion.div>

      {/* ── MAIN CARD ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'60px 20px 24px', position:'relative', zIndex:5 }}>
        {/* Entrance wrapper */}
        <motion.div
          initial={{ opacity:0, scale:0.88, y:48 }}
          animate={{ opacity:1, scale:1, y:0 }}
          transition={{ duration:0.72, ease:[0.16,1,0.3,1] }}
          style={{ width:'100%', maxWidth:'500px' }}
        >
        {/* Parallax + shake wrapper */}
        <motion.div
          ref={cardRef}
          animate={controls}
          style={{ rotateX:rotX, rotateY:rotY, transformStyle:'preserve-3d', perspective:1000, width:'100%' }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setCardHovered(true)}
          onMouseLeave={() => { setCardHovered(false); handleMouseLeave(); }}
        >
          <div style={{
            background:theme.bgConsole,
            border:`2px solid ${theme.border}`,
            padding:'32px', position:'relative', overflow:'hidden',
            boxShadow:`0 0 90px rgba(0,0,0,0.75), 0 0 40px ${theme.primary}05`,
          }}>
            <ScanlineOverlay color={theme.primary} />
            <CornerBrackets color={theme.primary} size={15} isHovered={cardHovered} />
            <NoiseTexture />

            {/* Forgot Password Panel */}
            <AnimatePresence>
              {showForgot && <ForgotPasswordPanel onClose={() => setShowForgot(false)} primary={theme.primary} sfx={sfx} />}
            </AnimatePresence>

            {/* ── Inner Content ── */}
            <motion.div variants={containerV} initial="hidden" animate="visible" style={{ display:'flex', flexDirection:'column' }}>

              {/* HEADER */}
              <motion.div variants={itemV} style={{ borderBottom:`1px solid ${theme.border}`, paddingBottom:'16px', marginBottom:'24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:'28px', fontWeight:700, color:'var(--color-text-bright)', textTransform:'uppercase', letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:'12px', margin:0 }}>
                    <motion.div
                      onHoverStart={() => { setLogoHovered(true); sfx.focus(); }}
                      onHoverEnd={() => setLogoHovered(false)}
                      whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      {logoHovered && (
                        <>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0.6 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                            style={{ position: 'absolute', width: 26, height: 26, borderRadius: '50%', border: `2px solid ${theme.primary}`, pointerEvents: 'none' }}
                          />
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0.4 }}
                            animate={{ scale: 3, opacity: 0 }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                            style={{ position: 'absolute', width: 26, height: 26, borderRadius: '50%', border: `1px solid ${theme.secondary}`, pointerEvents: 'none' }}
                          />
                        </>
                      )}
                      <Shield size={26} style={{ color: theme.primary, filter: logoHovered ? `drop-shadow(0 0 8px ${theme.primary})` : 'none' }} />
                    </motion.div>
                    <GlitchText text="SEO AASHAN" />
                  </h1>
                  <div style={{ fontSize:'10px', color:'var(--color-text-dim)', marginTop:'5px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                    SECURITY INTERFACE SEC-409 // AUTH GATEWAY
                  </div>
                </div>
                <motion.div animate={{ opacity:[0.55,1,0.55] }} transition={{ duration:2.5, repeat:Infinity }}
                  style={{ fontSize:'10px', color:config.cloudEnabled ? theme.primary : '#ffb700', border:`1px solid ${config.cloudEnabled ? theme.primary : '#ffb700'}44`, padding:'4px 9px', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}
                >
                  <span style={{ width:6, height:6, borderRadius:'50%', background:config.cloudEnabled ? theme.primary : '#ffb700', display:'inline-block' }} />
                  {config.cloudEnabled ? 'SYNC // ONLINE' : 'LOCAL MODE'}
                </motion.div>
              </motion.div>

              {/* ERROR BANNER */}
              <AnimatePresence>
                {error && (
                  <motion.div key="err" initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:'16px' }} exit={{ opacity:0, height:0, marginBottom:0 }} transition={{ duration:0.28 }}
                    style={{ background:'rgba(255,60,92,0.08)', border:'1px solid #ff3c5c', color:'#ff3c5c', padding:'12px', fontSize:'12px', display:'flex', alignItems:'center', gap:'8px', overflow:'hidden' }}
                  >
                    <AlertCircle size={15} /> <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AUTH PROGRESS */}
              <AnimatePresence>
                {loading && <AuthProgress step={authStep} />}
              </AnimatePresence>

              {/* FORM */}
              <motion.form variants={itemV} onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px', border:'none', padding:0, background:'none' }}>

                {/* Email */}
                <motion.div variants={itemV} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={{ fontSize:'11px', color:'var(--color-text-dim)', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px' }}>
                    <motion.span
                      animate={focusedField === 'email' ? { y: [-1, 2, -1], rotate: [0, 8, -8, 0] } : { y: 0, rotate: 0 }}
                      transition={{ duration: 0.5, repeat: focusedField === 'email' ? Infinity : 0 }}
                      style={{ display: 'inline-flex' }}
                    >
                      <Mail size={11} />
                    </motion.span> <FocusedScrambleText text="Email Address" isFocused={focusedField === 'email'} />
                  </label>
                  <motion.div
                    animate={focusedField==='email' ? { scale: 1.01, boxShadow:`0 0 20px ${theme.primary}45` } : { scale: 1, boxShadow:'0 0 0px transparent' }}
                    transition={{ duration:0.3 }}
                  >
                    <input type="email" className="console-input" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="administrator@domain.com"
                      disabled={loading || !config.cloudEnabled} required
                      onFocus={() => { setFocusedField('email'); sfx.focus(); }}
                      onBlur={() => setFocusedField(null)}
                      style={{ width:'100%', borderColor: focusedField==='email' ? theme.primary : undefined }}
                    />
                  </motion.div>
                </motion.div>

                {/* Password */}
                <motion.div variants={itemV} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={{ fontSize:'11px', color:'var(--color-text-dim)', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px' }}>
                    <motion.span
                      animate={focusedField === 'password' ? { scale: [1, 1.2, 1], rotate: [0, 12, -12, 0] } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, repeat: focusedField === 'password' ? Infinity : 0 }}
                      style={{ display: 'inline-flex' }}
                    >
                      <Key size={11} />
                    </motion.span> <FocusedScrambleText text="Authentication Passkey" isFocused={focusedField === 'password'} />
                  </label>
                  <motion.div
                    animate={focusedField==='password' ? { scale: 1.01, boxShadow:`0 0 20px ${theme.primary}45` } : { scale: 1, boxShadow:'0 0 0px transparent' }}
                    transition={{ duration:0.3 }}
                    style={{ position:'relative' }}
                  >
                    <input type={showPass ? 'text' : 'password'} className="console-input" value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={loading || !config.cloudEnabled} required
                      onFocus={() => { setFocusedField('password'); sfx.focus(); }}
                      onBlur={() => setFocusedField(null)}
                      style={{ width:'100%', paddingRight:'42px', borderColor: focusedField==='password' ? theme.primary : undefined }}
                    />
                    <motion.button type="button" whileHover={{ scale:1.1, color:theme.primary }} onClick={() => { setShowPass(p => !p); sfx.click(); }}
                      style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-dim)', display:'flex', alignItems:'center', padding:0 }}
                    >
                      {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </motion.button>
                  </motion.div>
                  <AnimatePresence>
                    {mode === 'signup' && <PasswordStrength password={password} primary={theme.primary} />}
                  </AnimatePresence>
                </motion.div>

                {/* Remember + Mode Toggle */}
                {config.cloudEnabled && (
                  <motion.div variants={itemV} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'11px', marginTop:'-4px' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', color:'var(--color-text-dim)', textTransform:'uppercase', userSelect:'none' }}>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} onClick={() => sfx.click()}
                        style={{ accentColor:theme.primary, width:12, height:12 }}
                      />
                      Remember
                    </label>
                    <div style={{ display:'flex', gap:'14px' }}>
                      {['signin','signup'].map(m => (
                        <motion.button key={m} type="button" whileHover={{ scale:1.06 }} whileTap={{ scale:0.92 }}
                          onClick={() => { setMode(m); sfx.click(); }}
                          style={{ background:'none', border:'none', color: mode===m ? theme.primary : 'var(--color-text-dim)', cursor:'pointer', textTransform:'uppercase', fontFamily:'var(--font-mono)', fontSize:'11px', transition:'color 0.2s' }}
                        >
                          [{m === 'signin' ? 'Sign In' : 'Register'}]
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                {config.cloudEnabled && (
                  <motion.div variants={itemV} style={{ position: 'relative', overflow: 'hidden', width: '100%', marginTop: '2px' }}>
                    {!loading && (
                      <motion.div 
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          bottom: 0, 
                          width: '30%', 
                          background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent)`, 
                          transform: 'skewX(-20deg)',
                          zIndex: 2,
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                    <motion.button type="submit" disabled={loading}
                      onMouseEnter={() => setSubmitHovered(true)}
                      onMouseLeave={() => setSubmitHovered(false)}
                      whileHover={!loading ? { scale:1.02, boxShadow:`0 0 26px ${theme.primary}60` } : {}}
                      whileTap={!loading ? { scale:0.975 } : {}}
                      style={{ width:'100%', background:loading ? 'var(--border-color)' : theme.primary, color:loading ? 'var(--color-text-dim)' : '#090c0d', border:'none', padding:'14px 24px', fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'13px', cursor:loading ? 'not-allowed' : 'pointer', textTransform:'uppercase', letterSpacing:'0.04em', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', transition:'background 0.2s', position: 'relative', zIndex: 1 }}
                    >
                      {loading ? (
                        <><motion.div animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:'linear' }}><Activity size={14}/></motion.div>PROCESSING...</>
                      ) : mode === 'signin' ? (
                        <>
                          ACCESS // SIGN IN{" "}
                          <motion.span
                            animate={submitHovered ? { x: [0, 5, 0] } : { x: 0 }}
                            transition={submitHovered ? { repeat: Infinity, duration: 0.8, ease: 'easeInOut' } : {}}
                            style={{ display: 'inline-flex' }}
                          >
                            <ArrowRight size={14}/>
                          </motion.span>
                        </>
                      ) : (
                        <>
                          CREATE // REGISTER{" "}
                          <motion.span
                            animate={submitHovered ? { x: [0, 5, 0] } : { x: 0 }}
                            transition={submitHovered ? { repeat: Infinity, duration: 0.8, ease: 'easeInOut' } : {}}
                            style={{ display: 'inline-flex' }}
                          >
                            <ArrowRight size={14}/>
                          </motion.span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </motion.form>

              {/* Forgot Passkey link */}
              {config.cloudEnabled && (
                <motion.div variants={itemV} style={{ textAlign:'center', marginTop:'10px' }}>
                  <motion.button type="button" whileHover={{ color: theme.primary }} onClick={() => { setShowForgot(true); sfx.click(); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-dim)', fontFamily:'var(--font-mono)', fontSize:'10px', textTransform:'uppercase', textDecoration:'underline', textUnderlineOffset:'3px', transition:'color 0.2s' }}
                  >
                    FORGOT PASSKEY?
                  </motion.button>
                </motion.div>
              )}



              {/* Footer */}
              <motion.div variants={itemV} style={{ marginTop:'20px', paddingTop:'14px', borderTop:`1px solid ${theme.border}`, fontSize:'10px', color:'var(--color-text-dim)', textAlign:'center', lineHeight:'1.7' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'2px' }}>
                  <Zap size={9} style={{ color:theme.primary }}/>
                   <span>SEO AASHAN ENGINE // TIER 4 SEO INTEGRATION</span>
                  <Zap size={9} style={{ color:theme.primary }}/>
                </div>
                <div>DATABASE PERSISTENCE // MULTI-TENANT ISOLATION // v4.1.0</div>
              </motion.div>

            </motion.div>
          </div>
        </motion.div>
        {/* /Parallax+shake */}
        </motion.div>
        {/* /Entrance */}
      </div>
    </div>
  );
}
