// Minimal in-memory Upstash Redis REST mock for local development/testing.
// Supports the commands used by api/index.js + api/licensing.js.
// Usage: node dev/mock-upstash.mjs [port]   (default 8790)

import http from "node:http";

const port = parseInt(process.argv[2] || "8790", 10);
const strings = new Map();
const sets = new Map();
const lists = new Map();

function exec([cmd, ...args]) {
  const command = String(cmd || "").toUpperCase();
  switch (command) {
    case "GET":
      return strings.has(args[0]) ? strings.get(args[0]) : null;
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
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const parsed = JSON.parse(body || "[]");
      let payload;
      if (req.url.startsWith("/pipeline")) {
        payload = parsed.map((command) => ({ result: exec(command) }));
      } else {
        payload = { result: exec(parsed) };
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
