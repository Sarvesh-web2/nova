export default function EarthControlsPanel() {
  return (
    <div
      className="
      fixed right-4 top-4
      w-80
      bg-black/80
      border border-cyan-500
      rounded-lg
      p-4
      z-[500]
    "
    >
      <h2 className="text-cyan-400 text-lg font-bold">
        EARTH CONTROL PANEL
      </h2>

      <div className="mt-4">
        <button
          className="
          w-full
          border border-cyan-500
          p-2 rounded
          mb-2
        "
        >
          Add Satellite
        </button>

        <button
          className="
          w-full
          border border-cyan-500
          p-2 rounded
          mb-2
        "
        >
          Toggle ISS
        </button>

        <button
          className="
          w-full
          border border-cyan-500
          p-2 rounded
        "
        >
          Toggle Trajectories
        </button>
      </div>
    </div>
  );
}