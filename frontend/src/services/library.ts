import { httpJson } from "@/services/http";

export type LibraryConfigResponse = { ok: boolean; dir: string; error?: string };

export function getLibraryConfig() {
  return httpJson<LibraryConfigResponse>("/api/library/config");
}

export function setLibraryConfig(dir: string) {
  return httpJson<LibraryConfigResponse>("/api/library/config", {
    method: "POST",
    body: JSON.stringify({ dir }),
  });
}

export type LibraryItem = {
  id: string;
  name: string;
  fileBase?: string;
  createdAt: string;
  updatedAt: string;
  pngUrl: string | null;
  hasJson?: boolean;
};

export type LibraryListResponse = {
  ok: boolean;
  dir: string;
  items: LibraryItem[];
  error?: string;
};

export function listLibrary() {
  return httpJson<LibraryListResponse>("/api/library");
}

export type LibraryLoadResponse = {
  ok: boolean;
  cardV2?: { spec: string; spec_version: string; data: any };
  avatarPngUrl?: string | null;
  error?: string;
};

export function loadLibraryItem(id: string) {
  return httpJson<LibraryLoadResponse>(`/api/library/${encodeURIComponent(id)}`);
}

export type LibrarySaveResponse = {
  ok: boolean;
  id?: string;
  dir?: string;
  error?: string;
};

export type LibrarySaveFormat = "json" | "png";

export function saveToLibrary(card: any, avatarUrl: string | null, format: LibrarySaveFormat) {
  return httpJson<LibrarySaveResponse>("/api/library/save", {
    method: "POST",
    body: JSON.stringify({ card, avatarUrl, format }),
  });
}

export function updateLibraryItem(id: string, card: any, avatarUrl: string | null, format: LibrarySaveFormat) {
  return httpJson<LibrarySaveResponse>(`/api/library/update/${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify({ card, avatarUrl, format }),
  });
}

export type LibraryDeleteResponse = {
  ok: boolean;
  error?: string;
};

export function deleteLibraryItem(id: string) {
  return httpJson<LibraryDeleteResponse>(`/api/library/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
