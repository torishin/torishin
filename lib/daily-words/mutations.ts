import { getSql } from "@/lib/daily-words/db";

export async function createTheme(input: {
  day: string;
  name: string;
  icon: string;
  description: string;
  generationPrompt: string;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    insert into daily_words_themes (
      day,
      name,
      icon,
      description,
      generation_prompt,
      sort_order
    )
    values (
      ${input.day},
      ${input.name},
      ${input.icon},
      ${input.description},
      ${input.generationPrompt},
      ${input.sortOrder}
    )
  `;
}

export async function updateTheme(input: {
  id: string;
  day: string;
  name: string;
  icon: string;
  description: string;
  generationPrompt: string;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    update daily_words_themes
    set day = ${input.day},
      name = ${input.name},
      icon = ${input.icon},
      description = ${input.description},
      generation_prompt = ${input.generationPrompt},
      sort_order = ${input.sortOrder},
      updated_at = now()
    where id = ${input.id}
  `;
}

export async function deleteTheme(id: string) {
  const sql = getSql();
  await sql`
    delete from daily_words_themes
    where id = ${id}
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

export async function findOrCreateCategory(input: {
  themeId: string;
  name: string;
  description: string;
}) {
  const sql = getSql();
  const existing = (await sql`
    select id
    from daily_words_categories
    where theme_id = ${input.themeId}
      and name = ${input.name}
    limit 1
  `) as Array<{ id: string }>;

  if (existing[0]) return existing[0].id;

  const rows = (await sql`
    insert into daily_words_categories (theme_id, name, description, sort_order)
    values (
      ${input.themeId},
      ${input.name},
      ${input.description},
      (
        select coalesce(max(sort_order), -1) + 1
        from daily_words_categories
        where theme_id = ${input.themeId}
      )
    )
    returning id
  `) as Array<{ id: string }>;

  return rows[0]?.id ?? "";
}

export async function updateCategory(input: {
  id: string;
  themeId: string;
  name: string;
  description: string;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    update daily_words_categories
    set theme_id = ${input.themeId},
      name = ${input.name},
      description = ${input.description},
      sort_order = ${input.sortOrder},
      updated_at = now()
    where id = ${input.id}
  `;
}

export async function deleteCategory(id: string) {
  const sql = getSql();
  await sql`
    delete from daily_words_categories
    where id = ${id}
  `;
}

export async function createArticle(input: {
  categoryId: string;
  title: string;
  lead: string;
  summary?: string;
  body: string;
  readingMinutes: number;
  sortOrder: number;
  tags?: string[];
  published?: boolean;
}) {
  const sql = getSql();
  const rows = await sql`
    insert into daily_words_articles (
      category_id,
      title,
      lead,
      summary,
      body,
      reading_minutes,
      sort_order,
      tags,
      published
    )
    values (
      ${input.categoryId},
      ${input.title},
      ${input.lead},
      ${input.summary ?? input.lead.slice(0, 60)},
      ${input.body},
      ${input.readingMinutes},
      ${input.sortOrder},
      ${input.tags ?? []},
      ${input.published ?? true}
    )
    returning id
  `;
  return (rows as Array<{ id: string }>)[0]?.id ?? "";
}

export async function updateArticle(input: {
  id: string;
  categoryId: string;
  title: string;
  lead: string;
  body: string;
  readingMinutes: number;
  sortOrder: number;
  published: boolean;
}) {
  const sql = getSql();
  await sql`
    update daily_words_articles
    set category_id = ${input.categoryId},
      title = ${input.title},
      lead = ${input.lead},
      summary = ${input.lead.slice(0, 60)},
      body = ${input.body},
      reading_minutes = ${input.readingMinutes},
      sort_order = ${input.sortOrder},
      published = ${input.published},
      updated_at = now()
    where id = ${input.id}
  `;
}

export async function deleteArticle(id: string) {
  const sql = getSql();
  await sql`
    delete from daily_words_articles
    where id = ${id}
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

export async function updateSource(input: {
  id: string;
  articleId: string;
  title: string;
  url: string;
  sortOrder: number;
}) {
  const sql = getSql();
  await sql`
    update daily_words_article_sources
    set article_id = ${input.articleId},
      title = ${input.title},
      url = ${input.url},
      sort_order = ${input.sortOrder},
      updated_at = now()
    where id = ${input.id}
  `;
}

export async function deleteSource(id: string) {
  const sql = getSql();
  await sql`
    delete from daily_words_article_sources
    where id = ${id}
  `;
}
