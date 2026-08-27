# I0 · 기반 정리 (M0)

새 세션에 이 파일을 통째로 주고 실행시킨다. **여기부터는 문서가 아니라 코드다.**

> **읽는 순서** — `docs/product/60-roadmap.md` §M0 · `docs/product/40-data-model.md` §F-1~F-8 · `supabase/migration-006.sql`

---

## 이 세션이 끝나면

M1이 시작될 수 있다. **지금은 M0-5가 G-3·G-5·G-8을 막고 있다** — 쓸 표가 없다.

## 할 일 — 순서대로

### 1. M0-2 · 미커밋 팔레트 변경을 커밋한다

작업트리에 네이비→청록 변경이 5파일 남아 있다: `README.md` · `index.html` · `src/components/ClinicMap.tsx` · `src/components/DoctorPortrait.tsx` · `src/components/RegionMap.tsx` · `src/styles.css`.

**이 변경이 미완성이라는 것이 I-2·I-3이다** — `vite.config.ts:17`은 네이비 `#0b2944`, `index.html:6`은 청록 `#0d2b29`다. **여기서 색을 통일하지 마라.** 그건 I-3이고 M1-B의 몫이다. **지금은 있는 그대로 커밋해서 무엇이 작업 중인지 기록에 남기는 것이 목적이다.**

커밋 전에 `npm run test:run`이 통과하는지 본다.

### 2. M0-4 · 커밋 규칙을 적는다

`docs/product/60-roadmap.md` §최종 검토를 남에게 맡긴다 에 있는 네 줄이 규칙이다. **새로 만들지 말고 그것을 `CONTRIBUTING.md`로 옮긴다.** 짧게.

### 3. M0-7 · `migration-002.sql`을 멱등하게 고친다

`60-roadmap.md` §M0-7이 **①(002를 고친다)** 로 판단했고 근거 넷이 적혀 있다. 그대로 실행한다.

고칠 것 — `create table` → `create table if not exists` · `create index` → `create index if not exists` · `create policy` 앞에 같은 이름의 `drop policy if exists` · `alter publication`을 `do $$ … exception when duplicate_object then null; end $$`로 감싼다.

**모양을 바꾸지 마라.** 컬럼·타입·정책 의미는 한 글자도 건드리지 않는다. `schema.sql`이 이미 이 모양이니 **거기서 문법을 베낀다.**

### 4. M0-5 · `migration-006.sql` 적용 — **사람이 한다**

**당신이 실행하지 않는다.** Supabase 접속 정보가 없고, 006 §2는 **되돌릴 수 없는 컬럼 삭제**를 포함한다.

대신 **적용 순서와 확인 항목을 짧은 체크리스트로 만들어 사용자에게 준다.**

- 어느 순서로 붙여넣는지 (`schema.sql → 002 → 003 → 004 → 005 → 006`)
- 006 §2 실행 전에 `40-data-model.md`의 F-2 판정을 읽으라는 것
- 적용 뒤 확인할 것: 새 표 4개(`private_threads` · `private_messages` · `expression_filter_hits` · `self_reported_clinics`)와 `bookings.document_types`가 `text[]`인지
- **고친 002를 빈 프로젝트에 두 번 붙여넣어 같은 결과가 나오는지** — M0-7의 검증

## 하지 말 것

- 화면을 고치지 마라. G-* 는 전부 M1이다
- 색을 통일하지 마라 (I-2·I-3은 M1-B)
- `styles.css`를 분할하지 마라 — M0-3은 없어졌다
- 기존 마이그레이션의 **모양**을 바꾸지 마라. 멱등화만 예외다 (`60-roadmap.md` §M0-7의 표)
- Supabase에 무엇도 적용하지 마라

## 끝났다고 판단하는 기준

1. `git status`에 미커밋 변경이 없다 (`docs/시장분석/` 제외)
2. `CONTRIBUTING.md`가 있고 네 줄 규칙이 담겨 있다
3. `migration-002.sql`의 다섯 문장이 전부 멱등하다
4. `npm run test:run` 통과 · CI 초록불
5. 006 적용 체크리스트를 사용자에게 전달했다
6. **`supabase`에 아무것도 적용하지 않았다**
