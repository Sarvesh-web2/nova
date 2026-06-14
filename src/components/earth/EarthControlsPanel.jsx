import { Cloud, Satellite, Zap, Globe2 } from "lucide-react";

const WEATHER_OPTIONS = ["SUNNY", "PARTLY_CLOUDY", "CLOUDY", "STORMY"];
const WEATHER_META    = {
  SUNNY:         { color: "#ffdf6d", icon: "☀", label: "Sunny"         },
  PARTLY_CLOUDY: { color: "#a0cfff", icon: "⛅", label: "Partly Cloudy" },
  CLOUDY:        { color: "#ffffff", icon: "☁", label: "Cloudy"        },
  STORMY:        { color: "#737882", icon: "⛈", label: "Stormy"        },
};

function Toggle({ on, onChange, accentColor = "#00FF88" }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative shrink-0 w-9 h-5 border transition-all focus:outline-none"
      style={{
        borderColor: on ? accentColor : "#333",
        background:  on ? `${accentColor}18` : "transparent",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-3.5 h-3.5 transition-all"
        style={{ background: on ? accentColor : "#444", transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

function SectionHead({ icon: Icon, label, color = "#00FF88" }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3 h-3 shrink-0" strokeWidth={1.5} style={{ color }} />
      <span className="text-[10px] tracking-[0.38em] uppercase" style={{ color }}>{label}</span>
    </div>
  );
}

export default function EarthControlsPanel({
  satCount,           onSatCountChange,
  showSatellites,     onShowSatellites,
  showTrajectories,   onShowTrajectories,
  showISS,            onShowISS,
  weatherMode,        onWeatherMode,
}) {
  return (
    <div className="flex flex-col gap-4 px-4 py-3">

      {/* ── ISS ── */}
      <section>
        <SectionHead icon={Satellite} label="Live ISS" color="#ffdf6d" />
        <div className="flex items-center gap-3">
          <Toggle on={showISS} onChange={onShowISS} accentColor="#ffdf6d" />
          <span className="text-xs tracking-[0.3em] text-[#888] uppercase">Track ISS Location</span>
        </div>
        {showISS && (
          <div className="mt-2.5 flex items-center gap-2 text-[10px] tracking-[0.28em] text-[#ffdf6d]/70 border border-[#ffdf6d]/20 px-2 py-1.5 bg-[#ffdf6d]/05">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ffdf6d] animate-pulse shrink-0" />
            TELEMETRY ACTIVE · 5s REFRESH
          </div>
        )}
      </section>

      <div className="border-t border-[#1a1a1a]" />

      {/* ── Satellites ── */}
      <section>
        <SectionHead icon={Zap} label="Satellite Array" color="#00FF88" />
        <div className="flex items-center gap-3 mb-3">
          <Toggle on={showSatellites} onChange={onShowSatellites} />
          <span className="text-xs tracking-[0.3em] text-[#888] uppercase">Show Satellites</span>
        </div>
        {showSatellites && (
          <div className="space-y-3 pl-1">
            <div>
              <div className="flex justify-between text-[10px] tracking-[0.3em] text-[#555] uppercase mb-1.5">
                <span>Orbit Count</span>
                <span className="text-[#00FF88] tabular-nums">{satCount}</span>
              </div>
              <input
                type="range"
                min={0} max={10} step={1}
                value={satCount}
                onChange={e => onSatCountChange(Number(e.target.value))}
                className="w-full h-0.5 appearance-none bg-[#1e1e1e] cursor-pointer"
                style={{ accentColor: "#00FF88" }}
              />
              <div className="flex justify-between text-[9px] text-[#333] mt-1 tracking-widest">
                <span>0</span><span>5</span><span>10</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle on={showTrajectories} onChange={onShowTrajectories} />
              <span className="text-xs tracking-[0.3em] text-[#888] uppercase">Orbital Rings</span>
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-[#1a1a1a]" />

      {/* ── Atmosphere ── */}
      <section>
        <SectionHead icon={Cloud} label="Atmosphere" color="#a0cfff" />
        <div className="grid grid-cols-2 gap-1.5">
          {WEATHER_OPTIONS.map(key => {
            const meta   = WEATHER_META[key];
            const active = weatherMode === key;
            return (
              <button
                key={key}
                onClick={() => onWeatherMode(key)}
                className="flex items-center gap-1.5 px-2 py-2 text-[9px] tracking-[0.22em] uppercase border transition-all focus:outline-none"
                style={{
                  borderColor: active ? meta.color : "#222",
                  color:       active ? meta.color : "#555",
                  background:  active ? `${meta.color}12` : "transparent",
                }}
              >
                <span className="text-sm leading-none">{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[9px] tracking-[0.3em] text-[#444] uppercase">
          Active /{" "}
          <span style={{ color: WEATHER_META[weatherMode]?.color }}>
            {WEATHER_META[weatherMode]?.label}
          </span>
        </div>
      </section>

      <div className="border-t border-[#1a1a1a]" />

      {/* ── Full view link ── */}
      <section>
        <SectionHead icon={Globe2} label="Full View" color="#00FF88" />
        <a
          href="/earth"
          className="flex items-center justify-between w-full border border-[#1c1c1c] px-3 py-2.5 text-[10px] tracking-[0.3em] text-[#555] uppercase hover:border-[#00FF88]/40 hover:text-[#00FF88] transition-all group"
        >
          <span>Open Earth Module</span>
          <span className="text-[#00FF88]/40 group-hover:text-[#00FF88] transition-colors">→</span>
        </a>
      </section>
    </div>
  );
}