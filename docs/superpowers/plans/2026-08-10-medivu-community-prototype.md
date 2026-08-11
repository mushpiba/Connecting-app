# MediVU Community Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Publish a static React demo of a Korean "전문가 지식iN for medicine" — a structured symptom question is triaged to 진료과, routed to doctors under a patient-chosen visibility level, answered with the doctor's profile attached, and converted into an attempt at 초진 대면 or 비대면 진료.

**Architecture:** A Vite SPA holds every interaction in memory. `src/domain/` stays pure and framework-free — triage, eligibility, routing, visibility, weekly-HOT ranking, and the telemedicine gate are all functions of their arguments. `src/data/rules/*` holds every tunable with an `asOf`. Screens render domain output and never compute a judgement.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, react-router-dom `HashRouter`, vite-plugin-pwa, CSS, GitHub Actions, GitHub Pages

## Global Constraints

- 가상 데이터와 결정적 로컬 픽스처만 쓴다. 실존 의료인·의료기관 이름을 쓰지 않는다.
- AI·인증·DB·결제 API를 호출하지 않는다.
- 브라우저 저장소에는 온보딩을 봤는지 같은 화면 표시용 플래그만 둔다. 증상·질문·답변·주소·
  결제수단 등 사람에 관한 값은 절대 넣지 않는다. 서버가 없는 데모라 저장소에 남는 값은
  지울 주체도 없다.
- `src/domain/`은 React·라우터·픽스처를 import 하지 않는다.
- `src/domain/`과 `src/data/` 어디에도 무인자 `Date.now()`/`new Date()`를 두지 않는다. 기준일은 항상 인자다.
- 진단명·질병 확률·중증도 지수를 만들지 않는다. 출력은 진료과 후보와 응급 안내까지다.
- 모든 수치·기준은 `src/data/rules/*`에 `asOf`와 함께 둔다.
- 비제출 버튼에 `type="button"`, 폼은 `onSubmit` + `preventDefault()`, 유니코드 글리프는 항상 `aria-hidden="true"`, 아이콘 라이브러리 금지.
- 라이트 테마 단일. `src/styles.css` 하나. CSS 모듈·Tailwind 금지. 파일 끝은 `@media (prefers-reduced-motion: reduce)`.
- 기본 내보내기·`React.FC` 금지. 명명 내보내기와 `export function Name(...)`만.
- 의존성은 `^` 없이 정확히 고정.

## Tasks

- [ ] 저장소 이름 정리(qna→community), PWA 설정, 계획 문서, `git init`.
- [ ] B2: `TriageRuleSet`에 상대 임계값을 넣고 `triage()`가 선두 점수의 절반 이하 후보를 버리게 한다.
- [ ] A2: `revisit-record`를 차단 게이트에서 경로 선택자로 바꿔 초진 경로를 연다.
- [ ] 앱 셸(HashRouter·전역 스타일·헤더·하단 내비), PWA 등록, `CommunityContext` 리듀서.
- [ ] 도메인 신규 모듈: intake·classifier·visibility·board·telemedicine과 각 단위 테스트.
- [ ] 픽스처와 화면 8개, 흐름 테스트 4종.
- [ ] 스타일·접근성 마감, CI 워크플로, README, 최종 검증과 배포.

## Public Interfaces

- `type PostVisibility = 'public' | 'specialty-only' | 'prior-clinic-only'`
- `type BodyArea = 'ent' | 'eye' | 'skin' | 'digestive' | 'musculoskeletal' | 'mind' | 'urinary' | 'womens' | 'child' | 'general' | 'unsure'`
- `interface SymptomClassifier { readonly id: string; readonly asOf: string; classify(input: ClassifierInput): Promise<TriageResult> }`
- `createRuleClassifier(triageRules: TriageRuleSet, intakeRules: IntakeRuleSet): SymptomClassifier`
- `buildTriageText(form: IntakeForm, ruleSet: IntakeRuleSet): string`
- `canDoctorSeeQuestion(doctor: Doctor, question: Question): boolean`
- `listVisibleQuestions(doctor: Doctor, questions: Question[]): Question[]`
- `suggestedSpecialties(question: Question): Set<Specialty>`
- `rankWeeklyHot(questions, empathies, ruleSet: BoardRuleSet, weekEndingOn: string): WeeklyRank[]`
- `orderBoard(questions: Question[], ranks: WeeklyRank[]): Question[]`
- `toggleEmpathy(empathies, questionId, patientId, at): Empathy[]`
- `evaluateTelemedicineGate(precheck, question, clinic, ruleSet, today): TelemedicineGate`
- Hash 화면: `#/home` `#/ask` `#/board` `#/questions/:questionId` `#/doctors/:doctorId` `#/me` `#/doctor/inbox` `#/doctor/questions/:questionId`

## Verification

- 단위 테스트가 다음을 덮는다: triage 임계값 경계, eligibility 8개 체크의 순서와 3-상태 결과, 초진/재진 경로 분기, visibility 3단계와 진료 이력 줄 비대칭, 주간 창 경계 양쪽, HOT 상한·최소치·동점 처리, 공감 토글, 게이트 사유가 항상 첫 실패 체크에서 온다는 것.
- 흐름 테스트가 다음을 덮는다: 홈→작성→분류 결과→게시, 게시판 HOT 고정과 공감, 의사 뷰의 가시성 차이와 답변 등록, 의사 프로필에서의 신청 시도(활성·비활성 양쪽).
- `npm run test:run`과 `npm run build`가 애플리케이션 기인 경고 없이 종료한다.
- `npm run preview`로 360px·768px·1280px, 키보드 전용 조작, 축소 모션을 수동 확인한다.

## 설계 결정 기록

### A2 — `revisit-record`는 경로 선택자다

이전 구현은 재진 기록이 없으면 `revisit-record`를 `'failed'`로 찍었고, 실패가 하나라도 있으면 `'ineligible'`이었다. 그래서 초진 경로가 구조적으로 열릴 수 없었다. 기록 없음은 "초진이다"라는 사실이지 결격 사유가 아니다. 이제 이 체크는 `'passed'`(사용 가능한 재진 기록) 또는 `'not-applicable'`(기록 없음·기간 초과·다른 기관)만 내고 절대 차단하지 않는다. 차단은 초진 요건(`first-visit-region`)과 양 경로 공통 요건이 맡는다. `detail` 문구는 네 갈래로 나눠 왜 초진으로 봤는지 남긴다.

### B2 — triage 상대 임계값

키워드 하나만 걸려도 진료과 후보에 오르면 "잠도 잘 못 잡니다" 한 마디에 정신건강의학과가 붙는다. 선두 점수의 절반 **초과**만 남긴다(strict `>`). 절대 최소 점수를 쓰면 "콧물이 납니다" 같은 짧은 입력에서 후보가 0개가 되어 주 사용 사례가 깨진다. 임계값은 `TriageRuleSet.relativeScoreFloor`에 둔다.

### 자유게시판 = 공개 질문 게시판

별도 엔티티를 만들지 않았다. 공감이 붙어야 하는 대상이 증상 질문이고, 목적이 "여러 과를 돌았지만 답을 못 얻은 사례를 다른 과 의사들에게도 보이게 하는 것"이기 때문이다. 비의료 잡담이 필요해지면 `Question.kind`가 확장점이다.

### 비대면 진료 게이트

사전 확인은 마이페이지에서 1회, 환자에게 귀속되는 필드만 받는다. 의료기관 의존 입력(clinic, priorVisit, sameSymptoms)은 보는 시점에 조립한다. 신청 버튼은 항상 렌더하고 막혔을 때 `EligibilityResult`의 **첫 번째 실패 체크의 `detail`**을 사유로 그대로 노출한다. `checks` 배열의 push 순서가 곧 사유 우선순위이므로 순서를 고정하는 회귀 테스트를 둔다.
