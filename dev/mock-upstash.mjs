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
    default:
      throw new Error(`Mock Upstash: unsupported command ${command}`);
  }
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
      let payload;
      if (req.url.startsWith("/pipeline")) {
        payload = parsed.map((command) => ({ result: exec(command) }));
        if (counting) { counters.roundTrips++; counters.commands += parsed.length; }
      } else {
        payload = { result: exec(parsed) };
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
