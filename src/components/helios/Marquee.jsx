import { HELIOS } from "@/constants/testIds.js";

const LOGS = [
  "SYSTEMS NOMINAL",
  "LEO CONSTELLATION SECURE",
  "RADAR SWEEP ACTIVE",
  "ORBITAL NODES ONLINE",
  "DSCOVR LINK STABLE",
  "GOES-18 TELEMETRY LOCKED",
  "AURORAL OVAL QUIET",
  "GROUND SEGMENT GREEN",
  "SENTINEL UPLINK 99.7%",
  "TIME SYNC :: GPS"
];

const FULL = `${LOGS.join("  //  ")}  //  `;

export default function Marquee({ position = "top" }) {
  return (
    <div
      data-testid={HELIOS.marquee}
      className={`helios-marquee ${position === "top" ? "border-b" : "border-t"} border-[#00FF88]/30 bg-[#040404] text-[#00FF88]`}
    >
      <div className="helios-marquee__track">
        <span>{FULL}</span>
        <span aria-hidden="true">{FULL}</span>
        <span aria-hidden="true">{FULL}</span>
      </div>
    </div>
  );
}

