# MediVU Community

MediVU Community는 환자가 증상을 적으면 진료과를 정리해 주고, 답변한 의사 프로필에서 진료로 이어지는 흐름을 보여주는 설치형 웹앱 데모입니다.

**이 프로젝트의 모든 환자·의사·의료기관·질문·답변 데이터는 가상 시연값입니다. 실제 의료기기, 진단, 처방, 예약 시스템이 아니며 실제 환자정보를 입력하면 안 됩니다.**

## 데모 보기

<https://skycastle0616.github.io/medi-commu/>

## 핵심 흐름

1. 홈에서 `증상 적어보기`를 눌러 3단계 문진 양식을 채웁니다. 증상, 진료 이력, 공개 범위 순입니다.
2. 적은 내용을 진료과 후보와 응급 신호로 정리해 보여줍니다. 진단명과 확률은 만들지 않습니다.
3. 사연에 올리면 공개 범위에 따라 보이는 의사가 달라지고, 답변은 내소식에 모입니다.
4. 홈의 `expert`에서 데모 의사 화면에 들어가 계정을 바꾸면 같은 사연이 다르게 보입니다.
5. 답변자 프로필에서 병원·자기소개·진료 방법을 보고 대면 예약 또는 비대면 진료 신청으로 이어갑니다.
6. 사연은 한 주 동안 공감이 많이 모인 글을 HOT으로 올려 여러 과의 의사 눈에 걸리게 합니다.

모바일에서는 전체 화면 앱으로 동작합니다. 768px 이상에서는 상단의 `웹 보기 · 앱 미리보기`로 좌측 레일 웹 레이아웃과 520px 앱 프레임을 전환할 수 있습니다.

## 로컬 실행

Node.js 24와 npm을 권장합니다.

```powershell
npm.cmd install
npm.cmd run dev
```

### 검증

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run preview
```

## 구조

- `src/domain`: 순수 판정 함수. React·라우터·픽스처를 import 하지 않습니다.
- `src/data/rules`: 법령과 운영 기준 수치. 전부 `asOf`를 답니다.
- `src/data`: 가상 환자·의사·의료기관·질문·답변 픽스처
- `src/state`: 인메모리 리듀서. 브라우저 저장소를 쓰지 않습니다.
- `src/features`: 화면 하나당 파일 하나
- `docs/superpowers/plans`: 승인된 구현 계획과 설계 결정 기록

주요 환자 경로는 `#/home`, `#/stories`, `#/ask`, `#/news`, `#/me`이며 기존 `#/board`는 `#/stories`로 이동합니다. 비대면 사전 확인은 `#/me/precheck`, 의사 데모 진입은 `#/expert`입니다.

### 도메인 함수

| 모듈 | 하는 일 |
| --- | --- |
| `triage` | 증상 문장에서 진료과 후보와 응급 신호를 뽑습니다. 선두 점수의 절반 초과만 남깁니다. |
| `intake` | 문진 양식을 분류용 문장으로 펼칩니다. 부위 체크박스는 진료과 키워드로만 확장하고 응급 신호 키워드는 넣지 않습니다. |
| `classifier` | `triage`를 `SymptomClassifier` 인터페이스 뒤에 둡니다. 나중에 LLM 분류기로 교체할 자리입니다. |
| `eligibility` | 비대면 진료 대상 여부를 8개 체크로 예비 확인합니다. 재진·초진 두 경로가 있습니다. |
| `telemedicine` | 신청 버튼의 활성 여부와 막힌 사유를 정합니다. |
| `routing` | 질문을 어느 의사에게 보여줄지 정합니다. 과금·광고 인자를 받지 않고 정렬도 하지 않습니다. |
| `visibility` | 공개 범위 세 단계를 판정합니다. 글이 보이는가와 글 안의 진료 이력 줄이 보이는가는 다른 판정입니다. |
| `board` | 주간 공감을 집계해 상단 고정 대상을 정합니다. 기준일은 항상 인자입니다. |
| `medication` | 성분별 비대면 처방 제한을 판정합니다. |
| `notice` | 막혔을 때 환자 안내문과 진료기록용 문구 초안을 만듭니다. |

### 규칙셋

| 규칙셋 | 파일 | 기준일 |
| --- | --- | --- |
| 진료과 분류 시연 규칙 | `src/data/rules/triageRules.ts` | 2026-08-09 |
| 비대면 진료 대상자 판정 시연 규칙셋 | `src/data/rules/eligibilityRules.ts` | 2026-08-09 |
| 비대면 처방제한 의약품 (시연용 발췌) | `src/data/rules/medicationRules.ts` | 2026-08-09 |
| 문진 부위 확장 시연 규칙 | `src/data/rules/intakeRules.ts` | 2026-08-09 |
| 주간 공감 정렬 시연 규칙 | `src/data/rules/boardRules.ts` | 2026-08-09 |

법령이 바뀌면 이 파일들만 고칩니다. 판정 코드는 건드리지 않습니다.

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 테스트와 빌드를 수행한 뒤 `dist`를 GitHub Pages에 게시합니다. 저장소의 **Settings → Pages → Source**가 **GitHub Actions**로 설정돼 있어야 합니다.

## 범위 밖

- 서버, 데이터베이스, 로그인, 의료정보 영구 저장. 질문·답변·사전 확인은 브라우저 메모리에만 있고 새로고침하면 사라집니다. 온보딩 완료 여부 한 항목만 로컬에 저장합니다.
- 실제 본인확인, 의사 면허 검증, 진료기록 보관, 건강정보 처리 동의
- 실제 예약 성사, 결제, 처방전 전송, 화상 통신
- 생성형 AI 분류. 지금은 키워드 규칙이며 `SymptomClassifier`가 교체 지점입니다.
- 진단명, 질병 확률, 중증도 지수

## 관련 프로토타입

- [MediVU-EMR](https://github.com/mushpiba/MediVU-EMR) — Ambient AI 진료 기록과 진단 보조
- [MediVU-mobile](https://github.com/mushpiba/MediVU-mobile) — 비대면 재진 진료 흐름
