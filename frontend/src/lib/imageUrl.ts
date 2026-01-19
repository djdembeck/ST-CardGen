export function resolveImageSrc(imageUrl?: string, imageBase64?: string): string | null {
  const b64 = imageBase64?.trim();
  if (b64) {
    if (b64.startsWith("data:")) return b64;
    return `data:image/png;base64,${b64}`;
  }

  const u = (imageUrl ?? "").trim();
  if (!u) return null;

  const looksLikeBase64 = !u.includes("/") && !u.includes(":") && !u.includes("?") && u.length > 200;
  if (looksLikeBase64) return `data:image/png;base64,${u}`;

  return u;
}

export function withCacheBust(url: string): string {
  if (url.startsWith("data:")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_=${Date.now()}`;
}
