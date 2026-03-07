import { useState, useEffect, useRef } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);

const fmtShort = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
    : `${(n / 1000).toFixed(0)}k`;

function calc(p25) {
  const R = 0.25;
  const inc26 = Math.max(0, Math.min(p25, 500_000) - 300_000) * R;
  const p26 = p25 + inc26;
  const inc27 = Math.max(0, Math.min(p25, 300_000) - 150_000) * R;
  const p27 = p26 + inc27;
  const inc28 = Math.max(0, Math.min(p25, 150_000)) * R;
  const p28 = p27 + inc28;
  const totalInc = inc26 + inc27 + inc28;
  return { p25, p26, p27, p28, inc26, inc27, inc28, totalInc };
}

// ── Aurora canvas background ──────────────────────────────────────────────────
function Aurora() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let t = 0;
    let raf;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width, h = canvas.height;

      // waves
      const waves = [
        { color: "rgba(0,180,160,0.13)", yBase: 0.35, amp: 0.08, freq: 1.1, speed: 0.4 },
        { color: "rgba(80,60,220,0.10)", yBase: 0.45, amp: 0.06, freq: 0.8, speed: 0.3 },
        { color: "rgba(0,220,140,0.09)", yBase: 0.25, amp: 0.07, freq: 1.3, speed: 0.5 },
        { color: "rgba(120,40,255,0.08)", yBase: 0.55, amp: 0.09, freq: 0.9, speed: 0.35 },
      ];
      waves.forEach(({ color, yBase, amp, freq, speed }) => {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.3, color);
        grad.addColorStop(0.7, color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 4) {
          const y = h * yBase + Math.sin(x / w * Math.PI * 2 * freq + t * speed) * h * amp
            + Math.sin(x / w * Math.PI * 3 * freq + t * speed * 1.3) * h * amp * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
      });

      t += 0.015;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// ── animated number ───────────────────────────────────────────────────────────
function AnimNum({ value, prefix = "", suffix = "" }) {
  const [disp, setDisp] = useState(value);
  const ref = useRef(value);
  useEffect(() => {
    const from = ref.current;
    const to = value;
    ref.current = to;
    let start;
    const duration = 500;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(from + (to - from) * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{prefix}{new Intl.NumberFormat("nb-NO").format(disp)}{suffix}</>;
}

// ── stacked bar ───────────────────────────────────────────────────────────────
function StackedBar({ data, max }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(({ year, base, inc26, inc27, inc28, color }) => {
        const total = base + inc26 + inc27 + inc28;
        const pct = (v) => `${(v / max * 100).toFixed(2)}%`;
        return (
          <div key={year} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, fontFamily: "'Bebas Neue', cursive", fontSize: 15, color: "#8aadcc", textAlign: "right", flexShrink: 0 }}>{year}</div>
            <div style={{ flex: 1, height: 34, borderRadius: 8, overflow: "hidden", display: "flex", background: "rgba(255,255,255,0.04)", position: "relative" }}>
              {/* base (always NOK-free exempt + already-taxed portion) */}
              <div style={{ width: pct(base), background: "linear-gradient(90deg,#1a4a6e,#1e5a80)", transition: "width 0.5s cubic-bezier(.4,0,.2,1)", height: "100%" }} />
              {inc26 > 0 && <div style={{ width: pct(inc26), background: "linear-gradient(90deg,#00c9a7,#00e5b4)", transition: "width 0.5s cubic-bezier(.4,0,.2,1) 0.05s", height: "100%" }} />}
              {inc27 > 0 && <div style={{ width: pct(inc27), background: "linear-gradient(90deg,#f7a600,#ffcc00)", transition: "width 0.5s cubic-bezier(.4,0,.2,1) 0.1s", height: "100%" }} />}
              {inc28 > 0 && <div style={{ width: pct(inc28), background: "linear-gradient(90deg,#ff5e78,#ff8a65)", transition: "width 0.5s cubic-bezier(.4,0,.2,1) 0.15s", height: "100%" }} />}
            </div>
            <div style={{ width: 74, fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: "#e0f0ff", textAlign: "right", flexShrink: 0, letterSpacing: 0.5 }}>
              {fmtShort(total)} kr
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── year card ─────────────────────────────────────────────────────────────────
function YearCard({ year, price, increase, threshold, isBase, active, onClick }) {
  const glowColor = isBase ? "#2979ff"
    : increase === 0 ? "#00e5b4"
      : increase < 30000 ? "#00e5b4"
        : increase < 75000 ? "#f7a600"
          : "#ff5e78";

  return (
    <button onClick={onClick} style={{
      background: active ? `rgba(255,255,255,0.09)` : "rgba(255,255,255,0.04)",
      border: `1.5px solid ${active ? glowColor : "rgba(255,255,255,0.08)"}`,
      borderRadius: 16,
      padding: "14px 12px",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.3s ease",
      boxShadow: active ? `0 0 24px ${glowColor}40` : "none",
      flex: "1 1 0",
      minWidth: 0,
    }}>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: glowColor, letterSpacing: 1, lineHeight: 1 }}>{year}</div>
      <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 11, color: "rgba(180,210,240,0.6)", marginTop: 2, marginBottom: 6 }}>
        {isBase ? "Nåværende pris" : `Grense: ${fmtShort(threshold)} kr`}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "#e8f4ff", letterSpacing: 0.5 }}>
        {fmtShort(price)} kr
      </div>
      {!isBase && (
        <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 11, color: increase > 0 ? glowColor : "rgba(180,210,240,0.5)", marginTop: 3, fontWeight: 600 }}>
          {increase > 0 ? `+${fmtShort(increase)} kr` : "Ingen økning"}
        </div>
      )}
    </button>
  );
}

// ── legend dot ────────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 11, color: "rgba(180,210,240,0.65)" }}>{label}</span>
    </div>
  );
}

// ── breakdown detail ──────────────────────────────────────────────────────────
function BreakdownRow({ label, amount, color, show }) {
  if (!show) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, color: "rgba(180,210,240,0.75)" }}>{label}</span>
      </div>
      <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 15, color: amount > 0 ? color : "rgba(180,210,240,0.35)", letterSpacing: 0.5 }}>
        {amount > 0 ? `+${fmt(amount)}` : "—"}
      </span>
    </div>
  );
}

// ── main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [price, setPrice] = useState(500_000);
  const [activeYear, setActiveYear] = useState("2026");
  const [isDragging, setIsDragging] = useState(false);

  const { p25, p26, p27, p28, inc26, inc27, inc28, totalInc } = calc(price);

  const years = [
    { year: "2025", price: p25, increase: 0, threshold: 500_000, isBase: true },
    { year: "2026", price: p26, increase: inc26, threshold: 300_000, isBase: false },
    { year: "2027", price: p27, increase: inc27, threshold: 150_000, isBase: false },
    { year: "2028", price: p28, increase: inc28, threshold: 0, isBase: false },
  ];

  const maxBar = Math.max(p28, 200_000) * 1.05;
  const barData = [
    { year: "2025", base: p25, inc26: 0, inc27: 0, inc28: 0 },
    { year: "2026", base: p25, inc26, inc27: 0, inc28: 0 },
    { year: "2027", base: p25, inc26, inc27, inc28: 0 },
    { year: "2028", base: p25, inc26, inc27, inc28 },
  ];

  const activeData = years.find(y => y.year === activeYear);

  // Slider marks
  const marks = [200_000, 500_000, 1_000_000, 1_500_000, 2_000_000];

  const sliderBg = (() => {
    const pct = ((price - 200_000) / (2_000_000 - 200_000)) * 100;
    return `linear-gradient(90deg, #00c9a7 0%, #2979ff ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
  })();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, notify user
                if (confirm('New version available! Would you like to update?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch(error => console.log('Service worker registration failed:', error));
    }
  }, []);

  return (
    <>
      {/* google fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080d1a; overflow-x: hidden; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle, #00e5b4, #00a87e); border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 0 14px #00e5b460; cursor: grab; transition: transform 0.15s; }
        input[type=range]::-webkit-slider-thumb:active { transform: scale(1.25); cursor: grabbing; }
        input[type=range]::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle, #00e5b4, #00a87e); border: 2px solid rgba(255,255,255,0.3); cursor: grab; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        .fade-up { animation: fadeUp 0.5s ease both; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1a3a5c; border-radius: 2px; }
      `}</style>

      <Aurora />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", maxWidth: 520, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* ── header ── */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,229,180,0.1)", border: "1px solid rgba(0,229,180,0.25)", borderRadius: 20, padding: "4px 14px", marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>🇳🇴</span>
            <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, color: "#00e5b4", letterSpacing: 1, textTransform: "uppercase" }}>Elbil MVA-kalkulator</span>
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(32px,8vw,48px)", letterSpacing: 2, color: "#e8f4ff", lineHeight: 1, marginBottom: 6 }}>
            MVA PÅ ELBILER
          </h1>
          <p style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, color: "rgba(160,200,235,0.65)", lineHeight: 1.5 }}>
            Beregn prisøkning fra 2026 til 2028 basert på Stortingets vedtak
          </p>
        </div>

        {/* ── slider card ── */}
        <div className="fade-up" style={{ animationDelay: "0.08s", background: "rgba(10,20,45,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "20px 18px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
            <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(160,200,235,0.55)", textTransform: "uppercase", letterSpacing: 1 }}>Pris i 2025</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, color: "#00e5b4", letterSpacing: 1 }}>
                <AnimNum value={price} />
              </span>
              <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, color: "rgba(160,200,235,0.55)", marginLeft: 4 }}>kr</span>
            </div>
          </div>

          <input
            type="range"
            min={200_000}
            max={2_000_000}
            step={5_000}
            value={price}
            style={{ background: sliderBg }}
            onChange={(e) => setPrice(+e.target.value)}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
          />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {marks.map(m => (
              <button key={m} onClick={() => setPrice(m)} style={{ fontFamily: "'Figtree', sans-serif", fontSize: 10, color: price === m ? "#00e5b4" : "rgba(160,200,235,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.2s" }}>
                {fmtShort(m)}
              </button>
            ))}
          </div>
        </div>

        {/* ── year cards ── */}
        <div className="fade-up" style={{ animationDelay: "0.12s", display: "flex", gap: 8, marginBottom: 14 }}>
          {years.map(y => (
            <YearCard key={y.year} {...y} active={activeYear === y.year} onClick={() => setActiveYear(y.year)} />
          ))}
        </div>

        {/* ── selected year detail ── */}
        <div className="fade-up" key={activeYear} style={{ animationDelay: "0.0s", background: "rgba(10,20,45,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "18px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: "#e8f4ff", letterSpacing: 1 }}>📋 PRISOVERSIKT {activeYear}</span>
            {activeData && !activeData.isBase && activeData.increase > 0 && (
              <div style={{ background: "rgba(255,94,120,0.15)", border: "1px solid rgba(255,94,120,0.3)", borderRadius: 8, padding: "3px 10px" }}>
                <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: "#ff5e78", letterSpacing: 0.5 }}>
                  +{fmt(activeData.increase)}
                </span>
              </div>
            )}
            {activeData && activeData.isBase && (
              <div style={{ background: "rgba(41,121,255,0.15)", border: "1px solid rgba(41,121,255,0.3)", borderRadius: 8, padding: "3px 10px" }}>
                <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 11, color: "#5b9fff", fontWeight: 600 }}>Utgangspris</span>
              </div>
            )}
          </div>

          {/* big price */}
          <div style={{ textAlign: "center", padding: "12px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 11, color: "rgba(160,200,235,0.5)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Ny pris</div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(38px,10vw,54px)", letterSpacing: 2, background: "linear-gradient(135deg, #e8f4ff, #00e5b4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <AnimNum value={activeData?.price || p25} />
              <span style={{ fontSize: "0.45em", letterSpacing: 1, marginLeft: 6 }}>NOK</span>
            </div>
          </div>

          {/* breakdown rows */}
          <div style={{ marginTop: 12 }}>
            <BreakdownRow label="Grunnpris (2025)" amount={p25} color="#5b9fff" show={true} />
            <BreakdownRow label="MVA-økning 2026 (300k–500k grense)" amount={inc26} color="#00e5b4" show={activeYear !== "2025"} />
            <BreakdownRow label="MVA-økning 2027 (150k–300k grense)" amount={inc27} color="#f7a600" show={activeYear === "2027" || activeYear === "2028"} />
            <BreakdownRow label="MVA-økning 2028 (full MVA)" amount={inc28} color="#ff5e78" show={activeYear === "2028"} />
          </div>

          {/* total increase */}
          {activeYear !== "2025" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "10px 0 0" }}>
              <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Totalt økning fra 2025</span>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: activeData?.increase + (activeYear === "2027" ? inc26 : activeYear === "2028" ? totalInc - activeData?.increase || 0 : 0) > 0 ? "#ff5e78" : "#00e5b4", letterSpacing: 0.5 }}>
                {(() => {
                  const tot = activeYear === "2026" ? inc26 : activeYear === "2027" ? inc26 + inc27 : totalInc;
                  return tot > 0 ? `+${fmt(tot)}` : "Ingen økning";
                })()}
              </span>
            </div>
          )}
        </div>

        {/* ── stacked bar chart ── */}
        <div className="fade-up" style={{ animationDelay: "0.16s", background: "rgba(10,20,45,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "18px", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, color: "rgba(160,200,235,0.7)", letterSpacing: 1, marginBottom: 14 }}>📊 PRISUTVIKLING PER ÅR</div>
          <StackedBar data={barData} max={maxBar} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 }}>
            <LegendDot color="#1e5a80" label="Grunnpris" />
            <LegendDot color="#00e5b4" label="+MVA 2026" />
            <LegendDot color="#f7a600" label="+MVA 2027" />
            <LegendDot color="#ff5e78" label="+MVA 2028" />
          </div>
        </div>

        {/* ── total increase summary ── */}
        <div className="fade-up" style={{ animationDelay: "0.2s", background: "rgba(10,20,45,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "18px", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, color: "rgba(160,200,235,0.7)", letterSpacing: 1, marginBottom: 14 }}>⚡ SAMLET PRISØKNING 2025 → 2028</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Prisøkning 2026", val: inc26, color: "#00e5b4" },
              { label: "Prisøkning 2027", val: inc27, color: "#f7a600" },
              { label: "Prisøkning 2028", val: inc28, color: "#ff5e78" },
              { label: "Total økning", val: totalInc, color: "#e8f4ff", big: true },
            ].map(({ label, val, color, big }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${val > 0 ? color + "33" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 11, color: "rgba(160,200,235,0.5)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: big ? 22 : 18, color: val > 0 ? color : "rgba(160,200,235,0.25)", letterSpacing: 0.5 }}>
                  {val > 0 ? <><AnimNum value={val} prefix="+" suffix=" kr" /></> : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── info box ── */}
        <div className="fade-up" style={{ animationDelay: "0.24s", background: "rgba(0,180,160,0.06)", border: "1px solid rgba(0,180,160,0.2)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 12, color: "rgba(160,200,235,0.6)", lineHeight: 1.6 }}>
            <strong style={{ color: "#00e5b4", display: "block", marginBottom: 4 }}>ℹ️ Regelendringer</strong>
            <strong style={{ color: "rgba(160,200,235,0.8)" }}>2025:</strong> Fri for MVA under 500 000 kr · MVA 25% over 500 000 kr<br />
            <strong style={{ color: "rgba(160,200,235,0.8)" }}>2026:</strong> Grense senket til 300 000 kr<br />
            <strong style={{ color: "rgba(160,200,235,0.8)" }}>2027:</strong> Grense senket til 150 000 kr<br />
            <strong style={{ color: "rgba(160,200,235,0.8)" }}>2028:</strong> Full MVA (25%) på hele kjøpsprisen
          </div>
        </div>

      </div>
    </>
  );
}