"use client";

import { useMemo, useState } from "react";

type Article = {
  id: string;
  title: string;
  lead: string;
  body: string[];
  readingMinutes: number;
  sources: { title: string; url: string }[];
};

type Category = {
  id: string;
  name: string;
  description: string;
  articles: Article[];
};

type Theme = {
  id: string;
  day: string;
  name: string;
  icon: string;
  description: string;
  categories: Category[];
};

const themes: Theme[] = [
  {
    id: "mantra",
    day: "月曜日",
    name: "真言",
    icon: "梵",
    description:
      "声に出す言葉、祈り、身体感覚を通して心を整えるためのテーマです。",
    categories: [
      {
        id: "history",
        name: "歴史と背景",
        description: "真言が受け継がれてきた文脈を読み解きます。",
        articles: [
          {
            id: "mantra-roots",
            title: "真言とは何か",
            lead: "短い音の連なりが、なぜ祈りや集中の入口になるのかを概観します。",
            readingMinutes: 6,
            body: [
              "真言は、意味を説明するためだけの言葉ではありません。声に出し、息を整え、同じ響きを反復することで、注意を散らすものから心を引き戻す実践として受け継がれてきました。",
              "日々の言葉として真言を扱うとき、大切なのは神秘性を過度に飾ることではなく、音と姿勢と時間を丁寧に扱うことです。短い一節でも、朝の数分に繰り返すことで、その日の心の置き場所を作れます。",
            ],
            sources: [
              {
                title: "高野山真言宗 総本山金剛峯寺",
                url: "https://www.koyasan.or.jp/",
              },
            ],
          },
          {
            id: "mantra-kukai",
            title: "弘法大師空海とことば",
            lead: "空海の思想における言葉、身体、世界観のつながりを紹介します。",
            readingMinutes: 7,
            body: [
              "空海の思想では、言葉は単なる記号ではなく、世界そのものと響き合うものとして捉えられます。文字、声、身振りが結びつくことで、学びは頭だけの理解を越えていきます。",
              "この視点は、現代の生活にも応用できます。忙しい日ほど、長い説明よりも短い言葉を繰り返し、身体を落ち着ける時間が支えになります。",
            ],
            sources: [],
          },
        ],
      },
      {
        id: "practice",
        name: "日常実践",
        description: "朝夕の短い時間に取り入れやすい実践集です。",
        articles: [
          {
            id: "morning-chant",
            title: "朝に唱える三分間の整え方",
            lead: "呼吸と声を使い、一日の始まりを静かに整える手順です。",
            readingMinutes: 4,
            body: [
              "椅子に浅く腰かけ、背筋を無理なく伸ばします。息を吐き切ってから、短い言葉を一つ選び、声量を抑えて三回唱えます。",
              "目的は立派に唱えることではありません。声が震えても、気が散っても、そのたびに息へ戻ることが練習になります。",
            ],
            sources: [],
          },
        ],
      },
    ],
  },
  {
    id: "health",
    day: "火曜日",
    name: "健康",
    icon: "健",
    description:
      "睡眠、運動、回復を中心に、毎日続けやすい身体の整え方を扱います。",
    categories: [
      {
        id: "sleep",
        name: "睡眠",
        description: "眠りの質を上げる環境と習慣を整理します。",
        articles: [
          {
            id: "sleep-light",
            title: "朝の光が夜の眠りを作る",
            lead: "体内時計を整えるために、朝の光が果たす役割を説明します。",
            readingMinutes: 5,
            body: [
              "睡眠は夜だけで完結しません。朝に光を浴びることは、体内時計へ「一日が始まった」と伝える重要な合図になります。",
              "起床後すぐに窓辺へ行く、短く散歩する、曇りの日でも外気に触れる。どれも小さな行動ですが、夜の眠気を育てる下準備になります。",
            ],
            sources: [
              {
                title: "Sleep Foundation",
                url: "https://www.sleepfoundation.org/",
              },
            ],
          },
        ],
      },
      {
        id: "movement",
        name: "運動と回復",
        description: "筋肉と関節を守る、軽い運動と休息の考え方です。",
        articles: [
          {
            id: "stretch-break",
            title: "座りすぎをほどく小休止",
            lead: "仕事や学習の合間に入れたい、短い可動域リセットです。",
            readingMinutes: 3,
            body: [
              "長く座る日は、強い運動を一度だけ行うより、短い休憩を何度か挟む方が身体にやさしい場合があります。",
              "肩を回す、股関節を伸ばす、足首を動かす。二分ほどの動きでも、集中の切り替えになります。",
            ],
            sources: [],
          },
        ],
      },
    ],
  },
  {
    id: "food",
    day: "水曜日",
    name: "食事",
    icon: "食",
    description:
      "食材、調理、栄養、文化を横断し、豊かな食生活を考えます。",
    categories: [
      {
        id: "seasonal",
        name: "季節の食材",
        description: "旬の食材から、身体と暮らしのリズムを見直します。",
        articles: [
          {
            id: "miso-soup",
            title: "味噌汁を一日の土台にする",
            lead: "具材を変えるだけで続けやすい、朝の温かい一杯について。",
            readingMinutes: 5,
            body: [
              "味噌汁は、栄養の完璧な答えというより、毎日を始めるための柔らかな型です。野菜、豆腐、海藻を少しずつ足すだけで、食卓の安心感が増します。",
              "忙しい日は出汁を簡略化しても構いません。続けるための余白を残すことも、食習慣の大切な技術です。",
            ],
            sources: [],
          },
        ],
      },
      {
        id: "culture",
        name: "食文化",
        description: "食べ方に宿る地域性や記憶を掘り下げます。",
        articles: [
          {
            id: "tea-time",
            title: "お茶の時間が作る余白",
            lead: "飲み物を介して、会話と沈黙の時間を見つめます。",
            readingMinutes: 4,
            body: [
              "お茶の時間には、作業の手を止める合図があります。湯を沸かし、器を温め、香りを待つ。その小さな順序が、生活に余白を戻します。",
              "一人で飲むお茶も、誰かと飲むお茶も、急がない練習になります。",
            ],
            sources: [],
          },
        ],
      },
    ],
  },
  {
    id: "social-work",
    day: "木曜日",
    name: "ソーシャルワーク",
    icon: "支",
    description:
      "人と地域を支える実践、制度、包摂の考え方を扱います。",
    categories: [
      {
        id: "community",
        name: "地域支援",
        description: "孤立を防ぎ、つながりを育てる実践を考えます。",
        articles: [
          {
            id: "listening",
            title: "支援の入口としての傾聴",
            lead: "助言の前に、相手の言葉が置かれる場を作ることについて。",
            readingMinutes: 6,
            body: [
              "支援の場では、すぐに解決策を提示したくなる瞬間があります。しかし、相手が自分の状況を言葉にできる場を作ること自体が、重要な支援になることがあります。",
              "傾聴は受け身ではありません。問いを選び、沈黙を待ち、相手の力が戻る余地を守る能動的な技術です。",
            ],
            sources: [],
          },
        ],
      },
      {
        id: "inclusion",
        name: "包摂と多様性",
        description: "誰も取り残さない場づくりの視点です。",
        articles: [
          {
            id: "inclusive-language",
            title: "言葉づかいから始まる包摂",
            lead: "呼び方や説明の仕方が、参加しやすさを左右します。",
            readingMinutes: 5,
            body: [
              "制度や設備だけでなく、日々の言葉づかいも場の入りやすさを左右します。何気ない呼称や前提が、誰かを外側に置いてしまうことがあります。",
              "完璧な言葉を最初から選ぶことより、気づいたときに直し、相手に尋ねる姿勢を持つことが大切です。",
            ],
            sources: [],
          },
        ],
      },
    ],
  },
];

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function DailyWordsApp() {
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id ?? "");
  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    selectedTheme?.categories[0]?.id ?? "",
  );
  const selectedCategory =
    selectedTheme.categories.find((category) => category.id === selectedCategoryId) ??
    selectedTheme.categories[0];

  const [selectedArticleId, setSelectedArticleId] = useState(
    selectedCategory?.articles[0]?.id ?? "",
  );
  const selectedArticle =
    selectedCategory.articles.find((article) => article.id === selectedArticleId) ??
    selectedCategory.articles[0];

  const totalArticles = useMemo(
    () =>
      themes.reduce(
        (themeTotal, theme) =>
          themeTotal +
          theme.categories.reduce(
            (categoryTotal, category) => categoryTotal + category.articles.length,
            0,
          ),
        0,
      ),
    [],
  );

  function selectTheme(theme: Theme) {
    setSelectedThemeId(theme.id);
    const nextCategory = theme.categories[0];
    setSelectedCategoryId(nextCategory.id);
    setSelectedArticleId(nextCategory.articles[0]?.id ?? "");
  }

  function selectCategory(category: Category) {
    setSelectedCategoryId(category.id);
    setSelectedArticleId(category.articles[0]?.id ?? "");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e9] text-[#2d2a26]">
      <header className="border-b border-[#e0d8cc] bg-white/65 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-[#7a7265] uppercase">
              Daily Words Library
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-wide">日々の言葉</h1>
            <p className="mt-1 text-sm text-[#7a7265]">
              テーマ、カテゴリ、文章一覧、文章詳細を4つのペインで閲覧します。
            </p>
          </div>
          <div className="rounded-full border border-[#e0d8cc] bg-white px-4 py-2 text-sm text-[#7a7265] shadow-sm">
            {themes.length} テーマ / {totalArticles} 文章
          </div>
        </div>
      </header>

      <section className="mx-auto grid h-[calc(100vh-97px)] max-w-[1600px] grid-cols-1 gap-3 p-3 lg:grid-cols-[240px_280px_340px_minmax(0,1fr)]">
        <Pane title="1. 日々の言葉のテーマ" subtitle="曜日ごとの主題">
          <div className="space-y-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => selectTheme(theme)}
                className={cx(
                  "w-full rounded-xl border p-3 text-left transition hover:border-[#5c6b4f] hover:bg-[#5c6b4f0f]",
                  selectedTheme.id === theme.id
                    ? "border-[#5c6b4f] bg-[#5c6b4f14] shadow-sm"
                    : "border-[#e0d8cc] bg-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5c6b4f] text-sm font-semibold text-white">
                    {theme.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{theme.name}</span>
                    <span className="block text-xs text-[#7a7265]">{theme.day}</span>
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#7a7265]">
                  {theme.description}
                </p>
              </button>
            ))}
          </div>
        </Pane>

        <Pane title="2. 文章のカテゴリ一覧" subtitle={selectedTheme.name}>
          <div className="mb-4 rounded-xl border border-[#e0d8cc] bg-[#fbf8f2] p-4">
            <p className="text-xs text-[#7a7265]">{selectedTheme.day}のテーマ</p>
            <h2 className="mt-1 text-lg font-semibold">{selectedTheme.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#7a7265]">
              {selectedTheme.description}
            </p>
          </div>
          <div className="space-y-2">
            {selectedTheme.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category)}
                className={cx(
                  "w-full rounded-xl border p-3 text-left transition hover:border-[#5c6b4f] hover:bg-[#5c6b4f0f]",
                  selectedCategory.id === category.id
                    ? "border-[#5c6b4f] bg-[#5c6b4f14]"
                    : "border-[#e0d8cc] bg-white",
                )}
              >
                <span className="block text-sm font-semibold">{category.name}</span>
                <span className="mt-1 block text-xs leading-5 text-[#7a7265]">
                  {category.description}
                </span>
                <span className="mt-3 inline-flex rounded-full bg-[#ede6d9] px-2.5 py-1 text-[11px] text-[#7a7265]">
                  {category.articles.length} 件
                </span>
              </button>
            ))}
          </div>
        </Pane>

        <Pane title="3. 各カテゴリ内の文章一覧" subtitle={selectedCategory.name}>
          <div className="space-y-2">
            {selectedCategory.articles.map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => setSelectedArticleId(article.id)}
                className={cx(
                  "w-full rounded-xl border p-4 text-left transition hover:border-[#5c6b4f] hover:bg-[#5c6b4f0f]",
                  selectedArticle.id === article.id
                    ? "border-[#5c6b4f] bg-[#5c6b4f14]"
                    : "border-[#e0d8cc] bg-white",
                )}
              >
                <span className="block text-sm font-semibold leading-6">
                  {article.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#7a7265]">
                  {article.lead}
                </span>
                <span className="mt-3 block text-[11px] text-[#7a7265]">
                  約 {article.readingMinutes} 分で読めます
                </span>
              </button>
            ))}
          </div>
        </Pane>

        <Pane title="4. 各文章の詳細" subtitle={selectedArticle.title} isDetail>
          <article className="rounded-2xl border border-[#e0d8cc] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a7265]">
              <span>{selectedTheme.name}</span>
              <span>/</span>
              <span>{selectedCategory.name}</span>
              <span>/</span>
              <span>約 {selectedArticle.readingMinutes} 分</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-9 tracking-wide">
              {selectedArticle.title}
            </h2>
            <p className="mt-3 border-l-2 border-[#5c6b4f] pl-4 text-sm leading-7 text-[#5c6b4f]">
              {selectedArticle.lead}
            </p>
            <div className="mt-6 space-y-5 text-[15px] leading-8">
              {selectedArticle.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <section className="mt-8 border-t border-[#e0d8cc] pt-5">
              <h3 className="text-sm font-semibold text-[#5c6b4f]">参考文献・引用元</h3>
              {selectedArticle.sources.length > 0 ? (
                <ol className="mt-3 space-y-2 text-sm text-[#7a7265]">
                  {selectedArticle.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        className="border-b border-[#5c6b4f] text-[#5c6b4f] hover:text-[#3e5235]"
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
                <p className="mt-3 text-sm text-[#7a7265]">
                  この文章には外部リンクの参考文献はまだ登録されていません。
                </p>
              )}
            </section>
          </article>
        </Pane>
      </section>
    </main>
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
  children: React.ReactNode;
  isDetail?: boolean;
}) {
  return (
    <section
      className={cx(
        "flex min-h-0 flex-col rounded-2xl border border-[#e0d8cc] bg-white/80 shadow-sm",
        isDetail && "bg-[#fffdf8]",
      )}
    >
      <div className="border-b border-[#e0d8cc] px-4 py-3">
        <p className="text-[11px] tracking-[0.18em] text-[#7a7265] uppercase">
          {title}
        </p>
        <h2 className="mt-1 truncate text-sm font-semibold">{subtitle}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </section>
  );
}
