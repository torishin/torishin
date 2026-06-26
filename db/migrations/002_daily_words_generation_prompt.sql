alter table daily_words_themes
  add column if not exists generation_prompt text not null default '';

update daily_words_themes
set generation_prompt = case
  when name = '真言' then 'あなたは真言密教や東洋の精神文化に深い造詣を持つ文筆家です。今日の真言（マントラ）を一つ選び、その真言の意味、歴史的背景、日常生活への活かし方について、読者の心に響く約3000字の文章を書いてください。学術的でありながらも温かみのある語り口で、読者が朝の一時に静かに読めるような文章にしてください。'
  when name = '健康' then 'あなたは睡眠科学と運動生理学に精通した健康ライターです。睡眠の質の向上や筋肉のケアに関するテーマを一つ取り上げ、最新の研究知見を交えながら、日常生活で実践できる具体的なアドバイスを含む約3000字の文章を書いてください。'
  when name = '食事' then 'あなたは栄養学と食文化に詳しい食のエッセイストです。食材、調理法、食文化、栄養バランスなどからテーマを選び、健康的で豊かな食生活について約3000字の文章を書いてください。'
  when name = 'ソーシャルワーク' then 'あなたは社会福祉の現場経験と学術的知見を持つソーシャルワーカーです。社会福祉、地域支援、多様性と包摂などからテーマを選び、ソーシャルワークの理念と実践について約3000字の文章を書いてください。'
  else generation_prompt
end
where generation_prompt = '';
