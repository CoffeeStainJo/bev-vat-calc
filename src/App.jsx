import { useState, useEffect, useRef } from "react";

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatNOK = (val) => {
  if (isNaN(val) || val === null) return "—";
  return new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

const parseNOK = (str) => {
  if (!str) return NaN;
  const cleaned = str.replace(/\s/g, "").replace(/kr/gi, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
};

const getDealTier = (pct) => {
  if (pct <= 0) return { label: "No Deal", emoji: "💸", color: "#ef4444", score: 0, desc: "The price has not dropped." };
  if (pct < 5) return { label: "Marginal", emoji: "🤏", color: "#f97316", score: 15, desc: "Barely worth noting. Keep watching." };
  if (pct < 15) return { label: "Decent", emoji: "👍", color: "#eab308", score: 35, desc: "A modest saving. Reasonable offer." };
  if (pct < 25) return { label: "Good Deal", emoji: "✨", color: "#84cc16", score: 55, desc: "A solid discount. Good value." };
  if (pct < 40) return { label: "Great Deal", emoji: "🔥", color: "#22c55e", score: 72, desc: "Impressive savings. Hard to ignore." };
  if (pct < 60) return { label: "Excellent!", emoji: "⚡", color: "#10b981", score: 88, desc: "Outstanding value. Act quickly." };
  return { label: "Legendary", emoji: "💎", color: "#6366f1", score: 100, desc: "Once-in-a-lifetime pricing. Don't hesitate." };
};

// ─── Animated Number ────────────────────────────────────────────────────────
function useAnimatedNumber(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (isNaN(target)) { setDisplay(0); return; }
    fromRef.current = display;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const prog = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 4);
      setDisplay(fromRef.current + (target - fromRef.current) * ease);
      if (prog < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return display;
}

// ─── Circular Gauge ─────────────────────────────────────────────────────────
function CircularGauge({ score, color, size = 190 }) {
  const R = (size / 2) - 18;
  const startAngle = -220;
  const totalAngle = 260;
  const cx = size / 2, cy = size / 2;

  const polarToXY = (deg, r) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arcPath = (from, to, r) => {
    const s = polarToXY(from, r), e = polarToXY(to, r);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };

  const animScore = useAnimatedNumber(score, 900);
  const filledAngle = (animScore / 100) * totalAngle;

  return (
    <svg width={size} height={size} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={arcPath(startAngle, startAngle + totalAngle, R)} fill="none" stroke="#1e293b" strokeWidth="13" strokeLinecap="round" />
      {score > 0 && (
        <path
          d={arcPath(startAngle, startAngle + filledAngle, R)}
          fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
          filter="url(#glow2)" style={{ transition: "stroke 0.5s ease" }}
        />
      )}
      {[0, 25, 50, 75, 100].map((t) => {
        const a = startAngle + (t / 100) * totalAngle;
        const o = polarToXY(a, R + 20), i = polarToXY(a, R + 12);
        return <line key={t} x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke="#334155" strokeWidth="2" strokeLinecap="round" />;
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="34" fontWeight="700" fontFamily="'Syne', sans-serif" fill={color} style={{ transition: "fill 0.5s ease" }}>
        {Math.round(animScore)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="#64748b" letterSpacing="3">
        DEAL SCORE
      </text>
    </svg>
  );
}

// ─── Savings Meter ──────────────────────────────────────────────────────────
function SavingsMeter({ savings, original }) {
  const valid = !isNaN(savings) && !isNaN(original) && original > 0 && savings >= 0;
  const pct = valid ? Math.min((savings / original) * 100, 100) : 0;
  const animPct = useAnimatedNumber(pct, 1000);
  const animSavings = useAnimatedNumber(valid ? savings : 0, 900);
  const segments = [
    { from: 0, to: 25, color: "#eab308" },
    { from: 25, to: 50, color: "#84cc16" },
    { from: 50, to: 75, color: "#22c55e" },
    { from: 75, to: 100, color: "#6366f1" },
  ];
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono-label">SAVINGS METER</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
          {valid ? `${formatNOK(animSavings)} kr` : "—"}
        </span>
      </div>
      <div style={{ display: "flex", height: 10, gap: 3, borderRadius: 99, overflow: "hidden" }}>
        {segments.map((seg, i) => {
          const fill = Math.max(0, Math.min(100, ((animPct - seg.from) / (seg.to - seg.from)) * 100));
          return (
            <div key={i} style={{ flex: 1, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${fill}%`, background: seg.color, boxShadow: fill > 50 ? `0 0 8px ${seg.color}88` : "none", transition: "width 0.1s" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        {["0%", "25%", "50%", "75%", "100%"].map(t => (
          <span key={t} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#334155" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Price Bar ──────────────────────────────────────────────────────────────
function PriceBar({ original, current }) {
  const valid = !isNaN(original) && !isNaN(current) && original > 0 && current > 0;
  const pct = valid ? Math.min((current / original) * 100, 100) : 100;
  const animPct = useAnimatedNumber(pct, 900);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono-label">ORIGINAL</span>
        <span className="mono-label">CURRENT</span>
      </div>
      <div style={{ position: "relative", height: 10, background: "#0f172a", borderRadius: 99, overflow: "hidden", border: "1px solid #1e293b" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #f59e0b22, #f59e0b44)", borderRadius: 99 }} />
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${animPct}%`, background: "linear-gradient(90deg, #10b981, #22c55e)", borderRadius: 99, boxShadow: "0 0 12px #22c55e88", transition: "width 0.1s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#f59e0b" }}>{valid ? `${formatNOK(original)} kr` : "—"}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#22c55e" }}>{valid ? `${formatNOK(current)} kr` : "—"}</span>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, delay = 0 }) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms`, borderColor: `${accent}33` }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${accent}18, transparent 70%)` }} />
      <div className="mono-label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(17px, 3vw, 22px)", fontWeight: 700, color: accent, lineHeight: 1.15, wordBreak: "break-word" }}>{value}</div>
      {sub && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#64748b", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ─── NOK Input ──────────────────────────────────────────────────────────────
function NOKInput({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
      <label className="mono-label">{label}</label>
      <div style={{ display: "flex", alignItems: "center", background: "#0f172a", border: `1px solid ${focused ? "#f59e0b" : "#1e293b"}`, borderRadius: 12, padding: "13px 15px", gap: 10, transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: focused ? "0 0 0 3px #f59e0b22" : "none" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: "#475569", flexShrink: 0 }}>kr</span>
        <input
          type="text" inputMode="decimal" value={value} placeholder={placeholder || "0,00"}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, color: "#f1f5f9", width: "100%", minWidth: 0 }}
        />
      </div>
    </div>
  );
}

// ─── Verdict Banner ─────────────────────────────────────────────────────────
function VerdictBanner({ tier, pct }) {
  if (!tier || pct <= 0) return null;
  return (
    <div className="verdict-banner" style={{
      background: `linear-gradient(135deg, ${tier.color}18, ${tier.color}08)`,
      border: `1px solid ${tier.color}44`,
      boxShadow: `0 0 30px ${tier.color}18`,
    }}>
      {/* Left: emoji + label + desc */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 26, flexShrink: 0 }}>{tier.emoji}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(15px, 4vw, 20px)", fontWeight: 800, color: tier.color }}>{tier.label}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "clamp(9px, 2.5vw, 11px)", color: "#64748b", marginTop: 2 }}>{tier.desc}</div>
        </div>
      </div>
      {/* Right: big % */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 6vw, 38px)", fontWeight: 800, color: tier.color, lineHeight: 1 }}>
          {formatNOK(pct)}%
        </div>
        <div className="mono-label" style={{ marginTop: 3 }}>OFF ORIGINAL</div>
      </div>
    </div>
  );
}

// ─── Deep Analytics ──────────────────────────────────────────────────────────
function DeepAnalytics({ original, current }) {
  const valid = !isNaN(original) && !isNaN(current) && original > 0 && current > 0 && current < original;
  const savings = valid ? original - current : 0;
  const pctOff = valid ? ((savings / original) * 100) : 0;
  const breakEven = valid ? (original / savings).toFixed(1) : null;
  const markup = valid ? (((original - current) / current) * 100) : 0;
  const valueScore = valid ? Math.min(10, (pctOff / 10)).toFixed(1) : "—";

  const items = [
    { label: "MARKUP TO ORIGINAL", value: valid ? `+${formatNOK(markup)}%` : "—", sub: "from current price", color: "#f97316" },
    { label: "VALUE SCORE", value: valid ? `${valueScore} / 10` : "—", sub: "deal quality index", color: "#6366f1" },
    { label: "BREAK-EVEN UNITS", value: valid ? `${breakEven}×` : "—", sub: "to offset 1× full", color: "#22c55e" },
    { label: "ABSOLUTE SAVING", value: valid ? `${formatNOK(savings)} kr` : "—", sub: "per unit purchased", color: "#f59e0b" },
  ];

  return (
    <div className="deep-grid">
      {items.map((item, i) => (
        <div key={i} style={{ padding: "4px 0" }}>
          <div className="mono-label" style={{ marginBottom: 6 }}>{item.label}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(15px, 3.5vw, 20px)", fontWeight: 700, color: item.color, wordBreak: "break-word" }}>{item.value}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#334155", marginTop: 3 }}>{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Scale Table ─────────────────────────────────────────────────────────────
function ScaleTable({ original, current, savings, pctOff, tier }) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
        <thead>
          <tr>
            {["Units", "Full Total", "Sale Total", "Saved", "%"].map(h => (
              <th key={h} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#475569", letterSpacing: 2, textAlign: "left", paddingBottom: 10, borderBottom: "1px solid #1e293b", paddingRight: 14 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 5, 10, 20].map(n => (
            <tr key={n} style={{ borderBottom: "1px solid #0f172a" }}>
              <td style={{ padding: "10px 14px 10px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#64748b" }}>{n}×</td>
              <td style={{ padding: "10px 14px 10px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#94a3b8" }}>{formatNOK(original * n)} kr</td>
              <td style={{ padding: "10px 14px 10px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#22c55e" }}>{formatNOK(current * n)} kr</td>
              <td style={{ padding: "10px 14px 10px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{formatNOK(savings * n)} kr</td>
              <td style={{ padding: "10px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 44, height: 4, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pctOff, 100)}%`, background: tier.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#475569" }}>{formatNOK(pctOff)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section Shell ───────────────────────────────────────────────────────────
function Section({ title, children, delay = 0 }) {
  return (
    <div className="section-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="mono-label" style={{ marginBottom: 18, letterSpacing: 3 }}>◈ {title}</div>
      {children}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function DealAnalyzer() {
  const [originalInput, setOriginalInput] = useState("");
  const [currentInput, setCurrentInput] = useState("");

  const original = parseNOK(originalInput);
  const current = parseNOK(currentInput);
  const valid = !isNaN(original) && !isNaN(current) && original > 0 && current > 0;
  const savings = valid ? original - current : 0;
  const pctOff = valid ? (savings / original) * 100 : 0;
  const tier = getDealTier(pctOff);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #020817;
          color: #f1f5f9;
          min-height: 100vh;
          font-family: 'Syne', sans-serif;
        }

        input::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 99px; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanline {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100vh); }
        }

        .mono-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #475569;
          letter-spacing: 2px;
          text-transform: uppercase;
          display: block;
        }

        /* ── Section card ── */
        .section-card {
          background: linear-gradient(135deg, #0a0f1e, #0f172a);
          border: 1px solid #1e293b;
          border-radius: 20px;
          padding: 22px 20px;
          animation: fadeSlideUp 0.55s ease both;
        }

        /* ── Stat card ── */
        .stat-card {
          background: linear-gradient(135deg, #0f172a 60%, #1e293b);
          border: 1px solid #1e2940;
          border-radius: 16px;
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
          animation: fadeSlideUp 0.6s ease both;
        }

        /* ── Verdict banner ── */
        .verdict-banner {
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          animation: fadeSlideUp 0.5s ease 0.1s both;
        }

        /* ── Gauge + stats side by side (desktop) ── */
        .gauge-stats {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 20px;
          align-items: start;
        }

        .gauge-box {
          background: linear-gradient(135deg, #0a0f1e, #0f172a);
          border: 1px solid #1e293b;
          border-radius: 20px;
          padding: 22px 18px 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: fadeSlideUp 0.5s ease 0.2s both;
        }

        /* 2-col stats grid stays 2 cols on all sizes */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          align-content: start;
        }

        /* ── Deep analytics 2-col ── */
        .deep-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 16px;
        }

        /* ── Input row ── */
        .input-row {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .arrow-divider {
          font-size: 20px;
          color: #334155;
          padding-bottom: 15px;
          flex-shrink: 0;
        }

        /* ═══════════════════════════════════
           MOBILE  ≤ 640px
        ═══════════════════════════════════ */
        @media (max-width: 640px) {

          /* Stack gauge above stats */
          .gauge-stats {
            grid-template-columns: 1fr;
          }

          /* Centre the gauge panel */
          .gauge-box {
            padding: 20px 16px 16px;
          }

          /* Keep stats 2-col on phone */
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          /* Stack price inputs vertically */
          .input-row {
            flex-direction: column;
          }
          .arrow-divider {
            display: none;
          }

          /* Verdict banner: allow text to wrap on very small screens */
          .verdict-banner {
            padding: 14px 16px;
            flex-wrap: wrap;
          }

          .section-card {
            padding: 18px 16px;
            border-radius: 16px;
          }
        }

        /* ═══════════════════════════════════
           TINY  ≤ 390px  (iPhone SE etc.)
        ═══════════════════════════════════ */
        @media (max-width: 390px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .deep-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Root */}
      <div style={{
        minHeight: "100vh",
        background: "#020817",
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -20%, #f59e0b0a 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 10% 80%, #6366f108 0%, transparent 60%),
          repeating-linear-gradient(0deg, transparent, transparent 39px, #ffffff03 39px, #ffffff03 40px),
          repeating-linear-gradient(90deg, transparent, transparent 39px, #ffffff03 39px, #ffffff03 40px)
        `,
        paddingBottom: 60,
        overflowX: "hidden",
      }}>

        {/* Scanline */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #f59e0b08, transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        {/* ── Header ── */}
        <div style={{ borderBottom: "1px solid #0f172a", background: "linear-gradient(180deg, #020817, #0a0f1e)", padding: "18px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeSlideUp 0.4s ease both", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 18px #f59e0b44", flexShrink: 0 }}>⚖️</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>
                DEAL<span style={{ color: "#f59e0b" }}>METER</span>
              </div>
              <div className="mono-label">NOK PRICE ANALYZER</div>
            </div>
          </div>
          <div className="mono-label" style={{ fontSize: 10 }}>
            {new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Inputs */}
          <Section title="Enter Prices" delay={100}>
            <div className="input-row">
              <NOKInput label="Original Price" value={originalInput} onChange={setOriginalInput} placeholder="2.999,00" />
              <div className="arrow-divider">→</div>
              <NOKInput label="Current / Sale Price" value={currentInput} onChange={setCurrentInput} placeholder="1.499,00" />
            </div>
          </Section>

          {/* Verdict */}
          {valid && pctOff > 0 && <VerdictBanner tier={tier} pct={pctOff} />}
          {valid && pctOff <= 0 && (
            <div style={{ background: "#ef444410", border: "1px solid #ef444430", borderRadius: 14, padding: "14px 18px", fontFamily: "'Syne', sans-serif", fontSize: 14, color: "#ef4444", animation: "fadeSlideUp 0.4s ease both" }}>
              ⚠️ The sale price is not lower than the original price.
            </div>
          )}

          {/* Gauge + Stats */}
          <div className="gauge-stats">
            <div className="gauge-box">
              <CircularGauge score={valid ? tier.score : 0} color={valid ? tier.color : "#1e293b"} size={190} />
              <SavingsMeter savings={savings} original={original} />
            </div>
            <div className="stats-grid">
              <StatCard label="You Save" value={valid && savings >= 0 ? `${formatNOK(savings)} kr` : "—"} sub={valid ? "per unit" : "enter prices above"} accent="#22c55e" delay={220} />
              <StatCard label="Percentage Off" value={valid && pctOff > 0 ? `${formatNOK(pctOff)}%` : "—"} sub={valid ? `of ${formatNOK(original)} kr` : ""} accent="#f59e0b" delay={270} />
              <StatCard label="Sale Price" value={valid ? `${formatNOK(current)} kr` : "—"} sub={valid ? "current offer" : ""} accent="#38bdf8" delay={320} />
              <StatCard label="You Pay" value={valid ? `${formatNOK((current / original) * 100)}%` : "—"} sub={valid ? "of original price" : ""} accent="#a78bfa" delay={370} />
            </div>
          </div>

          {/* Price comparison */}
          <Section title="Price Comparison" delay={300}>
            <PriceBar original={valid ? original : NaN} current={valid ? current : NaN} />
          </Section>

          {/* Deep analytics */}
          <Section title="Deep Analytics" delay={360}>
            <DeepAnalytics original={valid ? original : NaN} current={valid ? current : NaN} />
          </Section>

          {/* Scale table */}
          {valid && savings > 0 && (
            <Section title="Savings at Scale" delay={420}>
              <ScaleTable original={original} current={current} savings={savings} pctOff={pctOff} tier={tier} />
            </Section>
          )}

          {/* Empty state */}
          {!valid && (
            <div style={{ textAlign: "center", padding: "36px 24px", animation: "fadeSlideUp 0.6s ease 0.5s both" }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🏷️</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Enter prices to analyze the deal</div>
              <div className="mono-label" style={{ letterSpacing: 2, fontSize: 10 }}>Use comma as decimal — e.g. 1.299,90</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}