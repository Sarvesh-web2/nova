import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "./App.css";
import Marquee from "@/components/helios/Marquee.jsx";
import ScanlineOverlay from "@/components/helios/ScanlineOverlay.jsx";
import Landing from "@/pages/Landing.jsx";
import Solar from "@/pages/Solar.jsx";
import Threat from "@/pages/Threat.jsx";
import ISS from "@/pages/ISS.jsx";

const NotFound = () => (
  <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
    <div>
      <div className="text-xs tracking-[0.4em] text-[#FF2D2D] mb-3">ERR 404</div>
      <h1 className="text-3xl sm:text-5xl text-[#00FF88] uppercase tracking-tight">SIGNAL LOST</h1>
      <p className="text-sm text-[#777] mt-3">The requested module is offline.</p>
      <Link
        to="/"
        className="inline-block mt-6 border border-[#00FF88] text-[#00FF88] px-5 py-2 text-xs tracking-[0.35em] uppercase hover:bg-[#00FF88] hover:text-black transition-colors"
      >
        return to command
      </Link>
    </div>
  </div>
);

export default function App() {
  return (
    <div className="helios-root min-h-screen bg-[#050505] text-[#cfcfcf] flex flex-col">
      <BrowserRouter>
        <Marquee position="top" />
        <ScanlineOverlay />
        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/solar" element={<Solar />} />
              <Route path="/threat" element={<Threat />} />
              <Route path="/iss" element={<ISS />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Marquee position="bottom" />
      </BrowserRouter>
    </div>
  );
}

