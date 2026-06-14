import { Link } from "react-router-dom";

export default function ModelSidebar({
  open,
  setOpen,
  activeModel,
  setActiveModel,
}) {
  const models = [
    { name: "Earth", route: "/earth" },
    { name: "Solar", route: "/solar" },
    { name: "Threat", route: "/threat" },
    { name: "ISS", route: "/iss" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-[9999]
        bg-black/80 border border-cyan-500
        px-3 py-2 rounded text-cyan-400"
      >
        {open ? "✕" : "☰"}
      </button>

      <aside
        className={`
        fixed top-0 left-0 h-screen w-72
        bg-black/95 border-r border-cyan-500
        z-[9998]
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6">
          <h2 className="text-cyan-400 text-xl font-bold mb-6">
            HELIOS MODELS
          </h2>

          {models.map((model) => (
            <Link
              key={model.name}
              to={model.route}
              onClick={() => setActiveModel(model.name)}
              className={`
              block mb-3 p-3 rounded
              border border-cyan-500/20
              hover:border-cyan-400
              hover:bg-cyan-500/10
            `}
            >
              {activeModel === model.name ? "● " : ""}
              {model.name}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}