import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { createVirtualJoystick } from "./virtual-joystick.js";

const FIELD_RADIUS = 12.5;
const FLAG_KEEP_OUT = 4.2;
const WALK_SPEED = 4.2;

function getVisitorProfile() {
  let id = localStorage.getItem("visitorId");
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("visitorId", id);
  }
  let color = localStorage.getItem("visitorColor");
  if (!color) {
    const hue = Math.floor(Math.random() * 360);
    color = `hsl(${hue}, 65%, 52%)`;
    localStorage.setItem("visitorColor", color);
  }
  const nick = `방문자 ${id.slice(-4)}`;
  return { id, color, nick };
}

function clampToField(x, z) {
  const dist = Math.hypot(x, z);
  if (dist > FIELD_RADIUS) {
    const s = FIELD_RADIUS / dist;
    x *= s;
    z *= s;
  }
  if (Math.hypot(x, z) < FLAG_KEEP_OUT) {
    const angle = Math.atan2(z, x) || 0;
    x = Math.cos(angle) * FLAG_KEEP_OUT;
    z = Math.sin(angle) * FLAG_KEEP_OUT;
  }
  return { x, z };
}

function randomSpawnPoint() {
  const angle = Math.random() * Math.PI * 2;
  const r = FLAG_KEEP_OUT + 3 + Math.random() * 4;
  return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
}

export function createVisitorAvatar({ scene, container, reducedMotion, getCameraYaw }) {
  const profile = getVisitorProfile();
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: profile.color, roughness: 0.75 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.44, 6, 10), bodyMat);
  body.position.y = 0.5;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffddb8, roughness: 0.85 })
  );
  head.position.y = 0.98;

  group.add(body, head);

  const labelEl = document.createElement("div");
  labelEl.className = "visitor-label";
  labelEl.textContent = profile.nick;
  const label = new CSS2DObject(labelEl);
  label.position.set(0, 1.3, 0);
  label.visible = false;
  group.add(label);

  const spawn = randomSpawnPoint();
  group.position.set(spawn.x, 0, spawn.z);
  scene.add(group);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "visitor-label-layer";
  container.appendChild(labelRenderer.domElement);

  const keys = { w: false, a: false, s: false, d: false };
  let walkPhase = 0;

  function setKey(code, down) {
    if (code === "KeyW" || code === "ArrowUp") keys.w = down;
    if (code === "KeyS" || code === "ArrowDown") keys.s = down;
    if (code === "KeyA" || code === "ArrowLeft") keys.a = down;
    if (code === "KeyD" || code === "ArrowRight") keys.d = down;
  }

  function onKeyDown(e) {
    setKey(e.code, true);
  }
  function onKeyUp(e) {
    setKey(e.code, false);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const joystick = createVirtualJoystick(container);

  function resize(w, h) {
    labelRenderer.setSize(w, h);
  }

  function update(dt) {
    if (reducedMotion) return;

    const yaw = getCameraYaw();
    let mx = 0;
    let mz = 0;

    if (keys.w) {
      mx -= Math.sin(yaw);
      mz -= Math.cos(yaw);
    }
    if (keys.s) {
      mx += Math.sin(yaw);
      mz += Math.cos(yaw);
    }
    if (keys.a) {
      mx -= Math.cos(yaw);
      mz += Math.sin(yaw);
    }
    if (keys.d) {
      mx += Math.cos(yaw);
      mz -= Math.sin(yaw);
    }

    const joy = joystick.getInput();
    if (Math.hypot(joy.x, joy.y) > 0.15) {
      const forward = -joy.y;
      const strafe = joy.x;
      mx += -Math.sin(yaw) * forward + Math.cos(yaw) * strafe;
      mz += -Math.cos(yaw) * forward - Math.sin(yaw) * strafe;
    }

    const len = Math.hypot(mx, mz);
    let moving = false;

    if (len > 0) {
      mx /= len;
      mz /= len;
      const pos = group.position;
      pos.x += mx * WALK_SPEED * dt;
      pos.z += mz * WALK_SPEED * dt;
      group.rotation.y = Math.atan2(mx, mz);
      moving = true;
      walkPhase += dt * 10;
    }

    const clamped = clampToField(group.position.x, group.position.z);
    group.position.x = clamped.x;
    group.position.z = clamped.z;
    group.position.y = moving ? Math.abs(Math.sin(walkPhase)) * 0.06 : 0;
  }

  function getPosition() {
    return group.position;
  }

  function renderLabels(camera) {
    labelRenderer.render(scene, camera);
  }

  function dispose() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    joystick.dispose();
    labelRenderer.domElement.remove();
    scene.remove(group);
  }

  return { update, resize, renderLabels, dispose, getPosition, profile, group };
}
