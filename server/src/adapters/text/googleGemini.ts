import { loadConfig } from "../../config/store.js";
import { getKey } from "../../services/keyStore.js";
import type { Message } from "./openaiCompat.js";
import type { TextGenParams } from "./koboldcpp.js";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function truncate(text: string, max = 500) {
  return text.length > max ? text.slice(0, max) : text;
}

async function getApiKeyFromConfig() {
  const cfg = loadConfig();
  const keyName = cfg.text.googleGemini?.apiKeyRef;
  if (!keyName) return null;
  const apiKey = await getKey(keyName);
  if (!apiKey) throw new Error(`API key not found for "${keyName}".`);
  return apiKey;
}

export async function geminiListModelsWithKey(apiBaseUrl: string, apiKey?: string | null): Promise<string[]> {
  if (!apiKey) throw new Error("No Google Gemini API key configured.");
  const normalized = normalizeBaseUrl(apiBaseUrl);
  const res = await fetch(`${normalized}/models`, {
    headers: { "x-goog-api-key": apiKey },
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} ${truncate(text)}`.trim());
  }
  const data = JSON.parse(text);
  const models = Array.isArray(data?.models) ? data.models : [];
  const ids = models.map((model: any) => {
    if (typeof model?.baseModelId === "string" && model.baseModelId.trim()) return model.baseModelId.trim();
    if (typeof model?.name === "string") {
      const name = model.name.trim();
      return name.startsWith("models/") ? name.slice("models/".length) : name;
    }
    return null;
  }).filter((id: any) => typeof id === "string" && id.length > 0);
  return Array.from(new Set(ids));
}

export async function geminiListModels(): Promise<string[]> {
  const cfg = loadConfig();
  const apiBaseUrl = cfg.text.googleGemini?.apiBaseUrl || "https://generativelanguage.googleapis.com/v1beta";
  const apiKey = await getApiKeyFromConfig();
  return geminiListModelsWithKey(apiBaseUrl, apiKey);
}

export async function geminiChatComplete(messages: Message[], params?: TextGenParams) {
  const cfg = loadConfig();
  const openaiBaseUrl = normalizeBaseUrl(cfg.text.googleGemini?.openaiBaseUrl || "https://generativelanguage.googleapis.com/v1beta/openai/");
  const apiKey = await getApiKeyFromConfig();

  let chosenModel = cfg.text.googleGemini?.model;
  if (!chosenModel) {
    const models = await geminiListModels();
    chosenModel = models.find((m) => m.startsWith("gemini")) || models[0];
  }
  if (!chosenModel) chosenModel = "gemini-3-flash-preview";

  const defaults = cfg.text.googleGemini?.defaultParams ?? {};
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

  const res = await fetch(`${openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} ${truncate(text)}`.trim());
  }
  const json = JSON.parse(text);
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Gemini response missing content.");
  return content;
}

export async function geminiPing(): Promise<boolean> {
  const models = await geminiListModels();
  return models.length > 0;
}
