create extension if not exists pgcrypto;

create table if not exists daily_words_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'viewer')),
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_words_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references daily_words_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_words_sessions_user_id_idx
  on daily_words_sessions(user_id);

create table if not exists daily_words_themes (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  name text not null,
  icon text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_words_categories (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references daily_words_themes(id) on delete cascade,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_words_categories_theme_id_idx
  on daily_words_categories(theme_id);

create table if not exists daily_words_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references daily_words_categories(id) on delete cascade,
  title text not null,
  lead text not null default '',
  body text not null default '',
  reading_minutes integer not null default 3,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_words_articles_category_id_idx
  on daily_words_articles(category_id);

create table if not exists daily_words_article_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references daily_words_articles(id) on delete cascade,
  title text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_words_article_sources_article_id_idx
  on daily_words_article_sources(article_id);
