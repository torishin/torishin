import type {
  AiProvider,
  ArticleDraft,
  ArticleGenerationInput,
} from "@/lib/ai/types";
import { calculateMaxSimilarity } from "@/lib/ai/similarity";

type OpenAiResponse = {
  output_text?: string;
  error?: {
    message?: string;
  };
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const similarityThreshold = 70;

export function createOpenAiProvider(): AiProvider {
  return {
    name: "openai",
    async generateArticleDraft(input) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set.");
      }

      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      let avoidInstruction = "";
      let lastDraft: ArticleDraft | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const text = await requestOpenAi({
          apiKey,
          model,
          prompt: buildPrompt(input, avoidInstruction),
        });
        const draft = normalizeDraft(parseDraft(text), {
          provider: "openai",
          model,
          similarity: 0,
        });
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
      throw new Error("OpenAI did not return an article draft.");
    },
  };
}

async function requestOpenAi({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.9,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as OpenAiResponse;
  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `OpenAI API Error: ${response.status}`,
    );
  }

  const outputText =
    payload.output_text ??
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ??
    "";

  if (!outputText.trim()) {
    throw new Error("OpenAI returned empty text.");
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
      "OpenAI response did not include category, title, lead, summary, and body.",
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
