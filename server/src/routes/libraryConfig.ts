import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import { loadConfig, saveConfig } from "../config/store.js";

export const libraryConfigRouter = Router();

function isSafeAbsolute(p: string) {
  if (p.includes("\0")) return false;
  return path.isAbsolute(p);
}

libraryConfigRouter.get("/config", (req, res) => {
  const cfg = loadConfig();
  return res.json({ ok: true, dir: cfg.library.dir });
});

libraryConfigRouter.post("/config", (req, res) => {
  try {
    const body = z.object({ dir: z.string().min(1) }).parse(req.body);
    if (!isSafeAbsolute(body.dir)) {
      return res.status(200).json({ ok: false, error: "Path must be an absolute path" });
    }
    if (!fs.existsSync(body.dir)) fs.mkdirSync(body.dir, { recursive: true });

    const cfg = loadConfig();
    cfg.library.dir = body.dir;
    saveConfig(cfg);

    return res.json({ ok: true, dir: body.dir });
  } catch (e: any) {
    return res.status(200).json({ ok: false, error: String(e?.message ?? e) });
  }
});
