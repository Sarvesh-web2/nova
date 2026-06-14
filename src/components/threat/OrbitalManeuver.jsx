import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function OrbitalManeuver() {
  const containerRef = useRef(null);
  const statusRef = useRef(null);
  const telRRef = useRef(null);
  const telARef = useRef(null);
  const telPRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── RENDERER ────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, 340);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ─── SCENE / CAMERA ──────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / 340, 0.1, 1000);
    camera.position.set(0, 5, 11);

    // ─── CONTROLS ────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 25;

    // ─── LIGHTING ────────────────────────────────
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    // ─── TEXTURES ────────────────────────────────
    const loader = new THREE.TextureLoader();
    const earthTexture    = loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg");
    const normalTexture   = loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg");
    const specularTexture = loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg");

    // ─── EARTH ───────────────────────────────────
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(2, 64, 64),
      new THREE.MeshPhongMaterial({
        map: earthTexture,
        normalMap: normalTexture,
        specularMap: specularTexture,
        specular: new THREE.Color("grey"),
      })
    );
    scene.add(earth);

    // ─── SATELLITE ───────────────────────────────
    const satGroup = new THREE.Group();
    satGroup.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.1, 0.28),
      new THREE.MeshPhongMaterial({ color: 0xbbddff, emissive: 0x112233 })
    ));
    [-1, 1].forEach((s) => {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.025, 0.12),
        new THREE.MeshPhongMaterial({ color: 0x1133bb, emissive: 0x001133 })
      );
      panel.position.x = s * 0.22;
      satGroup.add(panel);
    });
    scene.add(satGroup);

    // ─── ORBIT LINES ─────────────────────────────
    function makeOrbitLine(rx, rz, color, opacity = 0.5) {
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity })
      );
      return line;
    }

    const orbit1 = makeOrbitLine(4, 4, 0x2288ff, 0.5);
    const orbit2 = makeOrbitLine(6.2, 5.2, 0x00ffaa, 0.0);
    scene.add(orbit1);
    scene.add(orbit2);

    const arcPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI;
      const rx = (4 + 6.2) / 2;
      const rz = (4 + 5.2) / 2;
      arcPts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz));
    }
    const transferArc = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPts),
      new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 })
    );
    scene.add(transferArc);

    // ─── STATE & INTERACTIONS ────────────────────
    let satAngle = 0;
    let curRX = 4, curRZ = 4;
    let maneuverT = -1;
    let maneuverDone = false;
    let phase = "STANDBY";

    const handleFire = () => {
      if (maneuverT >= 0 && !maneuverDone) return;
      maneuverT = 0;
      maneuverDone = false;
      curRX = 4; curRZ = 4;
      phase = "BURN";
      orbit2.material.opacity = 0.3;
      transferArc.material.opacity = 0.6;
      if (btnRef.current) btnRef.current.disabled = true;
      if (statusRef.current) statusRef.current.textContent = "CMD-77 ► BURN INITIATED — DELTA-V APPLIED";
    };

    const fireBtn = btnRef.current;
    if (fireBtn) fireBtn.addEventListener("click", handleFire);

    // ─── ANIMATION LOOP ──────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      earth.rotation.y += 0.001;

      if (maneuverT >= 0 && !maneuverDone) {
        maneuverT += dt;
        const dur = 5.0;
        const p = Math.min(maneuverT / dur, 1);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

        curRX = 4 + (6.2 - 4) * ease;
        curRZ = 4 + (5.2 - 4) * ease;

        if (p < 0.3) {
          phase = "BURN";
          if (statusRef.current) statusRef.current.textContent = "CMD-77 ► ENGINE BURN — APOGEE RAISING...";
        } else if (p < 0.9) {
          phase = "TRANSFER";
          if (statusRef.current) statusRef.current.textContent = "CMD-77 ► HOHMANN TRANSFER IN PROGRESS...";
          transferArc.material.opacity = 0.6 * (1 - (p - 0.3) / 0.6);
        } else {
          phase = "CIRCULARIZE";
          if (statusRef.current) statusRef.current.textContent = "CMD-77 ► CIRCULARIZATION BURN...";
        }

        if (p >= 1) {
          maneuverDone = true;
          transferArc.material.opacity = 0;
          orbit1.material.opacity = 0;
          orbit2.material.opacity = 0.55;
          phase = "COMPLETE";
          if (statusRef.current) statusRef.current.textContent = "CMD-77 ► NEW ORBIT ESTABLISHED — MISSION SUCCESS";

          setTimeout(() => {
            orbit1.material.opacity = 0.5;
            orbit2.material.opacity = 0;
            curRX = 4; curRZ = 4;
            maneuverT = -1;
            maneuverDone = false;
            phase = "STANDBY";
            if (btnRef.current) btnRef.current.disabled = false;
            if (statusRef.current) statusRef.current.textContent = "AWAITING BURN AUTHORIZATION";
          }, 6000);
        }
      }

      satAngle += 0.007;
      satGroup.position.set(
        Math.cos(satAngle) * curRX,
        Math.sin(satAngle * 0.2) * 0.35,
        Math.sin(satAngle) * curRZ
      );
      satGroup.rotation.y = -satAngle + Math.PI / 2;

      const r = Math.sqrt(satGroup.position.x ** 2 + satGroup.position.z ** 2);
      if (telRRef.current) telRRef.current.textContent = r.toFixed(2) + " u";
      if (telARef.current) telARef.current.textContent = Math.round((satAngle * 180 / Math.PI) % 360) + "°";
      if (telPRef.current) telPRef.current.textContent = phase;

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
      <div ref={containerRef} className="w-full h-[340px]" />
      <div className="border-t border-[#1a1a1a] p-3 font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#040404] text-[#888]">
        <div>RADIUS: <span ref={telRRef} className="text-[#00FF88]">4.00 u</span></div>
        <div>TRUE ANOMALY: <span ref={telARef} className="text-[#00FF88]">0°</span></div>
        <div>PHASE: <span ref={telPRef} className="text-cyan-400 font-bold">STANDBY</span></div>
        <button ref={btnRef} className="bg-[#111] hover:bg-[#222] border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 uppercase tracking-wider text-[10px] py-0.5 px-2 transition-all disabled:opacity-30 disabled:pointer-events-none">
          EXECUTE BURN
        </button>
        <div className="col-span-2 sm:col-span-4 border-t border-[#111] pt-1.5 mt-1 text-[10px] tracking-wide text-gray-500 uppercase">
          SYSTEM STATUS :: <span ref={statusRef} className="text-gray-400">AWAITING BURN AUTHORIZATION</span>
        </div>
      </div>
    </div>
  );
}