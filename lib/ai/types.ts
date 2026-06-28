export type PastArticleMemory = {
  categoryName: string;
  title: string;
  summary: string;
  lead: string;
  bodyExcerpt: string;
  tags: string[];
};

export type ArticleDraft = {
  category: string;
  title: string;
  lead: string;
  summary: string;
  body: string;
  readingMinutes: number;
  tags: string[];
  similarity: number;
  provider: string;
  model: string;
};

export type ArticleGenerationInput = {
  themeName: string;
  themeDescription: string;
  basePrompt: string;
  pastArticles: PastArticleMemory[];
};

export type AiProvider = {
  name: string;
  generateArticleDraft(input: ArticleGenerationInput): Promise<ArticleDraft>;
};
