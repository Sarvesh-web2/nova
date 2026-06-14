import { useState } from "react";
import { motion } from "framer-motion";
import PageShell from "@/components/helios/PageShell.jsx";
import EarthModel from "@/components/earth/EarthModel.jsx";
import EarthControlsPanel from "@/components/earth/EarthControlsPanel.jsx";

export default function Earth() {
  const [satCount,         setSatCount]         = useState(3);
  const [showSatellites,   setShowSatellites]   = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showISS,          setShowISS]          = useState(false);
  const [weatherMode,      setWeatherMode]      = useState("PARTLY_CLOUDY");

  return (
    <div>
      <PageShell
        code="MOD-04 // EARTH OVERWATCH"
        title="Earth Satellite Model"
        subtitle="Orbital Visualization · Live ISS · Atmosphere Sim"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6">

          {/* ── Globe viewport ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative bg-[#040404] border border-[#1a1a1a] overflow-hidden"
            style={{ minHeight: 480 }}
          >
            <EarthModel
              satCount={showSatellites ? satCount : 0}
              showTrajectories={showTrajectories}
              showISS={showISS}
              weatherMode={weatherMode}
            />

            {/* Corner brackets */}
            {[
              "top-3 left-3 border-l border-t",
              "top-3 right-3 border-r border-t",
              "bottom-3 left-3 border-l border-b",
              "bottom-3 right-3 border-r border-b",
            ].map(cls => (
              <span
                key={cls}
                aria-hidden="true"
                className={`absolute w-4 h-4 border-[#00FF88]/50 pointer-events-none ${cls}`}
              />
            ))}

            {/* HUD overlays */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
              <span className="text-[9px] tracking-[0.4em] text-[#00FF88]/40 uppercase">
                Earth Observation Platform
              </span>
            </div>
            <div className="absolute bottom-3 left-4 flex items-center gap-2 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span className="text-[9px] tracking-[0.3em] text-[#00FF88]/50 uppercase">
                Rendering · Real-time 3D
              </span>
            </div>
            <div className="absolute bottom-3 right-4 text-[9px] tracking-[0.3em] text-[#333] uppercase pointer-events-none">
              Three.js · WebGL
            </div>
          </motion.div>

          {/* ── Controls panel ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-[#040404] border border-[#1a1a1a] overflow-y-auto"
            style={{ maxHeight: 620 }}
          >
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-[#1a1a1a]">
              <div className="text-[10px] tracking-[0.4em] text-[#00FF88]/60 uppercase mb-0.5">
                Control Matrix
              </div>
              <div className="text-sm tracking-[0.3em] text-[#00FF88] uppercase">
                Orbital Config
              </div>
            </div>

            <EarthControlsPanel
              satCount={satCount}               onSatCountChange={setSatCount}
              showSatellites={showSatellites}   onShowSatellites={setShowSatellites}
              showTrajectories={showTrajectories} onShowTrajectories={setShowTrajectories}
              showISS={showISS}                 onShowISS={setShowISS}
              weatherMode={weatherMode}         onWeatherMode={setWeatherMode}
            />
          </motion.div>
        </div>

        {/* ── Telemetry status bar ──────────────────────────────────────── */}
        <div className="mt-4 border border-[#1a1a1a] bg-[#040404] px-4 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
          {[
            { label: "Satellites",   value: showSatellites ? satCount : 0, unit: "active" },
            { label: "Trajectories", value: showTrajectories ? "ON" : "OFF" },
            { label: "ISS Track",    value: showISS ? "LIVE" : "OFFLINE", accent: showISS },
            { label: "Atmosphere",   value: weatherMode.replace("_", " ") },
          ].map(({ label, value, unit, accent }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.35em] text-[#555] uppercase">{label}</span>
              <span
                className="text-xs tracking-[0.25em] tabular-nums"
                style={{ color: accent ? "#00FF88" : "#888" }}
              >
                {value}{unit ? ` ${unit}` : ""}
              </span>
            </div>
          ))}
        </div>
      </PageShell>
    </div>
  );
}