import { loadConfig } from "../../config/store.js";
import { getKey } from "../../services/keyStore.js";
import type { TextGenParams } from "./koboldcpp.js";

export type Message = { role: "system" | "user" | "assistant"; content: string };

function normalizeBaseUrl(url: string) {
  const trimmed = url.replace(/\/+$/, "");
  if (trimmed.endsWith("/v1")) return trimmed;
  return `${trimmed}/v1`;
}

function truncate(text: string, max = 500) {
  return text.length > max ? text.slice(0, max) : text;
}

async function getJson(url: string, apiKey?: string | null) {
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(url, { headers });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} ${truncate(text)}`.trim());
  }
  return JSON.parse(text);
}

async function postJson(url: string, body: any, apiKey?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} ${truncate(text)}`.trim());
  }
  return JSON.parse(text);
}

export async function openaiListModelsWithKey(baseUrl: string, apiKey?: string | null): Promise<string[]> {
  const normalized = normalizeBaseUrl(baseUrl);
  const data = await getJson(`${normalized}/models`, apiKey ?? undefined);
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((item: any) => item?.id).filter((id: any) => typeof id === "string");
}

async function getApiKeyFromConfig() {
  const cfg = loadConfig();
  const keyName = cfg.text.openaiCompat?.apiKeyRef;
  if (!keyName) return null;
  const apiKey = await getKey(keyName);
  if (!apiKey) {
    throw new Error(`API key not found for "${keyName}".`);
  }
  return apiKey;
}

export async function openaiListModels(): Promise<string[]> {
  const cfg = loadConfig();
  const baseUrl = normalizeBaseUrl(cfg.text.openaiCompat?.baseUrl || "http://127.0.0.1:1234/v1");
  const apiKey = await getApiKeyFromConfig();
  return openaiListModelsWithKey(baseUrl, apiKey);
}

export async function openaiChatComplete(messages: Message[], params?: TextGenParams) {
  const cfg = loadConfig();
  const baseUrl = normalizeBaseUrl(cfg.text.openaiCompat?.baseUrl || "http://127.0.0.1:1234/v1");
  const apiKey = await getApiKeyFromConfig();
  const model = cfg.text.openaiCompat?.model;

  let chosenModel = model;
  if (!chosenModel) {
    const models = await openaiListModelsWithKey(baseUrl, apiKey);
    chosenModel = models[0];
  }
  if (!chosenModel) throw new Error("No model available from OpenAI-compatible server.");

  const defaults = cfg.text.openaiCompat?.defaultParams ?? {};
  const body: Record<string, any> = {
    model: chosenModel,
    messages,
  };
  const temperature = params?.temperature ?? defaults.temperature;
  const top_p = params?.top_p ?? defaults.top_p;
  const max_tokens = params?.max_tokens ?? defaults.max_tokens;
  if (temperature !== undefined) body.temperature = temperature;
  if (top_p !== undefined) body.top_p = top_p;
  if (max_tokens !== undefined) body.max_tokens = max_tokens;

  const json = await postJson(`${baseUrl}/chat/completions`, body, apiKey);
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("OpenAI-compatible response missing content.");
  return content;
}

export async function openaiPing(): Promise<boolean> {
  const models = await openaiListModels();
  return models.length > 0;
}

export async function openaiPingWithKey(baseUrl: string, apiKey?: string | null): Promise<boolean> {
  const models = await openaiListModelsWithKey(baseUrl, apiKey ?? undefined);
  return models.length > 0;
}
