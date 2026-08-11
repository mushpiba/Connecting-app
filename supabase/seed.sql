-- 가상 의료기관. 실존 기관이 아니다.
-- 판정 분기를 하나씩 담당한다. 비대면 미운영, 월 비율 상한 초과, 병원급.

insert into clinics (
  id, name, level, region, address, phone, booking_url,
  telemedicine_enabled, monthly_telemedicine_ratio, landmark, lunch_break, hours
) values
  (
    'clinic-han', '가상 한빛이비인후과의원', 'clinic', '인천 미추홀구',
    '인천 미추홀구 가상로 12, 2층', '032-000-0001', 'https://example.invalid/clinic-han',
    true, 0.18, '가상역 3번 출구에서 도보 4분, 한빛빌딩 2층', '13:00–14:00',
    '[{"weekday":"mon","open":"09:00","close":"18:30"},
      {"weekday":"tue","open":"09:00","close":"18:30"},
      {"weekday":"wed","open":"09:00","close":"18:30"},
      {"weekday":"thu","open":"09:00","close":"18:30"},
      {"weekday":"fri","open":"09:00","close":"18:30"},
      {"weekday":"sat","open":"09:00","close":"13:00"},
      {"weekday":"sun","open":null,"close":null}]'::jsonb
  ),
  (
    'clinic-forest', '가상 서울숲내과의원', 'clinic', '서울 성동구',
    '서울 성동구 가상길 34, 3층', '02-000-0002', 'https://example.invalid/clinic-forest',
    true, 0.34, '가상숲공원 정문 건너편, 숲빌딩 3층', '12:30–13:30',
    '[{"weekday":"mon","open":"08:30","close":"18:00"},
      {"weekday":"tue","open":"08:30","close":"18:00"},
      {"weekday":"wed","open":"08:30","close":"18:00"},
      {"weekday":"thu","open":"08:30","close":"18:00"},
      {"weekday":"fri","open":"08:30","close":"18:00"},
      {"weekday":"sat","open":"08:30","close":"12:30"},
      {"weekday":"sun","open":null,"close":null}]'::jsonb
  ),
  (
    'clinic-skin', '가상 미추홀피부과의원', 'clinic', '인천 미추홀구',
    '인천 미추홀구 가상로 56, 5층', '032-000-0003', 'https://example.invalid/clinic-skin',
    false, 0, '가상시장 사거리 모퉁이, 미추홀타워 5층', '13:00–14:00',
    '[{"weekday":"mon","open":"10:00","close":"19:00"},
      {"weekday":"tue","open":"10:00","close":"19:00"},
      {"weekday":"wed","open":"10:00","close":"19:00"},
      {"weekday":"thu","open":"10:00","close":"19:00"},
      {"weekday":"fri","open":"10:00","close":"19:00"},
      {"weekday":"sat","open":null,"close":null},
      {"weekday":"sun","open":null,"close":null}]'::jsonb
  ),
  (
    'clinic-inha', '가상 인하늘병원', 'hospital', '인천 미추홀구',
    '인천 미추홀구 가상대로 78', '032-000-0004', 'https://example.invalid/clinic-inha',
    true, 0.12, '가상대로 사거리, 본관 1층 외래 접수', '12:30–13:30',
    '[{"weekday":"mon","open":"08:00","close":"17:30"},
      {"weekday":"tue","open":"08:00","close":"17:30"},
      {"weekday":"wed","open":"08:00","close":"17:30"},
      {"weekday":"thu","open":"08:00","close":"17:30"},
      {"weekday":"fri","open":"08:00","close":"17:30"},
      {"weekday":"sat","open":"08:00","close":"12:00"},
      {"weekday":"sun","open":null,"close":null}]'::jsonb
  )
on conflict (id) do nothing;
