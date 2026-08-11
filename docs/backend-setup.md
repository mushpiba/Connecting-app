# 여럿이서 테스트하기 — 백엔드 준비

지금 앱은 모든 상태가 브라우저 메모리에 있다. 설치한 사람마다 자기 픽스처 복사본을
갖기 때문에, A가 올린 사연이 B에게 보이지 않는다. 여럿이 같은 게시판을 쓰려면
서버가 있어야 한다.

Supabase를 쓴다. 정적 사이트가 직접 붙으므로 서버를 따로 돌리지 않아도 된다.

## 하나. 프로젝트 만들기 (5분)

1. <https://supabase.com> 가입 후 **New project**
2. 이름 `medi-commu`, 리전은 `Northeast Asia (Seoul)`을 고른다. 무료 티어에서
   서울을 못 고르면 가까운 곳 아무거나 골라도 테스트에는 지장이 없다.
3. 데이터베이스 비밀번호는 아무 값이나 정하고 따로 적어 둔다. 앱에서는 쓰지 않는다.

## 둘. 스키마 올리기 (2분)

프로젝트 대시보드 → **SQL Editor** → New query

1. `supabase/schema.sql` 내용을 붙여넣고 실행
2. `supabase/seed.sql` 내용을 붙여넣고 실행

## 셋. 로그인 방식 켜기 (2분)

**Authentication → Providers**

- 모여서 하는 짧은 테스트라면 **Anonymous sign-ins**만 켜면 된다. 이메일 인증
  절차 없이 앱에 들어오자마자 표시이름만 정하고 참여한다.
- 며칠에 걸쳐 쓸 거라면 **Email**을 켜고 *Confirm email*을 끈다. 같은 계정으로
  다시 들어올 수 있다.

## 넷. 키 두 개 알려주기

**Project Settings → API** 에서 두 값을 복사해 전달한다.

- `Project URL` — 예: `https://abcdefgh.supabase.co`
- `anon public` 키

이 두 값은 **공개해도 되는 값**이다. 브라우저에 그대로 실린다. 실제 차단은
`schema.sql`의 RLS 정책이 한다. `service_role` 키는 절대 공유하지 않는다.
그 키는 RLS를 통째로 무시한다.

## 다섯. 의사 계정 승인

면허 검증은 스스로 못 켠다. 트리거가 막아 둔다. 테스트에서 누군가를 의사로
만들려면 주최자가 SQL Editor에서 직접 올린다.

```sql
-- 먼저 누가 들어왔는지 본다
select id, display_name, role, license_verified from profiles order by created_at;

-- 의사로 승격. 소속 의료기관과 진료과를 함께 지정한다.
update profiles
set role = 'doctor',
    license_verified = true,
    clinic_id = 'clinic-han',
    specialty = 'otolaryngology'
where id = '여기에 profiles.id 붙여넣기';
```

`specialty`는 `src/domain/types.ts`의 `Specialty` 값을 그대로 쓴다.
`internal-medicine` `family-medicine` `otolaryngology` `dermatology`
`orthopedics` `psychiatry` `ophthalmology` `obgyn` `pediatrics` `urology`

`clinic_id`는 `seed.sql`에 넣은 넷 중 하나다.
`clinic-han` `clinic-forest` `clinic-skin` `clinic-inha`

## 테스트 진행 방법

1. 참여자 전원이 <https://skycastle0616.github.io/medi-commu/> 를 연다.
   Android·데스크톱 Chrome은 홈의 `설치` 버튼, iOS Safari는 공유 → 홈 화면에 추가.
   QR이 필요하면 Chrome 주소창에서 우클릭 → QR 코드 생성.
2. 각자 표시이름을 정하고 들어온다. 처음에는 전원 환자다.
3. 주최자가 위 SQL로 한두 명을 의사로 올린다. 새로고침하면 의사 화면이 열린다.
4. 환자 역할이 사연을 올린다. 공개 범위를 셋 중에 골라 본다.
5. 의사 역할 화면에서 사연이 뜨는지 본다. **진료과가 다른 의사에게는 안 보이는
   글이 있어야 정상이다.** 그게 공개 범위가 작동한다는 뜻이다.
6. 의사가 답변을 쓰면 환자 홈 최상단이 `의사 N명이 답변했어요`로 바뀐다.

## 주의

- **실제 증상이나 개인정보를 넣지 않는다.** 무료 티어는 리전이 해외일 수 있고,
  이 데모에는 의료정보 취급에 필요한 접근통제와 보관 정책이 없다.
- 테스트가 끝나면 Supabase 대시보드에서 테이블을 비우거나 프로젝트를 지운다.
