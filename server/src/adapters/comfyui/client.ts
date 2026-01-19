import { loadConfig } from "../../config/store.js";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function getComfyBaseUrl() {
  const cfg = loadConfig();
  return normalizeBaseUrl(cfg.image.baseUrls?.comfyui || "http://127.0.0.1:8188");
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getSystemStats(baseUrl: string) {
  return fetchJson(`${baseUrl}/system_stats`);
}

export async function getObjectInfo(baseUrl: string) {
  return fetchJson(`${baseUrl}/object_info`);
}
