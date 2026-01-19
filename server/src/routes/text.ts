import { Router } from "express";
import { listModels, pingProvider } from "../adapters/text/provider.js";
import { loadConfig } from "../config/store.js";

export const textRouter = Router();

// GET /api/text/models
textRouter.get("/models", async (req, res) => {
  try {
    const models = await listModels();
    return res.json({ ok: true, models });
  } catch (e: any) {
    return res.status(200).json({ ok: false, error: String(e?.message ?? e) });
  }
});

// GET /api/text/ping
textRouter.get("/ping", async (req, res) => {
  try {
    const cfg = loadConfig();
    const ok = await pingProvider();
    return res.json({ ok, provider: cfg.text.provider });
  } catch (e: any) {
    return res.status(200).json({ ok: false, error: String(e?.message ?? e) });
  }
});
