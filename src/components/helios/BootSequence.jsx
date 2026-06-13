import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HELIOS } from "@/constants/testIds.js";

const STAGES = [
  "INITIALIZING SATELLITE NETWORK...",
  "CONNECTING DETECTOR SENSORS...",
  "ACCESSING HELIOS ENGINE..."
];
const HEX = "ABCDEF0123456789";
const decryptChar = () => HEX[Math.floor(Math.random() * HEX.length)];
const decryptLine = (len = 48) => Array.from({ length: len }).map(decryptChar).join("");

export default function BootSequence({ onComplete, duration = 3000 }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [matrix, setMatrix] = useState(() => Array.from({ length: 10 }).map(() => decryptLine()));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const perStage = duration / STAGES.length;
    const stageTimer = setInterval(() => setStageIndex((s) => Math.min(s + 1, STAGES.length - 1)), perStage);
    const matrixTimer = setInterval(() => setMatrix((m) => m.map((_, i) => decryptLine(i % 2 === 0 ? 48 : 56))), 90);
    const progressTimer = setInterval(() => setProgress((p) => Math.min(p + 100 / (duration / 60), 100)), 60);
    const completeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 600);
    }, duration);

    return () => {
      clearInterval(stageTimer);
      clearInterval(matrixTimer);
      clearInterval(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid={HELIOS.bootSequence}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[80] bg-[#030303] text-[#00FF88] flex flex-col font-mono overflow-hidden"
        >
          <div className="absolute inset-0 helios-grid opacity-40" aria-hidden="true" />
          <div className="absolute top-6 left-6 text-xs tracking-[0.3em] opacity-80">HELIOS // BOOT</div>
          <div className="absolute top-6 right-6 text-xs tracking-[0.3em] opacity-80">CLEARANCE 7-ECHO</div>
          <div className="absolute bottom-6 left-6 text-xs tracking-[0.3em] opacity-80">NODE :: SENTINEL-01</div>
          <div className="absolute bottom-6 right-6 text-xs tracking-[0.3em] opacity-80">
            {new Date().toISOString().slice(0, 19)}Z
          </div>
          <div className="relative z-10 flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-3xl">
              <pre className="mb-8 text-[10px] sm:text-xs leading-[1.1] text-[#00FF88]/30 whitespace-pre select-none">
                {matrix.join("\n")}
              </pre>
              <div className="border border-[#00FF88]/40 bg-black/40 p-6">
                <div className="text-xs tracking-[0.3em] text-[#00FF88]/60 mb-4">
                  SECURE HANDSHAKE :: PROTOCOL OMEGA
                </div>
                {STAGES.map((stage, i) => {
                  const isDone = i < stageIndex;
                  const isActive = i === stageIndex;
                  return (
                    <motion.div
                      key={stage}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <span className={`text-xs w-3 ${isDone || isActive ? "text-[#00FF88]" : "text-[#222]"}`}>
                        {isDone ? "OK" : isActive ? ">" : "."}
                      </span>
                      <span
                        className={`text-sm sm:text-base tracking-wider ${isDone ? "text-[#00FF88]" : isActive ? "text-[#00FF88] helios-flicker" : "text-[#333]"}`}
                      >
                        {stage}
                      </span>
                    </motion.div>
                  );
                })}
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] tracking-[0.3em] text-[#00FF88]/60 mb-1.5">
                    <span>DECRYPTING</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-[#00FF88]/15 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#00FF88]"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear" }}
                      style={{ boxShadow: "0 0 12px #00FF88" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <motion.div
            aria-hidden="true"
            className="absolute left-0 right-0 h-[2px] bg-[#00FF88]/40"
            style={{ boxShadow: "0 0 20px #00FF88" }}
            initial={{ top: "-2px" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

