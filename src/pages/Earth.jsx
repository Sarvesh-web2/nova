import EarthModel from "../components/earth/EarthModel";
import EarthControlsPanel from "../components/earth/EarthControlsPanel";

export default function Earth() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <EarthModel />
      <EarthControlsPanel />
    </div>
  );
}