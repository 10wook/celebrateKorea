import * as THREE from "three";

const MIN_PITCH = 0.12;
const MAX_PITCH = 1.05;
const MIN_DIST = 3.5;
const MAX_DIST = 10.5;

export function createTpsCamera({ camera, container }) {
  const state = {
    yaw: Math.PI * 0.2,
    pitch: 0.38,
    distance: 5.6,
  };

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function onPointerDown(e) {
    if (e.button !== 0 && e.button !== 2) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    container.setPointerCapture?.(e.pointerId);
  }

  function onPointerUp(e) {
    dragging = false;
    container.releasePointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    state.yaw -= dx * 0.0045;
    state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.0035, MIN_PITCH, MAX_PITCH);
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onWheel(e) {
    e.preventDefault();
    state.distance = THREE.MathUtils.clamp(
      state.distance + e.deltaY * 0.008,
      MIN_DIST,
      MAX_DIST
    );
  }

  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointerup", onPointerUp);
  container.addEventListener("pointercancel", onPointerUp);
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("wheel", onWheel, { passive: false });
  container.addEventListener("contextmenu", (e) => e.preventDefault());

  camera.fov = 58;
  camera.updateProjectionMatrix();

  const lookAt = new THREE.Vector3();
  const desired = new THREE.Vector3();

  function update(targetPosition, dt) {
    lookAt.copy(targetPosition);
    lookAt.y += 0.95;

    const hDist = state.distance * Math.cos(state.pitch);
    const yOff = state.distance * Math.sin(state.pitch);

    desired.set(
      lookAt.x + Math.sin(state.yaw) * hDist,
      lookAt.y + yOff,
      lookAt.z + Math.cos(state.yaw) * hDist
    );

    const t = 1 - Math.pow(0.00001, dt);
    camera.position.lerp(desired, t);
    camera.lookAt(lookAt);
  }

  function getYaw() {
    return state.yaw;
  }

  function dispose() {
    container.removeEventListener("pointerdown", onPointerDown);
    container.removeEventListener("pointerup", onPointerUp);
    container.removeEventListener("pointercancel", onPointerUp);
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("wheel", onWheel);
  }

  return { update, getYaw, dispose };
}
