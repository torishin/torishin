import { redirect } from "next/navigation";

import { logoutAction } from "@/app/admin/actions";
import { AdminGenerator } from "@/components/daily-words/AdminGenerator";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/daily-words/auth";
import { getAdminDailyWordsData } from "@/lib/daily-words/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/login");

  const { themes, articles } = await getAdminDailyWordsData();

  return (
    <main className="min-h-screen bg-canvas p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              Daily Words AI Studio
            </p>
            <h1 className="text-2xl font-semibold">日々の言葉 管理画面</h1>
            <p className="text-sm text-muted-foreground">
              テーマを選び、AIが過去記事との差分を考慮して記事を生成します。
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              ログアウト
            </Button>
          </form>
        </header>

        <AdminGenerator
          themes={themes.map((theme) => ({
            id: theme.id,
            name: theme.name,
            description: theme.description,
            sortOrder: theme.sort_order,
          }))}
          articleCount={articles.length}
        />
      </div>
    </main>
  );
}
