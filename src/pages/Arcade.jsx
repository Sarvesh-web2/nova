import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const W = 800;
const H = 500;
const SECTORS = ["I", "II", "III", "IV", "V", "OMEGA"];
const SECTOR_SCORES = [0, 150, 350, 600, 900, 1200];

function getSectorIdx(score) {
  let idx = 0;
  for (let i = SECTOR_SCORES.length - 1; i >= 0; i--) {
    if (score >= SECTOR_SCORES[i]) { idx = i; break; }
  }
  return idx;
}

function mkState() {
  return {
    player: { x: W / 2, y: H - 60, invTimer: 0, shieldTimer: 0, slowTimer: 0 },
    lives: 3,
    score: 0,
    speedMul: 1,
    asteroids: [],
    particles: [],
    powerups: [],
    thrusters: [],
    stars: Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      spd: Math.random() * 1.5 + 0.3,
      r: Math.random() < 0.3 ? 1.5 : 1,
    })),
    shakeTimer: 0,
    sectorIdx: 0,
    frameCount: 0,
  };
}

// ─── Audio engine (Web Audio API, no deps) ───────────────────────────────────
function createAudio() {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playTone({ type = "sine", freq = 440, endFreq, gain = 0.3, duration = 0.15, delay = 0 }) {
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gainNode = ac.createGain();
      osc.connect(gainNode);
      gainNode.connect(ac.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
      if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + delay + duration);
      gainNode.gain.setValueAtTime(gain, ac.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
      osc.start(ac.currentTime + delay);
      osc.stop(ac.currentTime + delay + duration);
    } catch (_) { }
  }

  function playNoise({ gain = 0.2, duration = 0.1, delay = 0 }) {
    try {
      const ac = getCtx();
      const bufSize = ac.sampleRate * duration;
      const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      const gainNode = ac.createGain();
      gainNode.gain.setValueAtTime(gain, ac.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
      src.connect(gainNode);
      gainNode.connect(ac.destination);
      src.start(ac.currentTime + delay);
    } catch (_) { }
  }

  return {
    // Deep rumble explosion
    explosion() {
      playNoise({ gain: 0.4, duration: 0.35 });
      playTone({ type: "sawtooth", freq: 120, endFreq: 30, gain: 0.3, duration: 0.35 });
    },
    // Short thud — life lost
    hit() {
      playNoise({ gain: 0.25, duration: 0.18 });
      playTone({ type: "square", freq: 80, endFreq: 40, gain: 0.2, duration: 0.2 });
    },
    // Chime — power-up collected
    powerup(type) {
      if (type === "shield") {
        playTone({ type: "sine", freq: 660, gain: 0.2, duration: 0.1 });
        playTone({ type: "sine", freq: 880, gain: 0.2, duration: 0.12, delay: 0.08 });
        playTone({ type: "sine", freq: 1100, gain: 0.15, duration: 0.15, delay: 0.18 });
      } else {
        playTone({ type: "sine", freq: 440, gain: 0.2, duration: 0.1 });
        playTone({ type: "sine", freq: 550, gain: 0.15, duration: 0.12, delay: 0.1 });
      }
    },
    // Soft blip — asteroid evaded (score tick)
    score() {
      playTone({ type: "sine", freq: 220, endFreq: 330, gain: 0.06, duration: 0.07 });
    },
    // Ascending jingle — sector up
    sectorUp() {
      [330, 440, 550, 660].forEach((f, i) =>
        playTone({ type: "triangle", freq: f, gain: 0.15, duration: 0.1, delay: i * 0.09 })
      );
    },
    // Game over descending
    gameOver() {
      playNoise({ gain: 0.5, duration: 0.5 });
      [400, 300, 200, 100].forEach((f, i) =>
        playTone({ type: "sawtooth", freq: f, gain: 0.25, duration: 0.18, delay: i * 0.15 })
      );
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Arcade() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({ ArrowLeft: false, ArrowRight: false });
  // runningRef drives whether update() does game logic
  const runningRef = useRef(false);
  // loopActiveRef drives whether the rAF loop continues — set by the effect, not by game logic
  const loopActiveRef = useRef(false);
  const animIdRef = useRef(null);
  const audioRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | playing | dead
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [sector, setSector] = useState("I");
  const [shieldActive, setShieldActive] = useState(false);
  const [slowActive, setSlowActive] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("oe_hs") || "0"); } catch { return 0; }
  });

  const navigate = useNavigate();

  // Initialise audio lazily on first user gesture
  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = createAudio();
    return audioRef.current;
  }, []);

  const sfx = useCallback((name, ...args) => {
    try { ensureAudio()[name]?.(...args); } catch (_) { }
  }, [ensureAudio]);

  const spawnExplosion = useCallback((x, y, count, color) => {
    const st = stateRef.current;
    if (!st) return;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 1;
      st.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        r: Math.random() * 3 + 1,
        color,
      });
    }
  }, []);

  const endGame = useCallback(() => {
    runningRef.current = false;
    const st = stateRef.current;
    if (!st) return;
    spawnExplosion(st.player.x, st.player.y, 50, "#FF2D2D");
    spawnExplosion(st.player.x, st.player.y, 25, "#FF8800");
    sfx("gameOver");
    const finalScore = st.score;
    setHighScore(prev => {
      const next = Math.max(prev, finalScore);
      try { localStorage.setItem("oe_hs", next); } catch { }
      return next;
    });
    // Give particles time to animate, then show overlay
    setTimeout(() => {
      loopActiveRef.current = false;
      setPhase("dead");
    }, 900);
  }, [spawnExplosion, sfx]);

  const startGame = useCallback(() => {
    // Cancel any old loop first
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);

    stateRef.current = mkState();
    keysRef.current = { ArrowLeft: false, ArrowRight: false };
    setScore(0);
    setLives(3);
    setSector("I");
    setShieldActive(false);
    setSlowActive(false);

    // Set both flags BEFORE triggering the phase change so the effect
    // sees them as true on its very first tick.
    runningRef.current = true;
    loopActiveRef.current = true;

    ensureAudio(); // prime AudioContext on user gesture
    setPhase("playing");
  }, [ensureAudio]);

  // ── Main game loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function spawnThruster(px, py) {
      stateRef.current.thrusters.push({
        x: px + (Math.random() - 0.5) * 6,
        y: py + 16,
        vy: Math.random() * 2 + 1,
        life: 1,
        r: Math.random() * 2 + 1,
      });
    }

    function update() {
      const st = stateRef.current;
      if (!st || !runningRef.current) return;

      st.frameCount++;

      // Sector progression
      const sIdx = getSectorIdx(st.score);
      if (sIdx !== st.sectorIdx) {
        st.sectorIdx = sIdx;
        st.speedMul = 1 + sIdx * 0.22;
        setSector(SECTORS[sIdx]);
        sfx("sectorUp");
      }

      // Player movement
      const keys = keysRef.current;
      if (keys.ArrowLeft && st.player.x > 20) st.player.x -= 6;
      if (keys.ArrowRight && st.player.x < W - 20) st.player.x += 6;

      // Timers
      if (st.player.invTimer > 0) st.player.invTimer--;
      if (st.player.shieldTimer > 0) {
        st.player.shieldTimer--;
        if (st.player.shieldTimer === 0) setShieldActive(false);
      }
      if (st.player.slowTimer > 0) {
        st.player.slowTimer--;
        if (st.player.slowTimer === 0) setSlowActive(false);
      }
      if (st.shakeTimer > 0) st.shakeTimer--;

      const effSm = st.player.slowTimer > 0 ? 0.4 : st.speedMul;

      // Stars
      st.stars.forEach(s => {
        s.y += s.spd * effSm;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      });

      // Thruster
      if (st.frameCount % 2 === 0) spawnThruster(st.player.x, st.player.y);
      st.thrusters.forEach(t => { t.y += t.vy; t.life -= 0.1; });
      st.thrusters = st.thrusters.filter(t => t.life > 0);

      // Spawn asteroids
      const spawnRate = 0.025 + st.sectorIdx * 0.006;
      if (Math.random() < spawnRate * effSm) {
        st.asteroids.push({
          x: Math.random() * (W - 40) + 20,
          y: -30,
          r: Math.random() * 14 + 9,
          spd: (Math.random() * 2.5 + 1.5),
          rot: 0,
          rotSpd: (Math.random() - 0.5) * 0.08,
          sides: Math.floor(Math.random() * 3) + 5,
          wobble: Array.from({ length: 8 }, () => Math.random() * 0.25 + 0.85),
        });
      }

      // Spawn power-ups
      if (Math.random() < 0.004) {
        const type = Math.random() < 0.5 ? "shield" : "slow";
        st.powerups.push({ x: Math.random() * (W - 60) + 30, y: -20, spd: 1.8, type, pulse: 0 });
      }

      // Update asteroids
      for (let i = st.asteroids.length - 1; i >= 0; i--) {
        const a = st.asteroids[i];
        a.y += a.spd * effSm;
        a.rot += a.rotSpd;

        if (a.y > H + 40) {
          st.asteroids.splice(i, 1);
          st.score += 10;
          setScore(st.score);
          sfx("score");
          continue;
        }

        if (st.player.invTimer <= 0) {
          const dist = Math.hypot(st.player.x - a.x, st.player.y - a.y);
          if (dist < a.r + 12) {
            if (st.player.shieldTimer > 0) {
              st.player.shieldTimer = 0;
              setShieldActive(false);
              spawnExplosion(a.x, a.y, 14, "#00DDFF");
              st.asteroids.splice(i, 1);
              st.shakeTimer = 6;
              sfx("explosion");
            } else {
              st.lives--;
              setLives(st.lives);
              st.shakeTimer = 14;
              spawnExplosion(st.player.x, st.player.y, 22, "#FF2D2D");
              st.asteroids.splice(i, 1);
              if (st.lives <= 0) {
                endGame();
                return;
              }
              st.player.invTimer = 90;
              sfx("hit");
            }
          }
        }
      }

      // Update power-ups
      for (let i = st.powerups.length - 1; i >= 0; i--) {
        const p = st.powerups[i];
        p.y += p.spd;
        p.pulse += 0.1;
        if (p.y > H + 30) { st.powerups.splice(i, 1); continue; }
        const dist = Math.hypot(st.player.x - p.x, st.player.y - p.y);
        if (dist < 22) {
          if (p.type === "shield") { st.player.shieldTimer = 300; setShieldActive(true); }
          else { st.player.slowTimer = 300; setSlowActive(true); }
          spawnExplosion(p.x, p.y, 12, p.type === "shield" ? "#00DDFF" : "#FFD700");
          sfx("powerup", p.type);
          st.powerups.splice(i, 1);
        }
      }

      // Particles
      st.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life -= p.decay; p.vx *= 0.97; });
      st.particles = st.particles.filter(p => p.life > 0);
    }

    function draw() {
      const st = stateRef.current;
      if (!st) return;

      ctx.save();
      if (st.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);

      ctx.fillStyle = "#040404";
      ctx.fillRect(-10, -10, W + 20, H + 20);

      // Nebula bg
      const grad = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, 200);
      grad.addColorStop(0, "rgba(0,50,100,0.04)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Stars
      st.stars.forEach(s => {
        ctx.fillStyle = `rgba(0,255,136,${0.15 + s.r * 0.1})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      });

      // Power-ups
      st.powerups.forEach(p => {
        const pulse = Math.sin(p.pulse) * 3;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = p.type === "shield" ? "#00DDFF" : "#FFD700";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7 + Math.sin(p.pulse) * 0.3;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const a = (j / 6) * Math.PI * 2 - Math.PI / 6;
          const r = 12 + pulse;
          j === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = p.type === "shield" ? "rgba(0,221,255,0.15)" : "rgba(255,215,0,0.15)";
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      });

      // Asteroids
      st.asteroids.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.strokeStyle = "#FF2D2D";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let j = 0; j < a.sides; j++) {
          const ang = (j / a.sides) * Math.PI * 2;
          const r = a.r * (a.wobble[j % a.wobble.length] || 1);
          j === 0 ? ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r) : ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "rgba(255,45,45,0.07)";
        ctx.fill();
        ctx.restore();
      });

      // Thruster particles
      st.thrusters.forEach(t => {
        ctx.globalAlpha = t.life * 0.7;
        ctx.fillStyle = Math.random() > 0.5 ? "#00FF88" : "#00AA55";
        ctx.beginPath();
        ctx.arc(t.x, t.y, Math.max(0.1, t.r * t.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Player ship
      const inv = st.player.invTimer > 0 && Math.floor(st.player.invTimer / 4) % 2 === 0;
      if (!inv) {
        const px = st.player.x, py = st.player.y;
        ctx.save();
        if (st.player.shieldTimer > 0) {
          ctx.strokeStyle = "rgba(0,221,255,0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(0,221,255,0.15)";
          ctx.lineWidth = 8;
          ctx.stroke();
        }
        ctx.strokeStyle = "#00FF88";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py - 16);        // nose
        ctx.lineTo(px - 13, py + 14);   // left wing tip
        ctx.lineTo(px - 4, py + 8);     // left notch
        ctx.lineTo(px, py + 12);        // tail centre
        ctx.lineTo(px + 4, py + 8);     // right notch
        ctx.lineTo(px + 13, py + 14);   // right wing tip
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "rgba(0,255,136,0.08)";
        ctx.fill();
        // cockpit
        ctx.fillStyle = "#00FF88";
        ctx.beginPath();
        ctx.arc(px, py - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Particles
      st.particles.forEach(p => {
        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.r * p.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.restore();
    }

    // The loop runs as long as loopActiveRef is true.
    // runningRef controls whether update() does game logic —
    // they're intentionally separate so particles can finish after death.
    function loop() {
      if (!loopActiveRef.current) return;
      update();
      draw();
      animIdRef.current = requestAnimationFrame(loop);
    }

    loopActiveRef.current = true;
    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      loopActiveRef.current = false;
      cancelAnimationFrame(animIdRef.current);
    };
  }, [phase, endGame, spawnExplosion, sfx]);

  // ── Keyboard listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const down = e => {
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        keysRef.current[e.code] = true;
        e.preventDefault();
      }
      if (e.code === "Space" && phase !== "playing") {
        e.preventDefault();
        startGame();
      }
    };
    const up = e => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, startGame]);

  // Touch / mouse hold handlers for the buttons
  const pressDir = (dir) => () => { keysRef.current[dir] = true; };
  const releaseDir = (dir) => () => { keysRef.current[dir] = false; };

  const isOver = phase === "dead";
  const showOverlay = phase !== "playing";

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono p-4">

      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-[#FF2D2D] text-xs tracking-[0.4em] mb-1 uppercase animate-pulse">
          UPLINK SEVERED // MANUAL OVERRIDE
        </div>
        <h1 className="text-3xl sm:text-4xl text-[#00FF88] tracking-widest font-bold">
          ORBITAL EVASION
        </h1>
      </div>

      {/* HUD */}
      <div className="flex gap-6 items-center justify-between w-full max-w-[800px] px-2 mb-2 text-xs tracking-widest">
        <div>
          <div className="text-[#444] text-[10px]">SCORE</div>
          <div className="text-[#00FF88] text-sm font-bold">{score}</div>
        </div>
        <div>
          <div className="text-[#444] text-[10px]">BEST</div>
          <div className="text-[#00FF88] text-sm font-bold">{highScore}</div>
        </div>
        <div>
          <div className="text-[#444] text-[10px]">SECTOR</div>
          <div className="text-[#FF2D2D] text-sm font-bold">{sector}</div>
        </div>
        <div>
          <div className="text-[#444] text-[10px] mb-1">LIVES</div>
          <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full border ${i < lives ? "bg-[#00FF88] border-[#00FF88]" : "bg-transparent border-[#333]"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative border border-[#1a1a1a] shadow-[0_0_30px_rgba(0,255,136,0.05)]">
        {/* CRT scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-40" />

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="max-w-full h-auto bg-[#040404] block"
        />

        {/* Start / Game Over overlay */}
        {showOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            {isOver && <ShieldAlert className="w-12 h-12 text-[#FF2D2D] mb-4" />}
            <div className="text-[#00FF88] text-xl tracking-[0.3em] mb-2">
              {isOver ? "HULL BREACH DETECTED" : "SYSTEM STANDBY"}
            </div>
            {isOver && (
              <div className="text-[#555] text-xs tracking-widest mb-4">
                FINAL SCORE: {score}{score > 0 && score >= highScore ? " // NEW RECORD" : ""}
              </div>
            )}
            <button
              onClick={startGame}
              className="px-6 py-3 border border-[#00FF88] text-[#00FF88] text-sm tracking-[0.2em] hover:bg-[#00FF88]/20 transition-all uppercase"
            >
              [ PRESS SPACE TO {isOver ? "RETRY" : "LAUNCH"} ]
            </button>
            <div className="text-[#555] text-xs tracking-widest mt-6">
              USE [←] [→] ARROW KEYS OR TOUCH BUTTONS TO EVADE
            </div>
          </div>
        )}
      </div>

      {/* Power-up status */}
      <div className="flex gap-4 mt-2 text-[10px] tracking-widest min-h-[18px]">
        {shieldActive && <span className="text-[#00DDFF]">⬡ SHIELD ACTIVE</span>}
        {slowActive && <span className="text-[#FFD700]">⧗ SLOW-MO ACTIVE</span>}
      </div>

      {/* Touch / click hold controls */}
      <div className="flex gap-3 mt-3">
        {[
          { label: "◀", dir: "ArrowLeft" },
          { label: "▶", dir: "ArrowRight" },
        ].map(({ label, dir }) => (
          <button
            key={dir}
            onMouseDown={pressDir(dir)}
            onMouseUp={releaseDir(dir)}
            onMouseLeave={releaseDir(dir)}
            onTouchStart={e => { e.preventDefault(); pressDir(dir)(); }}
            onTouchEnd={e => { e.preventDefault(); releaseDir(dir)(); }}
            className="bg-[rgba(0,255,136,0.08)] border border-[#00FF88] text-[#00FF88] text-lg px-7 py-2.5 cursor-pointer select-none active:bg-[rgba(0,255,136,0.25)]"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate("/")}
          className="text-[#666] hover:text-[#00FF88] text-xs tracking-[0.3em] transition-colors"
        >
          &lt; RETURN TO MAIN COMMAND
        </button>
      </div>
    </div>
  );
}
