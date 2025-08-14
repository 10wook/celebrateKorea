const group1 = document.querySelector("#group1");
const group2 = document.querySelector("#group2");

function radian2degree(radian) {
  return radian * (180 / Math.PI);
}

if (group1) {
  group1.style.rotate = radian2degree(Math.acos(3 / Math.sqrt(13))) + "deg";
}
if (group2) {
  group2.style.rotate =
    radian2degree(Math.acos(3 / Math.sqrt(13))) * -1 + "deg";
}

// ---------------- Countdown (PLAN-01) ----------------
(function initCountdown() {
  const countdownEl = document.getElementById("countdown");
  const annivEl = document.getElementById("annivMessage");
  if (!countdownEl || !annivEl) return;

  const KST_OFFSET_HOURS = 9;

  function getKstParts(date) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const map = Object.fromEntries(fmt.map((p) => [p.type, p.value]));
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour),
      minute: Number(map.minute),
      second: Number(map.second),
    };
  }

  function kstToUtcMs(parts) {
    return Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      (parts.hour || 0) - KST_OFFSET_HOURS,
      parts.minute || 0,
      parts.second || 0
    );
  }

  function getNextGwangbokjeolUtcMs(now) {
    const p = getKstParts(now);
    const currentYear = p.year;
    const isAfterAug15 =
      p.month > 8 || (p.month === 8 && (p.day > 15 || (p.day === 15 && (p.hour >= 24))));
    const targetYear = isAfterAug15 ? currentYear + 1 : currentYear;
    return kstToUtcMs({ year: targetYear, month: 8, day: 15, hour: 0, minute: 0, second: 0 });
  }

  function isTodayAnniversaryKst(now) {
    const p = getKstParts(now);
    return p.month === 8 && p.day === 15;
  }

  function getAnniversaryYears(now) {
    const p = getKstParts(now);
    return p.year - 1945;
  }

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

  let intervalId = null;
  let lastText = "";

  function tick() {
    const now = new Date();
    if (isTodayAnniversaryKst(now)) {
      const years = getAnniversaryYears(now);
      countdownEl.setAttribute("hidden", "");
      const msg = `오늘은 제 ${years}주년 광복절입니다 🇰🇷`;
      if (annivEl.textContent !== msg) annivEl.textContent = msg;
      annivEl.removeAttribute("hidden");
      return;
    }
    annivEl.setAttribute("hidden", "");
    const targetUtcMs = getNextGwangbokjeolUtcMs(now);
    const remain = targetUtcMs - now.getTime();
    const text = formatRemainingTime(remain);
    if (text !== lastText) {
      countdownEl.textContent = text;
      lastText = text;
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
})();