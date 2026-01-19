import { z } from "zod";

export const CharacterGenSchema = z.object({
  name: z.string(),
  description: z.string(),
  personality: z.string(),
  scenario: z.string(),
  first_mes: z.string(),
  mes_example: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value.join("\n\n") : value)),

  tags: z
    .union([z.array(z.string()), z.string()])
    .transform((value) => (Array.isArray(value)
      ? value
      : value.split(",").map((tag) => tag.trim()).filter(Boolean)))
    .optional()
    .default([]),
  creator_notes: z.string().optional().default(""),
  image_prompt: z.string().optional().default(""),
  negative_prompt: z.string().optional().default(""),
  pov: z.enum(["first", "second", "third"]).optional().default("third"),
}).strict();

export type CharacterGen = z.infer<typeof CharacterGenSchema>;
