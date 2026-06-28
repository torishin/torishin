"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAiProvider, getDailyWordPrompt } from "@/lib/ai";
import type { ArticleDraft } from "@/lib/ai/types";
import {
  createSession,
  destroyCurrentSession,
  findUserByEmail,
  requireAdmin,
  verifyPassword,
} from "@/lib/daily-words/auth";
import {
  createArticle,
  createTheme,
  deleteTheme,
  findOrCreateCategory,
} from "@/lib/daily-words/mutations";
import {
  getThemeArticleMemory,
  getThemeForGeneration,
} from "@/lib/daily-words/queries";

export async function loginAction(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");
  const user = await findUserByEmail(email);

  if (
    !user ||
    user.role !== "admin" ||
    !(await verifyPassword(password, user.password_hash))
  ) {
    redirect("/admin/login?error=invalid");
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/admin/login");
}

export async function addThemeAction(formData: FormData) {
  await assertAdmin();
  const name = getRequiredString(formData, "name");

  await createTheme({
    day: "自由テーマ",
    name,
    icon: name.slice(0, 1),
    description: `${name}について、日々の生活とソーシャルワークの視点から読み解くテーマです。`,
    generationPrompt: "",
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function deleteThemeAction(formData: FormData) {
  await assertAdmin();
  await deleteTheme(getRequiredString(formData, "id"));
  revalidateDailyWords();
}

export async function generateDraftAction(themeId: string) {
  await assertAdmin();
  const theme = await getThemeForGeneration(themeId);
  if (!theme) {
    throw new Error("テーマが見つかりません。");
  }

  const pastArticles = await getThemeArticleMemory(themeId);
  const provider = getAiProvider();
  const draft = await provider.generateArticleDraft({
    themeName: theme.name,
    themeDescription: theme.description,
    basePrompt: await getDailyWordPrompt(),
    pastArticles: pastArticles.map((article) => ({
      categoryName: article.category_name,
      title: article.title,
      summary: article.summary,
      lead: article.lead,
      bodyExcerpt: article.body_excerpt,
      tags: article.tags ?? [],
    })),
  });

  return draft;
}

export async function saveDraftAction(themeId: string, draft: ArticleDraft) {
  await assertAdmin();
  const theme = await getThemeForGeneration(themeId);
  if (!theme) {
    throw new Error("テーマが見つかりません。");
  }

  const categoryId = await findOrCreateCategory({
    themeId,
    name: draft.category,
    description: `${theme.name}の「${draft.category}」に関する記事です。`,
  });

  await createArticle({
    categoryId,
    title: draft.title,
    lead: draft.lead,
    summary: draft.summary,
    body: draft.body,
    readingMinutes: draft.readingMinutes,
    sortOrder: 0,
    tags: draft.tags,
    published: true,
  });

  revalidateDailyWords();
  return { ok: true };
}

async function assertAdmin() {
  const user = await requireAdmin();
  if (!user) redirect("/admin/login");
}

function revalidateDailyWords() {
  revalidatePath("/");
  revalidatePath("/admin");
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function getNumber(formData: FormData, key: string, fallback: number) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
