-- 003 · 002에서 빠뜨린 컬럼
--
-- selected_symptoms 를 타입과 매퍼에만 넣고 SQL에서 빠뜨렸다. 조회가 이 열을
-- 함께 읽기 때문에 목록 전체가 실패했고, 그래서 사연이 하나도 뜨지 않았다.
--
-- 002를 이미 실행했다면 이것만 추가로 실행한다.

alter table questions add column if not exists selected_symptoms text[] not null default '{}';
alter table questions add column if not exists pain_level smallint
  check (pain_level is null or (pain_level between 1 and 10));
alter table questions add column if not exists intake_answers jsonb not null default '[]'::jsonb;
alter table bookings add column if not exists document_types text[] not null default '{}';
