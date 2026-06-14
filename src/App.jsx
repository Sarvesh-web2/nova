import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "./App.css";

import Marquee from "@/components/helios/Marquee.jsx";
import ScanlineOverlay from "@/components/helios/ScanlineOverlay.jsx";
import ModelSidebar from "@/components/helios/ModelSidebar.jsx";

import Landing from "@/pages/Landing.jsx";
import Solar from "@/pages/Solar.jsx";
import Threat from "@/pages/Threat.jsx";
import ISS from "@/pages/ISS.jsx";
import Earth from "@/pages/Earth.jsx";
// 👉 Your new Easter Egg game import
import Arcade from "@/pages/Arcade.jsx"; 

export default function App() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    let fired = false;

    const trigger = () => {
      if (fired) return;
      fired = true;
      setSidebarVisible(true);
    };

    // First downward wheel scroll
    const onWheel = (e) => { if (e.deltaY > 0) trigger(); };
    // Or any scroll past 40 px
    const onScroll = () => { if (window.scrollY > 40) trigger(); };

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

        {/* Sidebar lives outside <main> so it overlays all routes */}
        <ModelSidebar visible={sidebarVisible} />

        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/"       element={<Landing />} />
              <Route path="/solar"  element={<Solar />}   />
              <Route path="/threat" element={<Threat />}  />
              <Route path="/iss"    element={<ISS />}     />
              <Route path="/earth"  element={<Earth />}   />
              
              {/* THE EASTER EGG CATCH-ALL */}
              {/* Any broken link automatically launches Orbital Evasion */}
              <Route path="*"       element={<Arcade />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Marquee position="bottom" />
      </BrowserRouter>
    </div>
  );
}