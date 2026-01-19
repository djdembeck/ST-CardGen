import sanitizeFilename from "sanitize-filename";

export type V2Card = {
  spec: "chara_card_v2";
  spec_version: "2.0";
  data: Record<string, any>;
};

export function buildV2CardFromStorePayload(payload: Record<string, any>): V2Card {
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: { ...payload },
  };
}

export function normalizeImportedCard(obj: any): V2Card {
  if (obj && obj.spec === "chara_card_v2" && obj.data && typeof obj.data === "object") {
    return {
      spec: "chara_card_v2",
      spec_version: "2.0",
      data: { ...obj.data },
    };
  }

  if (obj && typeof obj === "object") {
    const { spec, spec_version, ...rest } = obj;
    return {
      spec: "chara_card_v2",
      spec_version: "2.0",
      data: { ...rest },
    };
  }

  throw new Error("Invalid card payload");
}

export function filenameFromCard(card: V2Card, fallback = "character") {
  const raw = String(card.data?.name ?? "").trim();
  const cleaned = sanitizeFilename(raw).replace(/\s+/g, "_");
  return cleaned || fallback;
}
