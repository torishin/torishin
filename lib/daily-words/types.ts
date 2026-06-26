export type DailyWordsSource = {
  id: string;
  title: string;
  url: string;
};

export type DailyWordsArticle = {
  id: string;
  title: string;
  lead: string;
  body: string[];
  readingMinutes: number;
  sources: DailyWordsSource[];
};

export type DailyWordsCategory = {
  id: string;
  name: string;
  description: string;
  articles: DailyWordsArticle[];
};

export type DailyWordsTheme = {
  id: string;
  day: string;
  name: string;
  icon: string;
  description: string;
  categories: DailyWordsCategory[];
};

export type DailyWordsUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "viewer";
};
