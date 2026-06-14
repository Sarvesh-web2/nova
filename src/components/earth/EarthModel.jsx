import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function EarthModel() {
  const mountRef = useRef();

  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    mountRef.current.appendChild(
      renderer.domElement
    );
    const controls =
  new OrbitControls(
    camera,
    renderer.domElement
  );

controls.enableDamping = true;

    const textureLoader = new THREE.TextureLoader();

const dayTexture = textureLoader.load(
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg"
);

const bumpTexture = textureLoader.load(
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_bump_2048.jpg"
);

const specularTexture = textureLoader.load(
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg"
);

const earthGeometry = new THREE.SphereGeometry(1, 64, 64);

const earthMaterial = new THREE.MeshStandardMaterial({
  map: dayTexture,
  bumpMap: bumpTexture,
  bumpScale: 0.015,
  roughnessMap: specularTexture,
  roughness: 1,
  metalness: 0.1,
});

const earth = new THREE.Mesh(
  earthGeometry,
  earthMaterial
);

scene.add(earth);

const cloudGeometry =
  new THREE.SphereGeometry(1.012, 64, 64);

const cloudMaterial =
  new THREE.MeshStandardMaterial({
    map: textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png"
    ),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });

const clouds =
  new THREE.Mesh(
    cloudGeometry,
    cloudMaterial
  );

scene.add(clouds);

    const ambientLight =
  new THREE.AmbientLight(
    0x333333
  );

scene.add(ambientLight);

const sunLight =
  new THREE.DirectionalLight(
    0xffffff,
    3.5
  );

sunLight.position.set(
  5,
  3,
  5
);

scene.add(sunLight);

    function animate() {
      requestAnimationFrame(animate);

      earth.rotation.y += 0.0015;
clouds.rotation.y += 0.0018;

controls.update();

      renderer.render(
        scene,
        camera
      );
    }

    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-screen h-screen"
    />
  );
}