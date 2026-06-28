import { readFile } from "node:fs/promises";
import path from "node:path";

import { createGeminiProvider } from "@/lib/ai/providers/gemini";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";

export async function getDailyWordPrompt() {
  return readFile(path.join(process.cwd(), "prompts", "daily-word.md"), "utf8");
}

export function getAiProvider() {
  const provider = process.env.AI_PROVIDER || "gemini";

  if (provider === "gemini") {
    return createGeminiProvider();
  }

  if (provider === "openai") {
    return createOpenAiProvider();
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
