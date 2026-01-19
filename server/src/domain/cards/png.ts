import extractChunks from "png-chunks-extract";
import encodeChunks from "png-chunks-encode";
import textChunk from "png-chunk-text";

function isKeywordChunk(chunk: any, keyword: string) {
  if (chunk.name !== "tEXt") return false;
  try {
    const decoded = textChunk.decode(chunk.data);
    return decoded?.keyword?.toLowerCase() === keyword.toLowerCase();
  } catch {
    return false;
  }
}

export function embedCardIntoPng(pngBuffer: Buffer, cardJsonString: string): Buffer {
  const chunks = extractChunks(pngBuffer);
  const filtered = chunks.filter((chunk: any) =>
    !(isKeywordChunk(chunk, "chara") || isKeywordChunk(chunk, "ccv3"))
  );

  const base64 = Buffer.from(cardJsonString, "utf-8").toString("base64");
  const charaChunk = textChunk.encode("chara", base64);

  const iendIndex = filtered.findIndex((chunk: any) => chunk.name === "IEND");
  if (iendIndex === -1) throw new Error("Invalid PNG: missing IEND chunk");
  filtered.splice(iendIndex, 0, charaChunk);

  return Buffer.from(encodeChunks(filtered));
}

export function extractCardFromPng(pngBuffer: Buffer): string {
  const chunks = extractChunks(pngBuffer);
  for (const chunk of chunks) {
    if (chunk.name !== "tEXt") continue;
    try {
      const decoded = textChunk.decode(chunk.data);
      if (decoded?.keyword?.toLowerCase() !== "chara") continue;
      const json = Buffer.from(decoded.text, "base64").toString("utf-8");
      if (!json) throw new Error("Empty character data");
      return json;
    } catch {
      // ignore parse errors for unrelated chunks
    }
  }
  throw new Error("No character data");
}
