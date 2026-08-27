# 30 · 기능 명세

> **이 문서가 병렬 개발의 계약서다.** 화면 하나를 맡으면 여기 적힌 것까지가 그 사람 몫이다.
> 화면 *사이*의 흐름은 `20-user-flows.md`, 테이블은 `40-data-model.md`.
> 마지막 대조: 2026-08-19 · 대상 커밋 `f018a58`

## 읽는 법

각 화면은 아래 항목을 갖는다. **인수 조건은 대응 테스트가 있는 것만 적었다.** 테스트가 없는 동작은 명세에도 없다 — 그 칸이 비어 있으면 그건 아직 아무도 지키지 않는다는 뜻이다.

화면을 새로 추가할 때도 같은 항목을 채운다. 특히 **안 하는 것** 칸을 비우지 말 것. 이 제품에서 하지 않기로 한 것들은 `00-product-definition.md`의 원칙에서 내려온다.

## 라우트 인벤토리

전체 28개. `App.tsx:125-155`.

### 환자

| 라우트 | 화면 | 파일 | 헤더·탭 |
| --- | --- | --- | --- |
| `/onboarding` | 온보딩 | `OnboardingScreen.tsx` | 게이트(다른 것 위에 뜸) |
| `/home` | 홈 | `HomeScreen.tsx` | 보임 |
| `/ask` | 문진 3단계 | `AskScreen.tsx` | **숨김** |
| `/stories` | 사연 목록 | `BoardScreen.tsx` | 보임 |
| `/board` | → `/stories` 리다이렉트 | — | — |
| `/news` | 내소식 | `NewsScreen.tsx` | 보임 |
| `/map` | 병원 찾기 | `MapScreen.tsx` | 보임 |
| `/questions/:questionId` | 사연 상세 | `QuestionDetailScreen.tsx` | 보임 |
| `/doctors/:doctorId` | 의사 프로필 | `DoctorProfileScreen.tsx` | 보임 |
| `/booking/:doctorId` | 대면 예약 3단계 | `BookingScreen.tsx` | 보임 |
| `/visit/:roomId` | 화상 진료방 (환자) | `ConsultScreen.tsx` | **숨김** |
| `/me` | MY | `MyPageScreen.tsx` | 보임 |
| `/me/precheck` | 비대면 사전 확인 | `PrecheckScreen.tsx` | **숨김** |
| `/me/address` `/me/payment` `/me/notifications` `/me/privacy` `/me/appointments` | MY 설정 5종 | `MySettingsScreens.tsx` | **숨김** |
| `/expert` | 의사 데모 진입 | `ExpertGateScreen.tsx` | **숨김** |

### 의사

| 라우트 | 화면 | 파일 |
| --- | --- | --- |
| `/doctor/home` | 의사 홈 | `DoctorHomeScreen.tsx` |
| `/doctor/inbox` | 받은 질문 | `DoctorInboxScreen.tsx` |
| `/doctor/stories` | 사연 피드 | `DoctorStoriesScreen.tsx` |
| `/doctor/visits` | 진료 | `DoctorVisitsScreen.tsx` |
| `/doctor/questions/:questionId` | 답변 작성 | `DoctorAnswerScreen.tsx` |
| `/doctor/visit/:roomId` | 화상 진료방 (의사) | `ConsultScreen.tsx` |
| `/doctor/me` `/doctor/me/profile` `/doctor/me/keywords` `/doctor/me/telemedicine` | 의사 MY | `DoctorSettingsScreens.tsx` |

`*` → `/home`.

---

## 화면 상세

### `/ask` · 문진 3단계 — **가장 큰 화면 (640줄)**

| | |
| --- | --- |
| **목적** | 아픈 사람이 자기 말로 적은 것을 진료과 후보와 응급 신호로 정리한다 |
| **단계** | `symptom` → `history` → `visibility` → `result` |
| **입력** | 자유 서술, 증상 칩, 통증 척도, 발병일, 경과, 일상 지장, 시도한 것, 부위, 문항 은행 답 |
| **출력** | `TriageResult` + 등록된 `Question` |
| **도메인** | `triage` · `intake`(`inferAreas` `canChoosePriorClinicOnly` `symptomDurationDays`) · `classifier` |
| **규칙** | `triageRules`(2026-08-09) · `symptomChips`(2026-08-12) · `questionBank`(2026-08-12) · `intakeRules`(2026-08-09) |
| **상태** | `publish-question` |
| **테스트** | `AskFlow.test.tsx` · `HomeAndAskShell.test.tsx` |

**인수 조건**

- 홈에서 시작해 질문을 등록하면 분류 결과를 본다
- 진료 이력을 밝히지 않으면 `prior-clinic-only`를 고를 수 없다. 밝히면 열린다
- 응급 신호가 있으면 119 안내를 **먼저** 띄운다
- 작성 중에는 일반 탭을 숨기고, 닫으면 홈으로 돌아간다

**설계 근거**

- 증상 1단계에 입력 칸이 스물여섯 개였다. 아픈 사람이 그걸 다 보고 시작하면 거기서 그만둔다. **없어도 글이 올라가는 것은 접는다. 지우지는 않는다.**
- 고칠 수 없다는 규칙은 **시작 전에** 알린다. 다 쓰고 나서 알면 늦다. 그리고 무엇을 올리는지 그대로 세우고 고칠 자리를 준다.
- 부위 체크박스는 **진료과 키워드로만** 확장한다. 응급 신호 키워드는 넣지 않는다 — 체크박스가 응급을 만들어내면 안 된다.
- 문항 은행은 추론된 부위에 해당하는 것만 연다. **민감한 범주는 추론으로 열지 않는다.** 환자가 직접 고르면 연다.

**안 하는 것** — 진단명·확률·중증도. 통증 척도로 아무것도 판정하지 않는다(그대로 전달만). 발표용 기준일이 아니라 실제 시계를 쓴다.

---

### `/home` · 홈

| | |
| --- | --- |
| **목적** | 읽을거리가 아니라 **내 건이 어디까지 왔는지**를 보여준다 |
| **도메인** | `resolveNextStep`(`nextStep.ts`) · `activeEncounter` `encounterTrack` · `carePrepProgress` · `groupMyActivity`(`activity.ts`) |
| **테스트** | `HomeAndAskShell.test.tsx` · `nextStep.test.ts` · `activity.test.ts` · `TelemedicineRequestFlow.test.tsx` |

**인수 조건**

- 남의 사연 대신 내 다음 할 일을 최상단에 둔다
- 사전 확인이 남아 있으면 진행 상황을 알려준다
- 진행 중인 비대면 신청이 있으면 어디까지 왔는지와 다음에 무엇이 일어나는지를 함께 적는다. 진료방이 열리면 거기서 바로 들어간다

**우선순위** — `booked` > `first-visit` > `answered`/`waiting`. 예약이 잡혀 있으면 그것이 가장 급한 정보다.

**안 하는 것** — HOT·공감 같은 남의 글을 홈에 올리지 않는다(멘토링 반영 결과). 활동은 사연 하나당 한 줄로 접는다.

---

### `/stories` · 사연 목록

| | |
| --- | --- |
| **탭** | `all` · `hot` · `mine` + 진료과 필터(접힘, 눌러야 펼침) |
| **도메인** | `rankWeeklyHot` `empathyCount` `hasEmpathized`(`board`) · `isPubliclyListed`(`visibility`) |
| **규칙** | `boardRules`(2026-08-09) |
| **테스트** | `BoardEmpathyFlow.test.tsx` · `PatientTabsFlow.test.tsx` · `board.test.ts` |

**인수 조건**

- 전체 탭은 **최신순**으로 늘어놓는다
- HOT 탭에서만 공감이 많은 글을 모아 본다. **HOT 탭도 최신순**이다
- 진료과를 골라 그 과의 사연만 본다
- 공감을 누르면 수가 오르고 다시 누르면 내려간다
- 비공개 글은 게시판에 올라오지 않는다
- 내 사연에는 비공개로 올린 글과 공개 범위를 함께 보여준다

**안 하는 것** — **공감 수로 줄을 세우지 않는다.** 어느 글이 위에 오는지를 우리가 정하면 그게 곧 노출 우선권이 된다. 진료과 필터를 늘 펼쳐 두지 않는다 — 필터가 목록보다 길어지면 사연이 밀린다.

---

### `/me/precheck` · 비대면 사전 확인

| | |
| --- | --- |
| **목적** | 비대면 진료 대상 여부를 **예비** 점검한다. 확정 판정이 아니다 |
| **입력** | 지역, 본인확인 여부, 약관 동의, 이달 비대면 횟수, 질환 예외 5종 |
| **도메인** | `eligibility`(8개 체크, 재진·초진 두 경로) · `isPrecheckComplete` · `carePrepProgress` |
| **규칙** | `eligibilityRules`(2026-08-09) |
| **저장** | **`localStore` — 기기 안에만.** 서버로 보내지 않는다 |
| **테스트** | `eligibility.test.ts` · `telemedicine.test.ts` · `carePrep.test.ts` · `TelemedicineRequestFlow.test.tsx` |

**인수 조건**

- 사전 확인 전에는 신청 버튼이 **보이되 비활성**이다 (숨기지 않는다 — 없는 것과 못 하는 것은 다르다)
- 사전 확인을 마치면 재진 환자는 신청할 수 있다
- 막히면 **대면 진료 안내문을 함께** 보여준다 (`notice.ts`)
- 무엇이 끝났고 무엇이 남았는지 낱개로 보이고, 남은 것으로 보내는 버튼을 함께 둔다
- 대면 예약은 **언제나** 열려 있다
- 비대면을 운영하지 않는 의료기관이면 그 사유를 보여준다

**안 하는 것** — 사는 지역과 질환 예외를 서버로 올리지 않는다. 이 데모의 DB는 해외 리전이고 의료정보를 다룰 접근통제가 없다.

---

### `/booking/:doctorId` · 대면 예약 3단계

| | |
| --- | --- |
| **단계** | 날짜 → 시간 → 확인 |
| **도메인** | `booking`(`BookingDay`) · `clinicHours` · `documents` |
| **상태** | `request-booking` → `bookings` INSERT |
| **테스트** | `BookingFlow.test.tsx` · `booking.test.ts` · `clinicHours.test.ts` |

**인수 조건**

- 날짜 목록은 **2주치**를 준다
- 휴진일은 고를 수 없다. 토요일 휴진 의료기관은 토요일을 막는다
- 가장 빠른 진료일을 미리 골라 둔다
- 점심시간은 시간 칸에 넣지 않는다. 토요일은 오후 칸을 열지 않는다
- 시간대별로 묶어서 보여준다. 시간을 고르기 전에는 다음으로 갈 수 없다
- **오늘 이미 지나간 시간대는 고를 수 없다**
- 진료 후 필요한 서류를 함께 고른다
- 날짜와 시간을 고르면 희망 시간을 전달한다

**안 하는 것** — 예약을 **확정하지 않는다.** 화면 문구는 "희망 시간을 전달했어요 · 병원 확인 후 확정됩니다"까지다. 중복은 의사·날짜·시간 셋으로 막는다(화면이 지어낸 id를 쓰지 않는다).

---

### `/visit/:roomId` · `/doctor/visit/:roomId` · 1:1 화상 진료방

| | |
| --- | --- |
| **연결** | WebRTC 직접 연결. 시그널링은 Supabase Realtime 브로드캐스트 `consult:{roomId}` |
| **전사** | 브라우저 내장 음성인식. **각자 자기 마이크만** 받아 적어 데이터 채널(`transcript`)로 상대에게 보낸다 |
| **도메인** | `consultation`(키워드 추출 — **사연 분류와 같은 규칙셋**) |
| **파일** | `ConsultScreen.tsx` · `useConsultRoom.ts` · `useSpeechTranscript.ts` |
| **테스트** | `consultation.test.ts` (도메인만. **화면 테스트 없음**) |

**인수 조건**

- 키워드와 기록 초안은 **의사에게만** 보인다. 환자 화면에 키워드를 띄우면 진단으로 읽힌다
- 녹음과 전사는 동의를 받고 시작한다
- 받아쓰기가 조용할 때 이유를 화면에 낸다 — 마이크 권한 / 마이크 점유 / 네트워크 실패를 각각 다른 문장으로
- 받아쓰기가 막혀도 **손으로 한 줄 넣는 길**이 있다
- 통화가 끝나면 마이크를 닫는다 (종료 버튼과 연결 종료 **양쪽**에서)
- 원격 설명보다 먼저 온 ICE 후보는 버리지 않고 담아 둔다
- 브라우저가 끊었을 때 한 박자 쉬고 다시 켠다 (시작과 종료가 겹치면 조용히 죽는다)

**설계 근거** — Daily 대신 직접 든 이유는 계정을 하나 더 만들지 않아도 되고, 무엇보다 다음 단계에서 프레임을 직접 암호화하려면 어차피 `PeerConnection`을 우리가 들고 있어야 하기 때문이다. 상대 목소리를 내가 받아 적으면 마이크 품질에 따라 엉뚱한 말이 기록으로 남는다. 통화용 키워드 규칙을 따로 만들면 두 곳의 기준이 갈라지고 어느 쪽이 맞는지 아무도 모르게 된다.

**한계 (실서비스 전 필수)** — TURN 없음(대칭 NAT에서 실패) · 브라우저 내장 전사는 음성을 제조사 서버로 보냄(기기 내 모델로 교체해야 종단간 암호화 성립) · 시그널링 채널이 방 이름만으로 구독 가능.

**안 하는 것** — 진단명을 만들지 않는다. 뽑히는 키워드는 **말에 실제로 있었던 단어**다.

---

### `/doctor/questions/:questionId` · 답변 작성

| | |
| --- | --- |
| **도구** | 답변 문구 템플릿 · 읽음/나중에 표시 · EMR 내보내기 |
| **도메인** | `emrExport` · `visibility` |
| **규칙** | `answerTemplates` |
| **테스트** | `DoctorAnswerFlow.test.tsx` · `visibility.test.ts` |

**인수 조건**

- 답변을 등록하면 환자 화면에 나타난다
- 진료과 한정 글은 그 과 의사에게만, 진료 이력 한정 글은 그 의료기관 의사에게만 보인다
- **안 보이는 질문에 직접 접근하면 막는다**
- 보류한 사연은 목록에서 지우지 않고 아래로 내린다 (지운 것이 아니라 미룬 것)

**안 하는 것** — 답변 문구에 **진단명을 담지 않는다.** 문구가 진단이 되면 읽는 사람이 확진으로 받아들인다. 문구는 그대로 보내라고 만든 것이 아니라 첫 줄을 대신 써 주는 것이며, 넣은 뒤 고치라고 화면에 적는다. EMR로 넘기는 것은 **환자가 한 말 + 거기서 뽑은 키워드 + 의사가 쓴 문장**뿐이다. 진단과 처방은 만들지 않는다.

---

### `/doctor/inbox` · `/doctor/stories` · `/doctor/visits`

| | |
| --- | --- |
| **도메인** | `doctorFeed`(`FeedReason`: `specialty` 또는 `keyword`) · `routing` · `visibility` |
| **테스트** | `doctorFeed.test.ts` · `routing.test.ts` |

- **받은 질문** — 나에게 온 것만
- **사연 피드** — 내 과 또는 내가 등록한 키워드에 걸린 것. **왜 걸렸는지를 함께 붙인다**
- **진료** — 비대면 신청. 사연 목록에 섞지 않는다. 열면 상태가 `in-progress`로 간다

**정렬** — 응급 신호가 걸린 사연만 맨 위. 나머지는 원래 순서 그대로. `routing`은 과금·광고 인자를 받지 않고 정렬도 하지 않는다.

**알림** — 하루 알림 상한이 있다.

> ⚠️ `DoctorInboxScreen.tsx:99`의 `.list-row`가 `<div>`다. `cursor: pointer`는 붙지만 누름 피드백도 키보드 접근도 없다. 다른 곳에서는 `<button>`이다. `50-nonfunctional.md` 참조.
> ⚠️ 상태 전이 5개 중 `in-progress` 하나만 구현돼 있다. `20-user-flows.md`의 **F-6** 참조.

---

### `/me/*` · MY 설정 5종

| 화면 | 다루는 것 | 테스트 |
| --- | --- | --- |
| `/me/address` | 지역 + 별칭(**선택**) | `MySettingsFlow.test.tsx` |
| `/me/payment` | **마스킹된 데모 결제수단만** | 〃 |
| `/me/notifications` | 답변 알림 · 예약 알림 각각 | 〃 |
| `/me/privacy` | 질문 공개 범위 기본값 · 프로필 표시 | 〃 |
| `/me/appointments` | 전달한 예약 희망 시간. 없으면 빈 상태 | 〃 |

**인수 조건 (주소)** — **별칭 없이 지역만 골라도 진료 준비가 채워진다.** 별칭은 여러 곳을 구분할 때만 쓰는 값이다. 지역에는 기본값이 있어 값만 보고는 확인했는지 알 수 없으므로, **사용자가 저장을 눌렀는지를 남겨** 그것으로 판단한다. 주소 화면의 지역 목록은 의료기관 지역 목록과 **같은 것**을 쓴다.

**안 하는 것** — 실제 카드번호·CVC를 받지 않는다. 주소·결제·알림·개인정보를 서버에 두지 않는다.

---

### `/onboarding` · `/expert`

- **온보딩** — 첫 방문을 안내한 뒤 **원래 열려던 화면으로 돌아간다.** 완료한 기기에서는 홈을 바로 연다. 3단계를 완료해도 **완료 여부 한 항목만** 저장한다. MY에서 다시 보고 나면 MY로 돌아온다. (`OnboardingFlow.test.tsx`)
- **`/expert`** — 준비된 의사 프로필을 골라 그 자리로 들어간다. 역할을 의사로 바꾸면 받은 질문 화면으로 간다. (`App.test.tsx`)

> ⚠️ **`/expert`는 데모 지름길이다.** 화면에서 스스로 면허 검증을 켤 수 있으면 검증이 아니다. 실서비스로 갈 때 가장 먼저 되돌릴 자리다. `40-data-model.md`의 `profiles` 절 참조.

---

## 공통 규칙

### 셸

- 헤더·하단탭을 숨기는 화면: `/ask` `/expert` `/me/*` `/doctor/me/*` `/visit/*` `/doctor/visit/*`
- 환자 하단탭 5개: `홈 · 사연 · Q · 내소식 · MY`. 중앙 Q가 `/ask`를 연다
- 내소식은 종 아이콘으로 헤더에서 들어간다
- 768px 이상에서 `웹 보기 · 앱 미리보기` 전환 (`PreviewToolbar`). PWA에서는 뜨지 않는다
- 모르는 경로는 홈으로 보낸다

### 오류와 알림

**실패는 반드시 화면에 보여야 한다.** 알림이 헤더 안에만 있으면 헤더를 감추는 화면(`/ask` 등)에서 등록이 실패해도 아무 일도 없었던 것처럼 보인다. `AppNotice`는 헤더 **밖**에 있다. 문구는 데이터베이스 원문이 아니라 **무엇을 하면 되는지**를 적는다.

### 시간

화면은 **실제 시계**(`appClock`)를 쓰고 픽스처만 기준일을 유지한다. 시간은 의료 화면에서 가장 먼저 믿는 값이라 여기가 틀리면 나머지를 다 의심하게 된다.

`src/domain/`과 `src/data/`에는 무인자 `Date.now()`/`new Date()`를 두지 않는다. 기준일은 항상 인자다.

### 동의 문구

**화면에 적은 것과 실제로 일어나는 일이 같아야 한다.** 서버로 보내면서 브라우저에만 둔다고 적는 것은 문구 오류가 아니라 동의를 잘못 받은 것이다. 증상 글이 모델 제공자에게 간다는 사실도 작성 화면에 적는다.

### 화면이 판정하지 않는다

화면은 도메인 출력을 렌더링만 한다. 판정은 `src/domain/`에 있고, 그건 React·라우터·픽스처를 import 하지 않는다. 새 판정 로직을 화면에 쓰고 있다면 잘못 들어간 것이다.

### 이름은 한 자리에서 만든다

진료과 한국어 이름은 `specialtyLabels` 한 곳에서만 만든다. 화면마다 따로 들고 있으면 한 곳을 빠뜨리게 되고, 실제로 그렇게 해서 `otolaryngology`가 그대로 환자에게 나갔다.

## 아직 명세가 없는 것

- **의원 운영자 화면** — `00-product-definition.md`의 **D-1**이 닫히면 P0가 될 수 있다
- **사전 문진 + 의사용 "진료 전 요약"** — 회의록이 요구했고 아직 없다
- **화상 진료방 화면 테스트** — 도메인 테스트만 있고 화면 테스트가 없는 유일한 주요 화면
- **진료 종료 처리** — `20-user-flows.md`의 F-6
