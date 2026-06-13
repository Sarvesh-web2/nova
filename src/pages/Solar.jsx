import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Flame, Wind } from "lucide-react";
import PageShell from "@/components/helios/PageShell.jsx";
import { fetchSolarFeed, fetchSolarStatus } from "@/api/client.js";
import { HELIOS } from "@/constants/testIds.js";

const Metric = ({ label, value, unit, Icon, testId, danger = false }) => (
  <div
    className="bg-[#060606] border border-[#1a1a1a] p-4 sm:p-5"
    style={{ boxShadow: danger ? "inset 0 0 22px rgba(255,45,45,0.12)" : "inset 0 0 22px rgba(0,255,136,0.06)" }}
  >
    <div className="flex items-center justify-between text-[10px] tracking-[0.35em] text-[#666] mb-3">
      <span>{label}</span>
      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: danger ? "#FF2D2D" : "#00FF88" }} />
    </div>
    <div className="flex items-baseline gap-2">
      <span
        data-testid={testId}
        className="text-2xl sm:text-3xl tabular-nums tracking-tight"
        style={{
          color: danger ? "#FF2D2D" : "#00FF88",
          textShadow: danger ? "0 0 12px rgba(255,45,45,0.35)" : "0 0 12px rgba(0,255,136,0.35)"
        }}
      >
        {value}
      </span>
      <span className="text-xs tracking-[0.25em] text-[#555]">{unit}</span>
    </div>
  </div>
);

export default function Solar() {
  const [status, setStatus] = useState(null);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      const data = await fetchSolarStatus();
      if (mounted) setStatus(data);
    };
    tick();
    fetchSolarFeed().then((items) => mounted && setFeed(items));
    const interval = setInterval(tick, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isStorm = status && (status.kpIndex >= 5 || status.flareClass?.startsWith("X"));

  return (
    <div data-testid={HELIOS.solarRoot}>
      <PageShell code="MOD-01 // HELIOSPHERIC" title="Solar Storm Monitor" subtitle="Real-time Heliospheric Surveillance">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div
              className="relative bg-[#040404] border border-[#1a1a1a] min-h-[280px] flex items-center justify-center overflow-hidden"
              style={{ boxShadow: isStorm ? "inset 0 0 50px rgba(255,45,45,0.16)" : "inset 0 0 50px rgba(255,184,0,0.10)" }}
            >
              <div className="absolute inset-0 helios-grid opacity-25" aria-hidden="true" />
              <motion.div
                aria-hidden="true"
                className="absolute rounded-full"
                style={{
                  width: 240,
                  height: 240,
                  background: "radial-gradient(circle at 35% 35%, #FFB800 0%, #FF6B00 35%, #5a1c00 75%, #050505 100%)",
                  boxShadow: "0 0 80px rgba(255,140,0,0.45)"
                }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute rounded-full border"
                style={{ width: 340, height: 340, borderColor: isStorm ? "#FF2D2D44" : "#00FF8844" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative z-10 text-center">
                <div className="text-[10px] tracking-[0.4em] text-[#FFB800]/80">SOHO LASCO C2</div>
                <div className="text-xs text-[#666] mt-1">composite heliospheric view</div>
              </div>
              {["top-3 left-3 border-l border-t", "top-3 right-3 border-r border-t", "bottom-3 left-3 border-l border-b", "bottom-3 right-3 border-r border-b"].map((cls) => (
                <span key={cls} aria-hidden="true" className={`absolute w-5 h-5 ${cls}`} style={{ borderColor: isStorm ? "#FF2D2D" : "#00FF88" }} />
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <Metric label="KP INDEX" value={status ? status.kpIndex.toFixed(2) : "----"} unit="/ 9" Icon={Activity} testId={HELIOS.solarKpIndex} danger={status?.kpIndex >= 5} />
              <Metric label="SOLAR WIND" value={status ? status.solarWind : "----"} unit="KM/S" Icon={Wind} testId={HELIOS.solarKpWind} />
              <Metric label="X-RAY FLARE" value={status ? status.flareClass : "----"} unit="CLASS" Icon={Flame} testId={HELIOS.solarKpFlares} danger={status?.flareClass?.startsWith("X")} />
            </div>
          </div>

          <div data-testid={HELIOS.solarFeed} className="bg-[#060606] border border-[#1a1a1a] p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
              <div>
                <div className="text-[10px] tracking-[0.4em] text-[#00FF88]/70">FEED S-09</div>
                <h2 className="text-lg sm:text-xl text-[#00FF88] uppercase tracking-tight mt-1">Solar Event Feed</h2>
              </div>
              <span className="text-[10px] tracking-[0.3em] text-[#666]">AUTO</span>
            </div>
            <ul className="mt-4 space-y-3 text-xs">
              {feed.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-[#111] pb-3 last:border-0">
                  <span className="text-[#444] tabular-nums">{item.t}</span>
                  <span className="text-[#888]">{item.msg}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4 text-[10px] tracking-[0.3em] text-[#555] uppercase">
              Refresh :: 2.5s | src :: local backend
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}

