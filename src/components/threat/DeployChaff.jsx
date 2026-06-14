import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function DeployChaff() {
  const containerRef = useRef(null);
  const statusRef = useRef(null);
  const telSRef = useRef(null);
  const telORef = useRef(null);
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
    controls.minDistance = 3;
    controls.maxDistance = 25;

    // ─── LIGHTING ────────────────────────────────
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    // ─── TEXTURES ────────────────────────────────
    const loader = new THREE.TextureLoader();
    const earthTexture = loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg");

    // ─── EARTH ───────────────────────────────────
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(2, 64, 64),
      new THREE.MeshPhongMaterial({ map: earthTexture })
    );
    scene.add(earth);

    // ─── ORBIT LINE ──────────────────────────────
    const orbitPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(a) * 4, 0, Math.sin(a) * 4));
    }
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbitPts),
      new THREE.LineBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.35 })
    ));

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

    // ─── CHAFF PARTICLES ─────────────────────────
    const CHAFF_N = 800;
    const chaffPos = new Float32Array(CHAFF_N * 3);
    const chaffVel = Array.from({ length: CHAFF_N }, () => new THREE.Vector3());
    const chaffGeo = new THREE.BufferGeometry();
    chaffGeo.setAttribute("position", new THREE.Float32BufferAttribute(chaffPos, 3));

    const chaffMat1 = new THREE.PointsMaterial({ color: 0xffcc44, size: 0.06, transparent: true, opacity: 0 });
    const chaffMat2 = new THREE.PointsMaterial({ color: 0xaaddff, size: 0.04, transparent: true, opacity: 0 });

    const chaffPos2 = new Float32Array(CHAFF_N * 3);
    const chaffVel2 = Array.from({ length: CHAFF_N }, () => new THREE.Vector3());
    const chaffGeo2 = new THREE.BufferGeometry();
    chaffGeo2.setAttribute("position", new THREE.Float32BufferAttribute(chaffPos2, 3));

    scene.add(new THREE.Points(chaffGeo, chaffMat1));
    scene.add(new THREE.Points(chaffGeo2, chaffMat2));

    // ─── STATE & INTERACTIONS ────────────────────
    let satAngle = 0;
    let chaffT = -1;

    const handleFire = () => {
      chaffT = 0;
      const pos = satGroup.position;
      const pa1 = chaffGeo.attributes.position;
      const pa2 = chaffGeo2.attributes.position;

      for (let i = 0; i < CHAFF_N; i++) {
        pa1.setXYZ(i, pos.x, pos.y, pos.z);
        pa2.setXYZ(i, pos.x, pos.y, pos.z);

        chaffVel[i].set((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15);
        chaffVel2[i].set((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08);
      }
      pa1.needsUpdate = true;
      pa2.needsUpdate = true;
      chaffMat1.opacity = 1;
      chaffMat2.opacity = 0.7;

      if (btnRef.current) btnRef.current.disabled = true;
      if (statusRef.current) statusRef.current.textContent = "CMD-18 ► CHAFF DEPLOYED — RADAR MASK ACTIVE";

      setTimeout(() => {
        if (btnRef.current) btnRef.current.disabled = false;
        if (statusRef.current) statusRef.current.textContent = "RADAR DECOY — READY FOR DEPLOYMENT";
      }, 6500);
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
      satAngle += 0.007;
      satGroup.position.set(Math.cos(satAngle) * 4, Math.sin(satAngle * 0.2) * 0.35, Math.sin(satAngle) * 4);
      satGroup.rotation.y = -satAngle + Math.PI / 2;

      if (chaffT >= 0) {
        chaffT += dt;
        const pa1 = chaffGeo.attributes.position;
        const pa2 = chaffGeo2.attributes.position;

        for (let i = 0; i < CHAFF_N; i++) {
          pa1.setXYZ(i, pa1.getX(i) + chaffVel[i].x, pa1.getY(i) + chaffVel[i].y, pa1.getZ(i) + chaffVel[i].z);
          pa2.setXYZ(i, pa2.getX(i) + chaffVel2[i].x, pa2.getY(i) + chaffVel2[i].y, pa2.getZ(i) + chaffVel2[i].z);
          chaffVel[i].multiplyScalar(0.96);
          chaffVel2[i].multiplyScalar(0.97);
        }
        pa1.needsUpdate = true;
        pa2.needsUpdate = true;

        if (chaffT > 2) {
          const fade = Math.max(0, 1 - (chaffT - 2) / 4);
          chaffMat1.opacity = fade;
          chaffMat2.opacity = fade * 0.7;
        }
        if (chaffT > 6.5) {
          chaffT = -1;
          chaffMat1.opacity = 0;
          chaffMat2.opacity = 0;
        }

        const spread = Math.min(chaffT * 0.4, 2.5);
        if (telSRef.current) telSRef.current.textContent = spread.toFixed(2) + " u";
        if (telORef.current) telORef.current.textContent = Math.round(chaffMat1.opacity * 100) + "%";
      } else {
        if (telSRef.current) telSRef.current.textContent = "0.00 u";
        if (telORef.current) telORef.current.textContent = "0%";
      }

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
        <div>CLOUD EXPANSION: <span ref={telSRef} className="text-amber-400">0.00 u</span></div>
        <div>RCS DENSITY: <span ref={telORef} className="text-amber-400">0%</span></div>
        <div>DECOY STATE: <span className="text-[#00FF88]">READY</span></div>
        <button ref={btnRef} className="bg-[#111] hover:bg-[#222] border border-amber-500/40 hover:border-amber-400 text-amber-400 uppercase tracking-wider text-[10px] py-0.5 px-2 transition-all disabled:opacity-30 disabled:pointer-events-none">
          DISPENSE CHAFF
        </button>
        <div className="col-span-2 sm:col-span-4 border-t border-[#111] pt-1.5 mt-1 text-[10px] tracking-wide text-gray-500 uppercase">
          COUNTERMEASURE :: <span ref={statusRef} className="text-gray-400">RADAR DECOY — READY FOR DEPLOYMENT</span>
        </div>
      </div>
    </div>
  );
}