import { HELIOS } from "@/constants/testIds.js";

export default function ScanlineOverlay() {
  return (
    <div
      data-testid={HELIOS.scanlineOverlay}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] helios-scanlines"
    />
  );
}

