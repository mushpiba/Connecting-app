-- 006 · 비공개 덧붙임, 직접 등록한 의료기관, 표현 필터 로그, 그리고 F-1·F-2·F-4 정리
--
-- **초안이다.** 아직 어느 프로젝트에도 적용하지 않았다. 근거와 각 컬럼을 읽는
-- 화면은 docs/product/40-data-model.md 에 함께 적었다. 그쪽을 먼저 읽는다.
--
-- schema.sql 과 002~005 를 올린 프로젝트에 이어서 실행한다.
-- 여러 번 실행해도 같은 결과가 되게 두었다.
--
-- 근거 —
--   D-6  비공개 덧붙임을 구조로 강제한다        (05-decisions.md)
--   Q-5  3왕복 · 환자 500자 · 의사 400자 · PT-1~PT-5  (30-feature-spec.md)
--   Q-6  직접 등록한 의료기관을 clinics 와 어떻게 잇나  (여기서 정한다)
--   C-4  진료기록의 작성 주체는 의료인이다
--   F-1~F-4  40-data-model.md 이 이미 식별해 둔 결함
--
-- ⚠️ 이 파일에서 되돌릴 수 없는 것은 §2(encounters 컬럼 삭제) 하나다. 나머지는
--    전부 더하기다. §2 를 실행하기 전에 40-data-model.md 의 F-2 판정을 읽는다.
--
-- 이 파일을 적용한 뒤 src/data/liveRepository.ts 의 fetchSnapshot 과 매퍼가 새
-- 표를 함께 읽어야 화면에 나온다. 그건 이 파일의 몫이 아니다.


-- ═══════════════════════════════════════════════════════════════════
-- §1 · F-1 · bookings.document_types 의 정본을 text[] 로 못 박는다
-- ═══════════════════════════════════════════════════════════════════
--
-- 같은 컬럼을 002·003 은 text[] 로, 005 는 jsonb 로 만든다. 셋 다
-- `add column if not exists` 라 먼저 돈 쪽이 이긴다. 그래서 어느 순서로
-- 적용했느냐에 따라 타입이 갈린다.
--
-- 정본은 **text[]** 다. src/data/liveMappers.ts 의 BookingRow.document_types 가
-- string[] 이고, src/domain/types.ts 의 BookingRequest.documentTypes 가
-- DocumentType[] 이다. 코드가 기대하는 모양에 서버를 맞춘다.
--
-- 기존 마이그레이션은 고치지 않는다. 이미 적용된 것들이다. 대신 여기서 세 갈래를
-- 전부 같은 자리로 모은다.
--   컬럼이 없다   → schema.sql 만 올린 자리. 만든다 (실제로 이 경우 서류 요청이
--                   조용히 사라진다. 005 가 고치려던 바로 그 증상이다)
--   jsonb 다      → 005 만 돈 자리. 값을 보존하며 text[] 로 바꾼다
--   text[] 다     → 아무것도 하지 않는다

create or replace function medivu_jsonb_to_text_array(v jsonb) returns text[]
  language sql immutable as $fn$
  select coalesce(array(select jsonb_array_elements_text(v)), '{}'::text[])
$fn$;

do $$
declare
  col_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into col_type
    from pg_attribute a
   where a.attrelid = 'public.bookings'::regclass
     and a.attname = 'document_types'
     and a.attnum > 0
     and not a.attisdropped;

  if col_type is null then
    execute 'alter table bookings add column document_types text[] not null default ''{}''';

  elsif col_type = 'jsonb' then
    -- 기본값이 '[]'::jsonb 라 그대로 두면 타입 변경이 실패한다. 떼고 바꾸고 다시 단다.
    execute 'alter table bookings alter column document_types drop default';
    execute 'alter table bookings alter column document_types type text[] '
         || 'using medivu_jsonb_to_text_array(document_types)';
    execute 'alter table bookings alter column document_types set default ''{}''::text[]';
    execute 'alter table bookings alter column document_types set not null';
  end if;
end $$;

drop function if exists medivu_jsonb_to_text_array(jsonb);

comment on column bookings.document_types is
  'text[] 가 정본이다. migration-005 의 jsonb 정의는 006 이 되돌린다. '
  'liveMappers.ts 의 BookingRow.document_types 가 string[] 을 기대한다.';


-- ═══════════════════════════════════════════════════════════════════
-- §2 · F-2 · C-4 · encounters 에서 진료 산출물 컬럼 5개를 뺀다
-- ═══════════════════════════════════════════════════════════════════
--
-- ⚠️ 이 파일에서 유일하게 되돌릴 수 없는 절이다.
--
-- scheduled_at · room_url · keywords · prescription_draft · record_draft.
-- src/ 전체에서 참조가 0회이고, 전부 기본값 그대로다. 지워도 잃을 데이터가 없다.
--
-- 왜 살리지 않는가 —
--
--   room_url          encounters.id 가 그대로 방 주소다. "Edge Function 이 채운다"는
--                     주석이 붙어 있지만 그런 함수는 없다. 방 주소가 두 개면 두
--                     사람이 서로 다른 방에 들어가는 길이 생긴다
--
--   keywords          화상 진료방 화면(30-feature-spec.md `/visit/:roomId`)이
--   prescription_draft  「통화 내용을 서버에 저장하지 않는다」고 환자에게 적어 두었다.
--   record_draft      원칙 6 — 화면에 적은 것과 실제로 일어나는 일이 같아야 한다.
--                     통화에서 나온 것을 담을 자리를 서버에 두면 그 문장이 거짓이 된다.
--                     그리고 처방 초안을 의료기관이 아닌 우리가 들고 있는 것은 C-4 다
--
--   scheduled_at      비대면 진료에 시간을 고르는 화면이 어디에도 없다. 시간을 고르는
--                     것은 대면 예약(bookings.visit_date / visit_time)뿐이다.
--                     흐름은 신청 → 의사 확인 → 방 열림이고 그 사이에 예정 시각이 없다
--
-- C-4 의 「임시 자료와 진료기록을 분리한다」는 이 삭제로 끝난다. 임시 자료(전사·
-- 키워드·기록 초안)는 기기 안에 있고 EMR 파일로 나간다(domain/emrExport.ts).
-- 진료기록은 의료기관의 EMR 안에서 의료인이 쓴다. **서버에는 한쪽만 있으므로
-- 「어느 쪽인지」를 가르는 컬럼이 필요 없다.** 표의 경계가 그 구분이다.

alter table encounters drop column if exists scheduled_at;
alter table encounters drop column if exists room_url;
alter table encounters drop column if exists keywords;
alter table encounters drop column if exists prescription_draft;
alter table encounters drop column if exists record_draft;

-- RLS 술어가 매 행마다 이 두 컬럼을 본다. `/care` 1·2구역과 `/doctor/visits` 가
-- 그 조회다.
create index if not exists encounters_patient_idx on encounters (patient_id, created_at desc);
create index if not exists encounters_doctor_idx on encounters (doctor_id, created_at desc);

-- `/doctor/inbox` 와 `/doctor/visits` 의 「받은 예약 요청」. 기존 unique 색인은
-- patient_id 로 시작해서 의사 쪽 조회를 받쳐 주지 못한다.
create index if not exists bookings_doctor_idx on bookings (doctor_id, visit_date);


-- ═══════════════════════════════════════════════════════════════════
-- §3 · D-6 · 비공개 덧붙임
-- ═══════════════════════════════════════════════════════════════════
--
-- 공개 덧붙임(question_notes)을 확장하지 않고 표를 따로 만든다. 두 표의 열람
-- 범위가 정반대이기 때문이다 — question_notes 는 「사연이 보이면 보인다」이고
-- 이쪽은 「두 사람만」이다. 한 표에 섞으면 열람 범위가 컬럼 값에 매달리고,
-- 정책 실수 하나가 비공개 대화를 공개 덧붙임으로 만든다. 새는 방향이 최악이다.
-- 화면도 이미 「둘은 다른 것이며 화면에서 섞지 않는다」로 정해 두었다.
--
-- **움직이는 값은 여기 없다.** 3왕복 · 환자 500자 · 의사 400자 · 금지 표현은
-- src/data/rules/privateThreadRules.ts 에 asOf 와 함께 둔다(원칙 7). 경계의
-- 위치는 유권해석 대상이라 움직인다. 스키마가 강제하는 것은 움직이지 않는 것
-- — **누가 · 어느 순서로 · 어느 방향으로** — 뿐이다.

create table if not exists private_threads (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions on delete cascade,
  -- 어느 공개 답변에 붙은 대화인가. **널을 허용한다.**
  -- D-6 이 「답변한 의사에게만」을 넓히는 쪽으로 뒤집히면 답변에 매이지 않은
  -- 대화가 생긴다. not null 로 박아 두면 그때 컬럼을 고쳐야 하고, 그건
  -- 마이그레이션이다. 지금은 아래 INSERT 정책이 널을 거부한다 — 경계는
  -- 컬럼이 아니라 정책에 있다.
  answer_id uuid references answers on delete cascade,
  -- 두 당사자를 행에 직접 둔다. RLS 술어가 매 행마다 도는 자리라 조인을 두면
  -- 정책이 비싸지고 무엇보다 읽기 어려워진다. encounters 가 이미 같은 모양이다.
  patient_id uuid not null references profiles on delete cascade,
  doctor_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  -- 한 답변에 대화 하나. 답변 카드 아래에 두 개가 붙으면 화면이 두 번 그린다.
  unique (answer_id, patient_id)
);

alter table private_threads enable row level security;

-- 아래 SELECT 정책이 매 행마다 이 두 컬럼을 본다. encounters 와 같은 이유로
-- 같은 모양의 색인을 둔다. 사연 단위 색인은 두지 않았다 — 클라이언트가 스냅샷을
-- 통째로 읽고 RLS 가 이미 내 것만 남기므로, 거기서 한 사연을 고르는 것은 몇 행
-- 안에서 끝난다.
create index if not exists private_threads_patient_idx
  on private_threads (patient_id, created_at desc);
create index if not exists private_threads_doctor_idx
  on private_threads (doctor_id, created_at desc);

drop policy if exists "비공개 대화는 두 사람만 본다" on private_threads;
create policy "비공개 대화는 두 사람만 본다"
  on private_threads for select using (
    patient_id = auth.uid() or doctor_id = auth.uid()
  );

-- D-6 항목 1·2 를 서버가 강제한다.
--   1. 환자가 먼저 말 걸어야 열린다 → INSERT 정책이 환자에게만 있다.
--      의사에게는 INSERT 정책이 아예 없다. 없는 문은 열리지 않는다
--   2. 답변한 의사에게만 열린다 → answers 로 확인한다. 답변하지 않은 의사를
--      doctor_id 에 적으면 exists 가 거짓이 된다
-- 화면이 아니라 여기가 막는다.
--
-- ⚠️ 안쪽 열 이름을 반드시 표 이름으로 붙여 쓴다. `a.doctor_id = doctor_id` 라고
--    적으면 answers 에도 doctor_id 가 있어서 안쪽 것끼리 비교되고 **정책이 항상
--    참이 된다.** 답변하지 않은 의사에게도 대화가 열린다. 실제로 그렇게 썼다가
--    걸렀다.
drop policy if exists "환자가 답변한 의사에게만 연다" on private_threads;
create policy "환자가 답변한 의사에게만 연다"
  on private_threads for insert with check (
    private_threads.patient_id = auth.uid()
    and private_threads.answer_id is not null
    and exists (
      select 1
        from answers a
        join questions q on q.id = a.question_id
       where a.id = private_threads.answer_id
         and a.question_id = private_threads.question_id
         and a.doctor_id = private_threads.doctor_id
         and q.author_id = auth.uid()
    )
  );

-- UPDATE·DELETE 정책을 만들지 않는다. 대화는 고쳐지지 않고, 사연이 지워질 때
-- 함께 사라진다(question_id 의 cascade). 화면의 삭제 확인 문구가 「답변과
-- 덧붙임도 함께 사라집니다」인 것과 같은 자리다.


create table if not exists private_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references private_threads on delete cascade,
  sender_id uuid not null references profiles on delete cascade,
  -- 말풍선을 어느 쪽에 그릴지와 고정 고지를 붙일지가 이 값으로 갈린다.
  sender_role app_role not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table private_messages enable row level security;

-- 말풍선 목록(시간순)과 왕복 카운트가 같은 색인을 쓴다. 한 대화의 행 수가
-- 상한(지금 6)으로 묶여 있어서 카운트는 이 색인만으로 충분히 싸다.
create index if not exists private_messages_thread_idx
  on private_messages (thread_id, created_at);

-- 왕복의 순서를 세는 자리.
--
-- 정책 안에서 private_messages 를 직접 세면 그 조회에 다시 private_messages 의
-- 정책이 걸려 `infinite recursion detected in policy` 로 막힌다. 실제로 그렇게
-- 썼다가 걸렀다. 그래서 소유자 권한으로 세는 함수를 따로 둔다.
--
-- **함수 자체가 당사자인지 먼저 본다.** 소유자 권한으로 도는 함수라 이 확인이
-- 없으면 대화 주소만 아는 사람이 「저 대화에 몇 마디 오갔나」를 셀 수 있다.
-- 당사자가 아니면 0 을 돌려주므로 밖에서는 빈 대화와 구별되지 않는다.
create or replace function medivu_private_message_count(p_thread uuid, p_role app_role)
  returns bigint
  language sql
  stable
  security definer
  set search_path = public
as $fn$
  select count(*)
    from private_messages m
   where m.thread_id = p_thread
     and m.sender_role = p_role
     and exists (
       select 1 from private_threads t
        where t.id = p_thread
          and (t.patient_id = auth.uid() or t.doctor_id = auth.uid())
     )
$fn$;

-- 대화가 보이면 그 안의 발화도 보인다. answers 가 questions 정책에 얹혀 있는
-- 것과 같은 방식이다 — 판정을 한 곳에만 둔다.
drop policy if exists "비공개 발화는 대화가 보이면 보인다" on private_messages;
create policy "비공개 발화는 대화가 보이면 보인다"
  on private_messages for select using (
    exists (select 1 from private_threads t where t.id = private_messages.thread_id)
  );

-- 환자는 자기 대화에만, 그리고 **의사 회신을 기다린 뒤에만** 말한다.
-- 자기 발화 수가 의사 회신 수를 넘어서면 막힌다. 첫 발화는 0 <= 0 이라 통과한다.
-- 한 왕복 = 환자 1 + 의사 1 을 순서로 강제하는 자리다. 숫자(3)는 여기 없다.
drop policy if exists "환자는 회신을 기다린 뒤 말한다" on private_messages;
create policy "환자는 회신을 기다린 뒤 말한다"
  on private_messages for insert with check (
    private_messages.sender_id = auth.uid()
    and private_messages.sender_role = 'patient'
    and exists (
      select 1 from private_threads t
       where t.id = private_messages.thread_id and t.patient_id = auth.uid()
    )
    and medivu_private_message_count(private_messages.thread_id, 'patient')
     <= medivu_private_message_count(private_messages.thread_id, 'doctor')
  );

-- 의사는 환자가 먼저 말을 건 뒤에만 회신한다. 회신 수가 환자 발화 수보다
-- 적을 때만 통과하므로 빈 대화에 먼저 쓸 수 없고, 연속으로 두 번 쓸 수도 없다.
-- 면허 검증도 여기서 다시 본다 — answers INSERT 정책과 같은 기준이다.
drop policy if exists "의사는 환자가 연 뒤에만 회신한다" on private_messages;
create policy "의사는 환자가 연 뒤에만 회신한다"
  on private_messages for insert with check (
    private_messages.sender_id = auth.uid()
    and private_messages.sender_role = 'doctor'
    and exists (
      select 1
        from private_threads t
        join profiles p on p.id = auth.uid()
       where t.id = private_messages.thread_id
         and t.doctor_id = auth.uid()
         and p.role = 'doctor'
         and p.license_verified
    )
    and medivu_private_message_count(private_messages.thread_id, 'doctor')
      < medivu_private_message_count(private_messages.thread_id, 'patient')
  );

-- UPDATE·DELETE 정책을 만들지 않는다. 「보낸 발화는 취소할 수 없다」가 화면의
-- 계약이고, 서버도 같아야 한다.

-- Realtime 에 넣지 않는다. 민감정보(개인정보보호법 제23조)이고, 발행 설정과
-- RLS 가 어긋났을 때 새는 방향이 최악이다. 그리고 3왕복짜리 비동기 문답은
-- 채팅이 아니라서 실시간이 필요하지 않다. 켜기로 하면 publication 에 더하는
-- 것으로 끝난다 — 표와 정책은 그대로다.


-- ═══════════════════════════════════════════════════════════════════
-- §4 · D-6 항목 5 · C-3 · 표현 필터에 걸린 기록
-- ═══════════════════════════════════════════════════════════════════
--
-- 양벌규정(의료법 제91조)의 「상당한 주의·감독」을 입증하는 데 필요한 것은
-- **우리가 걸렀다는 사실**이지 환자의 증상 원문이 아니다. 막으려고 만든 장치가
-- 새 보관소가 되면 안 된다.
--
-- 남긴다   규칙 ID · 규칙셋 기준일 · 시각 · 작성자 · 어디서 걸렸나 · 걸린 조각 20자
-- 안 남긴다  본문 전체 · 앞뒤 문맥 · 그 뒤 무엇으로 고쳐 보냈는지
--
-- 공개 답변에도 적용한다. C-3 이 이미 「답변 본문 안의 병원명 언급은 필터로
-- 막고 필터링 로그를 보관한다」를 요구하고 있다. 그래서 surface 가 둘이다.

create table if not exists expression_filter_hits (
  id uuid primary key default gen_random_uuid(),
  -- **외래키를 걸지 않는다.** 이 표는 가리키는 대상보다 오래 살아야 한다.
  -- 환자가 사연을 지우는 것만으로 의사가 걸린 기록이 사라지면 방어 자료가 아니다.
  -- 값은 참조가 아니라 식별자다.
  author_id uuid not null,
  surface text not null check (surface in ('public-answer', 'private-message')),
  question_id uuid,
  thread_id uuid,
  -- PT-1 ~ PT-5. 목록의 정본은 privateThreadRules.ts 다.
  rule_id text not null,
  -- 그때 무슨 규칙셋이 판단했는가. **규칙 파라미터가 아니라 지나간 사실**이다.
  -- 규칙 파일이 바뀌어도 이 값은 바뀌지 않아야 감사에 쓸 수 있다.
  rule_set_as_of date not null,
  matched_span text not null check (char_length(matched_span) <= 20),
  created_at timestamptz not null default now(),
  -- 어디서 걸렸는지 되짚을 수 없는 기록은 자료가 되지 못한다.
  check (question_id is not null or thread_id is not null)
);

alter table expression_filter_hits enable row level security;

-- 감사 조회는 「이 의료인에 대해 우리가 무엇을 했나」와 기간으로 뽑는다.
create index if not exists expression_filter_hits_author_idx
  on expression_filter_hits (author_id, created_at desc);

-- 넣기만 된다. 읽는 화면이 없는 것이 요건이고, 쓴 사람이 자기 기록을 고치거나
-- 지울 수 있으면 방어 자료가 되지 못한다. SELECT·UPDATE·DELETE 정책을 만들지
-- 않는다 — 운영자가 service_role 로 뽑는다.
drop policy if exists "걸린 사실만 남긴다" on expression_filter_hits;
create policy "걸린 사실만 남긴다"
  on expression_filter_hits for insert with check (author_id = auth.uid());

-- Realtime 에 넣지 않는다. 구독하는 화면이 없다.


-- ═══════════════════════════════════════════════════════════════════
-- §5 · Q-6 · 환자가 직접 등록한 의료기관
-- ═══════════════════════════════════════════════════════════════════
--
-- clinics 에 섞지 않는다. clinics 는 「누구나 읽는다」 하나로 도는 읽기 전용
-- 마스터이고, 직접 등록한 곳은 **본인만** 봐야 한다. 한 표에 두면 clinics 의
-- 정책을 행마다 갈라야 하고, 그 순간 검증된 데이터와 검증 안 된 데이터가 같은
-- 자리에 앉는다. 화면이 두 출처를 섞지 않기로 한 것과 같은 이유다.
--
-- 받는 것은 두 가지뿐이다 — 이름과 마지막 진료일. 지역·전화번호를 받지 않는다.
-- 확인할 수 없는 값을 늘릴 이유가 없다(`/care` 2구역).
--
-- **이 표는 비대면 재진 자격의 근거가 되지 않는다.** 자격은 우리가 만든 기록
-- (bookings · encounters)에서만 나온다. 환자가 스스로 적은 것으로 자격이
-- 열리면 그건 자격 확인이 아니다. eligibility 판정의 입력에 넣지 않는다.

create table if not exists self_reported_clinics (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles on delete cascade,
  -- 환자가 적은 이름 그대로. 우리가 고치지 않는다.
  name text not null,
  last_visited_on date not null,
  -- 신뢰 등급을 **행마다** 갖는다. 지금은 값이 하나뿐이지만 표 이름으로 대신하지
  -- 않는 이유가 있다 — 나중에 연계가 붙어 일부 행이 실제 clinics 레코드와 이어질
  -- 때, 컬럼이 없으면 그 순간 기존 행 전체의 뜻이 조용히 바뀐다.
  --
  -- 잇는 방법(Q-6) — 그때 더하는 것은 두 줄이다. 데이터는 움직이지 않는다.
  --   alter table self_reported_clinics add column linked_clinic_id text references clinics;
  --   check 를 trust in ('self-reported', 'linked') 로 바꾼다
  -- 지금 만들지 않는 것은 읽는 화면이 없기 때문이다. IA §3 이 「자리만 남기고
  -- 화면은 만들지 않는다」고 정했고, 「나중에 쓸 것 같아서」가 F-2 를 만들었다.
  -- 이어져도 재진 자격은 열리지 않는다. 이어졌다는 것은 「같은 곳으로 보인다」이지
  -- 「그날 그곳에서 진료받았다」가 아니다.
  trust text not null default 'self-reported'
    constraint self_reported_clinics_trust_check check (trust in ('self-reported')),
  created_at timestamptz not null default now()
);

alter table self_reported_clinics enable row level security;

-- `/care` 2구역의 정렬(마지막 진료일 내림차순)과 RLS 술어가 같은 색인을 쓴다.
create index if not exists self_reported_clinics_patient_idx
  on self_reported_clinics (patient_id, last_visited_on desc);

drop policy if exists "직접 등록한 곳은 본인만 본다" on self_reported_clinics;
create policy "직접 등록한 곳은 본인만 본다"
  on self_reported_clinics for select using (patient_id = auth.uid());

drop policy if exists "직접 등록은 본인만 넣는다" on self_reported_clinics;
create policy "직접 등록은 본인만 넣는다"
  on self_reported_clinics for insert with check (patient_id = auth.uid());

drop policy if exists "직접 등록은 본인만 지운다" on self_reported_clinics;
create policy "직접 등록은 본인만 지운다"
  on self_reported_clinics for delete using (patient_id = auth.uid());

-- UPDATE 정책을 만들지 않는다. 화면에는 추가와 지우기만 있다.
-- Realtime 에 넣지 않는다. 본인만 보는 표이고 다른 사람에게 알릴 변경이 없다.


-- ═══════════════════════════════════════════════════════════════════
-- §6 · F-4 · 구독하는데 발행하지 않던 표 둘
-- ═══════════════════════════════════════════════════════════════════
--
-- liveRepository.ts 의 subscribeToChanges 는 표 일곱을 구독하는데 publication 에는
-- 다섯만 있다. profiles 와 **bookings** 가 빠져 있다(40-data-model.md 의 F-4 는
-- profiles 만 적었다 — bookings 도 같은 상태다).
--
-- 지우지 않고 발행하는 쪽을 고른다. 구독을 지우는 것은 코드 수정이고, 무엇보다
-- 둘 다 실제로 필요하다 — 의사가 프로필을 고치면 환자 화면의 이름이 바뀌어야
-- 하고, 예약 요청은 `/doctor/inbox` 에 바로 떠야 한다.
--
-- 발행은 RLS 를 대신하지 않는다. postgres_changes 는 구독자 권한으로 정책을 다시
-- 본다. 그래서 bookings 를 발행해도 남의 예약은 오지 않는다. 같은 이유로 새 표를
-- 발행할 때는 그 표의 SELECT 정책이 먼저 맞아야 한다 — private_messages 를
-- 발행하지 않는 것이 그 판단이다.

do $$ begin
  alter publication supabase_realtime add table profiles;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table bookings;
exception when duplicate_object then null;
end $$;
