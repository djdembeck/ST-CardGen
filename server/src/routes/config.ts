import { Router } from "express";
import { ConfigSchema, type AppConfig } from "../config/schema.js";
import { loadConfig, saveConfig } from "../config/store.js";

export const configRouter = Router();

let current: AppConfig = loadConfig();

function redactConfig(cfg: AppConfig): AppConfig {
  const next = structuredClone(cfg);
  if (next.text?.openaiCompat && "apiKey" in next.text.openaiCompat) {
    delete (next.text.openaiCompat as { apiKey?: string }).apiKey;
  }
  if (next.image?.stability && "apiKey" in next.image.stability) {
    delete (next.image.stability as { apiKey?: string }).apiKey;
  }
  return next;
}

configRouter.get("/", (req, res) => {
  current = loadConfig();
  res.json(redactConfig(current));
});

configRouter.put("/", (req, res) => {
  const parsed = ConfigSchema.parse(req.body);
  current = parsed;
  saveConfig(current);
  res.json(redactConfig(current));
});
