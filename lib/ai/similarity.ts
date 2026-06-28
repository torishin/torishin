import type { ArticleDraft, PastArticleMemory } from "@/lib/ai/types";

export function calculateMaxSimilarity(
  draft: Pick<ArticleDraft, "title" | "summary" | "lead" | "body">,
  pastArticles: PastArticleMemory[],
) {
  if (pastArticles.length === 0) return 0;

  const draftText = [draft.title, draft.summary, draft.lead, draft.body].join(
    "\n",
  );
  return Math.max(
    ...pastArticles.map((article) =>
      calculateSimilarity(
        draftText,
        [
          article.title,
          article.summary,
          article.lead,
          article.bodyExcerpt,
        ].join("\n"),
      ),
    ),
  );
}

function calculateSimilarity(a: string, b: string) {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return Math.round((intersection / union) * 100);
}

function tokenize(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[、。・「」『』（）()［\][\]【】"'!?！？.,:：;；\s]+/g, " ")
    .trim();

  const tokens = new Set<string>();
  for (const part of normalized.split(" ")) {
    if (part.length >= 2) tokens.add(part);
  }

  for (let index = 0; index < normalized.length - 1; index += 1) {
    const token = normalized.slice(index, index + 2).trim();
    if (token.length === 2) tokens.add(token);
  }

  return tokens;
}
