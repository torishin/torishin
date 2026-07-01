import type {
  AiProvider,
  ArticleDraft,
  ArticleGenerationInput,
} from "@/lib/ai/types";
import { calculateMaxSimilarity } from "@/lib/ai/similarity";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const similarityThreshold = 70;

export function createGeminiProvider(): AiProvider {
  return {
    name: "gemini",
    async generateArticleDraft(input) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set.");
      }

      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      let avoidInstruction = "";
      let lastDraft: ArticleDraft | null = null;
      let lastError = "";

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        let draft: ArticleDraft;
        try {
          const text = await requestGemini({
            apiKey,
            model,
            prompt: buildPrompt(input, avoidInstruction),
          });
          draft = normalizeDraft(parseDraft(text), {
            provider: "gemini",
            model,
            similarity: 0,
          });
        } catch (caught) {
          lastError =
            caught instanceof Error
              ? caught.message
              : "Gemini generation failed.";
          avoidInstruction = [
            "直前の出力はJSONとして読み取れませんでした。",
            "必ず category, title, lead, summary, body, tags を持つ完全なJSONだけを返してください。",
            "本文が長すぎて切れないよう、1000〜1500文字の範囲内に収めてください。",
          ].join("\n");
          continue;
        }

        const similarity = calculateMaxSimilarity(draft, input.pastArticles);
        lastDraft = { ...draft, similarity };

        if (similarity < similarityThreshold) {
          return lastDraft;
        }

        avoidInstruction = [
          `直前の案は過去記事との類似度が約${similarity}%でした。`,
          "タイトル、カテゴリー、歴史背景、具体例、実践方法、ソーシャルワークへの結び付け方を大きく変えて、別の切り口で再生成してください。",
        ].join("\n");
      }

      if (lastDraft) return lastDraft;
      throw new Error(lastError || "Gemini did not return an article draft.");
    },
  };
}

async function requestGemini({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.9,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING" },
              title: { type: "STRING" },
              lead: { type: "STRING" },
              summary: { type: "STRING" },
              body: { type: "STRING" },
              tags: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
            },
            required: ["category", "title", "lead", "summary", "body", "tags"],
          },
        },
      }),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Gemini API Error: ${response.status}`,
    );
  }

  const outputText =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n") ?? "";

  if (!outputText.trim()) {
    throw new Error("Gemini returned empty text.");
  }

  return outputText;
}

function buildPrompt(input: ArticleGenerationInput, avoidInstruction: string) {
  const pastArticles = input.pastArticles.map((article, index) => ({
    no: index + 1,
    category: article.categoryName,
    title: article.title,
    summary: article.summary,
    lead: article.lead,
    tags: article.tags,
    bodyExcerpt: article.bodyExcerpt,
  }));

  return [
    input.basePrompt,
    "",
    "## 今回のテーマ",
    `テーマ名: ${input.themeName}`,
    `テーマ説明: ${input.themeDescription || "未設定"}`,
    `アクセス年月日: ${formatAccessDate(new Date())}`,
    "",
    "## 過去記事リスト",
    pastArticles.length > 0
      ? JSON.stringify(pastArticles, null, 2)
      : "このテーマの過去記事はまだありません。",
    "",
    avoidInstruction ? `## 再生成指示\n${avoidInstruction}\n` : "",
    "## 追加条件",
    "カテゴリーはAIが自然に決めてください。既存カテゴリーに縛られなくて構いません。",
    "本文は1000〜1500文字程度にしてください。",
    "リード文は約100文字、summaryは約60文字にしてください。",
    "読了時間は返さなくて構いません。保存時に自動計算します。",
    "外部資料を引用・参照する場合は、bodyの本文中に著者姓・年・頁またはWeb出典を示し、bodyの末尾に「引用・参考文献」を含めてください。",
    "ページ番号が確認できない資料は直接引用せず、電子メディア情報としてURLとアクセス年月日を記載してください。",
    "JSON以外の文字を返さないでください。",
  ].join("\n");
}

function formatAccessDate(date: Date) {
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

function parseDraft(text: string) {
  const normalized = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(normalized) as Partial<ArticleDraft>;
}

function normalizeDraft(
  draft: Partial<ArticleDraft>,
  meta: Pick<ArticleDraft, "provider" | "model" | "similarity">,
): ArticleDraft {
  if (
    !draft.category ||
    !draft.title ||
    !draft.lead ||
    !draft.summary ||
    !draft.body
  ) {
    throw new Error(
      "Gemini response did not include category, title, lead, summary, and body.",
    );
  }

  const body = draft.body.trim();
  return {
    category: draft.category.trim(),
    title: draft.title.trim(),
    lead: draft.lead.trim(),
    summary: draft.summary.trim(),
    body,
    readingMinutes: Math.max(1, Math.round(body.length / 600)),
    tags: Array.isArray(draft.tags)
      ? draft.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 6)
      : [],
    ...meta,
  };
}
