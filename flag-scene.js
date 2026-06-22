import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createSkyEnvironment, createStadium } from "./sky-environment.js";

const FLAG_WIDTH = 3;
const FLAG_HEIGHT = 2;
const POLE_HEIGHT = 5;
const POLE_RADIUS = 0.045;
const LOOK_TARGET = new THREE.Vector3(FLAG_WIDTH / 2, POLE_HEIGHT * 0.45, 0);

const vertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  uniform vec2 uWind;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float attach = smoothstep(-1.5, 1.5, position.x);
    float wave1 = sin(uTime * 2.8 + position.x * 4.5 + uWind.x * 3.0) * uAmplitude;
    float wave2 = sin(uTime * 1.6 + position.y * 3.0 + uWind.y * 2.0) * uAmplitude * 0.35;
    pos.z += (wave1 + wave2) * attach;
    pos.y += sin(uTime * 2.0 + position.x * 3.5) * uAmplitude * 0.12 * attach;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uMap;
  varying vec2 vUv;

  void main() {
    gl_FragColor = texture2D(uMap, vUv);
  }
`;

export function initFlagScene(container) {
  if (!container) return null;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const baseAmplitude = reducedMotion ? 0.02 : 0.22;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xb8e0f8, 30, 90);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  camera.position.set(6, 4.5, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(LOOK_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 5;
  controls.maxDistance = 38;
  controls.maxPolarAngle = Math.PI / 2 - 0.08;
  controls.minPolarAngle = 0.25;
  controls.enablePan = false;
  controls.update();

  const sky = createSkyEnvironment(scene);
  createStadium(scene);

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc4,
    metalness: 0.85,
    roughness: 0.35,
  });
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS * 1.15, POLE_HEIGHT, 16),
    poleMat
  );
  pole.position.set(0, POLE_HEIGHT / 2, 0);
  scene.add(pole);

  const poleCap = new THREE.Mesh(
    new THREE.SphereGeometry(POLE_RADIUS * 1.6, 12, 12),
    poleMat
  );
  poleCap.position.set(0, POLE_HEIGHT, 0);
  scene.add(poleCap);

  const flagGeometry = new THREE.PlaneGeometry(FLAG_WIDTH, FLAG_HEIGHT, 32, 16);
  const flagMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: baseAmplitude },
      uWind: { value: new THREE.Vector2(0, 0) },
      uMap: { value: null },
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
  });

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("./태극기.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    flagMaterial.uniforms.uMap.value = tex;
    flagMaterial.needsUpdate = true;
  });

  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(FLAG_WIDTH / 2, POLE_HEIGHT - FLAG_HEIGHT / 2, 0);
  scene.add(flag);

  const wind = { x: 0, y: 0 };
  let pointerPending = false;

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    wind.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    wind.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerPending = true;
  }

  container.addEventListener("pointermove", onPointerMove, { passive: true });

  const hint = document.createElement("div");
  hint.className = "scene-hint";
  hint.textContent = "드래그로 시점 이동";
  container.appendChild(hint);
  let hintTimer = setTimeout(() => hint.classList.add("fade-out"), 4000);
  container.addEventListener(
    "pointerdown",
    () => {
      hint.classList.add("fade-out");
      clearTimeout(hintTimer);
    },
    { once: true }
  );

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  resize();
  window.addEventListener("resize", resize);

  let rafId = null;
  const clock = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);

    if (pointerPending) {
      flagMaterial.uniforms.uWind.value.set(wind.x, wind.y);
      pointerPending = false;
    }

    const t = clock.getElapsedTime();
    flagMaterial.uniforms.uTime.value = t;

    const windBoost = 1 + Math.abs(wind.x) * 0.4 + Math.abs(wind.y) * 0.2;
    flagMaterial.uniforms.uAmplitude.value = baseAmplitude * windBoost;

    sky.update(new Date(), t);
    controls.update();

    renderer.render(scene, camera);
  }

  function start() {
    if (rafId) return;
    clock.start();
    animate();
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    clock.stop();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  function syncSkyTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") sky.setForceNight(true);
    else if (saved === "light") sky.setForceNight(false);
    else sky.setForceNight(null);
  }

  window.addEventListener("themechange", (e) => {
    const theme = e.detail?.theme;
    if (theme === "dark") sky.setForceNight(true);
    else if (theme === "light") sky.setForceNight(false);
    else sky.setForceNight(null);
  });

  syncSkyTheme();

  start();

  return { scene, camera, renderer, controls, stop, sky };
}
