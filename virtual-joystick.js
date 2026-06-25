const STICK_RADIUS = 50;

export function isTouchPreferred() {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function createVirtualJoystick(container) {
  const wrap = document.createElement("div");
  wrap.className = "virtual-joystick";
  wrap.setAttribute("aria-label", "이동 조이스틱");
  wrap.hidden = !isTouchPreferred();

  const base = document.createElement("div");
  base.className = "joystick-base";
  const stick = document.createElement("div");
  stick.className = "joystick-stick";
  base.appendChild(stick);
  wrap.appendChild(base);
  container.appendChild(wrap);

  const input = { x: 0, y: 0, active: false };
  let pointerId = null;
  let centerX = 0;
  let centerY = 0;

  function resetStick() {
    input.x = 0;
    input.y = 0;
    input.active = false;
    stick.style.transform = "translate(-50%, -50%)";
  }

  function moveStick(clientX, clientY) {
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > STICK_RADIUS) {
      dx = (dx / dist) * STICK_RADIUS;
      dy = (dy / dist) * STICK_RADIUS;
    }
    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.x = dx / STICK_RADIUS;
    input.y = dy / STICK_RADIUS;
  }

  function onPointerDown(e) {
    e.stopPropagation();
    pointerId = e.pointerId;
    input.active = true;
    const rect = base.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    base.setPointerCapture(e.pointerId);
    moveStick(e.clientX, e.clientY);
  }

  function onPointerMove(e) {
    if (e.pointerId !== pointerId) return;
    e.stopPropagation();
    moveStick(e.clientX, e.clientY);
  }

  function onPointerUp(e) {
    if (e.pointerId !== pointerId) return;
    e.stopPropagation();
    pointerId = null;
    base.releasePointerCapture(e.pointerId);
    resetStick();
  }

  base.addEventListener("pointerdown", onPointerDown);
  base.addEventListener("pointermove", onPointerMove);
  base.addEventListener("pointerup", onPointerUp);
  base.addEventListener("pointercancel", onPointerUp);

  const mq = window.matchMedia("(pointer: coarse)");
  const onMq = () => {
    wrap.hidden = !mq.matches;
    resetStick();
  };
  mq.addEventListener("change", onMq);

  function dispose() {
    mq.removeEventListener("change", onMq);
    wrap.remove();
  }

  return { getInput: () => input, dispose };
}

export function getControlsHint() {
  return isTouchPreferred()
    ? "왼쪽 조이스틱 이동 · 화면 드래그로 시점"
    : "WASD / 방향키 이동 · 드래그 시점 · 스크롤 줌";
}
