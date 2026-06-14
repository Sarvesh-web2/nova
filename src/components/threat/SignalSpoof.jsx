import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function SignalSpoof() {
  const containerRef = useRef(null);
  const radarCanvasRef = useRef(null);
  const statusRef = useRef(null);
  const telFRef = useRef(null);
  const telRRef = useRef(null);
  const telPRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const radarCanvas = radarCanvasRef.current;
    if (!container || !radarCanvas) return;

    const rctx = radarCanvas.getContext("2d");

    // ─── RENDERER (Cleanly bounds the height to 340px) ────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, 340);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ─── SCENE / CAMERA (Centered Projection) ──────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / 340, 0.1, 1000);
    camera.position.set(0, 6, 12);

    // ─── CONTROLS (Scroll-behavior bypass fixed here) ─────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    // Bypasses canvas locking so you can scroll the webpage past the simulation
    controls.enableZoom = false; 

    // ─── LIGHTING ────────────────────────────────
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(5, 4, 5);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // ─── EARTH (Locked explicitly to the 0,0,0 center) ───────────────────
    const loader = new THREE.TextureLoader();
    const earthTexture = loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg");
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(2, 64, 64), 
      new THREE.MeshPhongMaterial({ map: earthTexture })
    );
    earth.position.set(0, 0, 0);
    scene.add(earth);

    // ─── ORBIT LINE ──────────────────────────────
    const orbitPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(a) * 4, 0, Math.sin(a) * 4));
    }
    const orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbitPts),
      new THREE.LineBasicMaterial({ color: 0x00ccaa, transparent: true, opacity: 0.3 })
    );
    scene.add(orbitLine);

    // ─── SATELLITE ───────────────────────────────
    const satGroup = new THREE.Group();
    satGroup.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.28), 
      new THREE.MeshPhongMaterial({ color: 0xbbddff })
    ));
    scene.add(satGroup);

    // ─── SPOOF RINGS (Anchored tightly to the orbital plane) ───────────
    const spoofRings = [];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.RingGeometry(0.05, 0.15, 64);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);
      spoofRings.push({ mesh, delay: i * 0.4, localT: -(i * 0.4) });
    }

    // ─── CANVAS RADAR PANEL ──────────────────
    let radarAngle = 0;
    let radarBlips = [];

    function drawRadar(active) {
      const W = 70, H = 70, cx = 35, cy = 35, R = 32;
      rctx.clearRect(0, 0, W, H);
      rctx.fillStyle = "rgba(0,12,10,0.85)";
      rctx.beginPath(); rctx.arc(cx, cy, R, 0, Math.PI * 2); rctx.fill();

      [0.5, 1].forEach((f) => {
        rctx.strokeStyle = "rgba(0,255,180,0.15)";
        rctx.lineWidth = 0.5;
        rctx.beginPath(); rctx.arc(cx, cy, R * f, 0, Math.PI * 2); rctx.stroke();
      });

      if (active) {
        rctx.save();
        rctx.translate(cx, cy);
        rctx.rotate(radarAngle);
        const sweepGrad = rctx.createLinearGradient(0, 0, R, 0);
        sweepGrad.addColorStop(0, "rgba(0,255,180,0.4)");
        sweepGrad.addColorStop(1, "rgba(0,255,180,0)");
        rctx.fillStyle = sweepGrad;
        rctx.beginPath(); rctx.moveTo(0, 0); rctx.arc(0, 0, R, -0.2, 0.2); rctx.closePath(); rctx.fill();
        rctx.restore();

        radarBlips.forEach((b) => {
          b.age += 0.016;
          const alpha = Math.max(0, 1 - b.age / 1.5);
          rctx.fillStyle = `rgba(0,255,180,${alpha})`;
          rctx.beginPath(); rctx.arc(cx + b.x * R, cy + b.y * R, 2, 0, Math.PI * 2); rctx.fill();
        });
        radarBlips = radarBlips.filter((b) => b.age < 1.5);
      }
      rctx.strokeStyle = "rgba(0,255,180,0.3)";
      rctx.beginPath(); rctx.arc(cx, cy, R, 0, Math.PI * 2); rctx.stroke();
    }

    // ─── STATE ENGINE ────────────────────
    let satAngle = 0;
    let spoofT = -1;
    let pulseCount = 0;
    let lastPulseT = 0;

    const handleFire = () => {
      spoofT = 0;
      pulseCount = 0;
      spoofRings.forEach((r) => { r.localT = -r.delay; });
      if (btnRef.current) btnRef.current.disabled = true;
      if (statusRef.current) statusRef.current.textContent = "CMD-42 ► SPOOF RUNNING — INJECTING GHOST SIGNATURES";

      setTimeout(() => {
        spoofT = -1;
        spoofRings.forEach((r) => { r.mesh.material.opacity = 0; });
        if (btnRef.current) btnRef.current.disabled = false;
        if (statusRef.current) statusRef.current.textContent = "SIGNAL SPOOF — ARMED AND READY";
      }, 8000);
    };

    const fireBtn = btnRef.current;
    if (fireBtn) fireBtn.addEventListener("click", handleFire);

    const clock = new THREE.Clock();
    let animationFrameId;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      earth.rotation.y += 0.001;
      satAngle += 0.007;
      
      // Fixed spatial coordinates loop
      satGroup.position.set(Math.cos(satAngle) * 4, 0, Math.sin(satAngle) * 4);

      if (spoofT >= 0) {
        spoofT += dt;
        spoofRings.forEach((r) => {
          r.localT += dt;
          if (r.localT < 0) return;
          const cycle = r.localT % 2.0;
          r.mesh.scale.setScalar(0.2 + cycle * 5);
          r.mesh.material.opacity = Math.max(0, 0.7 - (cycle / 2.0) * 0.8);
          r.mesh.position.copy(satGroup.position);
        });

        const freq = 2.4 + Math.sin(spoofT * 4) * 0.6;
        if (telFRef.current) telFRef.current.textContent = freq.toFixed(2) + " GHz";
        if (telRRef.current) telRRef.current.textContent = Math.min(spoofT * 12, 90).toFixed(0) + " dB";

        if (spoofT - lastPulseT > 0.4) {
          pulseCount++;
          lastPulseT = spoofT;
          const angle = Math.random() * Math.PI * 2;
          const dist = 0.2 + Math.random() * 0.7;
          radarBlips.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, age: 0 });
        }
        if (telPRef.current) telPRef.current.textContent = pulseCount;
        radarAngle += dt * 3;
      } else {
        if (telFRef.current) telFRef.current.textContent = "0.00 GHz";
        if (telRRef.current) telRRef.current.textContent = "0 dB";
        if (telPRef.current) telPRef.current.textContent = "0";
      }

      drawRadar(spoofT >= 0);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / 340;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, 340);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (fireBtn) fireBtn.removeEventListener("click", handleFire);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col bg-[#020202]">
      <div className="relative w-full h-[340px]">
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute bottom-3 right-3 border border-[#00ffcc]/30 p-1 bg-black/80 rounded z-20">
          <canvas ref={radarCanvasRef} width={70} height={70} />
          <div className="text-[8px] font-mono text-center text-[#00ffcc] mt-0.5">FEED: FALSE_GHOST</div>
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] p-3 font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#040404] text-[#888]">
        <div>EMISSION: <span ref={telFRef} className="text-[#00ffcc]">0.00 GHz</span></div>
        <div>GAIN EFF: <span ref={telRRef} className="text-[#00ffcc]">0 dB</span></div>
        <div>BLIPS SEEDED: <span ref={telPRef} className="text-white font-bold">0</span></div>
        <button ref={btnRef} className="bg-[#111] hover:bg-[#222] border border-[#00ffcc]/40 hover:border-[#00ffcc] text-[#00ffcc] uppercase tracking-wider text-[10px] py-0.5 px-2 transition-all disabled:opacity-30 disabled:pointer-events-none">
          BROADCAST SPOOF
        </button>
        <div className="col-span-2 sm:col-span-4 border-t border-[#111] pt-1.5 mt-1 text-[10px] tracking-wide text-gray-500 uppercase">
          ELECTRONIC RECON :: <span ref={statusRef} className="text-gray-400">SIGNAL SPOOF — ARMED AND READY</span>
        </div>
      </div>
    </div>
  );
}