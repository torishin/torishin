"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSession,
  destroyCurrentSession,
  findUserByEmail,
  requireAdmin,
  verifyPassword,
} from "@/lib/daily-words/auth";
import {
  createArticle,
  createCategory,
  createSource,
  createTheme,
  deleteArticle,
  deleteCategory,
  deleteSource,
  deleteTheme,
  updateArticle,
  updateCategory,
  updateSource,
  updateTheme,
} from "@/lib/daily-words/mutations";
import { generateDailyWordsArticle } from "@/lib/daily-words/gemini";
import { getGenerationContext } from "@/lib/daily-words/queries";

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
  await createTheme({
    day: getRequiredString(formData, "day"),
    name: getRequiredString(formData, "name"),
    icon: getRequiredString(formData, "icon"),
    description: getRequiredString(formData, "description"),
    generationPrompt: getString(formData, "generationPrompt"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function updateThemeAction(formData: FormData) {
  await assertAdmin();
  await updateTheme({
    id: getRequiredString(formData, "id"),
    day: getRequiredString(formData, "day"),
    name: getRequiredString(formData, "name"),
    icon: getRequiredString(formData, "icon"),
    description: getRequiredString(formData, "description"),
    generationPrompt: getString(formData, "generationPrompt"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function deleteThemeAction(formData: FormData) {
  await assertAdmin();
  await deleteTheme(getRequiredString(formData, "id"));
  revalidateDailyWords();
}

export async function addCategoryAction(formData: FormData) {
  await assertAdmin();
  await createCategory({
    themeId: getRequiredString(formData, "themeId"),
    name: getRequiredString(formData, "name"),
    description: getRequiredString(formData, "description"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function updateCategoryAction(formData: FormData) {
  await assertAdmin();
  await updateCategory({
    id: getRequiredString(formData, "id"),
    themeId: getRequiredString(formData, "themeId"),
    name: getRequiredString(formData, "name"),
    description: getRequiredString(formData, "description"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function deleteCategoryAction(formData: FormData) {
  await assertAdmin();
  await deleteCategory(getRequiredString(formData, "id"));
  revalidateDailyWords();
}

export async function addArticleAction(formData: FormData) {
  await assertAdmin();
  await createArticle({
    categoryId: getRequiredString(formData, "categoryId"),
    title: getRequiredString(formData, "title"),
    lead: getRequiredString(formData, "lead"),
    body: getRequiredString(formData, "body"),
    readingMinutes: getNumber(formData, "readingMinutes", 3),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function generateArticleAction(formData: FormData) {
  await assertAdmin();
  const categoryId = getRequiredString(formData, "categoryId");
  const context = await getGenerationContext(categoryId);
  if (!context) {
    throw new Error("Selected category was not found.");
  }
  if (!context.generation_prompt.trim()) {
    throw new Error("Selected theme does not have a Gemini generation prompt.");
  }

  const generated = await generateDailyWordsArticle({
    themeName: context.theme_name,
    themeDay: context.theme_day,
    categoryName: context.category_name,
    categoryDescription: context.category_description,
    generationPrompt: context.generation_prompt,
  });

  const articleId = await createArticle({
    categoryId,
    title: generated.title,
    lead: generated.lead,
    body: generated.body,
    readingMinutes: generated.readingMinutes,
    sortOrder: getNumber(formData, "sortOrder", 0),
  });

  for (const [index, source] of generated.sources.entries()) {
    await createSource({
      articleId,
      title: source.title,
      url: source.url,
      sortOrder: index,
    });
  }

  revalidateDailyWords();
}

export async function updateArticleAction(formData: FormData) {
  await assertAdmin();
  await updateArticle({
    id: getRequiredString(formData, "id"),
    categoryId: getRequiredString(formData, "categoryId"),
    title: getRequiredString(formData, "title"),
    lead: getRequiredString(formData, "lead"),
    body: getRequiredString(formData, "body"),
    readingMinutes: getNumber(formData, "readingMinutes", 3),
    sortOrder: getNumber(formData, "sortOrder", 0),
    published: getBoolean(formData, "published"),
  });
  revalidateDailyWords();
}

export async function deleteArticleAction(formData: FormData) {
  await assertAdmin();
  await deleteArticle(getRequiredString(formData, "id"));
  revalidateDailyWords();
}

export async function addSourceAction(formData: FormData) {
  await assertAdmin();
  await createSource({
    articleId: getRequiredString(formData, "articleId"),
    title: getRequiredString(formData, "title"),
    url: getRequiredString(formData, "url"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function updateSourceAction(formData: FormData) {
  await assertAdmin();
  await updateSource({
    id: getRequiredString(formData, "id"),
    articleId: getRequiredString(formData, "articleId"),
    title: getRequiredString(formData, "title"),
    url: getRequiredString(formData, "url"),
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
  revalidateDailyWords();
}

export async function deleteSourceAction(formData: FormData) {
  await assertAdmin();
  await deleteSource(getRequiredString(formData, "id"));
  revalidateDailyWords();
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

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";

  return value.trim();
}

function getNumber(formData: FormData, key: string, fallback: number) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
