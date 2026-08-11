-- 004 · 데모 의사 계정 선택
--
-- 여럿이 모여 테스트할 때 주최자가 매번 SQL로 의사를 승격시키면 진행이 끊긴다.
-- 그래서 준비된 의사 프로필 중 하나를 골라 그 자리로 들어가게 한다.
--
-- 이것은 데모 한정이다. 실제 서비스에서 면허 검증을 화면에서 스스로 켤 수
-- 있으면 검증이 아니다. 실제로는 기관 연동이나 서류 심사가 서버에서 끝나야
-- 하고, 클라이언트는 결과만 읽어야 한다. 이 데모에는 진짜 신원이 없고 모든
-- 데이터가 가상이라 이렇게 둔다.

drop trigger if exists profiles_guard_privileges on profiles;
drop function if exists guard_profile_privileges();

-- 어느 준비된 프로필을 골랐는지. 자기소개와 약력을 화면에서 채우는 데 쓴다.
alter table profiles add column if not exists template_id text;

-- 고른 의료기관은 실제로 있어야 한다. 아무 값이나 적어 넣지 못하게 막는다.
alter table profiles drop constraint if exists profiles_clinic_fk;
alter table profiles
  add constraint profiles_clinic_fk foreign key (clinic_id) references clinics (id);
