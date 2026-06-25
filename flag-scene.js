import * as THREE from "three";
import { createSkyEnvironment, createStadium } from "./sky-environment.js";
import { isHalfMastToday } from "./flag-days.js";
import { createVisitorAvatar } from "./visitor-avatar.js";
import { createTpsCamera } from "./tps-camera.js";
import { getControlsHint } from "./virtual-joystick.js";

const FLAG_WIDTH = 3;
const FLAG_HEIGHT = 2;
const POLE_HEIGHT = 5;
const POLE_RADIUS = 0.045;

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

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const tpsCamera = createTpsCamera({ camera, container });

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
  scene.add(flag);

  function updateFlagFlyHeight(halfMast = isHalfMastToday()) {
    const centerY = halfMast
      ? POLE_HEIGHT - FLAG_HEIGHT * 1.5
      : POLE_HEIGHT - FLAG_HEIGHT / 2;
    flag.position.set(FLAG_WIDTH / 2, centerY, 0);
  }

  updateFlagFlyHeight();

  window.addEventListener("flagdaychange", (e) => {
    updateFlagFlyHeight(e.detail?.halfMast ?? false);
  });

  const visitor = createVisitorAvatar({
    scene,
    container,
    reducedMotion,
    getCameraYaw: () => tpsCamera.getYaw(),
  });

  const crosshair = document.createElement("div");
  crosshair.className = "tps-crosshair";
  crosshair.setAttribute("aria-hidden", "true");
  container.appendChild(crosshair);

  const moveHint = document.createElement("div");
  moveHint.className = "scene-hint";
  moveHint.textContent = getControlsHint();
  container.appendChild(moveHint);
  setTimeout(() => moveHint.classList.add("fade-out"), 6000);

  const wind = { x: 0, y: 0 };
  let pointerPending = false;

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    wind.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    wind.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerPending = true;
  }

  container.addEventListener("pointermove", onPointerMove, { passive: true });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    visitor.resize(w, h);
  }

  resize();
  window.addEventListener("resize", resize);

  tpsCamera.update(visitor.getPosition(), 1);

  let rafId = null;
  const clock = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);

    if (pointerPending) {
      flagMaterial.uniforms.uWind.value.set(wind.x, wind.y);
      pointerPending = false;
    }

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();
    flagMaterial.uniforms.uTime.value = t;

    const windBoost = 1 + Math.abs(wind.x) * 0.4 + Math.abs(wind.y) * 0.2;
    flagMaterial.uniforms.uAmplitude.value = baseAmplitude * windBoost;

    visitor.update(dt);
    tpsCamera.update(visitor.getPosition(), dt);
    sky.update(new Date(), t);

    renderer.render(scene, camera);
    visitor.renderLabels(camera);
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

  return { scene, camera, renderer, stop, sky, visitor, tpsCamera };
}
