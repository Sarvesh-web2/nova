import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const BASE = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets";

const WEATHER_PRESETS = {
  SUNNY:         { cloudOpacity: 0.05, lightIntensity: 3.5 },
  PARTLY_CLOUDY: { cloudOpacity: 0.35, lightIntensity: 2.8 },
  CLOUDY:        { cloudOpacity: 0.70, lightIntensity: 1.8 },
  STORMY:        { cloudOpacity: 0.90, lightIntensity: 1.0 },
};

export default function EarthModel({
  satCount = 3,
  showTrajectories = true,
  showISS = false,
  weatherMode = "PARTLY_CLOUDY",
  compact = false,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  // ── Core scene init ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.set(0, compact ? 1.5 : 2, compact ? 3.2 : 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan     = false;
    controls.minDistance   = compact ? 1.8 : 2.2;
    controls.maxDistance   = compact ? 5   : 8;

    // Lighting
    const ambient = new THREE.AmbientLight(0x333333);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 3.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Stars
    const starVerts = [];
    for (let i = 0; i < 2500; i++) {
      starVerts.push(
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 300,
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 })));

    // Earth
    const loader   = new THREE.TextureLoader();
    const earthMat = new THREE.MeshStandardMaterial({
      map:          loader.load(`${BASE}/earth_atmos_2048.jpg`),
      bumpMap:      loader.load(`${BASE}/earth_bump_2048.jpg`),
      bumpScale:    0.015,
      roughnessMap: loader.load(`${BASE}/earth_specular_2048.jpg`),
      roughness:    1.0,
      metalness:    0.1,
    });
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat);
    scene.add(earthMesh);

    // Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      map:         loader.load(`${BASE}/earth_clouds_1024.png`),
      transparent: true,
      opacity:     0.35,
      blending:    THREE.NormalBlending,
      depthWrite:  false,
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 64), cloudMat);
    scene.add(cloudMesh);

    // Atmosphere glow
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.07, side: THREE.BackSide }),
    ));

    stateRef.current = {
      scene, camera, renderer, controls,
      earthMesh, cloudMesh, sun,
      satellites: [],
      issMesh: null,
      issOrbitLine: null,
      issIntervalId: null,
    };

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      earthMesh.rotation.y += 0.0006;
      cloudMesh.rotation.y += 0.0008;

      stateRef.current.satellites.forEach(sat => {
        sat.angle += sat.speed * 0.0015;
        sat.mesh.position.set(
          sat.radius * Math.sin(sat.phi) * Math.cos(sat.angle + sat.theta),
          sat.radius * Math.cos(sat.phi),
          sat.radius * Math.sin(sat.phi) * Math.sin(sat.angle + sat.theta),
        );
        sat.mesh.lookAt(0, 0, 0);
      });

      const { issMesh } = stateRef.current;
      if (issMesh?.visible && stateRef.current.issTarget) {
        issMesh.position.lerp(stateRef.current.issTarget, 0.05);
        issMesh.lookAt(0, 0, 0);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      clearInterval(stateRef.current.issIntervalId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [compact]);

  // ── Satellites ───────────────────────────────────────────────────────────
  useEffect(() => {
    const { scene, satellites } = stateRef.current;
    if (!scene) return;

    satellites.forEach(({ mesh, line }) => { scene.remove(mesh); scene.remove(line); });
    stateRef.current.satellites = [];

    for (let i = 0; i < Math.min(satCount, 10); i++) {
      const color = new THREE.Color().setHSL(i / Math.max(satCount, 1), 0.85, 0.6);
      const mesh  = new THREE.Group();
      const body  = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 8),
        new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.1 }),
      );
      const ant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.002, 0.07),
        new THREE.MeshStandardMaterial({ color: 0xcccccc }),
      );
      ant.position.y = 0.038;
      mesh.add(body, ant);
      scene.add(mesh);

      const radius = 1.28 + (i % 3) * 0.08;
      const phi    = (Math.random() * 0.8 + 0.1) * Math.PI;
      const theta  = Math.random() * Math.PI * 2;

      const pts = Array.from({ length: 65 }, (_, j) => {
        const a = (j / 64) * Math.PI * 2;
        return new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(a + theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(a + theta),
        );
      });
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: showTrajectories ? 0.35 : 0.0 }),
      );
      scene.add(line);
      stateRef.current.satellites.push({
        mesh, line, radius, phi, theta,
        angle: Math.random() * 50,
        speed: 0.8 + Math.random() * 1.5,
      });
    }
  }, [satCount]);

  // ── Trajectories toggle ──────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current.satellites?.forEach(({ line }) => {
      if (line?.material) line.material.opacity = showTrajectories ? 0.35 : 0.0;
    });
  }, [showTrajectories]);

  // ── Weather ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const { cloudMesh, sun } = stateRef.current;
    if (!cloudMesh || !sun) return;
    const preset = WEATHER_PRESETS[weatherMode] ?? WEATHER_PRESETS.PARTLY_CLOUDY;
    cloudMesh.material.opacity = preset.cloudOpacity;
    sun.intensity              = preset.lightIntensity;
  }, [weatherMode]);

  // ── ISS ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const st = stateRef.current;
    if (!st.scene) return;

    if (!showISS) {
      if (st.issMesh)      st.issMesh.visible      = false;
      if (st.issOrbitLine) st.issOrbitLine.visible  = false;
      clearInterval(st.issIntervalId);
      return;
    }

    if (!st.issMesh) {
      const group = new THREE.Group();
      const core  = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.03, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9 }),
      );
      const lw = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 0.002),
        new THREE.MeshStandardMaterial({ color: 0x3355ff }),
      );
      lw.position.x = 0.1;
      const rw = lw.clone(); rw.position.x = -0.1;
      group.add(core, lw, rw);
      st.scene.add(group);
      st.issMesh = group;

      const pts = Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return new THREE.Vector3(1.32 * Math.cos(a), 0, 1.32 * Math.sin(a));
      });
      st.issOrbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xffdf6d, transparent: true, opacity: 0.2 }),
      );
      st.scene.add(st.issOrbitLine);
    }

    st.issMesh.visible      = true;
    st.issOrbitLine.visible = true;
    st.issTarget            = new THREE.Vector3(1.32, 0, 0);

    const fetchISS = async () => {
      try {
        const d   = await (await fetch("https://api.wheretheiss.at/v1/satellites/25544")).json();
        const phi = (90 - d.latitude)   * (Math.PI / 180);
        const tht = (d.longitude + 180) * (Math.PI / 180);
        stateRef.current.issTarget = new THREE.Vector3(
          -(1.32 * Math.sin(phi) * Math.sin(tht)),
           (1.32 * Math.cos(phi)),
           (1.32 * Math.sin(phi) * Math.cos(tht)),
        );
      } catch { /* silently ignore network errors */ }
    };
    fetchISS();
    st.issIntervalId = setInterval(fetchISS, 5000);
    return () => clearInterval(st.issIntervalId);
  }, [showISS]);

  return <div ref={mountRef} className="w-full h-full" />;
}