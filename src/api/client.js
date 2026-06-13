const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) throw new Error(`API ${path} failed with ${res.status}`);
  return res.json();
}

export const fetchIssTelemetry = () => request("/api/iss/telemetry");
export const fetchSolarStatus = () => request("/api/solar/status");
export const fetchSolarFeed = () => request("/api/solar/feed");
export const fetchThreatTargets = () => request("/api/threat/targets");
export const logTacticalAction = (action) =>
  request("/api/threat/action", {
    method: "POST",
    body: JSON.stringify({ action })
  });

