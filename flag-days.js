/**
 * 대한민국국기법 제8조 기준 공식 국기 게양일 (7일)
 * @see 행정안전부 국가상징 안내
 */
export const FLAG_DAYS = [
  { month: 3, day: 1, id: "samil", name: "3·1절", halfMast: false },
  { month: 6, day: 6, id: "hyunchung", name: "현충일", halfMast: true },
  { month: 7, day: 17, id: "jeheon", name: "제헌절", halfMast: false },
  { month: 8, day: 15, id: "gwangbok", name: "광복절", halfMast: false, anniversaryBase: 1945 },
  { month: 10, day: 1, id: "gukgun", name: "국군의 날", halfMast: false },
  { month: 10, day: 3, id: "gaecheon", name: "개천절", halfMast: false },
  { month: 10, day: 9, id: "hangeul", name: "한글날", halfMast: false },
];

const KST_OFFSET_HOURS = 9;

export function getKstParts(date) {
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

export function kstToUtcMs(parts) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    (parts.hour || 0) - KST_OFFSET_HOURS,
    parts.minute || 0,
    parts.second || 0
  );
}

export function getDemoFlagDay() {
  const demo = new URLSearchParams(location.search).get("demo");
  if (!demo) return null;
  const map = {
    hyunchung: "hyunchung",
    half: "hyunchung",
    samil: "samil",
    gwangbok: "gwangbok",
  };
  const id = map[demo] ?? demo;
  return FLAG_DAYS.find((d) => d.id === id) ?? null;
}

export function getFlagDayById(id) {
  return FLAG_DAYS.find((d) => d.id === id) ?? null;
}

export function getSelectedFlagDayId() {
  const urlDemo = getDemoFlagDay();
  if (urlDemo) return urlDemo.id;
  const saved = localStorage.getItem("flagDay");
  if (saved === "auto") return "auto";
  if (saved && getFlagDayById(saved)) return saved;
  return "auto";
}

export function setSelectedFlagDayId(id) {
  localStorage.setItem("flagDay", id);
  const url = new URL(location.href);
  url.searchParams.delete("demo");
  history.replaceState(null, "", url);
}

export function getOccurrenceForEvent(event, now = new Date()) {
  const demo = getDemoFlagDay();
  if (demo && demo.id === event.id) {
    return { event: demo, isToday: true, targetUtcMs: null };
  }

  const p = getKstParts(now);
  const isToday = p.month === event.month && p.day === event.day;
  if (isToday) return { event, isToday: true, targetUtcMs: null };

  let year = p.year;
  let targetUtcMs = kstToUtcMs({
    year,
    month: event.month,
    day: event.day,
    hour: 0,
    minute: 0,
    second: 0,
  });
  if (targetUtcMs <= now.getTime()) {
    year += 1;
    targetUtcMs = kstToUtcMs({
      year,
      month: event.month,
      day: event.day,
      hour: 0,
      minute: 0,
      second: 0,
    });
  }
  return { event, isToday: false, targetUtcMs };
}

export function resolveFlagDayCountdown(selectedId, now = new Date()) {
  if (selectedId === "auto") return getNextFlagDay(now);
  const event = getFlagDayById(selectedId);
  if (!event) return getNextFlagDay(now);
  return getOccurrenceForEvent(event, now);
}

export function getTodayFlagDay(now = new Date()) {
  const demo = getDemoFlagDay();
  if (demo) return demo;
  const p = getKstParts(now);
  return FLAG_DAYS.find((d) => d.month === p.month && d.day === p.day) ?? null;
}

export function getNextFlagDay(now = new Date()) {
  const demo = getDemoFlagDay();
  if (demo) return { event: demo, isToday: true, targetUtcMs: null };

  const today = getTodayFlagDay(now);
  if (today) return { event: today, isToday: true, targetUtcMs: null };

  const p = getKstParts(now);
  let nearest = null;

  for (const event of FLAG_DAYS) {
    for (const year of [p.year, p.year + 1]) {
      const targetUtcMs = kstToUtcMs({
        year,
        month: event.month,
        day: event.day,
        hour: 0,
        minute: 0,
        second: 0,
      });
      if (targetUtcMs <= now.getTime()) continue;
      if (!nearest || targetUtcMs < nearest.targetUtcMs) {
        nearest = { event, isToday: false, targetUtcMs };
      }
    }
  }

  return nearest;
}

export function formatTodayMessage(event, now = new Date()) {
  const p = getKstParts(now);
  if (event.anniversaryBase) {
    const years = p.year - event.anniversaryBase;
    return `오늘은 제 ${years}주년 ${event.name}입니다 🇰🇷`;
  }
  if (event.halfMast) {
    return `오늘은 ${event.name}입니다. 조기를 게양합니다 🇰🇷`;
  }
  return `오늘은 ${event.name}입니다 🇰🇷`;
}

export function isHalfMastToday(now = new Date()) {
  return getTodayFlagDay(now)?.halfMast ?? false;
}
