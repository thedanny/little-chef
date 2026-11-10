// Turning raw play into the numbers parents see, and the daily goal / cap rules.

import { isSuccess } from './difficulty.js';
import { dayKey, MAX_SESSIONS_KEPT } from './storage.js';

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Collapse a finished kitchen session into one history record. */
export function summarizeSession(session, { durationSec, levelStart, levelEnd, date = new Date() }) {
  const orders = session.orders;
  const rts = orders.filter((o) => o.rt != null).map((o) => o.rt);
  return {
    date: date.getTime(),
    day: dayKey(date),
    durationSec: Math.round(durationSec),
    orders: orders.length,
    success: orders.filter((o) => isSuccess(o.stars)).length,
    perfect: orders.filter((o) => o.stars === 3).length,
    late: orders.filter((o) => o.stars === 2).length,
    ruined: orders.filter((o) => o.stars === 1).length,
    abandoned: orders.filter((o) => o.stars === 0).length,
    avgRt: rts.length ? +avg(rts).toFixed(2) : null,
    spaceOuts: session.spaceOuts,
    peeks: session.peeks,
    busywork: session.busywork,
    missedCustomers: session.missedCustomers,
    cookingSec: Math.round(session.cookingTime),
    stars: session.stars,
    coins: session.coins,
    levelStart,
    levelEnd,
  };
}

/** Add a session record to a profile's history, totals and daily play time. */
export function applySession(profile, summary) {
  const s = profile.stats;
  s.sessions.push(summary);
  if (s.sessions.length > MAX_SESSIONS_KEPT) s.sessions.splice(0, s.sessions.length - MAX_SESSIONS_KEPT);
  const t = s.totals;
  t.sessions++;
  t.orders += summary.orders;
  t.success += summary.success;
  t.perfect += summary.perfect;
  t.stars += summary.stars;
  t.playSec += summary.durationSec;
  t.spaceOuts += summary.spaceOuts;
  t.bestLevel = Math.max(t.bestLevel, summary.levelEnd);
  const day = (profile.days[summary.day] ||= { playedSec: 0, sessions: 0 });
  day.playedSec += summary.durationSec;
  day.sessions++;
  // Keep only recent days.
  const keys = Object.keys(profile.days).sort();
  while (keys.length > 60) delete profile.days[keys.shift()];
  profile.lastSessionEnd = summary.date;
  return profile;
}

/** Shorter visits with no orders count as play time but not as a session. */
export const MIN_SESSION_SEC = 20;

/** Count play time toward today without adding a session record (very short visits). */
export function addPlayTime(profile, seconds, date = new Date()) {
  if (!(seconds > 0)) return;
  const day = (profile.days[dayKey(date)] ||= { playedSec: 0, sessions: 0 });
  day.playedSec += Math.round(seconds);
}

/**
 * A session that was interrupted (the app was closed while in the background)
 * left a provisional summary behind: commit it so the play time still counts.
 */
export function commitPending(profile) {
  const pending = profile.pending;
  profile.pending = null;
  if (!pending) return false;
  if (pending.orders > 0 || pending.durationSec >= MIN_SESSION_SEC) applySession(profile, pending);
  else addPlayTime(profile, pending.durationSec, new Date(pending.date || Date.now()));
  return true;
}

/** Dashboard numbers over the most recent `n` sessions (default: all kept). */
export function aggregate(profile, n = Infinity) {
  const sessions = profile.stats.sessions.slice(-n);
  const orders = sessions.reduce((a, s) => a + s.orders, 0);
  const success = sessions.reduce((a, s) => a + s.success, 0);
  const perfect = sessions.reduce((a, s) => a + s.perfect, 0);
  const spaceOuts = sessions.reduce((a, s) => a + s.spaceOuts, 0);
  const playSec = sessions.reduce((a, s) => a + s.durationSec, 0);
  const cookingSec = sessions.reduce((a, s) => a + (s.cookingSec || 0), 0);
  // Weight reaction time by how many orders each session had.
  let rtSum = 0;
  let rtN = 0;
  for (const s of sessions) {
    if (s.avgRt != null && s.orders) {
      rtSum += s.avgRt * s.orders;
      rtN += s.orders;
    }
  }
  return {
    sessions: sessions.length,
    orders,
    successRate: orders ? success / orders : null,
    perfectRate: orders ? perfect / orders : null,
    avgRt: rtN ? rtSum / rtN : null,
    spaceOuts,
    spaceOutsPerSession: sessions.length ? spaceOuts / sessions.length : null,
    spaceOutsPer10Min: cookingSec > 0 ? (spaceOuts / cookingSec) * 600 : null,
    playMin: playSec / 60,
  };
}

/**
 * Today's play allowance for a profile.
 * Returns how long the next session should be and whether play is allowed.
 */
export function dayStatus(profile, globals, now = new Date()) {
  const day = profile.days[dayKey(now)] || { playedSec: 0, sessions: 0 };
  const goalSec = Math.max(1, globals.goalMin) * 60;
  const capSec = globals.capMin > 0 ? Math.max(globals.capMin, globals.goalMin) * 60 : Infinity;
  const remainingCap = Math.max(0, capSec - day.playedSec);
  const cooldownSec = (globals.cooldownMin || 0) * 60;
  const sinceLast = profile.lastSessionEnd ? (now.getTime() - profile.lastSessionEnd) / 1000 : Infinity;
  const cooldownLeft = cooldownSec > 0 && day.sessions > 0 ? Math.max(0, cooldownSec - sinceLast) : 0;
  // First finish today's goal; after that each extra session is one goal long.
  const towardGoal = goalSec - day.playedSec;
  let sessionSec = towardGoal >= 120 ? towardGoal : goalSec;
  sessionSec = Math.min(sessionSec, remainingCap);
  const capped = remainingCap < 60;
  return {
    playedSec: day.playedSec,
    sessionsToday: day.sessions,
    goalSec,
    goalProgress: Math.min(1, day.playedSec / goalSec),
    goalMet: day.playedSec >= goalSec - 1,
    capSec,
    capped,
    cooldownLeft,
    canPlay: !capped && cooldownLeft <= 0,
    sessionSec: Math.round(sessionSec),
  };
}
