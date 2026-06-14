import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Radar, Radio, ShieldAlert, Zap } from "lucide-react";
import PageShell from "@/components/helios/PageShell.jsx";
import { fetchThreatTargets, logTacticalAction } from "@/api/client.js";
import { HELIOS } from "@/constants/testIds.js";
import DeployChaff from "@/components/threat/DeployChaff";
import SignalSpoof from "@/components/threat/SignalSpoof";
import OrbitalManeuver from "@/components/threat/OrbitalManeuver";

const ActionBtn = ({ testId, label, code, Icon, onClick, accent = "#00FF88" }) => (
  <motion.button
    data-testid={testId}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="group relative w-full text-left bg-[#060606] border p-4 flex items-center gap-4 focus:outline-none focus-visible:ring-2"
    style={{ borderColor: "#1a1a1a" }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = accent;
      e.currentTarget.style.boxShadow = `0 0 24px ${accent}40, inset 0 0 18px ${accent}15`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "#1a1a1a";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: accent, color: accent }}>
      <Icon className="w-5 h-5" strokeWidth={1.4} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] tracking-[0.35em] text-[#666]">&gt; {code}</div>
      <div className="text-sm sm:text-base uppercase tracking-tight" style={{ color: accent }}>
        {label}
      </div>
    </div>
    <span className="text-[10px] tracking-[0.3em] text-[#555] group-hover:text-[#00FF88] transition-colors">
      EXEC
    </span>
  </motion.button>
);

export default function Threat() {
  const [critical, setCritical] = useState(false);
  const [targets, setTargets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeDemo, setActiveDemo] = useState("77");

  useEffect(() => {
    fetchThreatTargets().then(setTargets);
  }, []);

  useEffect(() => {
    const start = setTimeout(() => setCritical(true), 6000);
    const stop = setTimeout(() => setCritical(false), 11000);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [logs.length]);

  const onAction = async (label) => {
    const result = await logTacticalAction(label);
    setLogs((items) => [
      {
        ts: `${new Date().toISOString().slice(11, 19)}Z`,
        msg: result.confirmation
      },
      ...items
    ].slice(0, 7));
  };

  const accent = critical ? "#FF2D2D" : "#00FF88";

  return (
    <div data-testid={HELIOS.threatRoot}>
      <PageShell
        code="MOD-02 // TACTICAL THREAT"
        title="Tactical Threat Demo"
        subtitle="Intercept Calculus :: Live Globe Envelope"
        statusColor={accent}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr_1fr] gap-4 sm:gap-6">
          <div className="flex flex-col gap-4">
            <div
              data-testid={HELIOS.alertBanner}
              className="relative overflow-hidden border p-4 sm:p-5"
              style={{
                borderColor: accent,
                background: critical ? "rgba(255,45,45,0.08)" : "rgba(0,255,136,0.05)",
                boxShadow: critical ? "0 0 28px rgba(255,45,45,0.45), inset 0 0 18px rgba(255,45,45,0.15)" : "0 0 18px rgba(0,255,136,0.18)"
              }}
            >
              <AnimatePresence mode="wait">
                {critical ? (
                  <motion.div key="crit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="text-[10px] tracking-[0.4em] text-[#FF2D2D] mb-2 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#FF2D2D] animate-pulse" />
                      ALERT :: PRIORITY 1
                    </div>
                    <div className="text-base sm:text-xl uppercase tracking-tight text-[#FF2D2D]">
                      CRITICAL INTERCEPT THREAT DETECTED
                    </div>
                    <div className="text-xs text-[#FF2D2D]/70 mt-2 tracking-wider">
                      Impact window :: T-00:01:42 // Recommend immediate countermeasures.
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="nom" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="text-[10px] tracking-[0.4em] text-[#00FF88] mb-2 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                      STATUS :: NOMINAL
                    </div>
                    <div className="text-base sm:text-xl uppercase tracking-tight text-[#00FF88]">SCANNING FOR PROJECTILES</div>
                    <div className="text-xs text-[#00FF88]/60 mt-2 tracking-wider">No active intercept vectors. Sweep continues.</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid gap-3">
              <ActionBtn
                testId={HELIOS.btnManeuver}
                code="CMD-77"
                label="Orbital Maneuver"
                Icon={Zap}
                accent={accent}
                onClick={() => {
                  setActiveDemo("77");
                  onAction("orbital maneuver");
                }}
              />
              <ActionBtn
                testId={HELIOS.btnChaff}
                code="CMD-18"
                label="Deploy Chaff"
                Icon={ShieldAlert}
                accent={accent}
                onClick={() => {
                  setActiveDemo("18");
                  onAction("deploy chaff");
                }}
              />
              <ActionBtn
                testId={HELIOS.btnSpoof}
                code="CMD-42"
                label="Signal Spoof"
                Icon={Radio}
                accent={accent}
                onClick={() => {
                  setActiveDemo("42");
                  onAction("signal spoof");
                }}
              />
            </div>
          </div>

          {/* MAIN SIMULATOR SCREEN CONTAINER */}
          <div
            data-testid={HELIOS.threatGlobe}
            className="relative bg-[#040404] border border-[#1a1a1a] overflow-hidden flex flex-col justify-between"
            style={{ boxShadow: `inset 0 0 60px ${accent}16`, minHeight: "420px" }}
          >
            <div className="p-3 border-b border-[#1a1a1a] flex justify-between items-center bg-[#060606] z-10">
              <span className="text-[10px] tracking-[0.35em] text-[#666]">TACTICAL VISUALIZATION MATRIX</span>
              <span className="text-[9px] px-1.5 py-0.5 border border-[#444] text-[#888] font-mono tracking-widest bg-[#020202]">
                MODE_CMD-{activeDemo}
              </span>
            </div>

            <div className="flex-1 w-full flex items-center justify-center relative">
              {activeDemo === "77" && <OrbitalManeuver />}
              {activeDemo === "18" && <DeployChaff />}
              {activeDemo === "42" && <SignalSpoof />}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-[#060606] border border-[#1a1a1a] p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
                <div>
                  <div className="text-[10px] tracking-[0.4em] text-[#00FF88]/70">TRACK LIST</div>
                  <h2 className="text-lg sm:text-xl text-[#00FF88] uppercase tracking-tight mt-1">Targets</h2>
                </div>
                <Crosshair className="w-4 h-4 text-[#00FF88]" strokeWidth={1.4} />
              </div>
              <ul className="mt-4 space-y-3 text-xs">
                {targets.map((target) => (
                  <li key={target.id} className="border border-[#111] bg-[#040404] p-3">
                    <div className="flex justify-between text-[#00FF88]">
                      <span>{target.id}</span>
                      <span>{target.vector}</span>
                    </div>
                    <div className="mt-2 text-[#888]">{target.designation}</div>
                    <div className="mt-1 text-[#555]">RANGE :: {target.range} KM</div>
                  </li>
                ))}
              </ul>
            </div>

            <div data-testid={HELIOS.actionLog} className="bg-[#060606] border border-[#1a1a1a] p-4 sm:p-5 flex-1">
              <div className="text-[10px] tracking-[0.4em] text-[#00FF88]/70 pb-3 border-b border-[#1a1a1a]">ACTION LOG</div>
              <ul className="mt-4 space-y-2 text-[11px] font-mono">
                {logs.length === 0 && <li className="text-[#555]">awaiting command...</li>}
                {logs.map((log, index) => (
                  <motion.li key={`${log.ts}-${index}`} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} className="text-[#888]">
                    <span className="text-[#444]">{log.ts}</span> {log.msg}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}