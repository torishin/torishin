"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { DailyWordsTheme } from "@/lib/daily-words/types";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function DailyWordsApp({ themes }: { themes: DailyWordsTheme[] }) {
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id ?? "");
  const selectedTheme =
    themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];
  const selectedThemeCategories = selectedTheme?.categories ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    selectedThemeCategories[0]?.id ?? "",
  );
  const selectedCategory =
    selectedThemeCategories.find(
      (category) => category.id === selectedCategoryId,
    ) ?? selectedThemeCategories[0];

  const selectedCategoryArticles = selectedCategory?.articles ?? [];
  const [selectedArticleId, setSelectedArticleId] = useState(
    selectedCategoryArticles[0]?.id ?? "",
  );
  const selectedArticle =
    selectedCategoryArticles.find(
      (article) => article.id === selectedArticleId,
    ) ?? selectedCategoryArticles[0];

  const totalArticles = useMemo(
    () =>
      themes.reduce(
        (themeTotal, theme) =>
          themeTotal +
          theme.categories.reduce(
            (categoryTotal, category) =>
              categoryTotal + category.articles.length,
            0,
          ),
        0,
      ),
    [themes],
  );

  function selectTheme(theme: DailyWordsTheme) {
    setSelectedThemeId(theme.id);
    const nextCategory = theme.categories[0];
    setSelectedCategoryId(nextCategory?.id ?? "");
    setSelectedArticleId(nextCategory?.articles[0]?.id ?? "");
  }

  function selectCategory(category: DailyWordsTheme["categories"][number]) {
    setSelectedCategoryId(category.id);
    setSelectedArticleId(category.articles[0]?.id ?? "");
  }

  return (
    <main className="min-h-screen bg-canvas text-foreground">
      <header className="border-b border-border bg-card/80 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              Daily Words Library
            </p>
            <h1 className="text-2xl font-semibold tracking-wide">日々の言葉</h1>
            <p className="text-sm text-muted-foreground">
              テーマ、カテゴリ、文章一覧、文章詳細を4つのペインで閲覧します。
            </p>
          </div>
          <div className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
            {themes.length} テーマ / {totalArticles} 文章
          </div>
        </div>
      </header>

      {themes.length === 0 ? (
        <section className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              まだ文章が登録されていません
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              管理画面からテーマ、カテゴリ、文章を追加すると、ここに4ペイン表示されます。
            </p>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid h-[calc(100vh-97px)] max-w-[1600px] grid-cols-1 gap-3 p-3 lg:grid-cols-[240px_280px_340px_minmax(0,1fr)]">
          <Pane title="1. 日々の言葉のテーマ" subtitle="曜日ごとの主題">
            <div className="flex flex-col gap-2">
              {themes.map((theme) => (
                <PaneButton
                  key={theme.id}
                  isSelected={selectedTheme?.id === theme.id}
                  onClick={() => selectTheme(theme)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {theme.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {theme.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {theme.day}
                      </span>
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {theme.description}
                  </p>
                </PaneButton>
              ))}
            </div>
          </Pane>

          <Pane
            title="2. 文章のカテゴリ一覧"
            subtitle={selectedTheme?.name ?? "未選択"}
          >
            {selectedTheme ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">
                    {selectedTheme.day}のテーマ
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {selectedTheme.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selectedTheme.description}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {selectedThemeCategories.map((category) => (
                    <PaneButton
                      key={category.id}
                      isSelected={selectedCategory?.id === category.id}
                      onClick={() => selectCategory(category)}
                    >
                      <span className="block text-sm font-semibold">
                        {category.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {category.description}
                      </span>
                      <span className="mt-3 inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground">
                        {category.articles.length} 件
                      </span>
                    </PaneButton>
                  ))}
                  {selectedThemeCategories.length === 0 ? (
                    <EmptyPaneMessage>
                      このテーマにはカテゴリがありません。
                    </EmptyPaneMessage>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Pane>

          <Pane
            title="3. 各カテゴリ内の文章一覧"
            subtitle={selectedCategory?.name ?? "未選択"}
          >
            <div className="flex flex-col gap-2">
              {selectedCategoryArticles.map((article) => (
                <PaneButton
                  key={article.id}
                  isSelected={selectedArticle?.id === article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  <span className="block text-sm leading-6 font-semibold">
                    {article.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {article.lead}
                  </span>
                  <span className="mt-3 block text-[11px] text-muted-foreground">
                    約 {article.readingMinutes} 分で読めます
                  </span>
                </PaneButton>
              ))}
              {selectedCategoryArticles.length === 0 ? (
                <EmptyPaneMessage>
                  このカテゴリには文章がありません。
                </EmptyPaneMessage>
              ) : null}
            </div>
          </Pane>

          <Pane
            title="4. 各文章の詳細"
            subtitle={selectedArticle?.title ?? "未選択"}
            isDetail
          >
            {selectedArticle && selectedCategory && selectedTheme ? (
              <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedTheme.name}</span>
                  <span>/</span>
                  <span>{selectedCategory.name}</span>
                  <span>/</span>
                  <span>約 {selectedArticle.readingMinutes} 分</span>
                </div>
                <h2 className="mt-3 text-2xl leading-9 font-semibold tracking-wide">
                  {selectedArticle.title}
                </h2>
                <p className="mt-3 border-l-2 border-primary pl-4 text-sm leading-7 text-primary">
                  {selectedArticle.lead}
                </p>
                <div className="mt-6 flex flex-col gap-5 text-[15px] leading-8">
                  {selectedArticle.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <section className="mt-8 border-t border-border pt-5">
                  <h3 className="text-sm font-semibold text-primary">
                    参考文献・引用元
                  </h3>
                  {selectedArticle.sources.length > 0 ? (
                    <ol className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                      {selectedArticle.sources.map((source) => (
                        <li key={source.id}>
                          <a
                            className="border-b border-primary text-primary hover:text-primary/80"
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      この文章には外部リンクの参考文献はまだ登録されていません。
                    </p>
                  )}
                </section>
              </article>
            ) : (
              <EmptyPaneMessage>
                表示する文章を選択してください。
              </EmptyPaneMessage>
            )}
          </Pane>
        </section>
      )}
    </main>
  );
}

function PaneButton({
  isSelected,
  children,
  onClick,
}: {
  isSelected: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-lg border p-3 text-left transition hover:border-primary hover:bg-primary/5",
        isSelected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-card",
      )}
    >
      {children}
    </button>
  );
}

function EmptyPaneMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function Pane({
  title,
  subtitle,
  children,
  isDetail = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  isDetail?: boolean;
}) {
  return (
    <section
      className={cx(
        "flex min-h-0 flex-col rounded-xl border border-border bg-card/80 shadow-sm",
        isDetail && "bg-card",
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
          {title}
        </p>
        <h2 className="mt-1 truncate text-sm font-semibold">{subtitle}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </section>
  );
}
