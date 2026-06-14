import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import "./App.css";

import Marquee from "@/components/helios/Marquee.jsx";
import ScanlineOverlay from "@/components/helios/ScanlineOverlay.jsx";
import ModelSidebar from "@/components/helios/ModelSidebar.jsx";

import Landing from "@/pages/Landing.jsx";
import Solar from "@/pages/Solar.jsx";
import Threat from "@/pages/Threat.jsx";
import ISS from "@/pages/ISS.jsx";
import Earth from "@/pages/Earth.jsx";

const NotFound = () => <div>404</div>;

export default function App() {
  const [bootFinished, setBootFinished] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModel, setActiveModel] = useState(null);
  useEffect(() => {
  const timer = setTimeout(() => {
    setBootFinished(true);
  }, 3200); // slightly longer than BootSequence

  return () => clearTimeout(timer);
}, []);
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 0 && activeModel === null) {
        setSidebarOpen(true);
        setActiveModel("earth");
      }
    };

    window.addEventListener("wheel", handleWheel, {
      passive: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [activeModel]);

  return (
    <BrowserRouter>
      <div className="helios-root min-h-screen bg-[#050505] text-[#cfcfcf] flex flex-col">
        {bootFinished && (
  <ModelSidebar
    open={sidebarOpen}
    setOpen={setSidebarOpen}
    activeModel={activeModel}
    setActiveModel={setActiveModel}
  />
)}

        <Marquee position="top" />
        <ScanlineOverlay />

        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/earth" element={<Earth />} />
              <Route path="/solar" element={<Solar />} />
              <Route path="/threat" element={<Threat />} />
              <Route path="/iss" element={<ISS />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Marquee position="bottom" />
      </div>
    </BrowserRouter>
  );
}