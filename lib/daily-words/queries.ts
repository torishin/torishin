import { getSql } from "@/lib/daily-words/db";
import type { DailyWordsTheme } from "@/lib/daily-words/types";

type ThemeRow = {
  id: string;
  day: string;
  name: string;
  icon: string;
  description: string;
};

type CategoryRow = {
  id: string;
  theme_id: string;
  name: string;
  description: string;
};

type ArticleRow = {
  id: string;
  category_id: string;
  title: string;
  lead: string;
  body: string;
  reading_minutes: number;
};

type SourceRow = {
  id: string;
  article_id: string;
  title: string;
  url: string;
};

export async function getDailyWordsThemes(): Promise<DailyWordsTheme[]> {
  const sql = getSql();
  const themes = (await sql`
      select id, day, name, icon, description
      from daily_words_themes
      order by sort_order asc, created_at asc
    `) as ThemeRow[];
  const categories = (await sql`
      select id, theme_id, name, description
      from daily_words_categories
      order by sort_order asc, created_at asc
    `) as CategoryRow[];
  const articles = (await sql`
      select id, category_id, title, lead, body, reading_minutes
      from daily_words_articles
      where published = true
      order by sort_order asc, created_at asc
    `) as ArticleRow[];
  const sources = (await sql`
      select id, article_id, title, url
      from daily_words_article_sources
      order by sort_order asc, created_at asc
    `) as SourceRow[];

  const sourcesByArticle = new Map<string, SourceRow[]>();
  for (const source of sources) {
    const group = sourcesByArticle.get(source.article_id) ?? [];
    group.push(source);
    sourcesByArticle.set(source.article_id, group);
  }

  const articlesByCategory = new Map<
    string,
    DailyWordsTheme["categories"][number]["articles"]
  >();
  for (const article of articles) {
    const group = articlesByCategory.get(article.category_id) ?? [];
    group.push({
      id: article.id,
      title: article.title,
      lead: article.lead,
      body: article.body
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      readingMinutes: article.reading_minutes,
      sources: (sourcesByArticle.get(article.id) ?? []).map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
      })),
    });
    articlesByCategory.set(article.category_id, group);
  }

  const categoriesByTheme = new Map<string, DailyWordsTheme["categories"]>();
  for (const category of categories) {
    const group = categoriesByTheme.get(category.theme_id) ?? [];
    group.push({
      id: category.id,
      name: category.name,
      description: category.description,
      articles: articlesByCategory.get(category.id) ?? [],
    });
    categoriesByTheme.set(category.theme_id, group);
  }

  return themes.map((theme) => ({
    id: theme.id,
    day: theme.day,
    name: theme.name,
    icon: theme.icon,
    description: theme.description,
    categories: categoriesByTheme.get(theme.id) ?? [],
  }));
}

export async function getAdminDailyWordsData() {
  const sql = getSql();
  const themes = (await sql`
      select id, day, name, icon, description, sort_order
      from daily_words_themes
      order by sort_order asc, created_at asc
    `) as Array<ThemeRow & { sort_order: number }>;
  const categories = (await sql`
      select id, theme_id, name, description, sort_order
      from daily_words_categories
      order by sort_order asc, created_at asc
    `) as Array<CategoryRow & { sort_order: number }>;
  const articles = (await sql`
      select id, category_id, title, lead, body, reading_minutes, published, sort_order
      from daily_words_articles
      order by sort_order asc, created_at asc
    `) as Array<ArticleRow & { published: boolean; sort_order: number }>;

  return { themes, categories, articles };
}
