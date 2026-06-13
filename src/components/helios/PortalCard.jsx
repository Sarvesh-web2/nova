import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function PortalCard({
  index = 0,
  code,
  title,
  subtitle,
  description,
  to,
  Icon,
  variant = "green",
  testId
}) {
  const navigate = useNavigate();
  const isAlert = variant === "alert";
  const accent = isAlert ? "#FF2D2D" : "#00FF88";

  return (
    <motion.button
      data-testid={testId}
      type="button"
      onClick={() => navigate(to)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={{ y: -6, scale: 1.015, transition: { type: "spring", stiffness: 320, damping: 22 } }}
      whileTap={{ scale: 0.985 }}
      className="group relative text-left bg-[#070707] border overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
      style={{ borderColor: "#1d1d1d", borderRadius: 0 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderRadius = "18px";
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}, 0 0 38px ${accent}55, inset 0 0 28px ${accent}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderRadius = "0px";
        e.currentTarget.style.borderColor = "#1d1d1d";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 helios-grid opacity-[0.08] group-hover:opacity-[0.18] transition-opacity" />
      {["top-2 left-2 border-l border-t", "top-2 right-2 border-r border-t", "bottom-2 left-2 border-l border-b", "bottom-2 right-2 border-r border-b"].map((cls) => (
        <span key={cls} aria-hidden="true" className={`absolute w-3 h-3 ${cls}`} style={{ borderColor: accent }} />
      ))}
      <div className="relative z-10 p-7 sm:p-9 flex flex-col h-full min-h-[300px] sm:min-h-[340px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.4em] opacity-70" style={{ color: accent }}>
            &gt; {code}
          </span>
          <span className="text-[10px] tracking-[0.3em] text-[#666]">MODULE {index + 1}/3</span>
        </div>
        <div className="mt-10 flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center border" style={{ borderColor: accent, color: accent }}>
            <Icon className="w-6 h-6" strokeWidth={1.4} />
          </div>
          <div className="text-xs tracking-[0.35em] text-[#666] uppercase">{subtitle}</div>
        </div>
        <h2 className="mt-6 text-2xl sm:text-3xl uppercase tracking-tight leading-none" style={{ color: accent }}>
          {title}
        </h2>
        <p className="mt-5 text-sm leading-6 text-[#888]">{description}</p>
        <div className="mt-auto pt-8 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.35em] text-[#555]">READY</span>
          <span className="text-xs tracking-[0.35em]" style={{ color: accent }}>ENTER</span>
        </div>
      </div>
    </motion.button>
  );
}

