import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import Marquee from "@/components/helios/Marquee.jsx";
import ScanlineOverlay from "@/components/helios/ScanlineOverlay.jsx";
import ModelSidebar from "@/components/helios/ModelSidebar.jsx";

import Landing from "@/pages/Landing.jsx";
import Solar from "@/pages/Solar.jsx";
import Threat from "@/pages/Threat.jsx";
import ISS from "@/pages/ISS.jsx";
import Earth from "@/pages/Earth.jsx";
import Arcade from "@/pages/Arcade.jsx";

export default function App() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    let fired = false;
    const trigger = () => { if (fired) return; fired = true; setSidebarVisible(true); };
    const onWheel  = (e) => { if (e.deltaY > 0) trigger(); };
    const onScroll = ()  => { if (window.scrollY > 40) trigger(); };
    window.addEventListener("wheel",  onWheel,  { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel",  onWheel);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="helios-root min-h-screen bg-[#050505] text-[#cfcfcf] flex flex-col">
      <BrowserRouter>
        <Marquee position="top" />
        <ScanlineOverlay />
        <ModelSidebar visible={sidebarVisible} />

        <main className="flex-1 relative">
          {/*
            AnimatePresence removed from here — wrapping Routes causes it to
            unmount/remount the active route on every internal state change
            (e.g. setScore, setPhase), which tears down the Arcade game loop
            instantly. Add AnimatePresence inside individual pages that need
            enter/exit motion instead.
          */}
          <Routes>
            <Route path="/"       element={<Landing />} />
            <Route path="/solar"  element={<Solar />}   />
            <Route path="/threat" element={<Threat />}  />
            <Route path="/iss"    element={<ISS />}     />
            <Route path="/earth"  element={<Earth />}   />
            <Route path="*"       element={<Arcade />}  />
          </Routes>
        </main>

        <Marquee position="bottom" />
      </BrowserRouter>
    </div>
  );
}