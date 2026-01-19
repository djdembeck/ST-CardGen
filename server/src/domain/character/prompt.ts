export type CharacterGenInput = {
  idea: string;
  name?: string;
  pov: "first" | "second" | "third";
  lorebook?: string;
};

export function buildCharacterGenPrompt(input: CharacterGenInput & { contentRating: "sfw" | "nsfw_allowed" }) {
  const nameLine = input.name?.trim()
    ? `Preferred name: ${input.name.trim()}`
    : "Preferred name: (invent a fitting name)";
  const loreLine = input.lorebook?.trim()
    ? `Lorebook:\n${input.lorebook.trim()}`
    : "Lorebook: (none)";

  return [
    "You are generating a SillyTavern character card.",
    "Return ONLY valid JSON. No markdown, no commentary.",
    "Rules:",
    "- Output must be a single JSON object with keys exactly:",
    "  name, description, personality, scenario, first_mes, mes_example, tags, creator_notes, image_prompt, negative_prompt, pov",
    "- Use standard JSON escaping for newlines (\\n). No trailing commas.",
    "- tags must be an array of short strings.",
    "- image_prompt must be a concise, detailed portrait prompt for the avatar.",
    "- negative_prompt should list what to avoid.",
    "- mes_example must contain 1-2 example exchanges using {{user}} and {{char}} labels.",
    input.contentRating === "sfw"
      ? "Content rating: SFW only. Keep content safe and avoid sexual content."
      : "Content rating: NSFW allowed. Do not add safety constraints unless requested; focus negative_prompt on quality/artifacts.",
    input.contentRating === "sfw"
      ? "- negative_prompt must include nudity and explicit sexual content to avoid."
      : "- negative_prompt should focus on quality/artifacts unless the user requests otherwise.",
    "POV rules for first_mes:",
    "- first: {{char}} speaks in first person.",
    "- second: address {{user}} in second person without controlling their actions.",
    "- third: write in third person, acknowledge {{user}} presence without controlling them.",
    "",
    "If you cannot comply with JSON, return ONLY the tagged template below and nothing else:",
    "#NAME#",
    "#DESCRIPTION#",
    "#PERSONALITY#",
    "#SCENARIO#",
    "#FIRST_MESSAGE#",
    "#EXAMPLE_MESSAGES#",
    "#TAGS#",
    "#CREATOR_NOTES#",
    "#IMAGE_PROMPT#",
    "#NEGATIVE_PROMPT#",
    "#POV#",
    "",
    "Input:",
    `Idea: ${input.idea.trim()}`,
    nameLine,
    `POV: ${input.pov}`,
    loreLine,
  ].join("\n");
}

type FillMissingInput = {
  card: Record<string, any>;
  missingKeys: string[];
  pov: "first" | "second" | "third";
  idea?: string;
  lorebook?: string;
};

export function buildFillMissingPrompt(input: FillMissingInput) {
  const fields = JSON.stringify(input.card, null, 2);
  const loreLine = input.lorebook?.trim()
    ? `Lorebook:\n${input.lorebook.trim()}`
    : "Lorebook: (none)";
  const ideaLine = input.idea?.trim() ? `Idea: ${input.idea.trim()}` : "Idea: (none)";

  return [
    "You are completing missing fields for a SillyTavern character card.",
    "Return ONLY valid JSON. No markdown, no commentary.",
    "Rules:",
    "- Output must be a JSON object containing ONLY the missing keys listed below.",
    "- Do NOT include keys that already have content.",
    "- Use standard JSON escaping for newlines (\\n). No trailing commas.",
    "- mes_example must contain 1-2 example exchanges using {{user}} and {{char}} labels if requested.",
    "POV rules for first_mes:",
    "- first: {{char}} speaks in first person.",
    "- second: address {{user}} in second person without controlling their actions.",
    "- third: write in third person, acknowledge {{user}} presence without controlling them.",
    "",
    "Missing keys:",
    input.missingKeys.join(", "),
    "",
    "Existing fields:",
    fields,
    ideaLine,
    `POV: ${input.pov}`,
    loreLine,
  ].join("\n");
}

type ImagePromptInput = {
  card: Record<string, any>;
  styleHints?: string;
};

export function buildImagePrompt(input: ImagePromptInput & { contentRating: "sfw" | "nsfw_allowed" }) {
  const fields = JSON.stringify(input.card, null, 2);
  const styleLine = input.styleHints?.trim()
    ? `Style hints: ${input.styleHints.trim()}`
    : "Style hints: (none)";

  return [
    "You are generating an avatar portrait prompt for a SillyTavern character.",
    "Return ONLY valid JSON with keys: image_prompt, negative_prompt.",
    "Rules:",
    "- image_prompt must be a concise, detailed portrait prompt.",
    "- negative_prompt should list what to avoid.",
    input.contentRating === "sfw"
      ? "Content rating: SFW only. Include nudity and explicit sexual content in negative_prompt."
      : "Content rating: NSFW allowed. Do not add safety constraints unless requested; focus negative_prompt on quality/artifacts.",
    "- Use standard JSON escaping for newlines (\\n). No trailing commas.",
    "",
    "Character fields:",
    fields,
    styleLine,
  ].join("\n");
}

type RegenerateInput = {
  idea: string;
  requestedName?: string;
  pov: "first" | "second" | "third";
  lorebook?: string;
  card: Record<string, any>;
  targets: string[];
};

export function buildRegeneratePrompt(input: RegenerateInput) {
  const nameLine = input.requestedName?.trim()
    ? `Preferred name: ${input.requestedName.trim()}`
    : "Preferred name: (unchanged)";
  const nameRule = input.requestedName?.trim()
    ? "If you update name, use the preferred name exactly unless you must adjust capitalization."
    : "";
  const loreLine = input.lorebook?.trim()
    ? `Lorebook:\n${input.lorebook.trim()}`
    : "Lorebook: (none)";

  return [
    "You are regenerating selected fields for a SillyTavern character card.",
    "Return ONLY valid JSON. No markdown, no commentary.",
    "Rules:",
    "- Output must be a JSON object containing ONLY the target keys listed below.",
    "- Do NOT include keys that are not in the target list.",
    "- Use standard JSON escaping for newlines (\\n). No trailing commas.",
    "- mes_example must contain 1-2 example exchanges using {{user}} and {{char}} labels if requested.",
    nameRule,
    "POV rules for first_mes:",
    "- first: {{char}} speaks in first person.",
    "- second: address {{user}} in second person without controlling their actions.",
    "- third: write in third person, acknowledge {{user}} presence without controlling them.",
    "",
    "Target keys:",
    input.targets.join(", "),
    "",
    "Existing fields:",
    JSON.stringify(input.card, null, 2),
    "",
    "Input:",
    `Idea: ${input.idea.trim()}`,
    nameLine,
    `POV: ${input.pov}`,
    loreLine,
  ].join("\n");
}
