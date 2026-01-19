import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

const defaultPrompt = "a cinematic portrait photo of a medieval ranger, shallow depth of field";
const defaultNegative = "blurry, low quality, deformed, extra fingers";

export const useGenerateStore = defineStore("generate", () => {
  const prompt = useLocalStorage("ccg_generate_prompt", defaultPrompt);
  const negativePrompt = useLocalStorage("ccg_generate_negative", defaultNegative);
  const seed = useLocalStorage<number | null>("ccg_generate_seed", null);

  function reset() {
    prompt.value = defaultPrompt;
    negativePrompt.value = defaultNegative;
    seed.value = null;
  }

  return { prompt, negativePrompt, seed, reset };
});
