"use client";

import { useMemo, useState, useTransition } from "react";

import {
  addThemeAction,
  deleteThemeAction,
  generateDraftAction,
  saveDraftAction,
} from "@/app/admin/actions";
import type { ArticleDraft } from "@/lib/ai/types";
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

type AdminTheme = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
};

export function AdminGenerator({
  themes,
  articleCount,
}: {
  themes: AdminTheme[];
  articleCount: number;
}) {
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id ?? "");
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) ?? themes[0],
    [selectedThemeId, themes],
  );

  function generate() {
    if (!selectedTheme) return;
    setError("");
    setMessage("");
    setDraft(null);

    startGenerating(async () => {
      try {
        const nextDraft = await generateDraftAction(selectedTheme.id);
        setDraft(nextDraft);
        setMessage(
          nextDraft.similarity >= 70
            ? `生成しました。ただし過去記事との類似度が約${nextDraft.similarity}%です。必要なら再生成してください。`
            : `生成しました。過去記事との最大類似度は約${nextDraft.similarity}%です。`,
        );
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "生成に失敗しました。",
        );
      }
    });
  }

  function save() {
    if (!selectedTheme || !draft) return;
    setError("");
    setMessage("");

    startSaving(async () => {
      try {
        await saveDraftAction(selectedTheme.id, draft);
        setDraft(null);
        setMessage("記事を保存し、公開しました。");
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "保存に失敗しました。",
        );
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>STEP 1. テーマだけ選ぶ</CardTitle>
            <CardDescription>
              管理者が入力するのはテーマだけです。カテゴリ、タイトル、要約、本文はAIが生成します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="theme">テーマ</Label>
                <select
                  id="theme"
                  value={selectedTheme?.id ?? ""}
                  onChange={(event) => {
                    setSelectedThemeId(event.target.value);
                    setDraft(null);
                    setMessage("");
                    setError("");
                  }}
                  className="h-9 w-full rounded-lg border border-input bg-card px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTheme ? (
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm font-medium">{selectedTheme.name}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {selectedTheme.description}
                  </p>
                </div>
              ) : null}

              <Button
                type="button"
                onClick={generate}
                disabled={!selectedTheme || isGenerating || isSaving}
                size="lg"
              >
                {isGenerating ? "生成中..." : "記事を生成する"}
              </Button>

              <p className="text-xs leading-5 text-muted-foreground">
                生成時には、同じテーマの過去記事を参照し、タイトル・要約・本文の類似度が高くならないように指示します。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>テーマの追加・削除</CardTitle>
            <CardDescription>
              テーマは自由に増やせます。削除すると配下の記事も削除されます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <form action={addThemeAction} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-theme">新しいテーマ</Label>
                  <Input
                    id="new-theme"
                    name="name"
                    placeholder="日本文化、人生、心理、人間関係など"
                    required
                  />
                </div>
                <input type="hidden" name="sortOrder" value={themes.length} />
                <Button type="submit" variant="outline">
                  テーマを追加
                </Button>
              </form>

              <div className="flex flex-col gap-2">
                {themes.map((theme) => (
                  <form
                    key={theme.id}
                    action={deleteThemeAction}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <input type="hidden" name="id" value={theme.id} />
                    <span className="min-w-0 truncate text-sm">
                      {theme.name}
                    </span>
                    <Button type="submit" variant="destructive" size="sm">
                      削除
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        {message ? (
          <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>STEP 2. AI生成プレビュー</CardTitle>
            <CardDescription>
              内容を確認して問題なければ保存します。保存すると公開状態になります。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {draft ? (
              <div className="flex flex-col gap-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="カテゴリー" value={draft.category} />
                  <PreviewField
                    label="読了時間"
                    value={`約${draft.readingMinutes}分`}
                  />
                  <PreviewField
                    label="類似度"
                    value={`約${draft.similarity}%`}
                  />
                  <PreviewField
                    label="AI"
                    value={`${draft.provider} / ${draft.model}`}
                  />
                </div>
                <PreviewField label="タイトル" value={draft.title} />
                <PreviewField label="要約" value={draft.summary} />
                <PreviewField label="リード文" value={draft.lead} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="body-preview">本文</Label>
                  <Textarea
                    id="body-preview"
                    value={draft.body}
                    readOnly
                    rows={18}
                    className="bg-card"
                  />
                </div>
                {draft.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {draft.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generate}
                    disabled={isGenerating || isSaving}
                  >
                    別の切り口で再生成
                  </Button>
                  <Button
                    type="button"
                    onClick={save}
                    disabled={isGenerating || isSaving}
                  >
                    {isSaving ? "保存中..." : "保存して公開"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-6">
                <p className="text-sm font-medium">
                  まだ生成プレビューはありません。
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  テーマを選んで「記事を生成する」を押すと、AIがカテゴリー、タイトル、要約、本文を作成します。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>運用メモ</CardTitle>
            <CardDescription>現在の記事数: {articleCount} 件</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>プロンプトは `prompts/daily-word.md` で編集できます。</li>
              <li>
                AIプロバイダーは `AI_PROVIDER` で切り替える前提の構造です。
              </li>
              <li>
                現段階ではEmbeddingではなく、過去記事のタイトル・要約・本文抜粋を参照して重複を避けます。
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm leading-6">
        {value}
      </div>
    </div>
  );
}
