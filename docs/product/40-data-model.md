# 40 · 데이터 모델

> 원본은 `supabase/schema.sql` + `migration-002~005.sql`이다. 이 문서는 그것을 사람이 읽는 순서로 옮기고, 코드 타입(`src/domain/types.ts`)과의 대응을 붙인 것이다.
> 마지막 대조: 2026-08-19 · 대상 커밋 `f018a58`

## 원칙

권한은 전부 RLS가 강제한다. 클라이언트는 정적 사이트라 서버가 없고, 화면 쪽 판정(`src/domain/visibility.ts`)은 사용자 경험을 위한 것이며 **실제 차단은 SQL이 한다**. 두 곳의 판정이 갈라지면 SQL이 맞다.

SQL 파일은 여러 번 실행해도 같은 결과가 되게 두었다. 어디까지 적용됐는지 헷갈릴 때 처음부터 다시 붙여넣을 수 있어야 한다.

## enum

| enum | 값 | 대응 타입 |
| --- | --- | --- |
| `app_role` | `patient` · `doctor` | `AppRole` (`types.ts:19`) |
| `post_visibility` | `public` · `specialty-only` · `prior-clinic-only` | `PostVisibility` (`types.ts:22`) |
| `encounter_status` | `requested` · `accepted` · `in-progress` · `completed` · `declined` | `EncounterRequestStatus` (`types.ts:416`) |

## 테이블

### `profiles`

환자와 의사가 같은 표에 있다. **계정 하나가 두 자리에 앉는다.** 화면에 서는 이름은 의사일 때 고른 페르소나의 이름이고, `display_name`은 건드리지 않는다 — 환자 화면으로 돌아갈 때 잃을 이름이기 때문이다.

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK → `auth.users` | 익명 인증 uid |
| `display_name` | text | 환자로 참여할 때 쓰는 이름 |
| `role` | `app_role` | 기본 `patient` |
| `region` | text | 기본 `인천 미추홀구` |
| `license_verified` | boolean | 의사 전용. 거짓이면 사연이 보이지도 답변이 써지지도 않는다 |
| `clinic_id` | text → `clinics` | FK는 migration-004에서 추가 |
| `specialty` | text | 진료과 |
| `template_id` | text | 어느 준비된 의사 프로필을 골랐는지 |

**RLS** — 읽기는 전체 공개. 쓰기·수정은 `auth.uid() = id`.

> ⚠️ **역할과 면허 검증을 스스로 바꿀 수 있다.** migration-004가 가드 트리거(`profiles_guard_privileges`)를 제거했다. 여럿이 모여 테스트할 때 주최자가 매번 SQL로 승격시키면 진행이 끊기기 때문이다. **실서비스로 갈 때 가장 먼저 되돌릴 자리다.** 실제로는 기관 연동이나 서류 심사가 서버에서 끝나야 하고 클라이언트는 결과만 읽어야 한다.

대응 타입: `Patient` (`types.ts:277`) / `Doctor` (`types.ts:239`) — 한 행이 매퍼(`liveMappers.ts:177`, `:198`)를 통해 둘 중 하나로 갈린다. `Doctor`의 `bio` `career` `consultStyle` `keywords`는 DB가 아니라 `template_id`가 가리키는 픽스처에서 온다.

### `clinics`

읽기 전용 마스터. RLS는 전체 읽기만 연다. `hours`는 jsonb 배열이고 `clinicHours.ts`가 해석한다.

주요 컬럼: `level`(`clinic`|`hospital`) · `region` · `telemedicine_enabled` · `monthly_telemedicine_ratio` · `lunch_break` · `hours`.
대응 타입: `Clinic` (`types.ts:214`)

### `questions` — 사연

**등록하면 고칠 수 없다.** 지나간 증상 설명이 조용히 바뀌면 그 위에 달린 답변이 무엇을 보고 쓴 것인지 알 수 없어진다. 대신 `question_notes`로 덧붙인다. (UPDATE 정책은 열려 있으나 화면은 쓰지 않는다.)

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `author_id` | uuid → `profiles` | |
| `title` `body` | text | 환자가 자기 말로 쓴 것 |
| `visibility` | `post_visibility` | |
| `onset_date` `course` `daily_impact` `tried_remedies` `body_areas` | | 문진 1·2단계 |
| `triage` | jsonb | `TriageResult` 전체. **화면용** |
| `specialties` | text[] | **RLS 전용 색인.** `triage.suggestions`에서 뽑아 넣는다 (`liveMappers.ts:127`) |
| `prior_clinic_id` `prior_visited_on` `same_symptoms` | | 진료 이력. `prior-clinic-only` 판정에 쓴다 |
| `selected_symptoms` | text[] | 칩으로 고른 증상 (migration-003) |
| `pain_level` | smallint 1–10 nullable | 환자가 스스로 고른 값. **우리가 이 숫자로 아무것도 판정하지 않는다.** 합산하지 않고 의사에게 그대로 전달만 한다 (migration-002) |
| `intake_answers` | jsonb | 문항 답 원값 그대로. 합산하지 않는다 (migration-002) |

색인: `specialties` GIN, `created_at desc`.

**RLS — 사연 열람 범위.** `visibility.ts`의 `canDoctorSeeQuestion`을 SQL로 옮긴 것이다.

1. 글쓴이 본인
2. `public` — 환자이거나, **면허 검증된** 의사. 미검증 의사는 공개 글도 못 본다
3. `specialty-only` — 검증된 의사 중 `profiles.specialty`가 `questions.specialties`에 포함된 사람
4. `prior-clinic-only` — 검증된 의사 중 `profiles.clinic_id`가 `questions.prior_clinic_id`와 같은 사람

INSERT/UPDATE/DELETE는 전부 `author_id = auth.uid()`.

대응 타입: `Question` (`types.ts:284`) · 행 타입 `QuestionRow` (`liveMappers.ts:24`)

### `answers`

`doctor_id` · `question_id` · `body`. **INSERT는 검증된 의사만** 되고, 대상 사연이 자기에게 보여야 한다(`exists`가 사연 정책을 통과해야 성립). SELECT도 같은 방식으로 사연 정책에 얹혀 있다 — 안 보이는 글의 답변은 `exists`가 거짓이 된다.

대응 타입: `Answer` (`types.ts:320`)

### `empathies`

`(question_id, patient_id)` 복합 PK. **누적 카운터가 아니라 개별 기록**이다. 카운터로는 "이번 주에 몇 개인가"에 답할 수 없다 — `board.ts`의 주간 집계가 이걸 쓴다.

대응 타입: `Empathy` (`types.ts:332`)

### `question_notes` — 덧붙임 (migration-002)

글쓴이만 쓴다. **의사는 답변으로 말한다.** 읽기는 사연이 보이면 보인다.

대응 타입: `QuestionNote` (`types.ts:312`)

### `bookings` — 대면 예약 희망

`unique (patient_id, doctor_id, visit_date, visit_time)`. 화면이 지어낸 id로 찾으면 서버가 만든 id와 어긋나므로 **의사·날짜·시간 셋으로 찾고, 서버도 그 셋으로 중복을 막는다.**

`document_types` — 진료확인서·영수증·세부내역서. 실손 청구나 회사 제출 때문에 진료를 받는 경우가 있어 진료의 부산물이 아니라 목적일 수 있다. 발급 자체는 병원이 한다.

**RLS** — SELECT는 `patient_id` 또는 `doctor_id`가 나. INSERT는 `patient_id = auth.uid()`.

대응 타입: `BookingRequest` (`types.ts:403`) · `BookingRow` (`liveMappers.ts:59`)

### `encounters` — 비대면 진료 신청

**`id`가 그대로 진료방 주소다.** 방 이름을 따로 만들면 두 사람이 서로 다른 방에 들어가는 길이 생긴다.

**RLS** — SELECT는 당사자 둘만. 그래서 *방 주소만 아는 사람은 들어올 수 없다* — 내 목록에 없는 방은 내가 당사자가 아닌 방이고, 화면이 가리는 게 아니라 서버가 판단한다. INSERT는 환자, UPDATE는 검증된 의사.

> ⚠️ **시그널링 채널은 아직 닫혀 있지 않다.** Supabase Realtime 브로드캐스트 채널 `consult:{roomId}`는 방 이름을 아는 사람이 구독할 수 있다. 단기 토큰을 발급해야 닫히고, 그건 서버가 필요한 일이다.

대응 타입: `EncounterRequest` (`types.ts:433`)

### Realtime 발행 테이블

`questions` `answers` `empathies` `encounters` `question_notes`. 핸들러는 변경 종류를 보지 않고 **스냅샷 전체를 다시 읽는다** (`liveRepository.ts:259`) — 이 규모에서는 그게 더 단순하고 안전하다.

`bookings` `profiles` `clinics`는 발행하지 않는다. (`liveRepository.ts`의 구독 목록에는 `profiles`가 들어 있으나 publication에 없어 이벤트가 오지 않는다 → **아래 F-4**)

## 서버에 두지 않는 것

`localStore.ts`가 기기 안에만 남기는 값들이다. **서버로 올리지 않는다.**

- 비대면 사전 확인 답 (`TelemedicinePrecheck`)
- 주소·지역 설정

사는 지역과 질환 예외는 사람에 관한 값이고, 이 데모의 데이터베이스는 해외 리전이며 의료정보를 다룰 접근통제가 없다. 새로고침 한 번에 준비가 통째로 풀리지 않게 하는 선까지만 남긴다.

## 코드와 스키마가 어긋나는 곳

문서화하며 찾은 것들이다. 전부 **아직 고치지 않았다.** 60-roadmap의 입력값이다.

### F-1 · `bookings.document_types`의 타입이 마이그레이션 경로에 따라 갈린다 — **버그 가능**

- `migration-002.sql`: `text[] not null default '{}'`
- `migration-005.sql`: `jsonb not null default '[]'::jsonb`

둘 다 `add column if not exists`라, **002를 먼저 돌렸으면 `text[]`로 남고 005는 아무 일도 하지 않는다.** 코드는 `text[]`를 기대한다 (`liveMappers.ts:67` `document_types: string[]`). 그러나 005의 주석은 스스로를 독립 실행 가능한 것처럼 설명하고 있어서, 새 프로젝트에 schema + 005만 적용하면 `jsonb`가 되고 매퍼가 어긋난다. **두 마이그레이션 중 하나를 정본으로 정하고 나머지를 지워야 한다.**

### F-2 · `encounters`에 아무도 읽지 않는 컬럼이 5개 있다 — **정리 대상**

`scheduled_at` · `room_url` · `keywords` · `prescription_draft` · `record_draft`. `src/` 전체에서 참조가 **0회**다.

`room_url`에는 "Edge Function이 채운다"는 주석이 있으나 그런 Edge Function은 없고, 실제로는 `encounters.id`가 방 주소다. 이 표는 원래 아래 F-3의 `Encounter`를 담으려고 설계됐다가, 실제로는 `EncounterRequest`를 담게 됐다.

### F-3 · `Encounter` 타입이 정의만 되고 쓰이지 않는다 — **정리 대상**

`types.ts:457`의 `Encounter`(진료 종료 후 EMR로 넘길 내용: `transcript` `orders` `soapDraft` `eligibility`)는 **어디서도 import되지 않는다.** 같이 있는 `EncounterStatus`(`booked`|`in-progress`|`completed`)도 서버 enum과 값이 다르며 쓰이지 않는다. 실제로 쓰는 것은 `EncounterRequest` / `EncounterRequestStatus`다.

지우거나, 아니면 진료 종료 후 기록을 실제로 서버에 남기기로 하고 F-2의 컬럼들과 함께 살릴지 정해야 한다. **회의록이 요구한 "진료 후 기록 초안"을 구현하려면 이쪽을 살리는 방향이 된다.**

### F-4 · `profiles`를 구독하지만 Realtime publication에 없다 — **무해하나 오해 유발**

`liveRepository.ts:270` 근처에서 `profiles` 변경을 구독하는데 `schema.sql`의 publication 목록에 `profiles`가 없다. 이벤트가 오지 않을 뿐 오류는 아니다. 구독을 지우거나 publication에 추가하거나 둘 중 하나.

### F-5 · `answerTemplates.ts`에만 `asOf`가 없다 — **경미**

나머지 규칙셋 7개는 전부 `asOf`를 단다. 답변 문구도 운영 기준이므로 같이 다는 편이 낫다.

## 스키마를 고칠 때

1. `supabase/schema.sql`은 **처음부터 다시 붙여넣을 수 있는 상태**를 유지한다 (`if not exists`, `drop policy if exists`).
2. 이미 배포된 프로젝트를 위해 `migration-00N.sql`을 따로 추가한다. **같은 컬럼을 두 마이그레이션에서 다른 타입으로 만들지 않는다** (F-1이 그 사례다).
3. 열람 범위를 바꿨다면 `src/domain/visibility.ts`와 SQL 정책을 **함께** 고친다. 어느 한쪽만 고치면 화면과 서버의 판정이 갈라진다.
4. 타입은 `src/domain/types.ts` → 행 타입은 `src/data/liveMappers.ts`. 매퍼를 빼먹으면 조회 전체가 실패한다 (migration-003이 그 사례다).
