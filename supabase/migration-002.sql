-- 002 · 통증 척도, 사연 덧붙임, 서류 발급
--
-- schema.sql 을 이미 올린 프로젝트에 이어서 실행한다.

-- ─────────────────────────── 통증 척도
--
-- 환자가 스스로 고르는 값이다. 우리가 이 숫자로 무엇도 판정하지 않는다.
-- 의사에게 그대로 전달만 한다.

alter table questions add column if not exists pain_level smallint
  check (pain_level is null or (pain_level between 1 and 10));

-- 문진 문항 답. 원값 그대로 담는다. 합산하지 않는다.
alter table questions add column if not exists intake_answers jsonb not null default '[]'::jsonb;

-- ─────────────────────────── 사연 덧붙임
--
-- 사연은 등록하면 고칠 수 없다. 지나간 증상 설명이 조용히 바뀌면 그 위에
-- 달린 답변이 무엇을 보고 쓴 것인지 알 수 없어진다. 대신 덧붙일 수 있다.

create table question_notes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table question_notes enable row level security;

create index question_notes_question_idx on question_notes (question_id, created_at);

create policy "보이는 사연의 덧붙임만 읽는다"
  on question_notes for select using (
    exists (select 1 from questions q where q.id = question_notes.question_id)
  );

-- 덧붙임은 글쓴이만 쓴다. 의사는 답변으로 말한다.
create policy "내 사연에만 덧붙인다"
  on question_notes for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from questions q
      where q.id = question_id and q.author_id = auth.uid()
    )
  );

-- ─────────────────────────── 서류 발급
--
-- 실손 청구나 회사 제출 때문에 진료를 받는 경우가 있다. 진료의 부산물이 아니라
-- 목적일 수 있어 신청 단계에서 함께 받는다. 발급 자체는 병원이 한다.

alter table bookings add column if not exists document_types text[] not null default '{}';

alter publication supabase_realtime add table question_notes;
