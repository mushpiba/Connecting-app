# 40 · 데이터 모델

> 원본은 `supabase/schema.sql` + `migration-002~006.sql`이다. 이 문서는 그것을 사람이 읽는 순서로 옮기고, **어느 화면이 그 컬럼을 읽는지**를 붙인 것이다.
> 상위 결정과 제약은 `05-decisions.md`가 정본이다. 화면이 요구하는 것은 `30-feature-spec.md`가 정본이다. 충돌하면 그쪽이 맞다.
> 마지막 대조: 2026-08-27 · 대상 커밋 `2c2690f`

## 이 개정에서 바뀐 것

2026-08-19판은 스키마를 옮겨 적고 **결함 다섯(F-1~F-5)을 열어 둔 채로** 끝났다. 그 사이 `05-decisions.md`가 제품의 축을 Q&A로 바꿨고(D-1·D-6), `15-information-architecture.md`가 `/care`를 신설했으며(Q-4), `30-feature-spec.md`가 비공개 덧붙임의 수치를 정했다(Q-5).

이번 판이 하는 일은 셋이다.

1. **F-1~F-5를 전부 판정한다.** 다섯 개 모두 「닫힘」이다 — §결함 판정
2. **화면이 요구하는 것을 최소한으로 더한다.** 새 표는 넷이고, 전부 이미 정해진 화면이 읽는다 — `private_threads` · `private_messages` · `expression_filter_hits` · `self_reported_clinics`
3. **모든 컬럼에 읽는 화면을 적는다.** 비어 있으면 비어 있다고 적는다. 그게 다음 F-2를 막는 유일한 방법이다

스키마 초안은 `supabase/migration-006.sql`이다. **아직 어느 프로젝트에도 적용하지 않았다.** 기존 마이그레이션은 고치지 않았다 — 이미 적용된 것들이다.

**이 문서는 코드보다 앞서 있다.** 새 표 넷을 `liveRepository.ts`가 아직 읽지 않고, 화면도 아직 없다. 「읽는 화면」 칸은 **누가 읽기로 되어 있는가**이지 지금 읽고 있는가가 아니다. 이미 구현된 것과 아직 아닌 것을 표마다 구분해 적었다.

---

## 원칙

**권한은 전부 RLS가 강제한다.** 클라이언트는 정적 사이트라 서버가 없고, 화면 쪽 판정(`src/domain/visibility.ts`)은 사용자 경험을 위한 것이며 실제 차단은 SQL이 한다. 두 곳의 판정이 갈라지면 SQL이 맞다.

**움직이는 값은 스키마에 두지 않는다.** 법령·운영 기준으로 움직이는 수치는 `src/data/rules/*`에 `asOf`와 함께 둔다(원칙 7). 스키마가 강제하는 것은 움직이지 않는 것 — **누가 · 어느 순서로 · 어느 방향으로** — 뿐이다. §규칙은 DB에 두지 않는다.

**SQL 파일은 여러 번 실행해도 같은 결과가 되게 둔다.** 어디까지 적용됐는지 헷갈릴 때 처음부터 다시 붙여넣을 수 있어야 한다. (002가 이 원칙을 지키지 않는다 — F-8)

---

## 읽는 법

표마다 아래를 적는다. 비우지 않는다.

| 항목 | 무엇을 적나 |
| --- | --- |
| **무엇을 담나** | 한 문장 |
| **누가 읽고 쓰나** | RLS 정책을 사람 말로. **실제 `supabase/*.sql`의 정책 이름과 함께** |
| **컬럼표** | 타입 · 널 · 기본값 · 무엇 · **읽는 화면** |
| **인덱스** | 어느 조회를 위한 것인지 |
| **Realtime** | 발행하는가. 누가 구독하는가 |

**「읽는 화면」이 비어 있는 컬럼은 F-2가 된다.** 그런 컬럼은 「없음」이라고 적고 왜 남겨 두는지를 함께 적는다. 적을 수 없으면 지운다.

---

## enum

| enum | 값 | 정의 위치 | 대응 타입 |
| --- | --- | --- | --- |
| `app_role` | `patient` · `doctor` | `schema.sql` | `AppRole` (`types.ts:19`) |
| `post_visibility` | `public` · `specialty-only` · `prior-clinic-only` | `schema.sql` | `PostVisibility` (`types.ts:22`) |
| `encounter_status` | `requested` · `accepted` · `in-progress` · `completed` · `declined` | `schema.sql` | `EncounterRequestStatus` (`types.ts:416`) |

enum을 더 만들지 않았다. `self_reported_clinics.trust`와 `expression_filter_hits.surface`는 `text` + `check`다 — `clinics.level`이 이미 쓰는 방식이고, 값을 늘릴 때 `alter type`이 아니라 제약 교체로 끝나기 때문이다.

---

# 테이블

## `profiles`

**무엇을 담나** — 환자와 의사가 같은 표에 있다. **계정 하나가 두 자리에 앉는다.**

**누가 읽고 쓰나** — 읽기는 전체 공개(`프로필은 누구나 읽는다`). 만들기와 고치기는 본인만(`내 프로필만 만든다` · `내 프로필만 고친다`). 지우는 정책은 없다.

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK → `auth.users` | 아니오 | — | 익명 인증 uid | 전 화면 (내가 누구인지) |
| `display_name` | text | 아니오 | — | 환자로 참여할 때 쓰는 이름 | `/me` · `/questions/:id` 작성자 줄 · `/doctor/visits` 신청자 |
| `role` | `app_role` | 아니오 | `patient` | 어느 트리로 들어가나 | 환자/의사 트리 분기 · `questions` RLS |
| `region` | text | 아니오 | `인천 미추홀구` | 사는 지역 | `/me` |
| `license_verified` | boolean | 아니오 | `false` | 의사 전용. 거짓이면 사연이 보이지도 답변이 써지지도 않는다 | `/doctor/inbox`·`/doctor/home`의 「권한 없음」 · `questions`·`answers`·`private_messages` RLS |
| `clinic_id` | text → `clinics` | 예 | — | 소속 의료기관 (FK는 `profiles_clinic_fk`, migration-004) | `/doctors/:id` · `/doctor/inbox` · `prior-clinic-only` RLS |
| `specialty` | text | 예 | — | 진료과 | `/doctors/:id` · `/doctor/inbox` 배달 · `specialty-only` RLS |
| `template_id` | text | 예 | — | 어느 준비된 의사 프로필을 골랐는지 | `/doctor/me/*` 전부 · `/doctors/:id` (픽스처 연결) |
| `created_at` | timestamptz | 아니오 | `now()` | 만든 시각 | **없음** — 조회 컬럼 목록(`liveRepository.ts:62`)에도 없다. **F-7** |

> ⚠️ **역할과 면허 검증을 스스로 바꿀 수 있다.** migration-004가 가드 트리거(`profiles_guard_privileges`)를 제거했다. 여럿이 모여 테스트할 때 주최자가 매번 SQL로 승격시키면 진행이 끊기기 때문이다. **실서비스로 갈 때 가장 먼저 되돌릴 자리다**(`50-nonfunctional.md` R-2).

**인덱스** — PK뿐. 전체를 한 번에 읽고 화면에서 가른다.
**Realtime** — **발행한다 (006에서 추가).** `liveRepository.ts:270`이 구독하고 있었으나 publication에 없었다 — F-4.

대응 타입: `Patient` (`types.ts:277`) / `Doctor` (`types.ts:239`). 한 행이 매퍼(`liveMappers.ts:177`, `:198`)를 통해 둘 중 하나로 갈린다. `Doctor`의 `bio` `career` `consultStyle` `keywords`는 DB가 아니라 `template_id`가 가리키는 픽스처에서 온다. **C-3이 요구하는 프로필 필드 축소는 픽스처 쪽 일이고 스키마를 건드리지 않는다.**

---

## `clinics`

**무엇을 담나** — 검증된 의료기관 마스터. 읽기 전용이다.

**누가 읽고 쓰나** — 누구나 읽는다(`의료기관은 누구나 읽는다`). **쓰기 정책이 없다** — 클라이언트는 넣을 수도 고칠 수도 없다. 이것이 「검증된 데이터」의 뜻이고, 환자가 직접 적은 곳을 이 표에 섞지 않는 이유다(§Q-6).

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | text PK | 아니오 | — | 기관 식별자 | 전 화면 (연결 키) |
| `name` | text | 아니오 | — | 기관 명칭 | `/care` 3구역 · `/doctors/:id` · `/booking/:doctorId` |
| `level` | text check `clinic` 또는 `hospital` | 아니오 | — | 의원급/병원급 | `/care` 3구역 · 비대면 자격 판정 |
| `region` | text | 아니오 | — | 소재 지역 | `/care` 3구역 · 초진 비대면 지역 판정 |
| `address` | text | 아니오 | — | 소재지 | `/doctors/:id` · `/booking/:doctorId` |
| `phone` | text | 아니오 | — | 전화번호 | `/doctors/:id` |
| `booking_url` | text | 아니오 | — | 병원 예약 페이지 | `/booking/:doctorId` |
| `telemedicine_enabled` | boolean | 아니오 | `false` | 비대면 운영 여부 | `/care` 3구역 막힌 사유 |
| `monthly_telemedicine_ratio` | numeric | 아니오 | `0` | 이번 달 비대면 비율 | `/care` 3구역 막힌 사유 · `eligibility` |
| `landmark` | text | 아니오 | `''` | 약도에 찍는 표시 | `ClinicMap` (`/care` 3구역) |
| `lunch_break` | text | 예 | — | 점심시간 | `/booking/:doctorId` · `ClinicSchedule` |
| `hours` | jsonb | 아니오 | `'[]'` | 요일별 진료시간 배열. `clinicHours.ts`가 해석 | `/care` 3구역 「오늘 진료」 · `/booking/:doctorId` |

**C-3 판정** — 명칭·소재지·전화번호·진료과목까지다. 가격·시술명·홍보 문구·홈페이지 링크를 담는 컬럼이 **없다.** 없는 컬럼은 실수로 화면에 나갈 수 없다.

**인덱스** — PK뿐. 표가 작고 전체를 읽는다.
**Realtime** — 발행하지 않는다. 구독하는 곳도 없다. 마스터 데이터라 세션 중에 바뀌지 않는다.

대응 타입: `Clinic` (`types.ts:214`)

---

## `questions` — 사연

**무엇을 담나** — 환자가 자기 말로 적은 증상 글과 문진 답.

**등록하면 고칠 수 없다.** 지나간 증상 설명이 조용히 바뀌면 그 위에 달린 답변이 무엇을 보고 쓴 것인지 알 수 없어진다. 대신 `question_notes`로 덧붙인다. (UPDATE 정책은 열려 있으나 화면은 쓰지 않는다.)

**누가 읽고 쓰나** — 열람 범위는 `사연 열람 범위` 정책 하나가 판정한다. `visibility.ts`의 `canDoctorSeeQuestion`을 SQL로 옮긴 것이다.

1. 글쓴이 본인
2. `public` — 환자이거나, **면허 검증된** 의사. 미검증 의사는 공개 글도 못 본다
3. `specialty-only` — 검증된 의사 중 `profiles.specialty`가 `questions.specialties`에 포함된 사람
4. `prior-clinic-only` — 검증된 의사 중 `profiles.clinic_id`가 `questions.prior_clinic_id`와 같은 사람

넣기·고치기·지우기는 전부 글쓴이만(`내 사연만 올린다` · `내 사연만 고친다` · `내 사연만 지운다`).

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 사연 주소 | `/questions/:questionId` |
| `author_id` | uuid → `profiles` | 아니오 | — | 글쓴이 | `/questions/:id` 작성자 줄 · RLS |
| `title` `body` | text | 아니오 | — | 환자가 자기 말로 쓴 것 | `/home` 피드 · `/questions/:id` · `/doctor/inbox` |
| `visibility` | `post_visibility` | 아니오 | `public` | 공개 범위 | `/ask` 3단계 · `/questions/:id` · RLS |
| `onset_date` | date | 아니오 | — | 언제부터 | `IntakeSummary` · `emrExport` |
| `course` | text | 아니오 | — | 나아지나 나빠지나 | `QuestionCard` · `IntakeSummary` |
| `daily_impact` | text | 아니오 | — | 일상에 어떤 지장 | `IntakeSummary` |
| `tried_remedies` | text[] | 아니오 | `'{}'` | 해 본 것 | `IntakeSummary` |
| `body_areas` | text[] | 아니오 | `'{}'` | 부위 | `IntakeSummary` |
| `triage` | jsonb | 아니오 | — | `TriageResult` 전체. **화면용** | `/ask` 결과 · `/questions/:id` 진료과 안내 · `/doctor/inbox` |
| `specialties` | text[] | 아니오 | `'{}'` | `triage.suggestions`에서 뽑아 넣는다 (`liveMappers.ts:127`) | **없음 — RLS 전용 색인.** 조회 컬럼 목록에 넣지 않는다. 화면은 `triage`를 읽는다 |
| `prior_clinic_id` | text | 예 | — | 진료받았던 곳 (환자 자기 신고) | `/doctor/questions/:id` 진료 이력 줄 · `prior-clinic-only` RLS |
| `prior_visited_on` | date | 예 | — | 그게 언제 | 〃 |
| `same_symptoms` | boolean | 아니오 | `false` | 그때와 같은 증상인가 | `/ask` 2단계 · `eligibility` |
| `selected_symptoms` | text[] | 아니오 | `'{}'` | 칩으로 고른 증상 (migration-003) | `/ask` 1단계 · `IntakeSummary` · `emrExport` |
| `pain_level` | smallint check 1–10 | 예 | — | 환자가 스스로 고른 값. **우리가 이 숫자로 아무것도 판정하지 않는다** (migration-002) | `/ask` · `IntakeSummary` · `emrExport` |
| `intake_answers` | jsonb | 아니오 | `'[]'` | 문항 답 원값 그대로. 합산하지 않는다 (migration-002) | `/ask` · `IntakeSummary` · `emrExport` |
| `created_at` | timestamptz | 아니오 | `now()` | 올린 시각 | `/home` 정렬 · `/news` 정렬 · `/questions/:id` |

> `prior_clinic_id`에는 외래키가 없다. `profiles.clinic_id`에는 migration-004가 걸었다. 지금은 화면이 `demoClinics` 목록에서 고르게 하므로 값이 어긋나지 않지만, **어긋나면 조용히 아무에게도 안 보이는 사연이 된다** — `prior-clinic-only` 판정이 거짓이 될 뿐 오류가 나지 않는다. **F-9**

**인덱스**
- `questions_specialties_idx` GIN — `specialty-only` RLS가 `p.specialty = any(specialties)`로 판정한다
- `questions_created_at_idx` (`created_at desc`) — `/home` 피드의 최신순

**Realtime** — 발행한다. `liveRepository.ts`가 구독하고 스냅샷 전체를 다시 읽는다.

대응 타입: `Question` (`types.ts:284`) · 행 타입 `QuestionRow` (`liveMappers.ts:24`)

---

## `answers` — 공개 답변

**무엇을 담나** — 검증된 의사가 사연에 단 공개 답변.

**누가 읽고 쓰나** — 읽기는 사연 정책에 얹혀 있다(`보이는 사연의 답변만 읽는다`) — 안 보이는 글의 답변은 `exists`가 거짓이 된다. 넣기는 **검증된 의사만**, 그리고 대상 사연이 자기에게 보여야 한다(`검증한 의사만 답변한다`). 고치기는 본인만(`내 답변만 고친다`). 지우는 정책은 없다.

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 답변 식별자 | `/questions/:id` · 비공개 대화가 매달리는 자리 |
| `question_id` | uuid → `questions` | 아니오 | — | 어느 사연에 | `/questions/:id` · `/news` |
| `doctor_id` | uuid → `profiles` | 아니오 | — | 누가 썼나 | `/questions/:id` 답변 카드 · `/news` |
| `body` | text | 아니오 | — | 답변 본문 | `/questions/:id` · `emrExport.recordDraft` |
| `created_at` | timestamptz | 아니오 | `now()` | 쓴 시각 | `/questions/:id` 등록순 정렬 · `/news` · **하루 5회 상한 계산(D-8)** |

**하루 답변 상한(D-8)에 새 컬럼이 필요 없다.** 「오늘 남은 답변 n회」는 `doctor_id`가 나이고 `created_at`이 오늘(KST)인 행의 개수로 나온다. **상한값 5는 스키마에 없다** — `src/data/rules/*`에 `asOf`와 함께 둔다(§규칙은 DB에 두지 않는다). 비공개 회신은 이 표에 들어오지 않으므로 자동으로 세어지지 않는다 — 화면이 요구한 「공개 답변만 센다」가 표의 경계로 지켜진다.

**인덱스** — `answers_question_idx` (`question_id, created_at`) — 사연 상세의 등록순 목록. 상한 계산은 `(doctor_id, created_at)`을 훑지만 의사 한 사람의 하루치라 지금 규모에서는 색인 없이도 싸다. **필요해지면 그때 만든다.**

**Realtime** — 발행한다.

대응 타입: `Answer` (`types.ts:320`)

---

## `empathies` — 공감

**무엇을 담나** — 누가 어느 사연에 공감했는지. **누적 카운터가 아니라 개별 기록이다.** 카운터로는 「이번 주에 몇 개인가」에 답할 수 없다 — `board.ts`의 주간 집계가 이걸 쓴다.

**누가 읽고 쓰나** — 읽기는 사연 정책에 얹혀 있다(`공감은 보이는 글에서 센다`). 넣기와 지우기는 본인만(`내 공감만 누른다` · `내 공감만 취소한다`).

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `question_id` | uuid → `questions` | 아니오 | — | 어느 사연에 | `/home` 피드 공감 수 |
| `patient_id` | uuid → `profiles` | 아니오 | — | 누가 | `/home` (내가 눌렀나) |
| `created_at` | timestamptz | 아니오 | `now()` | 누른 시각 | `/doctor/stories` 주간 집계 (`boardRules`) |

**인덱스** — PK `(question_id, patient_id)`가 복합키이자 색인이다.
**Realtime** — 발행한다.

대응 타입: `Empathy` (`types.ts:332`)

---

## `question_notes` — 공개 덧붙임 (migration-002)

**무엇을 담나** — 글쓴이가 자기 사연에 덧붙이는 글. **모두가 읽는다.** 비공개 덧붙임과 다른 것이며 화면에서도 섞지 않는다.

**누가 읽고 쓰나** — 읽기는 사연이 보이면 보인다(`보이는 사연의 덧붙임만 읽는다`). 넣기는 **글쓴이만**(`내 사연에만 덧붙인다`) — **의사는 답변으로 말한다.** 고치기·지우기 정책은 없다.

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 식별자 | `/questions/:id` |
| `question_id` | uuid → `questions` | 아니오 | — | 어느 사연에 | `/questions/:id` · `/doctor/questions/:id` |
| `author_id` | uuid → `profiles` | 아니오 | — | 글쓴이 | RLS |
| `body` | text | 아니오 | — | 덧붙인 글 | `/questions/:id` · `emrExport.addenda` |
| `created_at` | timestamptz | 아니오 | `now()` | 쓴 시각 | `/questions/:id` 등록순 |

**인덱스** — `question_notes_question_idx` (`question_id, created_at`).
**Realtime** — 발행한다.

대응 타입: `QuestionNote` (`types.ts:312`)

---

## `bookings` — 대면 예약 희망

**무엇을 담나** — 환자가 고른 희망 시간과 요청 서류. **우리가 예약을 확정하지 않는다** — 확정·취소·변경은 병원이 앱 밖에서 한다. 그래서 상태 컬럼이 없다.

`unique (patient_id, doctor_id, visit_date, visit_time)`. 화면이 지어낸 id로 찾으면 서버가 만든 id와 어긋나므로 **의사·날짜·시간 셋으로 찾고, 서버도 그 셋으로 중복을 막는다.**

**누가 읽고 쓰나** — 읽기는 당사자 둘만(`내 예약과 나에게 온 예약만 본다`). 넣기는 환자만(`내 예약만 넣는다`). 고치기·지우기 정책은 없다 — 앱에는 취소가 없다.

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 식별자 | — (키로만 쓴다) |
| `patient_id` | uuid → `profiles` | 아니오 | — | 누가 | `/doctor/visits` 신청자 이름 · RLS |
| `doctor_id` | uuid → `profiles` | 아니오 | — | 누구에게 | `/care` 1구역 · `/doctor/inbox` · RLS |
| `clinic_id` | text → `clinics` | 아니오 | — | 어느 기관 | `/care` 1·2구역 · `/doctor/inbox` |
| `visit_date` | date | 아니오 | — | 희망 날짜 | `/care` 1·2구역 · `/doctor/visits` 정렬 |
| `visit_time` | text | 아니오 | — | 희망 시간 | `/care` 1구역 · `/doctor/visits` |
| `document_types` | **text[]** | 아니오 | `'{}'` | 진료확인서·영수증·세부내역서. 실손 청구나 회사 제출 때문에 진료를 받는 경우가 있어 진료의 부산물이 아니라 목적일 수 있다. 발급 자체는 병원이 한다 | `/booking/:doctorId` · `/doctor/inbox` · `/doctor/visits` |
| `created_at` | timestamptz | 아니오 | `now()` | 전달한 시각 | **없음** — `BookingRequest.requestedAt`으로 매핑되지만 어느 화면도 그리지 않는다. **F-7** |

> **`document_types`의 정본은 `text[]`다.** 002·003은 `text[]`, 005는 `jsonb`로 같은 컬럼을 만들고 셋 다 `add column if not exists`라 먼저 돈 쪽이 이겼다. migration-006이 세 갈래를 전부 `text[]`로 모은다. §F-1.

**인덱스**
- `unique (patient_id, doctor_id, visit_date, visit_time)` — 중복 방지이자 환자 쪽 조회(`patient_id` 선두)
- `bookings_doctor_idx` (`doctor_id, visit_date`, 006 신설) — `/doctor/inbox`·`/doctor/visits`의 「받은 예약 요청」. 기존 unique 색인은 `patient_id`로 시작해서 의사 쪽 조회를 받쳐 주지 못한다

**Realtime** — **발행한다 (006에서 추가).** `liveRepository.ts`가 구독하고 있었으나 publication에 없었다 — F-4가 `profiles`만 적었으나 이 표도 같은 상태였다.

대응 타입: `BookingRequest` (`types.ts:403`) · `BookingRow` (`liveMappers.ts:59`)

---

## `encounters` — 비대면 진료 신청

**무엇을 담나** — 환자가 낸 비대면 진료 신청과 그 진행 상태. **산출물은 담지 않는다** (006에서 컬럼 다섯을 뺐다 — §F-2).

**`id`가 그대로 진료방 주소다.** 방 이름을 따로 만들면 두 사람이 서로 다른 방에 들어가는 길이 생긴다.

**누가 읽고 쓰나** — 읽기는 당사자 둘만(`내 진료만 본다`). 그래서 *방 주소만 아는 사람은 들어올 수 없다* — 내 목록에 없는 방은 내가 당사자가 아닌 방이고, 화면이 가리는 게 아니라 서버가 판단한다. 넣기는 환자(`환자가 진료를 신청한다`), 고치기는 **검증된 담당 의사**(`검증한 의사가 진료를 진행한다`).

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | **그대로 진료방 주소** | `/visit/:roomId` · `/doctor/visit/:roomId` |
| `question_id` | uuid → `questions` on delete **set null** | 예 | — | 어느 사연에서 왔나 | `/doctor/visits` 「사연 먼저 읽기」 |
| `patient_id` | uuid → `profiles` | 아니오 | — | 신청자 | `/doctor/visits` · RLS |
| `doctor_id` | uuid → `profiles` | 아니오 | — | 담당 의사 | `/care` 1구역 · RLS |
| `clinic_id` | text → `clinics` | 아니오 | — | 어느 기관 | `/care` 1·2구역 |
| `status` | `encounter_status` | 아니오 | `requested` | 5단계 상태 | `/care` 1구역 4단계 추적(`encounterTrack`) · `/doctor/visits` |
| `created_at` | timestamptz | 아니오 | `now()` | 신청 시각 | `/doctor/visits` · 정렬 |

**뺀 컬럼 다섯** — `scheduled_at` · `room_url` · `keywords` · `prescription_draft` · `record_draft`. 판정과 이유는 §F-2 · §C-4.

**인덱스** (006 신설)
- `encounters_patient_idx` (`patient_id, created_at desc`) — `/care` 1·2구역
- `encounters_doctor_idx` (`doctor_id, created_at desc`) — `/doctor/visits`

RLS 술어가 매 행마다 이 두 컬럼을 본다. 표가 커지면 정책 자체가 느려지는 자리다.

**Realtime** — 발행한다.

> ⚠️ **시그널링 채널은 아직 닫혀 있지 않다.** Supabase Realtime 브로드캐스트 채널 `consult:{roomId}`는 방 이름을 아는 사람이 구독할 수 있다. 단기 토큰을 발급해야 닫히고, 그건 서버가 필요한 일이다(`50-nonfunctional.md` R-3).

대응 타입: `EncounterRequest` (`types.ts:433`)

---

## `private_threads` — 비공개 덧붙임 · 대화 (006 · 미구현)

**무엇을 담나** — 환자와 **자기 사연에 답변한 의사** 사이에 열린 1:1 후속 대화 한 건. 답변 카드 하나에 대화 하나다.

**누가 읽고 쓰나**

- **읽기 — 당사자 둘만**(`비공개 대화는 두 사람만 본다`). 제3자에게는 대화의 존재 자체가 보이지 않는다
- **열기 — 환자만, 그리고 자기 사연에 답변한 의사에게만**(`환자가 답변한 의사에게만 연다`). 의사에게는 INSERT 정책이 **아예 없다** — D-6 항목 1(「환자가 먼저 말 걸어야 열린다」)을 없는 문으로 강제한다. 답변하지 않은 의사를 `doctor_id`에 적으면 `answers`를 보는 `exists`가 거짓이 된다 — D-6 항목 2
- **고치기·지우기 — 정책 없음.** 사연이 지워질 때 함께 사라진다

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 대화 식별자 | `/questions/:questionId` 비공개 덧붙임 · 필터 로그가 가리키는 값 |
| `question_id` | uuid → `questions` cascade | 아니오 | — | 어느 사연에 붙었나 | `/questions/:id` (사연 단위로 읽는다) |
| `answer_id` | uuid → `answers` cascade | **예** | — | 어느 답변 카드 아래에 붙었나 | `/questions/:id` (답변 카드마다 자기 대화를 찾는다) |
| `patient_id` | uuid → `profiles` cascade | 아니오 | — | 환자 | RLS · 말풍선 좌우 |
| `doctor_id` | uuid → `profiles` cascade | 아니오 | — | 답변한 의사 | `/questions/:id` 「{의사 이름}에게…」 · RLS |
| `created_at` | timestamptz | 아니오 | `now()` | 연 시각 | `/questions/:id` |

**`answer_id`가 널을 허용하는 이유** — D-6이 「답변한 의사에게만」을 넓히는 쪽으로 뒤집히면 답변에 매이지 않은 대화가 생긴다. `not null`로 박아 두면 그때 컬럼을 고쳐야 하고 **그게 마이그레이션이다.** 지금은 INSERT 정책이 널을 거부한다 — **경계는 컬럼이 아니라 정책에 있다.** §D-6이 뒤집힐 때.

`unique (answer_id, patient_id)` — 한 답변에 대화 하나. 답변 카드 아래에 두 개가 붙으면 화면이 두 번 그린다.

**인덱스** (`encounters`와 같은 모양)
- `private_threads_patient_idx` (`patient_id, created_at desc`)
- `private_threads_doctor_idx` (`doctor_id, created_at desc`)

SELECT 정책이 매 행마다 이 두 컬럼을 본다. 사연 단위 색인은 두지 않았다 — 클라이언트가 스냅샷을 통째로 읽고 RLS가 이미 내 것만 남기므로, 거기서 한 사연을 고르는 것은 몇 행 안에서 끝난다.

**Realtime** — **발행하지 않는다.** 민감정보(개인정보보호법 제23조)이고, 발행 설정과 RLS가 어긋났을 때 새는 방향이 최악이다. 그리고 3왕복짜리 비동기 문답은 채팅이 아니라서 실시간이 필요하지 않다. 켜기로 하면 publication에 더하는 것으로 끝난다 — 표와 정책은 그대로다.

---

## `private_messages` — 비공개 덧붙임 · 발화 (006 · 미구현)

**무엇을 담나** — 대화 안의 말풍선 하나.

**누가 읽고 쓰나**

- **읽기 — 대화가 보이면 보인다**(`비공개 발화는 대화가 보이면 보인다`). `answers`가 `questions` 정책에 얹혀 있는 것과 같은 방식이다. 판정을 한 곳에만 둔다
- **환자 — 자기 대화에만, 의사 회신을 기다린 뒤에만**(`환자는 회신을 기다린 뒤 말한다`)
- **의사 — 자기 대화에만, 환자가 먼저 말을 건 뒤에만, 그리고 면허 검증을 마쳤을 때만**(`의사는 환자가 연 뒤에만 회신한다`)
- **고치기·지우기 — 정책 없음.** 「보낸 발화는 취소할 수 없다」가 화면의 계약이고 서버도 같다

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 식별자 | `/questions/:questionId` |
| `thread_id` | uuid → `private_threads` cascade | 아니오 | — | 어느 대화의 | `/questions/:id` |
| `sender_id` | uuid → `profiles` cascade | 아니오 | — | 누가 | RLS |
| `sender_role` | `app_role` | 아니오 | — | 환자인가 의사인가 | `/questions/:id` — 말풍선 좌우, **의사 회신에만 붙는 고정 고지**, 남은 왕복 계산 |
| `body` | text | 아니오 | — | 발화 본문 | `/questions/:id` |
| `created_at` | timestamptz | 아니오 | `now()` | 보낸 시각 | `/questions/:id` 시간순 |

**길이 상한(환자 500자·의사 400자)이 컬럼 제약에 없다.** 움직이는 값이기 때문이다 — §규칙은 DB에 두지 않는다.

**순서와 방향은 서버가 강제한다.** 두 INSERT 정책이 자기 역할의 발화 수를 상대 역할의 발화 수와 비교한다.

| 규칙 | 어떻게 | 막는 것 |
| --- | --- | --- |
| 환자가 먼저 | 의사는 `의사 회신 수 < 환자 발화 수`일 때만 넣는다. 빈 대화에서는 `0 < 0`이 거짓 | 의사 쪽 영업·유인 경로 (D-6 항목 1) |
| 한 왕복 = 환자 1 + 의사 1 | 환자는 `환자 발화 수 <= 의사 회신 수`일 때만 넣는다 | 한쪽이 연달아 밀어 넣는 것 |
| 역할을 속일 수 없다 | `sender_id = auth.uid()`와 `sender_role`을 정책이 함께 본다 | 환자가 의사 말풍선을 만드는 것 |

세는 일은 `medivu_private_message_count(thread, role)`가 한다. 정책 안에서 `private_messages`를 직접 세면 그 조회에 다시 같은 표의 정책이 걸려 `infinite recursion detected in policy`로 막힌다. **그래서 소유자 권한으로 도는 함수를 따로 두었고, 함수가 스스로 「부르는 사람이 이 대화의 당사자인가」를 먼저 본다** — 아니면 0을 돌려준다. 이 확인이 없으면 대화 주소만 아는 사람이 「저 대화에 몇 마디 오갔나」를 셀 수 있다.

**왕복 카운트가 싸야 한다는 요구**(D-6 항목 3)는 `private_messages_thread_idx`가 받는다. 그리고 **상한 자체가 카운트를 싸게 만든다** — 한 대화의 행 수가 최대 6이다.

**인덱스** — `private_messages_thread_idx` (`thread_id, created_at`). 말풍선 목록(시간순)과 왕복 카운트가 같은 색인을 쓴다.

**Realtime** — 발행하지 않는다. `private_threads`와 같은 이유다.

---

## `expression_filter_hits` — 표현 필터에 걸린 기록 (006 · 미구현)

**무엇을 담나** — 처방·진단 단정·검사 지시·의료기관 유치로 읽히는 표현(PT-1~PT-5)이 걸려 **전송이 막힌 사실.** 양벌규정(의료법 제91조)의 「상당한 주의·감독」 입증 자료다.

**남기는 것과 안 남기는 것** — 필요한 것은 **우리가 걸렀다는 사실**이지 환자의 증상 원문이 아니다. **막으려고 만든 장치가 새 보관소가 되면 안 된다.**

| 남긴다 | 남기지 않는다 |
| --- | --- |
| 규칙 ID · 규칙셋 기준일 · 시각 · 작성자 · 어디서 걸렸나 · 걸린 조각 20자 | 본문 전체 · 앞뒤 문맥 · 그 뒤 무엇으로 고쳐 보냈는지 |

**누가 읽고 쓰나** — **넣기만 된다**(`걸린 사실만 남긴다`, `author_id = auth.uid()`). SELECT·UPDATE·DELETE 정책을 만들지 않았다. 쓴 사람이 자기 기록을 고치거나 지울 수 있으면 방어 자료가 되지 못한다. 뽑는 것은 운영자가 `service_role`로 한다.

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 식별자 | **없음 — 화면이 읽지 않는 것이 요건이다** |
| `author_id` | uuid (**FK 없음**) | 아니오 | — | 누가 쓰려다 걸렸나 | 〃 |
| `surface` | text check `public-answer` 또는 `private-message` | 아니오 | — | 공개 답변인가 비공개 회신인가 | 〃 |
| `question_id` | uuid (**FK 없음**) | 예 | — | 공개 답변이면 어느 사연에서 | 〃 |
| `thread_id` | uuid (**FK 없음**) | 예 | — | 비공개 회신이면 어느 대화에서 | 〃 |
| `rule_id` | text | 아니오 | — | PT-1 ~ PT-5 | 〃 |
| `rule_set_as_of` | date | 아니오 | — | 그때 무슨 규칙셋이 판단했나 | 〃 |
| `matched_span` | text check ≤20자 | 아니오 | — | 걸린 조각 | 〃 |
| `created_at` | timestamptz | 아니오 | `now()` | 시각 | 〃 |

**「전송이 막혔다는 사실」에 컬럼을 두지 않았다.** 이 표에 행이 있다는 것 자체가 그 사실이다. 성공한 전송은 여기 오지 않는다.

**외래키를 걸지 않은 이유** — 이 표는 가리키는 대상보다 오래 살아야 한다. `on delete cascade`를 걸면 환자가 사연을 지우는 것만으로 의사가 걸린 기록이 사라지고, `on delete set null`을 걸면 부모 삭제가 CHECK 재평가에 걸린다. 값은 참조가 아니라 **식별자**다.

**`rule_set_as_of`는 규칙 파라미터가 아니다.** 규칙 파일이 바뀌어도 지나간 판정이 어느 기준으로 이루어졌는지는 바뀌면 안 된다. **파라미터를 DB로 옮기는 것(§금지)과 지나간 사실을 기록하는 것은 반대 방향이다.**

**인덱스** — `expression_filter_hits_author_idx` (`author_id, created_at desc`). 감사 조회는 「이 의료인에 대해 우리가 무엇을 했나」와 기간으로 뽑는다.

**Realtime** — 발행하지 않는다. 구독하는 화면이 없다.

> ⚠️ **필터 자체는 브라우저에서 돈다.** 서버가 없으므로 클라이언트가 로그를 안 남기고 우회할 수 있다. 이 표는 **정직한 클라이언트가 남긴 기록**이지 서버가 강제한 기록이 아니다. `50-nonfunctional.md`의 위험 수용 항목으로 올려야 한다 — §새로 찾은 것 R-6.

---

## `self_reported_clinics` — 환자가 직접 등록한 의료기관 (006 · 미구현)

**무엇을 담나** — 환자가 「여기 다니고 있어요」로 손으로 적은 곳. **검증되지 않았다.**

**왜 `clinics`에 넣지 않나** — `clinics`는 「누구나 읽는다」 하나로 도는 읽기 전용 마스터이고 쓰기 정책이 아예 없다. 직접 등록한 곳은 **본인만** 봐야 한다. 한 표에 두면 `clinics`의 정책을 행마다 갈라야 하고, 그 순간 검증된 데이터와 검증 안 된 데이터가 같은 자리에 앉는다. 화면이 두 출처를 섞지 않기로 한 것과 같은 이유다(Q-4).

**누가 읽고 쓰나** — 본인만 본다(`직접 등록한 곳은 본인만 본다`). 본인만 넣고(`직접 등록은 본인만 넣는다`) 본인만 지운다(`직접 등록은 본인만 지운다`). **UPDATE 정책은 없다** — 화면에는 추가와 지우기만 있다.

| 컬럼 | 타입 | 널 | 기본값 | 무엇 | 읽는 화면 |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid PK | 아니오 | `gen_random_uuid()` | 식별자 | `/care` 2구역 (지우기 대상) |
| `patient_id` | uuid → `profiles` cascade | 아니오 | — | 누가 적었나 | RLS |
| `name` | text | 아니오 | — | 환자가 적은 이름 그대로. 우리가 고치지 않는다 | `/care` 2구역 「내가 직접 적은 곳」 |
| `last_visited_on` | date | 아니오 | — | 마지막 진료일 | `/care` 2구역 · 정렬 기준 |
| `trust` | text check `self-reported` | 아니오 | `self-reported` | 신뢰 등급 | `/care` 2구역 — 섹션 구분과 고정 고지 |
| `created_at` | timestamptz | 아니오 | `now()` | 적은 시각 | **없음** — 정렬은 `last_visited_on`으로 한다. 남겨 두는 이유는 파기 기준일이 필요해서다(§보존과 파기) |

**받는 것은 두 가지뿐이다.** 지역·전화번호를 받지 않는다 — 확인할 수 없는 값을 늘릴 이유가 없다(`/care` 2구역 「입력 칸 2개」).

**`trust`의 값이 지금 하나뿐인데 컬럼을 두는 이유** — 표 이름으로 대신하면, 나중에 연계가 붙어 일부 행이 실제 `clinics` 레코드와 이어질 때 **기존 행 전체의 뜻이 조용히 바뀐다.** 등급이 행에 실려 있어야 그 순간에도 각 행이 무엇인지 말할 수 있다. 화면이 두 출처를 구분해 표시하려면 조회 결과에 등급이 실려 와야 한다는 요구도 이 컬럼이 받는다.

**이 표는 비대면 재진 자격의 근거가 되지 않는다.** 자격은 우리가 만든 기록(`bookings` · `encounters`)에서만 나온다. 환자가 스스로 적은 것으로 자격이 열리면 그건 자격 확인이 아니다. **`eligibility` 판정의 입력에 넣지 않는다.** 화면에도 그렇게 적혀 있다 — `이 기록으로는 비대면 재진 자격이 생기지 않습니다.`

**인덱스** — `self_reported_clinics_patient_idx` (`patient_id, last_visited_on desc`). `/care` 2구역의 정렬과 RLS 술어가 같은 색인을 쓴다.

**Realtime** — 발행하지 않는다. 본인만 보는 표이고 다른 사람에게 알릴 변경이 없다.

---

# 결정과 판정

## D-6 · 비공개 덧붙임 — 스키마가 무엇을 강제하고 무엇을 강제하지 않는가

D-6의 구조 강제 6항목 중 스키마가 받쳐야 하는 것은 넷이었다. **화면이 아니라 서버가 막는다**는 것이 요구였다.

| # | D-6 장치 | 어디가 막나 | 판정 |
| --- | --- | --- | --- |
| 1 | 환자가 먼저 말 걸어야 열린다 | `private_threads`에 의사용 INSERT 정책이 **없다.** 그리고 의사 회신 정책이 「환자 발화가 있을 때만」을 본다 | **RLS** |
| 2 | 답변한 의사에게만 열린다 | `private_threads` INSERT가 `answers`로 확인한다 | **RLS** |
| 3 | 왕복 횟수 상한 | **숫자는 서버에 없다.** 순서와 방향만 RLS가 강제하고, 횟수는 화면이 `privateThreadRules.ts`를 보고 막는다. 카운트는 `private_messages_thread_idx`가 싸게 받는다 | **나눠 가짐** ↓ |
| 4 | 매 회신에 고정 고지 | 컬럼 없음. 문구는 화면 상수다 — **저장하면 의사가 지울 수 있는 데이터가 된다** | 화면 |
| 5 | 경계 이탈 표현 필터 | 걸린 기록은 `expression_filter_hits`. **판정 자체는 브라우저에서 돈다** | **나눠 가짐** ↓ |
| 6 | 「진료가 필요합니다」 상시 노출 | 컬럼 없음. 누르면 `/doctors/:doctorId`로 갈 뿐 저장할 것이 없다 | 화면 |

**항목 3과 5는 서버가 끝까지 막지 못한다. 그것을 알고 이렇게 둔다.**

- **왜 못 막나** — 상한 3왕복과 금지 표현 목록은 **유권해석이 오면 움직이는 값**이다. `check (round <= 3)`을 걸거나 패턴을 표로 옮기면, 값이 바뀔 때마다 마이그레이션이 필요해진다. 그건 D-6이 「마이그레이션 없이 끄거나 넓힐 수 있어야 한다」고 못 박은 것과 정면으로 어긋난다
- **그래서 나눈다** — **움직이지 않는 것(누가·순서·방향)은 SQL이, 움직이는 것(횟수·길이·표현)은 규칙 파일이** 맡는다
- **남는 구멍** — 브라우저를 거치지 않고 API를 직접 부르면 4왕복째가 들어가고, 금지 표현이 그대로 저장된다. **§새로 찾은 것 R-6**으로 올린다. 실제로 닫으려면 서버(Edge Function 또는 트리거)가 필요하고, 그건 `50-nonfunctional.md`의 R-2·R-3과 같은 급의 일이다

---

## D-6이 뒤집힐 때 — 마이그레이션 없이 움직이는 것

D-6은 닫혔지만 **경계의 위치는 유권해석 대상이라 움직인다.** 「마이그레이션이 필요 없다」가 뜻하는 것은 이것이다 — **컬럼을 더하거나 타입을 바꾸거나 데이터를 옮기지 않고, 정책과 규칙 파일만으로 경계를 움직일 수 있다.**

| 뒤집히는 방향 | 무엇을 고치나 | 스키마 변경 | 저장된 것 |
| --- | --- | --- | --- |
| 왕복·길이 상한이 바뀐다 | `privateThreadRules.ts`의 `limits`와 `asOf` | 없음 | 그대로 |
| 금지 표현이 바뀐다 | 〃 `bannedPatterns` | 없음 | 그대로 |
| **기능을 끈다** | 규칙 파일에서 끄고, `private_threads`의 INSERT 정책을 `drop policy` | 없음 | **그대로 남는다.** 새 대화만 안 열린다 |
| **「답변한 의사에게만」을 넓힌다** | INSERT 정책의 `exists (answers…)` 절을 교체 | 없음 — `answer_id`가 이미 널 허용이다 | 그대로 |
| **비공개를 공개로 넓힌다** | `private_messages`의 SELECT 정책을 교체 | 없음 — 본문이 이미 행 단위로 있고 `visibility` 값에 기대지 않는다 | 그대로 |
| **실시간을 켠다** | publication에 표를 더한다 | 없음 | 그대로 |
| 아예 금지된다 | 파기한다 | 없음 | **지운다** — §보존과 파기 |

**「답변한 의사에게만」을 넓히는 경우를 실제로 돌려 확인했다.** 정책 하나를 교체하니 답변하지 않은 의사에게 `answer_id` 없이 대화가 열렸고, `answer_id`는 널 허용 그대로였다. `not null`로 박혀 있었으면 여기서 `alter column`이 필요했을 것이다.

---

## 민감정보 · 보존과 파기

비공개 대화는 **민감정보(개인정보보호법 제23조)**다. 보존 기간과 파기 정책을 함께 적는다.

| 대상 | 보존 | 파기 | 근거 |
| --- | --- | --- | --- |
| `private_messages.body` · `private_threads` | **마지막 발화로부터 6개월** | 사연 삭제 시 즉시(cascade). 그 밖에는 기간 경과 시 | **법령이 정한 기간이 아니다. 우리가 정한 값이다.** 환자가 그 답변을 근거로 진료까지 가는 시간을 넘기지 않는다. D-8의 「5회」처럼 근거 없이 정한 값이므로 재고 대상이다 |
| `expression_filter_hits` | **5년** | 기간 경과 시 | 의료법 제91조 위반의 공소시효(형사소송법 제249조)를 덮는다. 본문을 담지 않아 민감정보가 아니다 |
| `self_reported_clinics` | 본인이 지울 때까지 | 본인이 지운다(⚠︎ 되돌릴 수 없다). 계정 삭제 시 cascade | 환자 본인의 메모다 |
| `questions` · `answers` · `question_notes` | 사연이 살아 있는 동안 | 글쓴이가 사연을 지우면 전부 함께(cascade) | 화면 문구와 같다 — 「답변과 덧붙임도 함께 사라집니다」 |

**지금 자동 파기 장치가 없다.** 기간 경과 파기는 `pg_cron` 같은 스케줄러가 필요하고 이 데모에는 없다. **데모에 실제 환자 정보를 넣지 않는 것이 지금의 통제이고, 실제 사용자를 태우기 전에 닫아야 한다** — §새로 찾은 것 R-7.

**정보주체의 삭제 요구(제36조)에 화면 경로가 없다.** 비공개 대화에는 삭제 버튼이 없고 — 「보낸 발화는 취소할 수 없다」가 화면의 계약이다 — 사연 전체를 지우는 것만이 길이다. 그것으로 충분한지는 이 문서가 정할 수 없다. §열린 질문 Q-8.

---

## Q-6 · 재진의 두 출처 — **여기서 닫는다**

`/care` 2구역은 「내가 진료봤던 곳」을 두 출처로 보여 준다. **섞지 않고 섹션을 나눈다**(Q-4).

| 출처 | 어디서 오나 | 새 표가 필요한가 | 신뢰 등급 |
| --- | --- | --- | --- |
| **앱 내 이력** | `bookings` · `encounters` 조회 | **필요 없다.** 두 표에 `patient_id`·`clinic_id`·날짜가 이미 있다 | 검증됨 — `clinics`를 가리킨다 |
| **환자 직접 등록** | `self_reported_clinics` | **필요하다** | `self-reported` — 검증 안 됨 |

Q-6이 물은 것 넷에 대한 답이다.

| 질문 | 답 |
| --- | --- |
| `clinics`에 넣는가, 별도 표인가 | **별도 표.** `clinics`는 쓰기 정책이 없는 마스터이고 열람 범위가 정반대다 |
| 나중에 실제 `clinics` 레코드와 같은 곳으로 판명되면 어떻게 잇나 | **`linked_clinic_id` 컬럼 하나를 더하고 `trust`의 허용값에 `linked`를 더한다.** 데이터는 움직이지 않고 기존 행은 그대로다. **지금 만들지 않는다** — 읽는 화면이 없고, IA §3이 「자리만 남기고 화면은 만들지 않는다」고 정했으며, 「나중에 쓸 것 같아서」가 F-2를 만들었다 |
| 신뢰 등급을 컬럼으로 갖는가 | **갖는다.** `trust`. 값이 지금 하나뿐인 것이 지금의 진실이다 — 「전부 검증 안 됨」 |
| 다른 환자에게 보이지 않게 | **RLS로 강제한다.** SELECT·INSERT·DELETE 정책 셋 다 `patient_id = auth.uid()`다 |

**이어져도 재진 자격은 열리지 않는다.** 이어졌다는 것은 「같은 곳으로 보인다」이지 「그날 그곳에서 진료받았다」가 아니다.

---

## C-4 · 기록의 주체는 의료인이다 — **여기서 닫는다**

**요구** — 앰비언트 기록 초안은 의사가 확정하기 전에는 진료기록으로 저장하지 않는다. 임시 자료와 진료기록을 스키마에서 분리하고, 어느 쪽인지 구분되게 한다.

**지금 상태** — `encounters`가 둘을 섞고 있었다. 진행 상태(신청·수락·진료방)와 산출물(`keywords` · `prescription_draft` · `record_draft`)이 한 행에 있고 **어느 쪽인지 가르는 표시가 없었다.** 아무도 읽지 않아 드러나지 않았을 뿐이다.

**판정** — **산출물 컬럼을 뺀다.** 분리는 컬럼이 아니라 **표의 경계**로 한다.

| | 어디에 있나 | 왜 |
| --- | --- | --- |
| **임시 자료** — 전사 · 키워드 · 기록 초안 | **서버에 없다.** 기기 안에 있고 EMR 파일로 나간다(`domain/emrExport.ts`) | 화상 진료방 화면이 환자에게 「통화 내용을 서버에 저장하지 않는다」고 적어 두었다. **원칙 6 — 화면에 적은 것과 실제로 일어나는 일이 같아야 한다** |
| **진료기록** | **서버에 없다.** 의료기관의 EMR 안에서 의료인이 쓴다 | 진료기록부의 작성·보관 주체는 의료기관이다(제22·23조). MediVU는 의료기관이 아니다 |
| 진료 신청과 진행 상태 | `encounters` | 두 사람이 같은 방에 들어가려면 서버에 있어야 한다 |

**서버에는 한쪽만 있으므로 「어느 쪽인지」를 가르는 컬럼이 필요 없다.** 컬럼으로 구분하는 것보다 강한 분리다 — 없는 자리에는 잘못 들어갈 수 없다.

**이 판정이 뒤집히려면** — 진료 후 기록을 실제로 서버에 남기기로 정해야 하고, 그때는 세 가지가 함께 와야 한다. ① 화면 문구를 먼저 고친다(지금 문구로는 동의를 잘못 받은 것이 된다) ② `encounters`가 아닌 별도 표에 담는다 ③ **확정 여부를 컬럼으로 갖고, 확정은 의료인만 할 수 있게 RLS로 강제한다.** 셋 중 하나라도 없이 컬럼만 되살리면 지금과 같은 자리로 돌아온다.

---

## 규칙은 DB에 두지 않는다

법령·운영 기준이 바뀌면 `src/data/rules/*`만 고친다. 판정 코드도 스키마도 건드리지 않는다(원칙 7). **아래 값들은 스키마에 들어갈 후보였고 전부 들어가지 않았다.**

| 파라미터 | 어디 있나 | 스키마에 만들지 않은 컬럼 |
| --- | --- | --- |
| 재진 유효기간 6개월 | `eligibilityRules.params.revisitValidMonths` | `revisit_valid_months` |
| 초진 처방일수 7일 · 월 비대면 비율 상한 0.3 · 환자당 월 2회 · 초진 동일 지역 | 〃 | 없음 |
| 비공개 왕복 상한 3 | `privateThreadRules.limits.maxRounds` (신설 예정) | `max_rounds` · `check (round <= 3)` |
| 비공개 길이 상한 500·400자 | 〃 `patientMaxChars` · `doctorMaxChars` | `check (char_length(body) <= 500)` |
| 금지 표현 PT-1~PT-5 | 〃 `bannedPatterns` · `medicationRules` | `banned_patterns` 표 |
| 하루 답변 상한 5회 | `src/data/rules/*` (신설 예정) | `daily_answer_limit` · `answers_today` 카운터 |
| 문진 문항 · 증상 칩 · 응급 신호 · 주간 공감 기준 | `questionBank` · `symptomChips` · `triageRules` · `boardRules` | 없음 |
| 답변 문구 | `answerTemplates` | 없음 |

**예외처럼 보이는 것 하나** — `expression_filter_hits.rule_set_as_of`는 규칙 파라미터가 아니라 **지나간 판정이 어느 기준으로 이루어졌는지의 기록**이다. 규칙 파일이 바뀌어도 이 값은 바뀌면 안 된다. 방향이 반대다.

---

## Realtime 발행표

핸들러는 변경 종류를 보지 않고 **스냅샷 전체를 다시 읽는다**(`liveRepository.ts:259`) — 이 규모에서는 그게 더 단순하고 안전하다.

| 표 | 발행 | 구독 | 왜 |
| --- | --- | --- | --- |
| `questions` `answers` `empathies` `encounters` `question_notes` | 예 | `liveRepository.ts` | 여럿이 같이 보는 것이 목적이다 |
| `profiles` | **예 (006)** | 〃 | 구독은 있는데 발행이 없었다 — F-4 |
| `bookings` | **예 (006)** | 〃 | 〃 (F-4가 적지 않았던 두 번째 표) |
| `clinics` | 아니오 | 없음 | 마스터 데이터. 세션 중에 바뀌지 않는다 |
| `private_threads` `private_messages` | **아니오** | 없음 | 민감정보. 발행 설정과 RLS가 어긋나면 새는 방향이 최악이다. 그리고 3왕복 비동기 문답은 채팅이 아니다 |
| `expression_filter_hits` `self_reported_clinics` | **아니오** | 없음 | 읽는 화면이 없거나(로그) 본인만 보는 표다 |

**발행은 RLS를 대신하지 않는다.** `postgres_changes`는 구독자 권한으로 정책을 다시 본다. 그래서 `bookings`를 발행해도 남의 예약은 오지 않는다. 같은 이유로 **새 표를 발행할 때는 그 표의 SELECT 정책이 먼저 맞아야 한다.**

---

## 서버에 두지 않는 것

`localStore.ts`가 기기 안에만 남기는 값들이다. **서버로 올리지 않는다.**

- 비대면 사전 확인 답 (`TelemedicinePrecheck`)
- 주소·지역 설정
- 화상 통화의 전사·키워드·기록 초안 (§C-4)

사는 지역과 질환 예외는 사람에 관한 값이고, 이 데모의 데이터베이스는 해외 리전이며 의료정보를 다룰 접근통제가 없다. 새로고침 한 번에 준비가 통째로 풀리지 않게 하는 선까지만 남긴다.

---

# 결함 판정

## 이전 판이 열어 둔 것 — F-1 ~ F-5

| ID | 무엇 | 판정 | 어디서 닫히나 |
| --- | --- | --- | --- |
| **F-1** | `bookings.document_types` 타입 갈림 | **닫힘** — 정본은 `text[]` | `migration-006.sql` §1 |
| **F-2** | `encounters` 미사용 컬럼 5개 | **닫힘** — 다섯 다 지운다 | 〃 §2 |
| **F-3** | `Encounter` 타입이 정의만 되고 안 쓰임 | **닫힘** — 지운다. 코드 삭제는 M1-A | 〃 §2 (서버 쪽) |
| **F-4** | `profiles`를 구독하는데 발행하지 않음 | **닫힘** — 발행한다. **`bookings`도 같은 상태였다** | 〃 §6 |
| **F-5** | `answerTemplates.ts`에만 `asOf`가 없다 | **닫힘** — 붙였다 | `src/data/rules/answerTemplates.ts` |

### F-1 · `bookings.document_types` — 정본은 `text[]`

**실제 타입을 확인하려 했으나 배포된 프로젝트에 닿지 못했다.** 이 세션의 네트워크 정책이 해당 호스트를 막는다. 그래서 SQL과 코드에서 판정했고, **그편이 오히려 정본이다** — 이 결함의 피해자는 「새 사람이 DB를 세울 때」이지 이미 도는 프로젝트가 아니기 때문이다.

| 파일 | 정의 |
| --- | --- |
| `schema.sql` | **컬럼이 없다** |
| `migration-002.sql:53` | `text[] not null default '{}'` |
| `migration-003.sql:12` | `text[] not null default '{}'` (002의 컬럼을 다시 적은 것) |
| `migration-005.sql:10` | `jsonb not null default '[]'::jsonb` |

셋 다 `add column if not exists`라 **먼저 돈 쪽이 이긴다.**

**정본을 `text[]`로 정한 이유** — 코드가 그것을 기대한다. `liveMappers.ts:67`의 `document_types: string[]`, `types.ts:410`의 `documentTypes: DocumentType[]`. 그리고 002·003 둘이 `text[]`이고 005만 `jsonb`다. 005의 주석은 「테이블에 둘 곳이 없어」라고 적고 있는데, 그 말이 참인 것은 **002도 003도 안 돈 프로젝트뿐**이다. 005는 002·003이 이미 그 컬럼을 만든 것을 못 보고 쓰였다.

**밟는 자리는 세 갈래고 006이 셋을 모은다.**

| 어떻게 세웠나 | 지금 타입 | 증상 | 006이 하는 일 |
| --- | --- | --- | --- |
| `schema.sql`만 | **컬럼 없음** | 서류 요청이 아무 오류 없이 사라진다. **005가 고치려던 바로 그 증상** | `text[]`로 만든다 |
| `schema` + `005`만 | `jsonb` | 매퍼가 기대하는 모양과 다르다 | 값을 보존하며 `text[]`로 바꾼다 |
| `schema` + `002`(또는 003) | `text[]` | 정상. 005는 아무 일도 하지 않았다 | 아무것도 하지 않는다 |

**세 갈래를 실제로 돌려 확인했다** — 셋 다 `text[] not null default '{}'`로 모였고, `jsonb`에 들어 있던 `["confirmation","receipt"]`는 `{confirmation,receipt}`로 그대로 옮겨졌다. 006을 두 번 돌려도 같았다.

**기존 마이그레이션은 지우지도 고치지도 않았다.** 이미 적용된 것들이라 지우면 이력이 끊긴다. 대신 006이 어느 경로로 왔든 같은 자리로 모은다.

### F-2 · `encounters` 미사용 컬럼 5개 — **지운다**

`scheduled_at` · `room_url` · `keywords` · `prescription_draft` · `record_draft`. `src/` 전체에서 참조가 **0회**고, 전부 기본값 그대로다.

| 컬럼 | 왜 살리지 않나 |
| --- | --- |
| `room_url` | `encounters.id`가 그대로 방 주소다. 「Edge Function이 채운다」는 주석이 있으나 그런 함수는 없다. **방 주소가 두 개면 두 사람이 서로 다른 방에 들어가는 길이 생긴다** |
| `keywords` · `prescription_draft` · `record_draft` | 화상 진료방 화면이 「통화 내용을 서버에 저장하지 않는다」고 환자에게 적어 두었다. **담을 자리를 서버에 두면 그 문장이 거짓이 된다**(원칙 6). 그리고 처방 초안을 의료기관이 아닌 우리가 들고 있는 것은 C-4다 |
| `scheduled_at` | 비대면 진료에 시간을 고르는 화면이 **어디에도 없다.** 시간을 고르는 것은 대면 예약뿐이고, 비대면의 흐름은 신청 → 의사 확인 → 방 열림이다 |

**이 삭제가 006에서 유일하게 되돌릴 수 없는 부분이다.** 다섯 컬럼 전부 참조 0회에 기본값뿐이므로 잃을 데이터가 없지만, 적용 전에 §C-4를 읽고 결정한다.

### F-3 · `Encounter` 타입 — **지운다**

`types.ts:457`의 `Encounter`(`transcript` `orders` `soapDraft` `eligibility`)와 같이 있는 `EncounterStatus`(`booked`|`in-progress`|`completed`)는 **어디서도 import되지 않는다.** `EncounterStatus`는 서버 enum과 값도 다르다. 실제로 쓰는 것은 `EncounterRequest` / `EncounterRequestStatus`다.

이전 판은 「회의록이 요구한 진료 후 기록 초안을 구현하려면 이쪽을 살리는 방향」이라고 열어 두었다. **살리지 않는다** — §C-4가 그 방향을 닫았다. 진료 후 기록은 서버가 아니라 EMR로 가고, 그 경로는 `emrExport`가 이미 갖고 있다.

**코드에서 지우는 것은 이 문서의 범위 밖이다** — M1-A의 일이다(`60-roadmap.md`). 서버 쪽 짝은 006 §2가 지운다. 함께 지울 것: `Encounter` · `EncounterStatus` · `TranscriptLine` · `PrescriptionOrder`(`Encounter.orders`에만 쓰인다).

### F-4 · 구독하는데 발행하지 않던 표 — **발행한다**

`liveRepository.ts`의 `subscribeToChanges`는 표 **일곱**을 구독하는데 publication에는 **다섯**만 있었다. 빠진 것은 `profiles`와 **`bookings`** 둘이다 — **이전 판은 `profiles`만 적었다.**

지우지 않고 발행하는 쪽을 골랐다. 구독을 지우는 것은 코드 수정이고, 무엇보다 둘 다 실제로 필요하다 — 의사가 프로필을 고치면 환자 화면의 이름이 바뀌어야 하고, 예약 요청은 `/doctor/inbox`에 바로 떠야 한다. 둘 다 이미 RLS가 걸려 있어 발행이 곧 유출이 아니다.

### F-5 · `answerTemplates.ts`의 `asOf` — **붙였다**

나머지 규칙셋 일곱은 전부 `asOf`를 단다. `answerTemplateRuleSet`(`name` · `source` · `asOf: '2026-08-27'` · `templates`)을 더하고 `templatesFor`가 그것을 읽게 했다. **기존 `answerTemplates` 내보내기는 그대로 두었다** — 쓰는 쪽을 고치지 않는다.

> 이 하나만 `src/`를 건드렸다. 데이터 파일이고 더하기만 했으며, 타입 검사와 테스트 257개를 다시 돌려 확인했다.

## 이번에 새로 찾은 것

| ID | 무엇 | 무게 | 어디로 |
| --- | --- | --- | --- |
| **F-7** | `profiles.created_at`과 `bookings.created_at`을 아무 화면도 읽지 않는다 | 경미 | 아래 |
| **F-8** | **`migration-002.sql`을 두 번 돌리면 실패한다** | **새 사람이 밟는다** | 아래 |
| **F-9** | `questions.prior_clinic_id`에 외래키가 없다 | 경미 | 아래 |
| **R-6** | 왕복 상한과 표현 필터를 서버가 강제하지 못한다 | **실제 사용자 전** | `50-nonfunctional.md` |
| **R-7** | 민감정보 자동 파기 장치가 없다 | **실제 사용자 전** | 〃 |

### F-7 · 읽는 화면이 없는 `created_at` 둘

`profiles.created_at`은 조회 컬럼 목록(`liveRepository.ts:62`)에도 없어서 아예 내려오지 않는다. `bookings.created_at`은 `BookingRequest.requestedAt`으로 매핑되지만 어느 화면도 그리지 않는다.

**지우지 않는다.** 행이 언제 생겼는지는 파기 기준일과 장애 추적의 출발점이고, `created_at`이 없는 표는 「언제부터 잘못됐나」에 답할 수 없다. **F-2와 다른 점은 이것이 화면용 컬럼이 아니라는 것**이다 — 화면이 아니라 운영이 읽는다.

### F-8 · `migration-002.sql`은 다시 붙여넣을 수 없다

`create table question_notes` · `create index question_notes_question_idx` · `create policy …` · `alter publication … add table question_notes` 넷 다 **`if not exists`도 `drop … if exists`도 없다.** 002를 이미 돌린 프로젝트에 다시 붙여넣으면 첫 `create table`에서 멈춘다.

이 문서와 `schema.sql`이 「여러 번 실행해도 같은 결과」를 원칙으로 내걸고 있는데 002가 그것을 지키지 않는다. **어디까지 적용됐는지 헷갈릴 때 처음부터 다시 붙여넣는 것이 이 저장소의 복구 절차인데, 그 절차가 002에서 멈춘다.**

**고치지 않았다** — 「기존 마이그레이션을 수정하지 않는다」가 이 작업의 전제다. **그러나 M0의 F-1 항목 옆에 함께 적어야 한다**(`60-roadmap.md`). 고치는 방법은 두 가지다. ① 002에 `if not exists`·`drop policy if exists`를 더한다(전제를 깨는 대신 원칙을 회복한다) ② 007을 새로 만들어 `question_notes`를 멱등하게 다시 선언한다. **둘 중 어느 쪽인지는 저장소 소유자가 정한다.**

### F-9 · `questions.prior_clinic_id`에 외래키가 없다

`profiles.clinic_id`에는 migration-004가 `profiles_clinic_fk`를 걸었는데 이쪽에는 없다. 지금은 `/ask`가 `demoClinics` 목록에서 고르게 하므로 값이 어긋나지 않는다. **그러나 어긋나면 조용히 아무에게도 안 보이는 사연이 된다** — `prior-clinic-only` 판정이 거짓이 될 뿐 오류가 나지 않는다.

**006에 넣지 않았다.** 라이브 프로젝트에 이미 `clinics`에 없는 값이 들어 있으면 제약 추가가 실패하고, 그러면 006 전체가 멈춘다. 화면이 목록에서 고르게 하는 한 급하지 않다. 넣을 때는 `not valid`로 붙이고 기존 행을 확인한 뒤 `validate constraint`한다.

---

## 열린 질문 — 이 문서가 정할 수 없는 것

| ID | 질문 | 누가 정하나 |
| --- | --- | --- |
| **Q-7** | **비공개 회신이 도착한 것을 환자에게 어디서 알리나.** `/news`는 지금 「내 사연」과 「새 답변」만 다루고 비공개 회신은 없다. 그리고 실시간을 끄기로 했으므로 화면을 다시 열기 전에는 모른다 | `30-feature-spec.md` (`/news`) |
| **Q-8** | **정보주체의 삭제 요구(개인정보보호법 제36조)에 화면 경로가 필요한가.** 지금은 사연 전체를 지우는 것만이 길이다 | `50-nonfunctional.md` · 법률 검토 |
| **Q-9** | 의사 쪽에서 「회신을 기다리는 대화」 목록이 필요한가. 지금은 의사가 사연 상세로 들어가야만 대화를 본다 | `30-feature-spec.md` (`/doctor/*`) |

셋 다 **스키마를 막지 않는다.** Q-7·Q-9는 표를 바꾸지 않고 화면만 움직이고, Q-8은 정책 하나를 더하는 일이다.

---

## 스키마를 고칠 때

1. `supabase/schema.sql`은 **처음부터 다시 붙여넣을 수 있는 상태**를 유지한다(`if not exists`, `drop policy if exists`). **마이그레이션도 마찬가지다** — 002가 그 반례다(F-8)
2. 이미 배포된 프로젝트를 위해 `migration-00N.sql`을 따로 추가한다. **같은 컬럼을 두 마이그레이션에서 다른 타입으로 만들지 않는다**(F-1이 그 사례다)
3. 열람 범위를 바꿨다면 `src/domain/visibility.ts`와 SQL 정책을 **함께** 고친다. 어느 한쪽만 고치면 화면과 서버의 판정이 갈라진다
4. 타입은 `src/domain/types.ts` → 행 타입은 `src/data/liveMappers.ts` → 조회 컬럼 목록은 `liveRepository.ts`. **셋 중 하나만 빠뜨려도 조회 전체가 실패한다**(migration-003이 그 사례다)
5. **정책 안에서 안쪽 열 이름을 반드시 표 이름으로 붙여 쓴다.** `a.doctor_id = doctor_id`라고 적으면 `answers`에도 `doctor_id`가 있어서 안쪽 것끼리 비교되고 **정책이 항상 참이 된다.** 006을 쓰다가 실제로 밟았고, 답변하지 않은 의사에게 비공개 대화가 열렸다. **정책은 눈으로 읽어서는 검증되지 않는다 — 돌려 봐야 한다**
6. **정책 안에서 자기 표를 세지 않는다.** `infinite recursion detected in policy`로 막힌다. 소유자 권한 함수(`security definer`)로 빼되, **그 함수가 스스로 「부르는 사람이 당사자인가」를 먼저 봐야 한다** — 안 그러면 그 함수가 새 유출 경로다
7. 새 표를 Realtime에 발행하기 전에 그 표의 SELECT 정책을 먼저 확인한다

---

## 이 문서를 갱신하는 때

- `supabase/*.sql`이 바뀌었을 때 — **바꾼 사람이 여기 표를 함께 고친다**
- 화면이 새 컬럼을 요구할 때 — **읽는 화면을 적을 수 없으면 그 컬럼은 만들지 않는다**
- F-* 또는 R-*이 해결됐을 때 — **해결한 사람이 여기서 지운다**
- D-6의 유권해석 회신이 왔을 때 — §D-6이 뒤집힐 때의 표를 따라 움직인다
- 보존 기간을 실제로 재거나 법률 검토를 받았을 때 — §보존과 파기의 숫자를 그 사람이 고친다

## 관련 문서

- `05-decisions.md` — D-6 · C-3 · C-4 · C-5의 정본
- `15-information-architecture.md` — Q-4(재진 두 출처) · Q-6이 여기로 넘어온 자리
- `30-feature-spec.md` — Q-5(3왕복 · 500/400자 · PT-1~PT-5)와 각 화면이 읽는 것
- `50-nonfunctional.md` — R-1~R-5, 그리고 이 문서가 올린 R-6 · R-7
- `60-roadmap.md` — M0의 F-1, M1-A의 F-2 · F-3 · F-6
- `supabase/migration-006.sql` — 이 문서의 스키마 초안
