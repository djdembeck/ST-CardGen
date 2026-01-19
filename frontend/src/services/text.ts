import { httpJson } from "@/services/http";

export type TextModelsResponse = {
  ok: boolean;
  models?: string[];
  error?: string;
};

export type TextPingResponse = {
  ok: boolean;
  provider?: string;
  error?: string;
};

export function listTextModels() {
  return httpJson<TextModelsResponse>("/api/text/models");
}

export function pingTextProvider() {
  return httpJson<TextPingResponse>("/api/text/ping");
}
