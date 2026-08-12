-- 예약에 요청 서류를 담을 자리.
--
-- 화면에서는 진료확인서·영수증·세부내역서를 고를 수 있었는데 테이블에 둘 곳이
-- 없어 저장 단계에서 통째로 사라졌다. 읽는 쪽은 document_types 를 찾다가 없으면
-- 빈 배열로 넘어가서, 아무 오류 없이 요청만 없어졌다.
--
-- 여러 번 돌려도 안전하다.

alter table bookings
  add column if not exists document_types jsonb not null default '[]'::jsonb;
