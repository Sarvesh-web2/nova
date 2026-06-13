import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const issApiUrl = process.env.ISS_API_URL || "https://api.wheretheiss.at/v1/satellites/25544";

app.use(cors());
app.use(express.json());

let mockPhase = 0;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mockIssTelemetry() {
  mockPhase += 0.015;
  return {
    latitude: Math.sin(mockPhase) * 51.6,
    longitude: ((mockPhase * 60) % 360) - 180,
    altitude: 408 + Math.sin(mockPhase * 2) * 6,
    velocity: 27580 + Math.cos(mockPhase * 1.3) * 60,
    timestamp: Math.floor(Date.now() / 1000),
    source: "MOCK"
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "helios-sentinel" });
});

app.get("/api/iss/telemetry", async (_req, res) => {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const response = await fetch(issApiUrl, { signal: ctl.signal });
    clearTimeout(timer);

    if (!response.ok) throw new Error(`ISS API status ${response.status}`);
    const d = await response.json();

    res.json({
      latitude: d.latitude,
      longitude: d.longitude,
      altitude: d.altitude,
      velocity: d.velocity,
      timestamp: d.timestamp,
      source: "LIVE"
    });
  } catch (error) {
    res.json(mockIssTelemetry());
  }
});

app.get("/api/solar/status", async (_req, res) => {
  await delay(120);
  const flares = ["B1.2", "C3.4", "M1.0", "X1.8", "C7.2", "M2.5"];
  res.json({
    kpIndex: +(Math.random() * 6 + 1).toFixed(2),
    solarWind: Math.floor(380 + Math.random() * 240),
    flareClass: flares[Math.floor(Math.random() * flares.length)],
    cmeProbability: Math.floor(Math.random() * 80) + 10,
    updatedAt: new Date().toISOString()
  });
});

app.get("/api/solar/feed", async (_req, res) => {
  await delay(150);
  res.json([
    { id: "evt-401", t: "T-00:02:14", msg: "CORONAL HOLE 812 - high-speed stream inbound" },
    { id: "evt-402", t: "T-00:18:42", msg: "GOES-18 X-RAY FLUX nominal, monitoring band C" },
    { id: "evt-403", t: "T-01:04:09", msg: "DSCOVR magnetometer Bz flipped negative" },
    { id: "evt-404", t: "T-02:31:55", msg: "NOAA SWPC issued G1 minor storm watch" },
    { id: "evt-405", t: "T-03:47:11", msg: "Proton event probability < 12% next 24h" },
    { id: "evt-406", t: "T-05:12:08", msg: "SOHO LASCO C2 - no Earth-directed CME detected" }
  ]);
});

app.get("/api/threat/targets", async (_req, res) => {
  await delay(100);
  res.json([
    { id: "TGT-077", designation: "DEBRIS CLUSTER 2024-F3", range: 412, vector: "PRO" },
    { id: "TGT-091", designation: "UNCLASSIFIED OBJECT", range: 1180, vector: "RET" },
    { id: "TGT-104", designation: "SATELLITE FRAGMENT", range: 84, vector: "NORM" }
  ]);
});

app.post("/api/threat/action", async (req, res) => {
  await delay(80);
  const action = String(req.body?.action || "unknown");
  res.json({
    ok: true,
    action,
    timestamp: new Date().toISOString(),
    confirmation: `ACK :: ${action.toUpperCase()} :: AUTH 7-NOVEMBER-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`
  });
});

app.listen(port, () => {
  console.log(`HELIOS backend listening on http://localhost:${port}`);
});

