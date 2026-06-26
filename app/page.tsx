import { DailyWordsApp } from "@/components/daily-words/DailyWordsApp";
import { getDailyWordsThemes } from "@/lib/daily-words/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const themes = await getDailyWordsThemes();
  return <DailyWordsApp themes={themes} />;
}
