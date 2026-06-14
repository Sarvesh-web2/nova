import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronRight, X } from "lucide-react";
import EarthModel from "@/components/earth/EarthModel.jsx";
import EarthControlsPanel from "@/components/earth/EarthControlsPanel.jsx";

export default function ModelSidebar({ visible }) {
  const [open, setOpen] = useState(false);

  const [satCount,         setSatCount]         = useState(3);
  const [showSatellites,   setShowSatellites]   = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showISS,          setShowISS]          = useState(false);
  const [weatherMode,      setWeatherMode]      = useState("PARTLY_CLOUDY");

  // Auto-open on first scroll reveal
  useEffect(() => {
    if (visible && !open) setOpen(true);
  }, [visible]);

  return (
    <>
      {/* ── Edge toggle tab ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.button
            key="sidebar-tab"
            initial={{ x: 56, opacity: 0 }}
            animate={{ x: 0,  opacity: 1 }}
            exit={{    x: 56, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={() => setOpen(v => !v)}
            aria-label={open ? "Close Earth sidebar" : "Open Earth sidebar"}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 py-4 px-2 border border-r-0 border-[#00FF88]/30 bg-[#060606] hover:bg-[#091209] transition-colors focus:outline-none"
            style={{ boxShadow: "inset 0 0 18px rgba(0,255,136,0.05), -4px 0 20px rgba(0,255,136,0.04)" }}
          >
            <Globe className="w-4 h-4 text-[#00FF88]" strokeWidth={1.4} />
            <ChevronRight
              className="w-3 h-3 text-[#00FF88]/50 transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            <span
              className="text-[9px] tracking-[0.28em] text-[#00FF88]/50 uppercase select-none"
              style={{ writingMode: "vertical-rl", marginTop: 6 }}
            >
              EARTH
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="sidebar-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{    x: "100%" }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-40 flex flex-col bg-[#030303] border-l border-[#181818]"
            style={{
              width: 310,
              boxShadow: "-16px 0 60px rgba(0,0,0,0.6), -4px 0 24px rgba(0,255,136,0.03)",
            }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#181818]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00FF88]" strokeWidth={1.4} />
                <span className="text-xs tracking-[0.38em] text-[#00FF88] uppercase">Earth Command</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-[#444] hover:text-[#00FF88] transition-colors focus:outline-none"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-D Globe viewport */}
            <div className="relative shrink-0 border-b border-[#181818]" style={{ height: 216 }}>
              <EarthModel
                satCount={showSatellites ? satCount : 0}
                showTrajectories={showTrajectories}
                showISS={showISS}
                weatherMode={weatherMode}
                compact
              />

              {/* Corner brackets */}
              {[
                "top-2 left-2 border-l border-t",
                "top-2 right-2 border-r border-t",
                "bottom-2 left-2 border-l border-b",
                "bottom-2 right-2 border-r border-b",
              ].map(cls => (
                <span
                  key={cls}
                  aria-hidden="true"
                  className={`absolute w-3 h-3 border-[#00FF88]/50 pointer-events-none ${cls}`}
                />
              ))}

              {/* Status badge */}
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                <span className="text-[9px] tracking-[0.32em] text-[#00FF88]/50 uppercase">Live 3D</span>
              </div>
            </div>

            {/* Scrollable controls */}
            <div className="flex-1 overflow-y-auto">
              <EarthControlsPanel
                satCount={satCount}             onSatCountChange={setSatCount}
                showSatellites={showSatellites} onShowSatellites={setShowSatellites}
                showTrajectories={showTrajectories} onShowTrajectories={setShowTrajectories}
                showISS={showISS}               onShowISS={setShowISS}
                weatherMode={weatherMode}       onWeatherMode={setWeatherMode}
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-[#181818]">
              <span className="text-[9px] tracking-[0.3em] text-[#333] uppercase">EARTHsat v2.0</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                <span className="text-[9px] tracking-[0.3em] text-[#00FF88] uppercase">Online</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}