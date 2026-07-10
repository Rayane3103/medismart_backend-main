// Shared Upstash Redis client with lazy initialization and a clear error when
// the environment variables are missing (instead of the cryptic
// "Failed to parse URL from /pipeline" thrown by the raw client).
//
// Accepted variable names:
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   (Upstash console)
//   KV_REST_API_URL        / KV_REST_API_TOKEN          (Vercel Upstash/KV integration)

import { Redis } from "@upstash/redis";

function resolveConfig() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "").trim();
  if (!url || !token) {
    throw new Error(
      "Base de donnees Redis non configuree. Ajoutez UPSTASH_REDIS_REST_URL et "
      + "UPSTASH_REDIS_REST_TOKEN (valeurs dans la console Upstash) aux variables "
      + "d'environnement du deploiement (Vercel/Render), puis redeployez."
    );
  }
  return { url, token };
}

let client = null;

export const redis = new Proxy({}, {
  get(_target, prop) {
    if (!client) client = new Redis(resolveConfig());
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
