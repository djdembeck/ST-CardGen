import { httpJson } from "@/services/http";

export type GenerateImageRequest = {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  aspectRatio?: string;
  outputFormat?: "png" | "webp" | "jpeg";
};

export type GenerateImageResponse = {
  ok: boolean;
  error?: string;
  provider?: string;

  promptId?: string;
  seed?: number;

  // server returns this when it finds an image
  imageUrl?: string;
  imageBase64?: string;

  // optional debug payloads you may return server-side
  image?: any;
};

export function generateImage(req: GenerateImageRequest) {
  return httpJson<GenerateImageResponse>("/api/image/generate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export type ListSamplersResponse = {
  ok: boolean;
  provider?: string;
  baseUrl?: string;
  samplers?: string[];
  warning?: string;
  error?: string;
};

export type ListSchedulersResponse = {
  ok: boolean;
  provider?: string;
  baseUrl?: string;
  schedulers?: string[];
  warning?: string;
  error?: string;
};

export type ConnectImageProviderResponse = {
  ok: boolean;
  provider: string;
  baseUrl: string;
  checkedAt?: string;
  samplers?: string[];
  schedulers?: string[];
  details?: { workflows?: Array<{ name: string; title: string; hasLora: boolean }> };
  warning?: string;
  error?: string;
};

export type ListComfyWorkflowsResponse = {
  ok: boolean;
  workflows?: Array<{ name: string; title: string; hasLora: boolean }>;
  error?: string;
};

export function listSamplers() {
  return httpJson<ListSamplersResponse>("/api/image/samplers");
}

export function listSchedulers() {
  return httpJson<ListSchedulersResponse>("/api/image/schedulers");
}

export function connectImageProvider(provider: "comfyui" | "sdapi" | "koboldcpp" | "stability" | "huggingface" | "google") {
  return httpJson<ConnectImageProviderResponse>("/api/image/connect", {
    method: "POST",
    body: JSON.stringify({ provider }),
  });
}

export function listComfyWorkflows() {
  return httpJson<ListComfyWorkflowsResponse>("/api/image/comfyui/workflows");
}
