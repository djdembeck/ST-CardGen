import { Router } from "express";
import { z } from "zod";
import { Readable } from "node:stream";
import { getComfyBaseUrl } from "../adapters/comfyui/client.js";

export const comfyuiPromptRouter = Router();

const PromptRequestSchema = z.object({
  // This is the exact ComfyUI workflow/prompt object you would send to /prompt
  prompt: z.record(z.any()),
  client_id: z.string().optional(),
});

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

// POST /api/comfyui/prompt
comfyuiPromptRouter.post("/prompt", async (req, res) => {
  const baseUrl = getComfyBaseUrl();
  try {
    const parsed = PromptRequestSchema.parse(req.body);
    const result = await postJson(`${baseUrl}/prompt`, parsed);
    // result usually contains { prompt_id: "..." }
    res.json({ ok: true, baseUrl, result });
  } catch (e: any) {
    res.status(200).json({ ok: false, error: String(e?.message ?? e) });
  }
});

// GET /api/comfyui/history/:promptId
comfyuiPromptRouter.get("/history/:promptId", async (req, res) => {
  const baseUrl = getComfyBaseUrl();
  try {
    const promptId = req.params.promptId;
    const hist = await getJson(`${baseUrl}/history/${encodeURIComponent(promptId)}`);
    res.json({ ok: true, baseUrl, history: hist });
  } catch (e: any) {
    res.status(200).json({ ok: false, error: String(e?.message ?? e) });
  }
});

// GET /api/comfyui/view?filename=...&type=output&subfolder=...
comfyuiPromptRouter.get("/view", async (req, res) => {
  const baseUrl = getComfyBaseUrl();

  const filename = String(req.query.filename ?? "");
  const type = String(req.query.type ?? "output");
  const subfolder = String(req.query.subfolder ?? "");

  if (!filename) {
    return res.status(400).json({ ok: false, error: "Missing filename" });
  }

  const params = new URLSearchParams();
  params.set("filename", filename);
  if (type) params.set("type", type);
  if (subfolder) params.set("subfolder", subfolder);

  try {
    const r = await fetch(`${baseUrl}/view?${params.toString()}`);
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);

    // Pipe image bytes through your server (no CORS issues in browser)
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/octet-stream");
    if (r.body) {
      Readable.fromWeb(r.body as any).pipe(res);
    }
  } catch (e: any) {
    res.status(200).json({ ok: false, error: String(e?.message ?? e) });
  }
});
