// ---------------- Shared KST utils ----------------
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

function getKstHourDecimal(now = new Date()) {
  const p = getKstParts(now);
  return p.hour + p.minute / 60 + p.second / 3600;
}

function isNightByKst(now = new Date()) {
  const h = getKstHourDecimal(now);
  return h >= 20 || h < 6;
}

// ---------------- Theme (PLAN-04) ----------------
(function initShare() {
  const shareBtn = document.getElementById("shareBtn");
  const toast = document.getElementById("toast");
  if (!shareBtn || !toast) return;

  const shareData = {
    title: "태극기, 광복절을 기념합니다",
    text: "광복절을 기념합니다 🇰🇷",
    url: window.location.href,
  };

  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.removeAttribute("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.setAttribute("hidden", "");
    }, 2800);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(shareData.url);
    showToast("링크가 복사되었습니다");
  }

  shareBtn.addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await copyUrl();
        return;
      }
      showToast("공유를 지원하지 않는 환경입니다");
    } catch (err) {
      if (err?.name === "AbortError") return;
      try {
        await copyUrl();
      } catch {
        showToast("공유에 실패했습니다. 다시 시도해 주세요");
      }
    }
  });
})();

// ---------------- Stars overlay (PLAN-04) ----------------
(function initStars() {
  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let stars = [];
  let rafId = null;
  let visible = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.min(180, Math.floor((canvas.width * canvas.height) / 8000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.8 + 0.2,
    }));
  }

  function draw(t) {
    if (!visible) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const alpha = reducedMotion
        ? 0.65
        : 0.35 + Math.sin(t * 0.001 * s.speed + s.phase) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(t) {
    rafId = requestAnimationFrame(loop);
    draw(t);
  }

  function start() {
    if (rafId || reducedMotion) return;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function setVisible(isDark) {
    visible = isDark;
    canvas.classList.toggle("active", visible);
    if (visible) {
      resize();
      draw(0);
      start();
    } else {
      stop();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  window.addEventListener("themechange", (e) => {
    setVisible(e.detail?.isDark);
  });

  window.addEventListener("resize", () => {
    if (visible) resize();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (visible) start();
  });
})();

// ---------------- Theme (PLAN-04) ----------------
(function initTheme() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  const STORAGE_KEY = "theme";

  function getAutoTheme() {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    if (isNightByKst()) return "dark";
    return "light";
  }

  function getResolvedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return getAutoTheme();
  }

  function applyTheme() {
    const resolved = getResolvedTheme();
    const isManual = localStorage.getItem(STORAGE_KEY) === "dark" || localStorage.getItem(STORAGE_KEY) === "light";
    const isDark = resolved === "dark";

    document.documentElement.classList.toggle("theme-dark", isDark);
    document.documentElement.classList.toggle("theme-light", !isDark);

    toggle.textContent = isDark ? "☀️" : "🌙";
    toggle.setAttribute(
      "aria-label",
      isManual
        ? isDark
          ? "라이트 모드로 전환"
          : "다크 모드로 전환"
        : isDark
          ? "라이트 모드로 전환 (자동)"
          : "다크 모드로 전환 (자동)"
    );

    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: {
          theme: isManual ? resolved : "auto",
          resolved,
          isDark,
        },
      })
    );
  }

  toggle.addEventListener("click", () => {
    const resolved = getResolvedTheme();
    const next = resolved === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme();
  });

  toggle.addEventListener("dblclick", () => {
    localStorage.removeItem(STORAGE_KEY);
    applyTheme();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!localStorage.getItem(STORAGE_KEY)) applyTheme();
  });

  setInterval(() => {
    if (!localStorage.getItem(STORAGE_KEY)) applyTheme();
  }, 60_000);

  applyTheme();
})();
