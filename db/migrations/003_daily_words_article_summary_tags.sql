alter table daily_words_articles
  add column if not exists summary text not null default '',
  add column if not exists tags text[] not null default '{}';

update daily_words_articles
set summary = left(lead, 60)
where summary = '';
