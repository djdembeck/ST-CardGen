import fs from "node:fs";
import path from "node:path";
import sanitizeFilename from "sanitize-filename";

import { loadConfig } from "../../config/store.js";
import { buildV2CardFromStorePayload, normalizeImportedCard } from "../cards/v2.js";
import { embedCardIntoPng, extractCardFromPng } from "../cards/png.js";

export type LibraryItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  source: "managed" | "filesystem";
  fileBase: string;
  pngPath?: string;
  jsonPath?: string;
};

export type LibrarySaveFormat = "json" | "png";

type LibraryIndexItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type LibraryIndex = {
  items: LibraryIndexItem[];
};

type LibraryList = {
  dir: string;
  items: LibraryItem[];
};

type CachedScan = {
  dir: string;
  at: number;
  items: LibraryItem[];
};

let cache: CachedScan | null = null;

function getLibraryDir() {
  const cfg = loadConfig();
  return cfg.library.dir;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function indexPath(dir: string) {
  return path.join(dir, "index.json");
}

function readIndex(dir: string): LibraryIndex {
  const p = indexPath(dir);
  if (!fs.existsSync(p)) return { items: [] };
  try {
    const raw = fs.readFileSync(p, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return { items: parsed.items };
  } catch {
    // fall through
  }
  return { items: [] };
}

function writeIndex(dir: string, index: LibraryIndex) {
  const p = indexPath(dir);
  fs.writeFileSync(p, JSON.stringify(index, null, 2), "utf-8");
}

function makeId(name: string) {
  const base = sanitizeFilename(name || "character").replace(/\s+/g, "_") || "character";
  return `${base}-${Date.now()}`;
}

function jsonPath(dir: string, fileBase: string) {
  return path.join(dir, `${fileBase}.json`);
}

function pngPath(dir: string, fileBase: string) {
  return path.join(dir, `${fileBase}.png`);
}

export function encodeId(value: string) {
  return Buffer.from(value, "utf-8").toString("base64url");
}

export function decodeId(id: string): string | null {
  try {
    const decoded = Buffer.from(id, "base64url").toString("utf-8");
    return decoded || null;
  } catch {
    return null;
  }
}

function safeBaseName(value: string) {
  const base = path.basename(value);
  if (base !== value) throw new Error("Invalid file identifier");
  return base;
}

function readNameFromJsonFile(filePath: string) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    const card = normalizeImportedCard(parsed);
    return String(card.data?.name ?? "").trim();
  } catch {
    return "";
  }
}

function readNameFromPngFile(filePath: string) {
  try {
    const raw = fs.readFileSync(filePath);
    const json = extractCardFromPng(raw);
    const parsed = JSON.parse(json);
    const card = normalizeImportedCard(parsed);
    return String(card.data?.name ?? "").trim();
  } catch {
    return "";
  }
}

function buildFilesystemItem(dir: string, fileBase: string, pngFile?: string, jsonFile?: string): LibraryItem {
  const pngStat = pngFile ? fs.statSync(pngFile) : null;
  const jsonStat = jsonFile ? fs.statSync(jsonFile) : null;
  const stat = pngStat ?? jsonStat;

  const nameFromJson = jsonFile ? readNameFromJsonFile(jsonFile) : "";
  const nameFromPng = !nameFromJson && pngFile ? readNameFromPngFile(pngFile) : "";
  const displayName = nameFromJson || nameFromPng || fileBase;

  return {
    id: encodeId(fileBase),
    name: displayName,
    createdAt: stat ? stat.ctime.toISOString() : new Date().toISOString(),
    updatedAt: stat ? stat.mtime.toISOString() : new Date().toISOString(),
    source: "filesystem",
    fileBase,
    pngPath: pngFile,
    jsonPath: jsonFile,
  };
}

function scanLibraryDir(dir: string): LibraryItem[] {
  const now = Date.now();
  if (cache && cache.dir === dir && now - cache.at < 5000) return cache.items;

  const items: LibraryItem[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const byBase = new Map<string, { png?: string; json?: string }>();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ext !== ".png" && ext !== ".json") continue;
    if (entry.name.toLowerCase() === "index.json") continue;
    const base = path.basename(entry.name, ext);
    const record = byBase.get(base) || {};
    const fullPath = path.join(dir, entry.name);
    if (ext === ".png") record.png = fullPath;
    if (ext === ".json") record.json = fullPath;
    byBase.set(base, record);
  }

  for (const [base, record] of byBase.entries()) {
    items.push(buildFilesystemItem(dir, base, record.png, record.json));
  }

  cache = { dir, at: now, items };
  return items;
}

function resolveFileBaseCandidates(dir: string, id: string) {
  const index = readIndex(dir);
  if (index.items.find((item) => item.id === id)) {
    return [id];
  }

  const decoded = decodeId(id);
  if (decoded) {
    const safe = safeBaseName(decoded);
    return [safe, id];
  }

  return [safeBaseName(id)];
}

function resolvePaths(dir: string, id: string) {
  const candidates = resolveFileBaseCandidates(dir, id);
  for (const base of candidates) {
    const jp = jsonPath(dir, base);
    const pp = pngPath(dir, base);
    const hasJson = fs.existsSync(jp);
    const hasPng = fs.existsSync(pp);
    if (hasJson || hasPng) return { fileBase: base, jsonPath: hasJson ? jp : undefined, pngPath: hasPng ? pp : undefined };
  }
  return { fileBase: candidates[0], jsonPath: undefined, pngPath: undefined };
}

function writeCardFiles(
  dir: string,
  fileBase: string,
  card: Record<string, any>,
  format: LibrarySaveFormat,
  avatarPng?: Buffer | null,
) {
  const jp = jsonPath(dir, fileBase);
  const pp = pngPath(dir, fileBase);
  if (format === "json") {
    fs.writeFileSync(jp, JSON.stringify(card, null, 2), "utf-8");
    if (fs.existsSync(pp)) fs.unlinkSync(pp);
    return;
  }

  if (!avatarPng) throw new Error("Avatar image required for PNG save");
  const embedded = embedCardIntoPng(avatarPng, JSON.stringify(card));
  fs.writeFileSync(pp, embedded);
  if (fs.existsSync(jp)) fs.unlinkSync(jp);
}

export function listLibraryItems(): LibraryList {
  const dir = getLibraryDir();
  ensureDir(dir);
  const index = readIndex(dir);
  const scanned = scanLibraryDir(dir);
  const scannedByBase = new Map(scanned.map((item) => [item.fileBase, item]));

  const items: LibraryItem[] = [];

  for (const managed of index.items) {
    const match = scannedByBase.get(managed.id);
    items.push({
      id: managed.id,
      name: managed.name,
      createdAt: managed.createdAt,
      updatedAt: managed.updatedAt,
      source: "managed",
      fileBase: managed.id,
      pngPath: match?.pngPath ?? (fs.existsSync(pngPath(dir, managed.id)) ? pngPath(dir, managed.id) : undefined),
      jsonPath: match?.jsonPath ?? (fs.existsSync(jsonPath(dir, managed.id)) ? jsonPath(dir, managed.id) : undefined),
    });
    if (match) scannedByBase.delete(managed.id);
  }

  items.push(...scannedByBase.values());
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return { dir, items };
}

export function loadLibraryCard(id: string) {
  const dir = getLibraryDir();
  ensureDir(dir);
  const resolved = resolvePaths(dir, id);

  let cardJson: string | null = null;
  if (resolved.jsonPath) {
    cardJson = fs.readFileSync(resolved.jsonPath, "utf-8");
  } else if (resolved.pngPath) {
    cardJson = extractCardFromPng(fs.readFileSync(resolved.pngPath));
  }

  if (!cardJson) throw new Error("Card not found");
  const parsed = JSON.parse(cardJson);
  const cardV2 = normalizeImportedCard(parsed);
  const hasPng = Boolean(resolved.pngPath);
  return { dir, cardV2, hasPng };
}

export function loadLibraryPng(id: string) {
  const dir = getLibraryDir();
  ensureDir(dir);
  const resolved = resolvePaths(dir, id);
  if (!resolved.pngPath) throw new Error("Image not found");
  return fs.readFileSync(resolved.pngPath);
}

export function saveLibraryCard(
  payload: Record<string, any>,
  format: LibrarySaveFormat,
  avatarPng?: Buffer | null,
) {
  const dir = getLibraryDir();
  ensureDir(dir);

  const card = buildV2CardFromStorePayload(payload);
  const id = makeId(String(payload?.name ?? ""));
  const now = new Date().toISOString();

  writeCardFiles(dir, id, card, format, avatarPng);

  const index = readIndex(dir);
  index.items.unshift({
    id,
    name: String(payload?.name ?? "Untitled"),
    createdAt: now,
    updatedAt: now,
  });
  writeIndex(dir, index);

  cache = null;
  return { dir, id };
}

export function updateLibraryCard(
  idOrEncoded: string,
  payload: Record<string, any>,
  format: LibrarySaveFormat,
  avatarPng?: Buffer | null,
) {
  const dir = getLibraryDir();
  ensureDir(dir);

  const resolved = resolvePaths(dir, idOrEncoded);
  if (!resolved.jsonPath && !resolved.pngPath) throw new Error("Card not found");

  const card = buildV2CardFromStorePayload(payload);
  const fileBase = resolved.fileBase;
  const now = new Date().toISOString();

  writeCardFiles(dir, fileBase, card, format, avatarPng);

  const index = readIndex(dir);
  const existing = index.items.find((item) => item.id === fileBase);
  if (existing) {
    existing.name = String(payload?.name ?? "Untitled");
    existing.updatedAt = now;
  } else {
    index.items.unshift({
      id: fileBase,
      name: String(payload?.name ?? "Untitled"),
      createdAt: now,
      updatedAt: now,
    });
  }
  writeIndex(dir, index);

  cache = null;
  return { dir, id: fileBase };
}

export function deleteLibraryItem(idOrEncoded: string) {
  const dir = getLibraryDir();
  ensureDir(dir);
  const resolvedDir = path.resolve(dir);

  const index = readIndex(dir);
  const decoded = decodeId(idOrEncoded);
  const candidates = Array.from(new Set([
    ...index.items.filter((item) => item.id === idOrEncoded).map((item) => item.id),
    idOrEncoded,
    decoded ?? "",
  ])).filter(Boolean);

  let fileBase: string | null = null;
  let foundJson: string | undefined;
  let foundPng: string | undefined;

  for (const candidate of candidates) {
    let safeCandidate: string;
    try {
      safeCandidate = safeBaseName(candidate);
    } catch {
      continue;
    }
    const jp = jsonPath(dir, safeCandidate);
    const pp = pngPath(dir, safeCandidate);
    const hasJson = fs.existsSync(jp);
    const hasPng = fs.existsSync(pp);
    if (hasJson || hasPng) {
      fileBase = safeCandidate;
      foundJson = hasJson ? jp : undefined;
      foundPng = hasPng ? pp : undefined;
      break;
    }
  }

  if (!fileBase) throw new Error("Card not found");

  const validatePath = (filePath?: string) => {
    if (!filePath) return;
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(resolvedDir + path.sep) && resolved !== resolvedDir) {
      throw new Error("Invalid file path");
    }
  };

  validatePath(foundPng);
  validatePath(foundJson);

  if (foundPng && fs.existsSync(foundPng)) fs.unlinkSync(foundPng);
  if (foundJson && fs.existsSync(foundJson)) fs.unlinkSync(foundJson);

  const nextIndex = readIndex(dir);
  const nextItems = nextIndex.items.filter((item) => item.id !== fileBase);
  if (nextItems.length !== nextIndex.items.length) {
    writeIndex(dir, { items: nextItems });
  }

  cache = null;
}
