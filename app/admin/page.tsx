import type { ComponentProps, ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  addArticleAction,
  addCategoryAction,
  addSourceAction,
  addThemeAction,
  deleteArticleAction,
  deleteCategoryAction,
  deleteSourceAction,
  deleteThemeAction,
  generateArticleAction,
  logoutAction,
  updateArticleAction,
  updateCategoryAction,
  updateSourceAction,
  updateThemeAction,
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

  const { themes, categories, articles, sources } =
    await getAdminDailyWordsData();

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
              <TextAreaField
                name="generationPrompt"
                label="Gemini生成プロンプト"
                placeholder="このテーマで文章を生成するときのAIへの指示文を入力します"
                rows={6}
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
            title="3. Geminiで文章を生成"
            description="選択したカテゴリに、Gemini APIで生成した文章を保存します。"
          >
            <form
              action={generateArticleAction}
              className="flex flex-col gap-4"
            >
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
                name="sortOrder"
                label="並び順"
                type="number"
                defaultValue={String(articles.length)}
              />
              <p className="text-sm text-muted-foreground">
                `.env` の GEMINI_API_KEY
                を使って生成します。生成されたタイトル、リード文、本文、参考リンクはDBに保存されます。
              </p>
              <Button type="submit" disabled={categories.length === 0}>
                Geminiで文章を生成して追加
              </Button>
            </form>
          </AdminFormCard>

          <AdminFormCard
            title="4. 文章を手動追加"
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
            title="5. 参考リンクを追加"
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

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">既存情報の編集・削除</h2>
            <p className="text-sm text-muted-foreground">
              既存の4ペイン情報を編集できます。削除は配下データにも影響するため、必要な場合だけ実行してください。
            </p>
          </div>

          <AdminFormCard
            title="テーマを編集・削除"
            description="Pane 1 の表示内容と Gemini 生成プロンプトを変更します。"
          >
            <div className="flex flex-col gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <form
                    action={updateThemeAction}
                    className="flex flex-col gap-4"
                  >
                    <input type="hidden" name="id" value={theme.id} />
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_96px_96px]">
                      <Field
                        name="name"
                        label="テーマ名"
                        defaultValue={theme.name}
                        required
                      />
                      <Field
                        name="day"
                        label="曜日"
                        defaultValue={theme.day}
                        required
                      />
                      <Field
                        name="icon"
                        label="アイコン"
                        defaultValue={theme.icon}
                        required
                      />
                      <Field
                        name="sortOrder"
                        label="並び順"
                        type="number"
                        defaultValue={String(theme.sort_order)}
                      />
                    </div>
                    <TextAreaField
                      name="description"
                      label="説明"
                      defaultValue={theme.description}
                      required
                    />
                    <TextAreaField
                      name="generationPrompt"
                      label="Gemini生成プロンプト"
                      defaultValue={theme.generation_prompt}
                      rows={6}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="submit">テーマを更新</Button>
                    </div>
                  </form>
                  <form
                    action={deleteThemeAction}
                    className="mt-2 flex justify-end"
                  >
                    <input type="hidden" name="id" value={theme.id} />
                    <Button type="submit" variant="destructive">
                      テーマを削除
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </AdminFormCard>

          <AdminFormCard
            title="カテゴリを編集・削除"
            description="Pane 2 のカテゴリを変更します。"
          >
            <div className="flex flex-col gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <form
                    action={updateCategoryAction}
                    className="flex flex-col gap-4"
                  >
                    <input type="hidden" name="id" value={category.id} />
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_96px]">
                      <SelectField
                        name="themeId"
                        label="テーマ"
                        defaultValue={category.theme_id}
                        required
                      >
                        {themes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.day} / {theme.name}
                          </option>
                        ))}
                      </SelectField>
                      <Field
                        name="name"
                        label="カテゴリ名"
                        defaultValue={category.name}
                        required
                      />
                      <Field
                        name="sortOrder"
                        label="並び順"
                        type="number"
                        defaultValue={String(category.sort_order)}
                      />
                    </div>
                    <TextAreaField
                      name="description"
                      label="説明"
                      defaultValue={category.description}
                      required
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="submit">カテゴリを更新</Button>
                    </div>
                  </form>
                  <form
                    action={deleteCategoryAction}
                    className="mt-2 flex justify-end"
                  >
                    <input type="hidden" name="id" value={category.id} />
                    <Button type="submit" variant="destructive">
                      カテゴリを削除
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </AdminFormCard>

          <AdminFormCard
            title="文章を編集・削除"
            description="Pane 3 と Pane 4 に表示する文章を変更します。"
          >
            <div className="flex flex-col gap-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <form
                    action={updateArticleAction}
                    className="flex flex-col gap-4"
                  >
                    <input type="hidden" name="id" value={article.id} />
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_96px_96px]">
                      <SelectField
                        name="categoryId"
                        label="カテゴリ"
                        defaultValue={article.category_id}
                        required
                      >
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
                        defaultValue={article.title}
                        required
                      />
                      <Field
                        name="readingMinutes"
                        label="読了時間"
                        type="number"
                        defaultValue={String(article.reading_minutes)}
                      />
                      <Field
                        name="sortOrder"
                        label="並び順"
                        type="number"
                        defaultValue={String(article.sort_order)}
                      />
                    </div>
                    <TextAreaField
                      name="lead"
                      label="リード文"
                      defaultValue={article.lead}
                      required
                    />
                    <TextAreaField
                      name="body"
                      label="本文"
                      defaultValue={article.body}
                      required
                      rows={10}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="published"
                        defaultChecked={article.published}
                        className="size-4"
                      />
                      公開する
                    </label>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="submit">文章を更新</Button>
                    </div>
                  </form>
                  <form
                    action={deleteArticleAction}
                    className="mt-2 flex justify-end"
                  >
                    <input type="hidden" name="id" value={article.id} />
                    <Button type="submit" variant="destructive">
                      文章を削除
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </AdminFormCard>

          <AdminFormCard
            title="参考リンクを編集・削除"
            description="Pane 4 の参考文献・引用元を変更します。"
          >
            <div className="flex flex-col gap-4">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <form
                    action={updateSourceAction}
                    className="flex flex-col gap-4"
                  >
                    <input type="hidden" name="id" value={source.id} />
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_96px]">
                      <SelectField
                        name="articleId"
                        label="文章"
                        defaultValue={source.article_id}
                        required
                      >
                        {articles.map((article) => (
                          <option key={article.id} value={article.id}>
                            {article.title}
                          </option>
                        ))}
                      </SelectField>
                      <Field
                        name="title"
                        label="リンク名"
                        defaultValue={source.title}
                        required
                      />
                      <Field
                        name="url"
                        label="URL"
                        type="url"
                        defaultValue={source.url}
                        required
                      />
                      <Field
                        name="sortOrder"
                        label="並び順"
                        type="number"
                        defaultValue={String(source.sort_order)}
                      />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="submit">参考リンクを更新</Button>
                    </div>
                  </form>
                  <form
                    action={deleteSourceAction}
                    className="mt-2 flex justify-end"
                  >
                    <input type="hidden" name="id" value={source.id} />
                    <Button type="submit" variant="destructive">
                      参考リンクを削除
                    </Button>
                  </form>
                </div>
              ))}
            </div>
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
  const inputKey = [
    props.name,
    props.type ?? "text",
    props.defaultValue == null ? "" : String(props.defaultValue),
  ].join(":");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.name}>{label}</Label>
      <Input key={inputKey} id={props.name} {...props} />
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
