import { httpJson } from "@/services/http";

export type FsRootsResponse = {
  ok: boolean;
  roots: string[];
};

export type FsListResponse = {
  ok: boolean;
  path: string;
  parent: string | null;
  dirs: { name: string; path: string }[];
  error?: string;
};

export function getFsRoots() {
  return httpJson<FsRootsResponse>("/api/fs/roots");
}

export function listFsDir(path: string) {
  const url = `/api/fs/list?path=${encodeURIComponent(path)}`;
  return httpJson<FsListResponse>(url);
}
