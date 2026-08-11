-- MediVU Community · Supabase 스키마
--
-- 클라이언트는 정적 사이트라 서버가 없다. 그래서 권한은 전부 RLS가 강제한다.
-- src/domain/visibility.ts 의 판정을 여기에 옮겨 적었다. 화면 쪽 판정은 사용자
-- 경험을 위한 것이고 실제 차단은 이 파일이 한다.
--
-- 이 데모에는 실제 환자 정보를 넣지 않는다. 무료 티어는 해외 리전이다.

-- ─────────────────────────── 프로필

create type app_role as enum ('patient', 'doctor');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  role app_role not null default 'patient',
  region text not null default '인천 미추홀구',
  -- 의사 전용. 검증 전에는 질문이 보이지도 답변이 써지지도 않는다.
  license_verified boolean not null default false,
  clinic_id text,
  specialty text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "프로필은 누구나 읽는다"
  on profiles for select using (true);

create policy "내 프로필만 만든다"
  on profiles for insert with check (auth.uid() = id);

create policy "내 프로필만 고친다"
  on profiles for update using (auth.uid() = id);

-- 역할과 면허 검증을 스스로 바꾸면 검증이 무의미해진다. 트리거로 고정한다.
create function guard_profile_privileges() returns trigger as $$
begin
  new.role := old.role;
  new.license_verified := old.license_verified;
  new.clinic_id := old.clinic_id;
  new.specialty := old.specialty;
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_guard_privileges
  before update on profiles
  for each row execute function guard_profile_privileges();

-- ─────────────────────────── 의료기관

create table clinics (
  id text primary key,
  name text not null,
  level text not null check (level in ('clinic', 'hospital')),
  region text not null,
  address text not null,
  phone text not null,
  booking_url text not null,
  telemedicine_enabled boolean not null default false,
  monthly_telemedicine_ratio numeric not null default 0,
  landmark text not null default '',
  lunch_break text,
  hours jsonb not null default '[]'::jsonb
);

alter table clinics enable row level security;

create policy "의료기관은 누구나 읽는다" on clinics for select using (true);

-- ─────────────────────────── 사연

create type post_visibility as enum ('public', 'specialty-only', 'prior-clinic-only');

create table questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  title text not null,
  body text not null,
  visibility post_visibility not null default 'public',
  onset_date date not null,
  course text not null,
  daily_impact text not null,
  tried_remedies text[] not null default '{}',
  body_areas text[] not null default '{}',
  -- triage 전체는 화면용이고 specialties는 RLS가 쓰는 색인이다.
  triage jsonb not null,
  specialties text[] not null default '{}',
  prior_clinic_id text,
  prior_visited_on date,
  same_symptoms boolean not null default false,
  created_at timestamptz not null default now()
);

alter table questions enable row level security;

create index questions_specialties_idx on questions using gin (specialties);
create index questions_created_at_idx on questions (created_at desc);

-- visibility.ts canDoctorSeeQuestion 을 옮긴 것.
-- 면허 미검증 의사는 공개 글도 못 본다.
create policy "사연 열람 범위"
  on questions for select using (
    author_id = auth.uid()
    or (
      visibility = 'public'
      and exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and (p.role = 'patient' or p.license_verified)
      )
    )
    or (
      visibility = 'specialty-only'
      and exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.role = 'doctor'
          and p.license_verified
          and p.specialty = any (questions.specialties)
      )
    )
    or (
      visibility = 'prior-clinic-only'
      and questions.prior_clinic_id is not null
      and exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.role = 'doctor'
          and p.license_verified
          and p.clinic_id = questions.prior_clinic_id
      )
    )
  );

create policy "내 사연만 올린다"
  on questions for insert with check (author_id = auth.uid());

create policy "내 사연만 고친다"
  on questions for update using (author_id = auth.uid());

create policy "내 사연만 지운다"
  on questions for delete using (author_id = auth.uid());

-- ─────────────────────────── 답변

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions on delete cascade,
  doctor_id uuid not null references profiles on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table answers enable row level security;

create index answers_question_idx on answers (question_id, created_at);

-- 위 사연 정책이 걸려 있어 안 보이는 글은 이 exists 가 거짓이 된다.
create policy "보이는 사연의 답변만 읽는다"
  on answers for select using (
    exists (select 1 from questions q where q.id = answers.question_id)
  );

create policy "검증한 의사만 답변한다"
  on answers for insert with check (
    doctor_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'doctor' and p.license_verified
    )
    and exists (select 1 from questions q where q.id = question_id)
  );

create policy "내 답변만 고친다"
  on answers for update using (doctor_id = auth.uid());

-- ─────────────────────────── 공감

create table empathies (
  question_id uuid not null references questions on delete cascade,
  patient_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, patient_id)
);

alter table empathies enable row level security;

create policy "공감은 보이는 글에서 센다"
  on empathies for select using (
    exists (select 1 from questions q where q.id = empathies.question_id)
  );

create policy "내 공감만 누른다"
  on empathies for insert with check (patient_id = auth.uid());

create policy "내 공감만 취소한다"
  on empathies for delete using (patient_id = auth.uid());

-- ─────────────────────────── 예약 희망 시간

create table bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles on delete cascade,
  doctor_id uuid not null references profiles on delete cascade,
  clinic_id text not null references clinics,
  visit_date date not null,
  visit_time text not null,
  created_at timestamptz not null default now(),
  unique (patient_id, doctor_id, visit_date, visit_time)
);

alter table bookings enable row level security;

create policy "내 예약과 나에게 온 예약만 본다"
  on bookings for select using (patient_id = auth.uid() or doctor_id = auth.uid());

create policy "내 예약만 넣는다"
  on bookings for insert with check (patient_id = auth.uid());

-- ─────────────────────────── 진료 (2단계)

create type encounter_status as enum (
  'requested',
  'accepted',
  'in-progress',
  'completed',
  'declined'
);

create table encounters (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions on delete set null,
  patient_id uuid not null references profiles on delete cascade,
  doctor_id uuid not null references profiles on delete cascade,
  clinic_id text not null references clinics,
  status encounter_status not null default 'requested',
  scheduled_at timestamptz,
  -- 화상 방 주소. Edge Function이 채운다.
  room_url text,
  -- 진료 중 정리한 키워드와 처방전 초안. EMR로 넘길 재료다.
  keywords jsonb not null default '[]'::jsonb,
  prescription_draft jsonb not null default '[]'::jsonb,
  record_draft text not null default '',
  created_at timestamptz not null default now()
);

alter table encounters enable row level security;

create policy "내 진료만 본다"
  on encounters for select using (patient_id = auth.uid() or doctor_id = auth.uid());

create policy "환자가 진료를 신청한다"
  on encounters for insert with check (patient_id = auth.uid());

create policy "검증한 의사가 진료를 진행한다"
  on encounters for update using (
    doctor_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'doctor' and p.license_verified
    )
  );

-- ─────────────────────────── 실시간

alter publication supabase_realtime add table questions;
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table empathies;
alter publication supabase_realtime add table encounters;
