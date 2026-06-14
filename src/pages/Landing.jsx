import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // 👉 1. Added Router hook
import { Crosshair, Globe, Satellite, Sun } from "lucide-react";
import BootSequence from "@/components/helios/BootSequence.jsx";
import PortalCard from "@/components/helios/PortalCard.jsx";
import { HELIOS } from "@/constants/testIds.js";

const portals = [
  {
    code: "MOD-01",
    title: "Solar Storm Monitor",
    subtitle: "Heliospheric",
    description: "Track solar wind, X-ray flare class, CME probability, and operator feed events.",
    to: "/solar",
    Icon: Sun,
    testId: HELIOS.cardSolar
  },
  {
    code: "MOD-02",
    title: "Tactical Threat Demo",
    subtitle: "Intercept",
    description: "Simulate orbital intercept alerts, target tracks, and countermeasure command acknowledgements.",
    to: "/threat",
    Icon: Crosshair,
    variant: "alert",
    testId: HELIOS.cardThreat
  },
  {
    code: "MOD-03",
    title: "ISS Tracking & Comm",
    subtitle: "Overwatch",
    description: "Watch the live ISS stream while telemetry updates through the local backend at one hertz.",
    to: "/iss",
    Icon: Satellite,
    testId: HELIOS.cardIss
  },
  {
    code: "MOD-04",
    title: "Earth Satellite Model",
    subtitle: "Orbital Viz",
    description: "Live 3-D Earth globe with satellite constellations, ISS tracking, and atmosphere simulation.",
    to: "/earth",
    Icon: Globe,
    testId: HELIOS.cardEarth ?? "card-earth"
  }
];

export default function Landing() {
  const [booting, setBooting] = useState(true);
  const navigate = useNavigate(); // 👉 2. Initialized Router hook

  return (
    <div data-testid={HELIOS.landingRoot} className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      {booting && <BootSequence duration={3000} onComplete={() => setBooting(false)} />}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(0,255,136,0.07) 0%, rgba(0,0,0,0) 60%)" }}
      />
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: booting ? 0 : 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center justify-between text-[10px] sm:text-xs tracking-[0.35em] text-[#666] uppercase mb-10 sm:mb-14"
        >
          <span>SENTINEL-01 // ORBITAL COMMAND</span>
          <span className="hidden sm:inline">CLASSIFIED // TS-SCI</span>
          <span>
            STATUS: <span className="text-[#00FF88]">NOMINAL</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: booting ? 0 : 1, y: booting ? 24 : 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="max-w-5xl"
        >
          <div className="text-xs tracking-[0.45em] text-[#00FF88]/70 mb-4 sm:mb-6">
            ORBITAL THREAT DEFENSE PLATFORM // V 4.2.7
          </div>
          <h1
            data-testid={HELIOS.landingTitle}
            className="text-[2.6rem] sm:text-7xl md:text-8xl uppercase leading-[0.92] tracking-tight text-[#00FF88]"
            style={{ textShadow: "0 0 28px rgba(0,255,136,0.25)" }}
          >
            HELIOS
            <br />
            SENTINEL<span className="text-[#00FF88]/40">.</span>
          </h1>
          <p
            data-testid={HELIOS.landingSubtitle}
            className="mt-6 max-w-3xl text-sm sm:text-base leading-7 text-[#888] tracking-wide"
          >
            A standalone reconstruction of the Emergent bundle as a local full-stack command interface.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
          {portals.map((portal, index) => (
            <PortalCard key={portal.to} index={index} {...portal} />
          ))}
        </div>
      </div>

      {/* 👉 3. THE SECRET PLANET BUTTON 👈 */}
      {!booting && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          onClick={() => navigate('/arcade')}
          title="Classified // Orbital Evasion"
          className="fixed bottom-6 right-6 z-50 group flex items-center justify-center w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-[#00FF88]/20 shadow-[0_0_15px_rgba(0,255,136,0.1)] hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:border-[#00FF88]/60 transition-all duration-500 cursor-pointer"
        >
          {/* Planet Sphere */}
          <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-950 via-[#00FF88]/80 to-[#00FF88] shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-500">
            {/* Inner Glow */}
            <div className="absolute inset-0 rounded-full bg-[#00FF88] opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-500" />
          </div>
          {/* Planetary Ring */}
          <div className="absolute w-10 h-3 border-[1.5px] border-[#00FF88]/40 rounded-[50%] -rotate-12 group-hover:rotate-12 group-hover:border-[#00FF88] transition-all duration-700" />
        </motion.button>
      )}

    </div>
  );
}