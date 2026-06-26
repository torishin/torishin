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
} from "@/lib/daily-words/mutations";

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
    sortOrder: getNumber(formData, "sortOrder", 0),
  });
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
