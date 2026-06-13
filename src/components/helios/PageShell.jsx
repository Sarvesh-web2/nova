import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { HELIOS } from "@/constants/testIds.js";

export default function PageShell({ code, title, subtitle, statusColor = "#00FF88", children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-[#1c1c1c]">
        <div>
          <Link
            to="/"
            data-testid={HELIOS.backLink}
            className="inline-flex items-center gap-2 text-xs tracking-[0.35em] text-[#666] hover:text-[#00FF88] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
            BACK TO COMMAND
          </Link>
          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <span className="text-[10px] tracking-[0.4em]" style={{ color: statusColor }}>
              &gt; {code}
            </span>
            <h1 className="text-2xl sm:text-4xl uppercase tracking-tight leading-none" style={{ color: statusColor }}>
              {title}
            </h1>
          </div>
          {subtitle && <div className="text-xs tracking-[0.3em] text-[#666] mt-2 uppercase">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-[#666]">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
          />
          LINK SECURE :: {new Date().toISOString().slice(11, 19)}Z
        </div>
      </div>
      {children}
    </motion.div>
  );
}

