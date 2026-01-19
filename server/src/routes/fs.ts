import { Router } from "express";
import fs from "node:fs";
import path from "node:path";

export const fsRouter = Router();

function isSafeAbsolute(p: string) {
  if (p.includes("\0")) return false;
  return path.isAbsolute(p);
}

function getWindowsRoots() {
  const roots: string[] = [];
  for (let i = 65; i <= 90; i += 1) {
    const letter = String.fromCharCode(i);
    const root = `${letter}:\\`;
    if (fs.existsSync(root)) roots.push(root);
  }
  return roots;
}

// GET /api/fs/roots
fsRouter.get("/roots", (req, res) => {
  const roots = process.platform === "win32" ? getWindowsRoots() : ["/"];
  res.json({ ok: true, roots });
});

// GET /api/fs/list?path=<absPath>
fsRouter.get("/list", async (req, res) => {
  try {
    const target = String(req.query.path || "");
    if (!target || !isSafeAbsolute(target)) {
      return res.status(200).json({ ok: false, error: "Path must be an absolute path" });
    }

    const entries = await fs.promises.readdir(target, { withFileTypes: true });
    const dirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(target, entry.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const parent = (() => {
      if (process.platform !== "win32") return path.dirname(target);
      const normalized = path.normalize(target);
      if (/^[A-Za-z]:\\?$/.test(normalized)) return null;
      return path.dirname(normalized);
    })();

    return res.json({ ok: true, path: target, parent, dirs });
  } catch (e: any) {
    return res.status(200).json({ ok: false, error: String(e?.message ?? e) });
  }
});
