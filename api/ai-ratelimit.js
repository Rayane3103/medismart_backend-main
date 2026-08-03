// Rate limiting: a burst/throughput guard, distinct from the existing
// monthly/daily credit caps (which are a billing quota reset on a calendar
// schedule). A doctor with credit remaining can still be rate-limited by a
// buggy retry loop or a scripted flood - this catches that case.
//
// Storage: ai:ratelimit:{doctorId}:{windowStart} (STRING, INCR + EXPIRE),
// fixed 60s window.

import { redis } from "./redis.js";

const WINDOW_SECONDS = 60;

export async function checkRateLimit(doctorId, limitPerMin) {
  const windowStart = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `ai:ratelimit:${doctorId}:${windowStart}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SECONDS * 2);
  return { allowed: count <= limitPerMin, count, limit: limitPerMin };
}
