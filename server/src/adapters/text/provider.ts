import { loadConfig } from "../../config/store.js";
import { koboldGenerateText, koboldListModels, koboldPing, type TextGenParams } from "./koboldcpp.js";
import { openaiChatComplete, openaiListModels, openaiPing, type Message } from "./openaiCompat.js";
import { geminiChatComplete, geminiListModels, geminiPing } from "./googleGemini.js";

export type TextProvider = "koboldcpp" | "openai_compat" | "google_gemini";

export async function generateText(systemPrompt: string, userPrompt: string, params?: TextGenParams) {
  const cfg = loadConfig();
  if (cfg.text.provider === "openai_compat") {
    const messages: Message[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: userPrompt });
    return openaiChatComplete(messages, params);
  }
  if (cfg.text.provider === "google_gemini") {
    const messages: Message[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: userPrompt });
    return geminiChatComplete(messages, params);
  }
  return koboldGenerateText(systemPrompt, userPrompt, params);
}

export async function listModels() {
  const cfg = loadConfig();
  if (cfg.text.provider === "openai_compat") {
    return openaiListModels();
  }
  if (cfg.text.provider === "google_gemini") {
    return geminiListModels();
  }
  return koboldListModels();
}

export async function pingProvider() {
  const cfg = loadConfig();
  if (cfg.text.provider === "openai_compat") {
    return openaiPing();
  }
  if (cfg.text.provider === "google_gemini") {
    return geminiPing();
  }
  return koboldPing();
}
