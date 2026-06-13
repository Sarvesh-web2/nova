import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import PageShell from "@/components/helios/PageShell.jsx";
import { fetchIssTelemetry } from "@/api/client.js";
import { HELIOS } from "@/constants/testIds.js";

const fmt = (n, d = 4) => (n === null || n === undefined || Number.isNaN(n) ? "----" : Number(n).toFixed(d));

const TelemetryRow = ({ label, value, unit, testId, pulse = false }) => (
  <div className="border border-[#1a1a1a] bg-[#060606] p-4 sm:p-5">
    <div className="flex items-center justify-between text-[10px] tracking-[0.35em] text-[#666] mb-3">
      <span>{label}</span>
      <span
        className={`w-1.5 h-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`}
        style={{ background: "#00FF88", boxShadow: "0 0 8px #00FF88" }}
      />
    </div>
    <div className="flex items-baseline gap-2">
      <span
        data-testid={testId}
        className="text-2xl sm:text-3xl text-[#00FF88] tabular-nums tracking-tight"
        style={{ textShadow: "0 0 12px rgba(0,255,136,0.35)" }}
      >
        {value}
      </span>
      <span className="text-xs tracking-[0.25em] text-[#555]">{unit}</span>
    </div>
  </div>
);

export default function ISS() {
  const [telemetry, setTelemetry] = useState({
    latitude: null,
    longitude: null,
    altitude: null,
    velocity: null,
    timestamp: null,
    source: "INIT"
  });
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      const data = await fetchIssTelemetry();
      if (!mounted) return;
      setTelemetry(data);
      setHistory((items) => [
        {
          ts: `${new Date().toISOString().slice(11, 19)}Z`,
          msg: `POS DELTA :: lat ${Number(data.latitude).toFixed(2)} lon ${Number(data.longitude).toFixed(2)}`
        },
        ...items
      ].slice(0, 8));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div data-testid={HELIOS.issRoot}>
      <PageShell code="MOD-03 // ISS OVERWATCH" title="Live ISS Tracking & Comm" subtitle="NASA DSN Downlink :: Crewed Asset 25544">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6">
          <div className="bg-[#060606] border border-[#1a1a1a] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] text-[10px] tracking-[0.35em] uppercase">
              <span className="text-[#00FF88]">NASA :: LIVE DOWNLINK</span>
              <span className="text-[#666]">CH 25544 // 1080P</span>
            </div>
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              {/* UPDATED LINK: Pointing directly to your new live stream ID */}
              <iframe
                data-testid={HELIOS.issIframe}
                title="NASA Live ISS Stream"
                src="https://www.youtube.com/embed/FuuC4dpSQ1M?autoplay=1&mute=1"
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
              {["top-2 left-2 border-l border-t", "top-2 right-2 border-r border-t", "bottom-2 left-2 border-l border-b", "bottom-2 right-2 border-r border-b"].map((cls) => (
                <span key={cls} aria-hidden="true" className={`absolute w-4 h-4 border-[#00FF88] ${cls}`} />
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[#1a1a1a] flex items-center justify-between text-[10px] tracking-[0.3em] text-[#666] uppercase">
              <span>
                SIGNAL STRENGTH :: <span className="text-[#00FF88]">98%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF2D2D", boxShadow: "0 0 8px #FF2D2D" }} />
                LIVE
              </span>
            </div>
          </div>

          <div data-testid={HELIOS.telemetryPanel} className="bg-[#060606] border border-[#1a1a1a] p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
              <div>
                <div className="text-[10px] tracking-[0.4em] text-[#00FF88]/70">PANEL T-03</div>
                <h2 className="text-lg sm:text-xl text-[#00FF88] uppercase tracking-tight mt-1">Telemetry Overwatch</h2>
              </div>
              <span
                data-testid={HELIOS.telemetryStatus}
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: telemetry.source === "LIVE" ? "#00FF88" : "#FFB800" }}
              >
                {telemetry.source}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TelemetryRow label="LATITUDE" unit="DEG N" value={fmt(telemetry.latitude, 4)} testId={HELIOS.telemetryLat} pulse />
              <TelemetryRow label="LONGITUDE" unit="DEG E" value={fmt(telemetry.longitude, 4)} testId={HELIOS.telemetryLon} pulse />
              <TelemetryRow label="ALTITUDE" unit="KM" value={fmt(telemetry.altitude, 2)} testId={HELIOS.telemetryAlt} />
              <TelemetryRow label="VELOCITY" unit="KM/H" value={fmt(telemetry.velocity, 1)} testId={HELIOS.telemetryVel} />
            </div>

            <div className="border border-[#1a1a1a] bg-[#040404] p-3 mt-1">
              <div className="text-[10px] tracking-[0.35em] text-[#666] mb-2">DOWNLINK TICK LOG</div>
              <ul className="space-y-1 text-[11px] font-mono">
                {history.length === 0 && <li className="text-[#555]">awaiting first packet...</li>}
                {history.map((item, index) => (
                  <motion.li key={`${item.ts}-${index}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 text-[#888]">
                    <span className="text-[#444]">{item.ts}</span>
                    <span>{item.msg}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] tracking-[0.3em] text-[#555] uppercase mt-auto">
              Refresh rate :: 1 Hz | source :: backend ISS proxy / mock
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}