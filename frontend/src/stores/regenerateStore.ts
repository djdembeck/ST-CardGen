import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

type RegenerateControls = {
  keepName: boolean;
  keepDescription: boolean;
  keepPersonality: boolean;
  keepScenario: boolean;
  keepFirstMes: boolean;
  keepMesExample: boolean;
  keepTags: boolean;
  keepCreatorNotes: boolean;
  keepImagePrompt: boolean;
  keepNegativePrompt: boolean;
  keepAvatar: boolean;
};

const defaults: RegenerateControls = {
  keepName: true,
  keepDescription: false,
  keepPersonality: false,
  keepScenario: false,
  keepFirstMes: false,
  keepMesExample: false,
  keepTags: false,
  keepCreatorNotes: false,
  keepImagePrompt: true,
  keepNegativePrompt: true,
  keepAvatar: true,
};

export const useRegenerateStore = defineStore("regenerate", () => {
  const controls = useLocalStorage<RegenerateControls>("ccg_regen_controls_v1", { ...defaults });
  return { controls };
});
