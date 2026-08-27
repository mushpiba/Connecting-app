# MediVU Community

MediVU Community는 환자가 자기 말로 적은 증상을 진료과 후보로 정리해 의사에게 보내고, 그 답변을 대면 예약 또는 비대면 진료까지 잇는 설치형 웹앱(PWA)입니다.

**이 프로젝트의 모든 환자·의사·의료기관·질문·답변 데이터는 가상 시연값입니다. 실제 의료기기, 진단, 처방, 예약 시스템이 아니며 실제 환자정보를 입력하면 안 됩니다.**

제품 정의와 기능 명세는 [`docs/product/`](docs/product/)에 있습니다. 새로 합류했다면 [`docs/product/00-product-definition.md`](docs/product/00-product-definition.md)부터 읽으세요.

## 데모 보기

<https://skycastle0616.github.io/medi-commu/>

## 핵심 흐름

1. 홈에서 `증상 적어보기`를 눌러 3단계 문진 양식을 채웁니다. 증상, 진료 이력, 공개 범위 순입니다.
2. 적은 내용을 진료과 후보와 응급 신호로 정리해 보여줍니다. 진단명과 확률은 만들지 않습니다.
3. 사연에 올리면 공개 범위에 따라 보이는 의사가 달라지고, 답변은 내소식에 모입니다.
4. 홈의 `expert`에서 데모 의사 화면에 들어가 계정을 바꾸면 같은 사연이 다르게 보입니다.
5. 답변자 프로필에서 병원·자기소개·진료 방법을 보고 대면 예약 또는 비대면 진료 신청으로 이어갑니다.
6. 비대면 진료를 신청하면 의사가 열었을 때 두 사람이 같은 1:1 화상 진료방으로 들어갑니다. 통화 중 오간 말은 실시간 전사되고, 키워드와 기록 초안은 의사에게만 보입니다.
7. 사연은 최신순으로 쌓이고, 한 주 동안 공감이 많이 모인 글은 HOT 탭에서 따로 모아 봅니다.

모바일에서는 전체 화면 앱으로 동작합니다. 768px 이상에서는 상단의 `웹 보기 · 앱 미리보기`로 좌측 레일 웹 레이아웃과 520px 앱 프레임을 전환할 수 있습니다.

## 로컬 실행

Node.js 24와 npm을 권장합니다.

```powershell
npm.cmd install
npm.cmd run dev
```

`VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 없으면 인메모리 픽스처로 도는 데모 모드가 됩니다. 서버를 붙이는 절차는 [`docs/backend-setup.md`](docs/backend-setup.md)에 있습니다. 테스트는 항상 데모 모드에서 돌며 네트워크를 타지 않습니다.

### 검증

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run preview
```

## 구조

- `src/domain`: 순수 판정 함수. React·라우터·픽스처를 import 하지 않고, 무인자 `Date.now()`를 두지 않습니다.
- `src/data/rules`: 법령과 운영 기준 수치. 전부 `asOf`를 답니다.
- `src/data`: 가상 픽스처, Supabase 클라이언트, 라이브 저장소, 분류기 전송 계층
- `src/state`: 앱 상태 컨텍스트. 데모 모드에서는 인메모리 리듀서, 라이브 모드에서는 Supabase를 읽고 씁니다. 사전 확인과 주소만 `localStore`로 기기 안에 남기고 서버로 보내지 않습니다.
- `src/features`: 화면 하나당 파일 하나 (`patient` · `doctor` · `consult`)
- `supabase`: 스키마, 마이그레이션, 시드, Edge Function
- `docs/product`: 제품 정의와 기능 명세 (계속 갱신)
- `docs/superpowers`: 승인된 구현 계획과 설계 결정 기록 (슬라이스별 스냅샷)

주요 환자 경로는 `#/home`, `#/stories`, `#/ask`, `#/news`, `#/me`이며 기존 `#/board`는 `#/stories`로 이동합니다. 비대면 사전 확인은 `#/me/precheck`, 의사 데모 진입은 `#/expert`, 화상 진료방은 `#/visit/:roomId`입니다.

### 도메인 함수

| 모듈 | 하는 일 |
| --- | --- |
| `triage` | 증상 문장에서 진료과 후보와 응급 신호를 뽑습니다. 선두 점수의 절반 초과만 남깁니다. |
| `intake` | 문진 양식을 분류용 문장으로 펼칩니다. 부위 체크박스는 진료과 키워드로만 확장하고 응급 신호 키워드는 넣지 않습니다. |
| `classifier` | `triage`를 `SymptomClassifier` 인터페이스 뒤에 둡니다. LLM 분류기가 여기로 들어갑니다. |
| `eligibility` | 비대면 진료 대상 여부를 8개 체크로 예비 확인합니다. 재진·초진 두 경로가 있습니다. |
| `telemedicine` | 신청 버튼의 활성 여부와 막힌 사유를 정합니다. |
| `routing` | 질문을 어느 의사에게 보여줄지 정합니다. 과금·광고 인자를 받지 않고 정렬도 하지 않습니다. |
| `visibility` | 공개 범위 세 단계를 판정합니다. 글이 보이는가와 글 안의 진료 이력 줄이 보이는가는 다른 판정입니다. |
| `board` | 주간 공감을 집계해 HOT 대상을 정합니다. 기준일은 항상 인자입니다. |
| `medication` | 성분별 비대면 처방 제한을 판정합니다. |
| `notice` | 막혔을 때 환자 안내문과 진료기록용 문구 초안을 만듭니다. |
| `doctorFeed` | 의사에게 보일 사연을 고르고 왜 걸렸는지(진료과·키워드)를 함께 답니다. |
| `clinicHours` | 요일별 진료시간을 해석합니다. |
| `clinicFinder` | 지역·비대면 가능 여부로 가까운 의료기관을 추립니다. |
| `booking` | 예약 가능한 날과 시간대를 셉니다. 오늘은 이미 지난 시간을 뺍니다. |
| `documents` | 진료 후 발급받을 서류 종류와 용도를 정리합니다. |
| `carePrep` | 비대면 준비가 어디까지 됐는지 낱개로 셉니다. |
| `encounterTrack` | 진료 신청이 어느 단계까지 왔는지 단계별로 표시합니다. |
| `consultation` | 통화 전사에서 키워드를 뽑습니다. 사연 분류와 같은 규칙셋을 씁니다. |
| `emrExport` | 진료 기록을 EMR 모양으로 내보냅니다. 진단명과 처방은 만들지 않습니다. |
| `types` | 도메인 타입 정의 |

### 규칙셋

| 규칙셋 | 파일 | 기준일 |
| --- | --- | --- |
| 진료과 분류 시연 규칙 | `src/data/rules/triageRules.ts` | 2026-08-09 |
| 비대면 진료 대상자 판정 시연 규칙셋 | `src/data/rules/eligibilityRules.ts` | 2026-08-09 |
| 비대면 처방제한 의약품 (시연용 발췌) | `src/data/rules/medicationRules.ts` | 2026-08-09 |
| 문진 부위 확장 시연 규칙 | `src/data/rules/intakeRules.ts` | 2026-08-09 |
| 주간 공감 정렬 시연 규칙 | `src/data/rules/boardRules.ts` | 2026-08-09 |
| 문진 질문 은행 | `src/data/rules/questionBank.ts` | 2026-08-12 |
| 증상 칩 | `src/data/rules/symptomChips.ts` | 2026-08-12 |
| 답변 문구 | `src/data/rules/answerTemplates.ts` | — |

법령이 바뀌면 이 파일들만 고칩니다. 판정 코드는 건드리지 않습니다.

## 서버

Supabase를 씁니다. 익명 인증, 8개 테이블(`profiles` `clinics` `questions` `answers` `empathies` `bookings` `encounters` `question_notes`), 전 테이블 RLS, Realtime 구독, Edge Function `classify-symptoms` 1개입니다. 공개 범위 판정은 화면과 SQL 양쪽에 있습니다. 스키마는 `supabase/schema.sql`과 `migration-002~005.sql`, 자세한 대응표는 [`docs/product/40-data-model.md`](docs/product/40-data-model.md)에 있습니다.

증상 분류는 Edge Function이 모델을 부르고, 4초 안에 응답이 없으면 키워드 규칙으로 되돌아갑니다. 모델 API 키는 Supabase 비밀값으로만 두고 브라우저에 내려보내지 않습니다.

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 테스트와 빌드를 수행한 뒤 `dist`를 GitHub Pages에 게시합니다. 저장소의 **Settings → Pages → Source**가 **GitHub Actions**로 설정돼 있어야 합니다.

`vite.config.ts`의 `base`가 `/medi-commu/`로 고정돼 있습니다. 다른 이름의 저장소에서 배포하면 경로가 어긋납니다.

## 범위 밖

- **진단명, 질병 확률, 중증도 지수.** 출력은 진료과 후보와 응급 안내까지입니다.
- **실제 본인확인과 의사 면허 검증.** 지금은 화면에서 의사 역할로 전환할 수 있습니다. 실제 검증이 붙기 전까지 이것은 데모 지름길이며 가장 먼저 되돌릴 항목입니다.
- **실제 예약 성사, 결제, 처방전 전송.**
- **의료정보 보관.** 데이터베이스는 해외 리전이고 의료정보를 다룰 접근통제가 없습니다. 사는 지역과 질환 예외 같은 값은 서버로 보내지 않고 기기 안에만 둡니다.
- **실서비스용 음성 전사.** 브라우저 내장 음성인식은 음성을 브라우저 제조사 서버로 보냅니다. 실제 환자 대화에는 쓸 수 없고, 기기 안에서 도는 모델로 바꿔야 종단간 암호화가 성립합니다.
- **중계 서버(TURN).** 없기 때문에 대칭 NAT 뒤에서는 화상 연결이 되지 않습니다.

## 관련 프로토타입

- [MediVU-EMR](https://github.com/mushpiba/MediVU-EMR) — Ambient AI 진료 기록과 진단 보조
- [MediVU-mobile](https://github.com/mushpiba/MediVU-mobile) — 비대면 재진 진료 흐름
