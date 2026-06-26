import { getSql } from "@/lib/daily-words/db";

export async function createTheme(input: {
  day: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    insert into daily_words_themes (day, name, icon, description, sort_order)
    values (${input.day}, ${input.name}, ${input.icon}, ${input.description}, ${input.sortOrder})
  `;
}

export async function createCategory(input: {
  themeId: string;
  name: string;
  description: string;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    insert into daily_words_categories (theme_id, name, description, sort_order)
    values (${input.themeId}, ${input.name}, ${input.description}, ${input.sortOrder})
  `;
}

export async function createArticle(input: {
  categoryId: string;
  title: string;
  lead: string;
  body: string;
  readingMinutes: number;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    insert into daily_words_articles (
      category_id,
      title,
      lead,
      body,
      reading_minutes,
      sort_order
    )
    values (
      ${input.categoryId},
      ${input.title},
      ${input.lead},
      ${input.body},
      ${input.readingMinutes},
      ${input.sortOrder}
    )
  `;
}

export async function createSource(input: {
  articleId: string;
  title: string;
  url: string;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    insert into daily_words_article_sources (article_id, title, url, sort_order)
    values (${input.articleId}, ${input.title}, ${input.url}, ${input.sortOrder})
  `;
}
