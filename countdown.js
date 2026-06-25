import {
  FLAG_DAYS,
  getSelectedFlagDayId,
  setSelectedFlagDayId,
  resolveFlagDayCountdown,
  formatTodayMessage,
} from "./flag-days.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatRemainingTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}일 ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function dispatchFlagDayState(detail) {
  window.dispatchEvent(new CustomEvent("flagdaychange", { detail }));
}

function buildPicker(pickerEl, onSelect) {
  const autoBtn = document.createElement("button");
  autoBtn.type = "button";
  autoBtn.dataset.id = "auto";
  autoBtn.textContent = "가까운 날";
  autoBtn.setAttribute("role", "tab");
  autoBtn.setAttribute("aria-label", "가장 가까운 국기 게양일");
  pickerEl.appendChild(autoBtn);
  autoBtn.addEventListener("click", () => onSelect("auto"));

  for (const day of FLAG_DAYS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = day.id;
    btn.textContent = day.name;
    btn.setAttribute("role", "tab");
    btn.setAttribute(
      "aria-label",
      day.halfMast ? `${day.name}, 조기 게양` : `${day.name}, 국기 게양`
    );
    if (day.halfMast) btn.dataset.halfMast = "true";
    btn.addEventListener("click", () => onSelect(day.id));
    pickerEl.appendChild(btn);
  }
}

function updatePickerActive(pickerEl, selectedId) {
  for (const btn of pickerEl.querySelectorAll("button")) {
    const active = btn.dataset.id === selectedId;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }
}

export function initCountdown() {
  const countdownEl = document.getElementById("countdown");
  const annivEl = document.getElementById("annivMessage");
  const labelEl = document.getElementById("flagDayLabel");
  const pickerEl = document.getElementById("flagDayPicker");
  if (!countdownEl || !annivEl || !pickerEl) return;

  let selectedId = getSelectedFlagDayId();
  let intervalId = null;
  let lastCountdown = "";
  let lastLabel = "";

  function selectDay(id) {
    selectedId = id;
    setSelectedFlagDayId(id);
    updatePickerActive(pickerEl, selectedId);
    lastCountdown = "";
    lastLabel = "";
    tick();
  }

  buildPicker(pickerEl, selectDay);
  updatePickerActive(pickerEl, selectedId);

  function tick() {
    const now = new Date();
    const next = resolveFlagDayCountdown(selectedId, now);
    if (!next) return;

    dispatchFlagDayState({
      event: next.event,
      isToday: next.isToday,
      halfMast: next.event.halfMast && next.isToday,
    });

    if (next.isToday) {
      countdownEl.setAttribute("hidden", "");
      const msg = formatTodayMessage(next.event, now);
      if (annivEl.textContent !== msg) annivEl.textContent = msg;
      annivEl.removeAttribute("hidden");

      const label = next.event.halfMast ? "조기 게양일" : "국기 게양일";
      if (labelEl && label !== lastLabel) {
        labelEl.textContent = label;
        lastLabel = label;
      }
      return;
    }

    annivEl.setAttribute("hidden", "");
    const remain = next.targetUtcMs - now.getTime();
    const time = formatRemainingTime(remain);
    const label = `${next.event.name}까지`;

    if (time !== lastCountdown) {
      countdownEl.textContent = time;
      lastCountdown = time;
    }
    if (labelEl && label !== lastLabel) {
      labelEl.textContent = label;
      lastLabel = label;
    }
    countdownEl.removeAttribute("hidden");
  }

  function start() {
    if (intervalId) return;
    tick();
    intervalId = setInterval(tick, 1000);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  start();
}

initCountdown();
