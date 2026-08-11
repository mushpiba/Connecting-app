# MediVU Home and MY Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public HOT feed on Home with a personal dashboard and add session-only demo screens for patient address, payment, notifications, privacy, and appointments.

**Architecture:** Reuse `buildMyActivity` for the Home summary and leave community posts in `/stories`. Store non-medical demo preferences in a dedicated app-level `PatientSettingsContext`; existing `CommunityContext`, medical rules, questions, answers, and bookings remain unchanged.

**Tech Stack:** React 19, TypeScript, React Router hash routes, Vitest, Testing Library, Vite PWA.

## Global Constraints

- Keep patient navigation as `홈 · 사연 · Q · 내소식 · MY`.
- Q opens the existing three-step `/ask` flow; 내소식 keeps the bell SVG and `/news` behavior.
- Do not store address, payment, notification, privacy, question, answer, or medical data in `localStorage`.
- Payment screens use masked demo methods only and never accept a real card number or CVC.
- Keep existing domain interfaces and medical decision logic unchanged.
- Push only after the full suite and PWA build pass.

---

### Task 1: Personal Home dashboard

**Files:**
- Modify: `src/features/patient/HomeAndAskShell.test.tsx`
- Modify: `src/features/patient/HomeScreen.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `buildMyActivity(questions, answers, patientId): MyActivityItem[]`
- Produces: Home sections `최근 내 활동`, `빠른 메뉴`, `진료 준비`, and `사연 둘러보기`

- [ ] **Step 1: Replace the HOT expectation with the desired dashboard behavior**

```tsx
expect(screen.queryByRole('heading', { name: 'HOT 사연' })).not.toBeInTheDocument()
expect(screen.queryAllByTestId('question-card')).toHaveLength(0)
expect(screen.getByRole('heading', { name: '최근 내 활동' })).toBeInTheDocument()
expect(screen.getByText('지난번 처방 이후 경과를 여쭙습니다')).toBeInTheDocument()
expect(screen.getByRole('button', { name: '예약 내역' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '사연 둘러보기' })).toBeInTheDocument()
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm.cmd test -- --run src/features/patient/HomeAndAskShell.test.tsx`

Expected: FAIL because Home still renders `HOT 사연` and has no personal activity or quick-menu headings.

- [ ] **Step 3: Implement the minimal dashboard**

```tsx
const latestActivity = buildMyActivity(state.questions, state.answers, state.patientId)[0]

<section aria-labelledby="home-activity-heading">
  <h2 id="home-activity-heading">최근 내 활동</h2>
  <button onClick={() => navigate(`/questions/${latestActivity.question.id}`)}>
    {latestActivity.question.title}
  </button>
</section>
```

Remove all board ranking imports and `QuestionCard` rendering from Home. Add buttons for `/me/precheck`, `/me/appointments`, `/news`, and `/stories`, plus a static checklist that asks users to prepare symptom onset, current medication names, and questions for the doctor.

- [ ] **Step 4: Style the dashboard and verify GREEN**

Add `.home-activity-card`, `.home-quick-menu`, `.care-prep-card`, and `.stories-entry-card` rules to `src/styles.css`, then run:

`npm.cmd test -- --run src/features/patient/HomeAndAskShell.test.tsx src/features/patient/PatientTabsFlow.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/patient/HomeAndAskShell.test.tsx src/features/patient/HomeScreen.tsx src/styles.css
git commit -m "feat: personalize patient home"
```

---

### Task 2: Session-only patient settings state

**Files:**
- Create: `src/state/PatientSettingsContext.tsx`
- Create: `src/state/PatientSettingsContext.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `PatientSettings`, `initialPatientSettings`, `PatientSettingsProvider`, `usePatientSettings()`
- `PatientSettings` fields: `address`, `paymentMethodId`, `notifications`, `defaultVisibility`, `showProfile`

- [ ] **Step 1: Write a provider behavior test**

```tsx
expect(result.current.settings.address.region).toBe('인천 미추홀구')
act(() => result.current.updateSettings({ address: { region: '서울 성동구', detail: '회사' } }, '주소를 저장했습니다.'))
expect(result.current.settings.address.detail).toBe('회사')
expect(result.current.notice).toBe('주소를 저장했습니다.')
act(() => result.current.resetSettings())
expect(result.current.settings).toEqual(initialPatientSettings)
```

- [ ] **Step 2: Run the context test and confirm RED**

Run: `npm.cmd test -- --run src/state/PatientSettingsContext.test.tsx`

Expected: FAIL because `PatientSettingsContext` does not exist.

- [ ] **Step 3: Implement the context**

```ts
export interface PatientSettings {
  address: { region: string; detail: string }
  paymentMethodId: 'demo-hana' | 'demo-kakao' | 'none'
  notifications: { answers: boolean; bookings: boolean; service: boolean }
  defaultVisibility: PostVisibility
  showProfile: boolean
}
```

Expose `updateSettings(patch, notice)` and `resetSettings()`. Use React state only; do not call browser storage APIs. Wrap `AppRoutes` with `PatientSettingsProvider` inside `CommunityProvider`.

- [ ] **Step 4: Run the context test and confirm GREEN**

Run: `npm.cmd test -- --run src/state/PatientSettingsContext.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/state/PatientSettingsContext.tsx src/state/PatientSettingsContext.test.tsx src/App.tsx
git commit -m "feat: add patient settings state"
```

---

### Task 3: MY setting detail screens and routes

**Files:**
- Create: `src/features/patient/AddressSettingsScreen.tsx`
- Create: `src/features/patient/PaymentSettingsScreen.tsx`
- Create: `src/features/patient/NotificationSettingsScreen.tsx`
- Create: `src/features/patient/PrivacySettingsScreen.tsx`
- Create: `src/features/patient/AppointmentsScreen.tsx`
- Create: `src/features/patient/MySettingsFlow.test.tsx`
- Modify: `src/features/patient/MyPageScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `usePatientSettings()`, `useCommunity()`, `findDoctor()`, `findClinic()`
- Produces routes: `/me/address`, `/me/payment`, `/me/notifications`, `/me/privacy`, `/me/appointments`

- [ ] **Step 1: Write flow tests for every menu and setting**

```tsx
await user.click(screen.getByRole('button', { name: '주소 설정' }))
expect(screen.getByRole('heading', { name: '주소 설정' })).toBeInTheDocument()
await user.selectOptions(screen.getByLabelText('기본 지역'), '서울 성동구')
await user.type(screen.getByLabelText('상세 주소 별칭'), '회사')
await user.click(screen.getByRole('button', { name: '주소 저장' }))
expect(screen.getByRole('status')).toHaveTextContent('주소를 저장했습니다.')
```

Add equivalent assertions for choosing `하나카드 •••• 0616`, toggling `답변 도착 알림`, saving the default visibility, and opening an empty `예약 내역` screen.

- [ ] **Step 2: Run the setting flow and confirm RED**

Run: `npm.cmd test -- --run src/features/patient/MySettingsFlow.test.tsx`

Expected: FAIL because the new MY buttons and routes do not exist.

- [ ] **Step 3: Implement each focused screen**

Every screen starts with a `← MY로 돌아가기` button, one `h1`, its controls, a primary save button, `role="status"` notice, and a caveat explaining that no real address validation, payment, push permission, or consent occurs.

`AppointmentsScreen` reads `state.bookings`. When empty it renders `아직 전달한 예약 희망 시간이 없습니다.`; otherwise it resolves doctor and clinic names and displays `{date} {time}`.

- [ ] **Step 4: Add grouped MY menus and focused routes**

Add `진료 준비` buttons for precheck, address, payment, and appointments. Add `앱 설정` buttons for notifications, privacy, onboarding, and reset. Mark all `/me/*` detail routes as focused so the general tab bar is hidden inside the phone frame.

- [ ] **Step 5: Run focused and regression tests**

Run:

`npm.cmd test -- --run src/features/patient/MySettingsFlow.test.tsx src/features/patient/PatientTabsFlow.test.tsx src/features/patient/TelemedicineRequestFlow.test.tsx src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/patient src/App.tsx src/styles.css
git commit -m "feat: add MY setting demos"
```

---

### Task 4: Verify, integrate, and deploy

**Files:**
- Modify only if verification reveals a scoped defect.

**Interfaces:**
- Consumes: complete feature branch
- Produces: updated remote `main` and GitHub Pages deployment input

- [ ] **Step 1: Run the complete test suite twice**

```powershell
npm.cmd test -- --run
npm.cmd test -- --run
```

Expected each time: all test files and tests pass with exit code 0.

- [ ] **Step 2: Build and inspect PWA artifacts**

```powershell
npm.cmd run build
Test-Path dist\manifest.webmanifest
Test-Path dist\sw.js
```

Expected: TypeScript and Vite build pass; both checks return `True`.

- [ ] **Step 3: Inspect mobile and desktop layouts**

Verify 390×844 mobile, 768px web view, and 1280px app preview. Confirm no horizontal overflow, the Q button stays centered, settings forms scroll inside the phone frame, and Home contains no public question card.

- [ ] **Step 4: Reconcile with current `main`**

Fetch the remote, inspect the main worktree for Claude/user changes, and merge without overwriting unrelated work. Stop and report if the same lines have unresolved semantic conflicts.

- [ ] **Step 5: Push deployment branch**

After the merged `main` passes the full suite and build, push `main` to `origin`. Do not force-push. Confirm the resulting commit SHA and GitHub Actions deployment state.
