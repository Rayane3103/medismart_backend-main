// Minimal in-memory Upstash Redis REST mock for local development/testing.
// Supports the commands used by api/index.js + api/licensing.js.
// Usage: node dev/mock-upstash.mjs [port]   (default 8790)
//
// Env knobs (both default to off, for perf work against a realistic Upstash):
//   MOCK_LATENCY_MS  delay every REST call, standing in for the network hop
//   MOCK_COUNT       expose round-trip/command counters on GET /__stats

import http from "node:http";

const port = parseInt(process.argv[2] || "8790", 10);
const latencyMs = parseInt(process.env.MOCK_LATENCY_MS || "0", 10);
const counting = process.env.MOCK_COUNT === "1";
const strings = new Map();
const sets = new Map();
const lists = new Map();
const hashes = new Map();
const zsets = new Map(); // key -> Map(member -> score)
const counters = { roundTrips: 0, commands: 0 };

function exec([cmd, ...args]) {
  const command = String(cmd || "").toUpperCase();
  switch (command) {
    case "GET":
      return strings.has(args[0]) ? strings.get(args[0]) : null;
    case "MGET":
      return args.map((key) => (strings.has(key) ? strings.get(key) : null));
    case "SET": {
      // Optional trailing: EX <seconds> (TTL ignored in the mock)
      strings.set(args[0], args[1]);
      return "OK";
    }
    case "DEL": {
      let count = 0;
      for (const key of args) {
        if (strings.delete(key)) count++;
        if (sets.delete(key)) count++;
        if (lists.delete(key)) count++;
        if (hashes.delete(key)) count++;
        if (zsets.delete(key)) count++;
      }
      return count;
    }
    case "SADD": {
      if (!sets.has(args[0])) sets.set(args[0], new Set());
      const set = sets.get(args[0]);
      let added = 0;
      for (const member of args.slice(1)) {
        if (!set.has(member)) { set.add(member); added++; }
      }
      return added;
    }
    case "SREM": {
      const set = sets.get(args[0]);
      if (!set) return 0;
      let removed = 0;
      for (const member of args.slice(1)) if (set.delete(member)) removed++;
      return removed;
    }
    case "SMEMBERS":
      return Array.from(sets.get(args[0]) || []);
    case "LPUSH": {
      if (!lists.has(args[0])) lists.set(args[0], []);
      lists.get(args[0]).unshift(...args.slice(1).reverse());
      return lists.get(args[0]).length;
    }
    case "LTRIM": {
      const list = lists.get(args[0]) || [];
      lists.set(args[0], list.slice(parseInt(args[1], 10), parseInt(args[2], 10) + 1));
      return "OK";
    }
    case "LRANGE": {
      const list = lists.get(args[0]) || [];
      const stop = parseInt(args[2], 10);
      return list.slice(parseInt(args[1], 10), stop === -1 ? undefined : stop + 1);
    }
    case "EXISTS":
      return args.reduce((n, key) => n + (strings.has(key) || sets.has(key) || lists.has(key) ? 1 : 0), 0);
    case "INCR": {
      const cur = parseInt(strings.get(args[0]) || "0", 10) + 1;
      strings.set(args[0], String(cur));
      return cur;
    }
    case "INCRBY": {
      const cur = parseInt(strings.get(args[0]) || "0", 10) + parseInt(args[1], 10);
      strings.set(args[0], String(cur));
      return cur;
    }
    case "EXPIRE":
      return 1; // TTL ignored in the mock
    case "HINCRBY": {
      if (!hashes.has(args[0])) hashes.set(args[0], new Map());
      const h = hashes.get(args[0]);
      const cur = parseInt(h.get(args[1]) || "0", 10) + parseInt(args[2], 10);
      h.set(args[1], String(cur));
      return cur;
    }
    case "HGETALL": {
      // Real Upstash REST wire format is a flat [field1,val1,field2,val2,...]
      // array (like raw Redis RESP), which the @upstash/redis client then
      // deserializes into an object - not a JS object directly. An empty/
      // missing hash is `[]`, not `null` (the client's deserializer calls
      // `.length` on the raw result unconditionally).
      const h = hashes.get(args[0]);
      if (!h) return [];
      return Array.from(h.entries()).flat();
    }
    case "HGET": {
      const h = hashes.get(args[0]);
      return h ? (h.get(args[1]) ?? null) : null;
    }
    case "HSET": {
      if (!hashes.has(args[0])) hashes.set(args[0], new Map());
      const h = hashes.get(args[0]);
      let added = 0;
      for (let i = 1; i < args.length; i += 2) {
        if (!h.has(args[i])) added++;
        h.set(args[i], args[i + 1]);
      }
      return added;
    }
    case "ZADD": {
      if (!zsets.has(args[0])) zsets.set(args[0], new Map());
      const z = zsets.get(args[0]);
      // Upstash JS client sends ZADD key score member (single pair form).
      z.set(args[2], parseFloat(args[1]));
      return 1;
    }
    case "ZRANGE": {
      const z = zsets.get(args[0]) || new Map();
      let entries = Array.from(z.entries()).sort((a, b) => a[1] - b[1]);
      const rev = args.includes("REV") || args.includes("rev");
      if (rev) entries = entries.reverse();
      const start = parseInt(args[1], 10);
      const stop = parseInt(args[2], 10);
      const sliced = stop === -1 ? entries.slice(start) : entries.slice(start, stop + 1);
      return sliced.map(([member]) => member);
    }
    default:
      throw new Error(`Mock Upstash: unsupported command ${command}`);
  }
}

// The @upstash/redis client defaults to responseEncoding "base64": it sends
// an `Upstash-Encoding: base64` header and then, on every response,
// unconditionally base64-DECODES every string (and array-of-strings) it
// gets back, regardless of which command produced it - see `decode()` in
// the client. Real Upstash base64-encodes its responses to match; this mock
// must do the same for any client newer than ~1.20, or field names/values
// for hash/array replies (HGETALL, etc.) get corrupted by that blind
// decode step even though the values were never actually base64 to begin
// with. Numbers are left alone (decode() only touches strings), and the
// literal "OK" is also left alone (decode() special-cases it).
function encodeForClient(raw) {
  if (typeof raw === "string") {
    return raw === "OK" ? raw : Buffer.from(raw, "utf8").toString("base64");
  }
  if (Array.isArray(raw)) return raw.map(encodeForClient);
  return raw;
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/__stats")) {
    if (req.method === "DELETE") { counters.roundTrips = 0; counters.commands = 0; }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(counters));
    return;
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));
    try {
      const parsed = JSON.parse(body || "[]");
      const wantsBase64 = String(req.headers["upstash-encoding"] || "").toLowerCase() === "base64";
      const finish = (value) => (wantsBase64 ? encodeForClient(value) : value);
      let payload;
      if (req.url.startsWith("/pipeline")) {
        payload = parsed.map((command) => ({ result: finish(exec(command)) }));
        if (counting) { counters.roundTrips++; counters.commands += parsed.length; }
      } else {
        payload = { result: finish(exec(parsed)) };
        if (counting) { counters.roundTrips++; counters.commands++; }
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
});

server.listen(port, () => {
  console.log(`Mock Upstash Redis listening on http://127.0.0.1:${port}`);
});
