type GeminiChunk = {
  web?: {
    uri?: string;
    title?: string;
  };
};

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
  groundingMetadata?: {
    groundingChunks?: GeminiChunk[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
};

export type GeneratedArticle = {
  title: string;
  lead: string;
  body: string;
  readingMinutes: number;
  sources: Array<{ title: string; url: string }>;
  model: string;
};

const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

export async function generateDailyWordsArticle(input: {
  themeName: string;
  themeDay: string;
  categoryName: string;
  categoryDescription: string;
  generationPrompt: string;
}): Promise<GeneratedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const today = new Date();
  const dateText = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const prompt = [
    input.generationPrompt,
    "",
    `本日は${dateText}です。`,
    `テーマ: ${input.themeDay} / ${input.themeName}`,
    `カテゴリ: ${input.categoryName}`,
    `カテゴリ説明: ${input.categoryDescription}`,
    "",
    "Google検索による最新情報や研究、具体例を踏まえ、管理画面に保存できる文章を作成してください。",
    "出力は次のJSONのみ。Markdown、コードフェンス、JSON以外の説明文は出さないでください。",
    JSON.stringify({
      title: "文章タイトル",
      lead: "文章の短いリード文",
      body: "本文。段落の間は空行で区切る。見出しを使う場合は行頭に■を付ける。",
      readingMinutes: 6,
    }),
  ].join("\n");

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.9 },
  };

  let lastError = "";
  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const payload = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (!response.ok) {
      lastError =
        payload.error?.message ?? `Gemini API Error: ${response.status}`;
      if ([400, 401, 403].includes(response.status)) break;
      continue;
    }

    const candidate = payload.candidates?.[0];
    const text =
      candidate?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n") ?? "";

    if (!text) {
      lastError = "Gemini returned empty text.";
      continue;
    }

    const parsed = parseGeneratedText(text, input);
    const sources = buildSources(
      candidate?.groundingMetadata?.groundingChunks ?? [],
    );

    return {
      ...parsed,
      sources,
      model,
    };
  }

  throw new Error(lastError || "Gemini generation failed.");
}

function parseGeneratedText(
  text: string,
  input: {
    themeName: string;
    categoryName: string;
  },
) {
  const normalized = normalizeGeneratedText(text);

  try {
    return parseGeneratedJson(normalized);
  } catch {
    return parsePlainGeneratedText(normalized, input);
  }
}

function parseGeneratedJson(text: string) {
  const normalized = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(normalized) as Partial<GeneratedArticle>;

  if (!parsed.title || !parsed.lead || !parsed.body) {
    throw new Error("Gemini response did not include title, lead, and body.");
  }

  return {
    title: parsed.title.trim(),
    lead: parsed.lead.trim(),
    body: parsed.body.trim(),
    readingMinutes:
      typeof parsed.readingMinutes === "number" &&
      Number.isFinite(parsed.readingMinutes)
        ? Math.max(1, Math.round(parsed.readingMinutes))
        : estimateReadingMinutes(parsed.body),
  };
}

function parsePlainGeneratedText(
  text: string,
  input: {
    themeName: string;
    categoryName: string;
  },
) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title =
    stripHeadingPrefix(lines.find((line) => line.length <= 80) ?? "") ||
    `${input.themeName}の${input.categoryName}`;
  const body = text.trim();
  const lead =
    stripHeadingPrefix(
      lines.find(
        (line) =>
          line !== title && !line.startsWith("{") && !line.startsWith("}"),
      ) ?? "",
    ) || `${input.categoryName}について、Geminiが生成した文章です。`;

  return {
    title,
    lead,
    body,
    readingMinutes: estimateReadingMinutes(body),
  };
}

function normalizeGeneratedText(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function stripHeadingPrefix(text: string) {
  return text
    .replace(/^["'「『【\[{]*/, "")
    .replace(/["'」』】\]}:,，、。]*$/, "")
    .replace(/^■\s*/, "")
    .replace(/^(title|タイトル)\s*[:：]\s*/i, "")
    .trim();
}

function estimateReadingMinutes(body: string) {
  return Math.max(1, Math.round(body.length / 600));
}

function buildSources(chunks: GeminiChunk[]) {
  const seen = new Set<string>();
  const sources: Array<{ title: string; url: string }> = [];

  for (const chunk of chunks) {
    const url = chunk.web?.uri;
    if (!url || seen.has(url)) continue;

    seen.add(url);
    sources.push({
      title: chunk.web?.title ?? url,
      url,
    });
  }

  return sources;
}
