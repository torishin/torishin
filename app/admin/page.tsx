import type { ComponentProps, ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  addArticleAction,
  addCategoryAction,
  addSourceAction,
  addThemeAction,
  logoutAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/daily-words/auth";
import { getAdminDailyWordsData } from "@/lib/daily-words/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/login");

  const { themes, categories, articles } = await getAdminDailyWordsData();

  return (
    <main className="min-h-screen bg-canvas p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              Daily Words Admin
            </p>
            <h1 className="text-2xl font-semibold">日々の言葉 管理画面</h1>
            <p className="text-sm text-muted-foreground">
              管理者として、4つのペインに表示するテーマ・カテゴリ・文章・参考リンクを追加します。
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              ログアウト
            </Button>
          </form>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <AdminFormCard
            title="1. テーマを追加"
            description="Pane 1 に表示する曜日ごとのテーマを追加します。"
          >
            <form action={addThemeAction} className="flex flex-col gap-4">
              <Field name="day" label="曜日" placeholder="月曜日" required />
              <Field name="name" label="テーマ名" placeholder="真言" required />
              <Field
                name="icon"
                label="アイコン文字"
                placeholder="梵"
                required
              />
              <Field
                name="sortOrder"
                label="並び順"
                type="number"
                defaultValue="0"
              />
              <TextAreaField
                name="description"
                label="説明"
                placeholder="テーマの説明を入力します"
                required
              />
              <Button type="submit">テーマを追加</Button>
            </form>
          </AdminFormCard>

          <AdminFormCard
            title="2. カテゴリを追加"
            description="Pane 2 に表示するカテゴリをテーマに紐づけます。"
          >
            <form action={addCategoryAction} className="flex flex-col gap-4">
              <SelectField name="themeId" label="テーマ" required>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.day} / {theme.name}
                  </option>
                ))}
              </SelectField>
              <Field
                name="name"
                label="カテゴリ名"
                placeholder="歴史と背景"
                required
              />
              <Field
                name="sortOrder"
                label="並び順"
                type="number"
                defaultValue="0"
              />
              <TextAreaField
                name="description"
                label="説明"
                placeholder="カテゴリの説明を入力します"
                required
              />
              <Button type="submit" disabled={themes.length === 0}>
                カテゴリを追加
              </Button>
            </form>
          </AdminFormCard>

          <AdminFormCard
            title="3. 文章を追加"
            description="Pane 3 と Pane 4 に表示する文章本文を追加します。"
          >
            <form action={addArticleAction} className="flex flex-col gap-4">
              <SelectField name="categoryId" label="カテゴリ" required>
                {categories.map((category) => {
                  const theme = themes.find(
                    (item) => item.id === category.theme_id,
                  );
                  return (
                    <option key={category.id} value={category.id}>
                      {theme?.name ?? "未分類"} / {category.name}
                    </option>
                  );
                })}
              </SelectField>
              <Field
                name="title"
                label="タイトル"
                placeholder="真言とは何か"
                required
              />
              <TextAreaField
                name="lead"
                label="リード文"
                placeholder="短い紹介文を入力します"
                required
              />
              <TextAreaField
                name="body"
                label="本文"
                placeholder={"段落ごとに空行を入れて入力します\n\n2つ目の段落"}
                required
                rows={8}
              />
              <Field
                name="readingMinutes"
                label="読了時間（分）"
                type="number"
                defaultValue="3"
              />
              <Field
                name="sortOrder"
                label="並び順"
                type="number"
                defaultValue="0"
              />
              <Button type="submit" disabled={categories.length === 0}>
                文章を追加
              </Button>
            </form>
          </AdminFormCard>

          <AdminFormCard
            title="4. 参考リンクを追加"
            description="Pane 4 の文章詳細に表示する引用元・参考文献を追加します。"
          >
            <form action={addSourceAction} className="flex flex-col gap-4">
              <SelectField name="articleId" label="文章" required>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </SelectField>
              <Field
                name="title"
                label="リンク名"
                placeholder="高野山真言宗 総本山金剛峯寺"
                required
              />
              <Field
                name="url"
                label="URL"
                type="url"
                placeholder="https://example.com"
                required
              />
              <Field
                name="sortOrder"
                label="並び順"
                type="number"
                defaultValue="0"
              />
              <Button type="submit" disabled={articles.length === 0}>
                参考リンクを追加
              </Button>
            </form>
          </AdminFormCard>
        </section>
      </div>
    </main>
  );
}

function AdminFormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  ...props
}: ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}

function TextAreaField({
  label,
  rows = 4,
  ...props
}: ComponentProps<typeof Textarea> & { label: string; name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.name}>{label}</Label>
      <Textarea id={props.name} rows={rows} {...props} />
    </div>
  );
}

function SelectField({
  label,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.name}>{label}</Label>
      <select
        id={props.name}
        className="h-8 w-full rounded-lg border border-input bg-card px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
