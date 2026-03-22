import { useState, useEffect, useRef, useCallback } from "react";

// ── Asset imports ────────────────────────────────────────────────────────────
import cowImg from "./assets/cow.png";
import pigImg from "./assets/pig.png";
import anotherPigImg from "./assets/anotherpig.png";
import chickenImg from "./assets/chicken.png";

const ANIMAL_SRCS = [cowImg, pigImg, anotherPigImg, chickenImg];

const MILESTONES = [
  {
    id: 1,
    label: "Nộp tài liệu",
    sublabel: "Final Document Submission",
    target: new Date("2026-04-21T18:00:00+07:00"),
    accent: "#e8d5b7",
  },
  {
    id: 2,
    label: "Ngày bảo vệ",
    sublabel: "Defense Day",
    target: new Date("2026-05-04T00:00:00+07:00"),
    accent: "#b7c8e8",
  },
];

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    const calc = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        done: false,
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return timeLeft;
}

// ── Animal physics hook ───────────────────────────────────────────────────────
const ANIMAL_COUNT = 7;
const SIZE_BASE = 80;

function initAnimals() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  return Array.from({ length: ANIMAL_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.35 + Math.random() * 0.45;
    const size = SIZE_BASE + Math.random() * 35;
    return {
      id: i,
      src: ANIMAL_SRCS[i % ANIMAL_SRCS.length],
      x: Math.random() * (W - size),
      y: Math.random() * (H - size),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: (Math.random() - 0.5) * 15,
      vr: (Math.random() - 0.5) * 0.06,
      size,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.025 + Math.random() * 0.015,
      fleeing: false,
      fleeTimer: 0,
    };
  });
}

function useAnimals() {
  const rafRef = useRef(null);
  const physRef = useRef(null);
  const [renderState, setRenderState] = useState([]);

  useEffect(() => {
    physRef.current = initAnimals();

    const tick = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;

      physRef.current = physRef.current.map((a) => {
        let { x, y, vx, vy, rotation, vr, size, wobble, wobbleSpeed, fleeing, fleeTimer } = a;

        x += vx;
        y += vy;
        rotation += vr;
        wobble += wobbleSpeed;

        if (x < 0) { x = 0; vx = Math.abs(vx) * (0.9 + Math.random() * 0.2); }
        if (x > W - size) { x = W - size; vx = -Math.abs(vx) * (0.9 + Math.random() * 0.2); }
        if (y < 0) { y = 0; vy = Math.abs(vy) * (0.9 + Math.random() * 0.2); }
        if (y > H - size) { y = H - size; vy = -Math.abs(vy) * (0.9 + Math.random() * 0.2); }

        if (fleeing) {
          fleeTimer--;
          if (fleeTimer <= 0) {
            fleeing = false;
            const spd = 0.35 + Math.random() * 0.45;
            const ang = Math.random() * Math.PI * 2;
            vx = Math.cos(ang) * spd;
            vy = Math.sin(ang) * spd;
          }
        }

        return { ...a, x, y, vx, vy, rotation, wobble, fleeing, fleeTimer };
      });

      // Snapshot for render — only position/transform fields
      setRenderState(
        physRef.current.map(({ id, src, x, y, vx, rotation, size, wobble, fleeing }) => ({
          id, src, x, y, vx, rotation, size,
          scaleX: fleeing ? 1 + Math.sin(wobble * 8) * 0.15 : 1 + Math.sin(wobble) * 0.03,
          scaleY: fleeing ? 1 - Math.sin(wobble * 8) * 0.10 : 1 - Math.sin(wobble) * 0.015,
          fleeing,
        }))
      );

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const flee = useCallback((id) => {
    if (!physRef.current) return;
    physRef.current = physRef.current.map((a) => {
      if (a.id !== id) return a;
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 4;
      return { ...a, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, fleeing: true, fleeTimer: 50, wobble: 0 };
    });
  }, []);

  return { animals: renderState, flee };
}

// ── UI Components ─────────────────────────────────────────────────────────────
function Unit({ value, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "3.5rem" }}>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "clamp(2rem, 6vw, 3.5rem)",
        fontWeight: 500, lineHeight: 1,
        letterSpacing: "-0.02em", color: "#1a1a1a",
      }}>
        {String(value).padStart(2, "0")}
      </span>
      <span style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: "0.65rem", letterSpacing: "0.12em",
        textTransform: "uppercase", color: "#888", marginTop: "0.4rem",
      }}>
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
      color: "#ccc", lineHeight: 1, paddingBottom: "1.2rem", userSelect: "none",
    }}>:</span>
  );
}

function Card({ milestone }) {
  const t = useCountdown(milestone.target);
  const dateStr = milestone.target.toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    ...(milestone.id === 1 ? { hour: "numeric", minute: "numeric" } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return (
    <div style={{
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(232,232,232,0.9)",
      borderRadius: "1.25rem",
      padding: "2.5rem 2.25rem 2rem",
      flex: "1 1 340px", maxWidth: "480px",
      display: "flex", flexDirection: "column", gap: "1.5rem",
      position: "relative", zIndex: 10,
    }}>
      <div style={{
        position: "absolute", top: "1.5rem", right: "1.75rem",
        width: 10, height: 10, borderRadius: "50%",
        background: milestone.accent, border: "2px solid #1a1a1a",
      }} />
      <div>
        <div style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: "0.68rem", letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#999", marginBottom: "0.35rem",
        }}>
          Mốc {milestone.id} · GDP493
        </div>
        <div style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
          fontWeight: 400, color: "#1a1a1a", lineHeight: 1.15,
        }}>
          {milestone.label}
        </div>
        <div style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: "0.8rem", color: "#aaa", marginTop: "0.25rem",
        }}>
          {milestone.sublabel}
        </div>
      </div>

      {t ? (
        t.done ? (
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.6rem", color: "#1a1a1a" }}>
            Đã đến hạn ✓
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <Unit value={t.days} label="ngày" />
            <Separator />
            <Unit value={t.hours} label="giờ" />
            <Separator />
            <Unit value={t.minutes} label="phút" />
            <Separator />
            <Unit value={t.seconds} label="giây" />
          </div>
        )
      ) : <div style={{ height: "4rem" }} />}

      <div style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: "0.78rem", color: "#bbb",
        borderTop: "1px solid #f0f0f0", paddingTop: "1rem",
      }}>
        {dateStr}
      </div>
    </div>
  );
}

function Animal({ data, onFlee }) {
  const { x, y, rotation, size, scaleX, scaleY, src, vx } = data;
  const flipped = vx < 0;

  return (
    <img
      src={src}
      onClick={() => onFlee(data.id)}
      style={{
        position: "fixed",
        left: x, top: y,
        width: size, height: size,
        objectFit: "contain",
        transform: `rotate(${rotation}deg) scaleX(${flipped ? -scaleX : scaleX}) scaleY(${scaleY})`,
        cursor: "pointer",
        userSelect: "none",
        zIndex: 2,
        willChange: "transform, left, top",
        filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.07))",
        WebkitUserDrag: "none",
      }}
      draggable={false}
      alt=""
    />
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { animals, flee } = useAnimals();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Be+Vietnam+Pro:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        body { background: #f6f5f3; }
      `}</style>

      {/* Animals */}
      {animals.map((a) => (
        <Animal key={a.id} data={a} onFlee={flee} />
      ))}

      {/* UI — pointer-events: none on wrapper so animals remain clickable */}
      <div style={{
        position: "fixed", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "2rem 1rem", gap: "2.5rem",
        pointerEvents: "none",
      }}>
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          <div style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            color: "#1a1a1a", fontWeight: 400,
          }}>
            GDP493 · Capstone
          </div>
          <div style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: "0.8rem", color: "#aaa",
            letterSpacing: "0.05em", marginTop: "0.3rem",
          }}>
            Fall 2026 · Interaction Design · Supervisor La Hong Quan
          </div>
        </div>

        <div style={{
          display: "flex", flexWrap: "wrap", gap: "1.25rem",
          justifyContent: "center", width: "100%", maxWidth: "1020px",
          pointerEvents: "auto",
        }}>
          {MILESTONES.map((m) => <Card key={m.id} milestone={m} />)}
        </div>

        <div style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: "0.7rem", color: "#ccc", letterSpacing: "0.06em",
          pointerEvents: "none",
        }}>
          FPT University · HN
        </div>
      </div>
    </>
  );
}
