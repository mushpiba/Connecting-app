-- 데모 시드 · 픽스처에서 생성한 파일이다. 직접 고치지 않는다.
-- 만드는 법: npx vitest run scripts/emit-demo-seed.test.ts
--
-- 소개용 사연이 미리 들어 있어야 데모를 보여줄 수 있다. 여기에 참여자가
-- 올린 사연이 얹힌다. 가상 계정은 로그인하지 않는다.

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000d0b8c228', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '0000d0b8c228@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-0000d0b8d969', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '0000d0b8d969@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-0000d0b8b5e4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '0000d0b8b5e4@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-0000d76bee1e', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '0000d76bee1e@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-000065dfca7f', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '000065dfca7f@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-00007d376277', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '00007d376277@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-0000262a4a5c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '0000262a4a5c@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-000065dfca22', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '000065dfca22@demo.invalid', now(), now()),
  ('00000000-0000-4000-8000-0000858a3a02', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '0000858a3a02@demo.invalid', now(), now())
on conflict (id) do nothing;

insert into profiles (id, display_name, role, region, license_verified, clinic_id, specialty)
values
  ('00000000-0000-4000-8000-0000d0b8c228', '가상 민이', 'patient', '인천 미추홀구', false, null, null),
  ('00000000-0000-4000-8000-0000d0b8d969', '가상 수현', 'patient', '서울 성동구', false, null, null),
  ('00000000-0000-4000-8000-0000d0b8b5e4', '가상 재우', 'patient', '서울 강남구', false, null, null),
  ('00000000-0000-4000-8000-0000d76bee1e', '가상 김이비', 'doctor', '인천 미추홀구', true, 'clinic-han', 'otolaryngology'),
  ('00000000-0000-4000-8000-000065dfca7f', '가상 박내과', 'doctor', '인천 미추홀구', true, 'clinic-forest', 'internal-medicine'),
  ('00000000-0000-4000-8000-00007d376277', '가상 정피부', 'doctor', '인천 미추홀구', true, 'clinic-skin', 'dermatology'),
  ('00000000-0000-4000-8000-0000262a4a5c', '가상 최마음', 'doctor', '인천 미추홀구', true, 'clinic-inha', 'psychiatry'),
  ('00000000-0000-4000-8000-000065dfca22', '가상 이가정', 'doctor', '인천 미추홀구', true, 'clinic-forest', 'family-medicine'),
  ('00000000-0000-4000-8000-0000858a3a02', '가상 한검증', 'doctor', '인천 미추홀구', false, 'clinic-han', 'otolaryngology')
on conflict (id) do nothing;

insert into questions (id, author_id, title, body, visibility, onset_date, course, daily_impact, tried_remedies, body_areas, selected_symptoms, pain_level, intake_answers, triage, specialties, prior_clinic_id, prior_visited_on, same_symptoms, created_at)
values
  ('00000000-0000-4000-8000-0000c3816faf', '00000000-0000-4000-8000-0000d0b8c228', '2주째 콧물과 코막힘이 안 나아요', '콧물이 계속 나고 코막힘 때문에 밤에 잠을 설칩니다. 약국 약을 먹어도 그대로입니다.', 'public', '2026-07-27', 'unchanged', 'disruptive', ARRAY['otc']::text[], ARRAY['ent']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"otolaryngology","label":"이비인후과","matchedKeywords":["콧물","코막힘"],"score":3}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['otolaryngology']::text[], 'clinic-han', '2026-06-02', true, '2026-08-08T09:10:00.000Z'),
  ('00000000-0000-4000-8000-0000c3830ca0', '00000000-0000-4000-8000-0000d0b8d969', '세 과를 돌았는데 두드러기 원인을 못 찾았어요', '넉 달째 저녁마다 두드러기가 올라오고 가려움이 심합니다. 피부 검사도 받았고 내과도 갔는데 원인을 못 찾았습니다. 비슷한 경험 있으신 분 계실까요.', 'public', '2026-04-10', 'fluctuating', 'severe', ARRAY['otc', 'clinic']::text[], ARRAY['skin']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"dermatology","label":"피부과","matchedKeywords":["두드러기","가려움","피부"],"score":3}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['dermatology']::text[], null, null, false, '2026-07-25T11:00:00.000Z'),
  ('00000000-0000-4000-8000-0000acf16a7b', '00000000-0000-4000-8000-0000d0b8b5e4', '두 달째 잠이 안 옵니다', '누워도 두세 시간은 뒤척이고 새벽에 자꾸 깹니다. 불안한 생각이 계속 돕니다.', 'public', '2026-06-08', 'worsening', 'severe', ARRAY['rest']::text[], ARRAY['mind']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"psychiatry","label":"정신건강의학과","matchedKeywords":["잠","불안"],"score":3}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['psychiatry']::text[], null, null, false, '2026-08-05T22:30:00.000Z'),
  ('00000000-0000-4000-8000-00004477decb', '00000000-0000-4000-8000-0000d0b8d969', '식후 속쓰림이 반복됩니다', '한 달 전부터 밥 먹고 나면 속이 쓰리고 신물이 올라옵니다.', 'specialty-only', '2026-07-06', 'unchanged', 'mild', ARRAY['otc']::text[], ARRAY['digestive']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"internal-medicine","label":"내과","matchedKeywords":["속쓰림"],"score":3}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['internal-medicine']::text[], null, null, false, '2026-08-07T13:20:00.000Z'),
  ('00000000-0000-4000-8000-0000f66f93e8', '00000000-0000-4000-8000-0000d0b8c228', '지난번 처방 이후 경과를 여쭙습니다', '지난 진료에서 받은 약을 다 먹었는데 코막힘이 조금 남았습니다. 같은 증상입니다.', 'prior-clinic-only', '2026-07-27', 'improving', 'mild', ARRAY['clinic']::text[], ARRAY['ent']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"otolaryngology","label":"이비인후과","matchedKeywords":["코막힘"],"score":3}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['otolaryngology']::text[], 'clinic-han', '2026-06-02', true, '2026-08-09T08:40:00.000Z'),
  ('00000000-0000-4000-8000-0000c3800d1f', '00000000-0000-4000-8000-0000d0b8d969', '계단 내려갈 때만 무릎이 시큰합니다', '3주 전부터 계단을 내려갈 때 오른쪽 무릎이 시큰합니다. 평지에서는 괜찮습니다.', 'public', '2026-07-19', 'unchanged', 'mild', ARRAY['rest']::text[], ARRAY['musculoskeletal']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"orthopedics","label":"정형외과","matchedKeywords":["무릎"],"score":3}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['orthopedics']::text[], null, null, false, '2026-08-06T18:00:00.000Z'),
  ('00000000-0000-4000-8000-0000064e5ed5', '00000000-0000-4000-8000-0000d0b8c228', '눈이 자꾸 충혈되는데 안약을 계속 써도 될까요', '한 달 전부터 아침마다 눈이 충혈됩니다. 약국 안약을 쓰면 잠깐 나아졌다가 다시 돌아옵니다.', 'public', '2026-07-05', 'fluctuating', 'mild', ARRAY['otc']::text[], ARRAY['eye']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"ophthalmology","label":"안과","matchedKeywords":["눈","충혈"],"score":2}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['ophthalmology']::text[], null, null, false, '2026-08-04T08:15:00.000Z'),
  ('00000000-0000-4000-8000-0000ac0e30c0', '00000000-0000-4000-8000-0000d0b8b5e4', '아이가 밤에만 기침을 심하게 합니다', '다섯 살 아이인데 낮에는 멀쩡하다가 눕기만 하면 기침을 합니다. 열은 없습니다.', 'public', '2026-07-30', 'worsening', 'disruptive', ARRAY['none']::text[], ARRAY['child', 'ent']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"otolaryngology","label":"이비인후과","matchedKeywords":["기침"],"score":3},{"specialty":"pediatrics","label":"소아청소년과","matchedKeywords":["아이"],"score":2}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['otolaryngology', 'pediatrics']::text[], null, null, false, '2026-08-02T21:40:00.000Z'),
  ('00000000-0000-4000-8000-0000749f856b', '00000000-0000-4000-8000-0000d0b8d969', '자도 자도 피로가 안 풀립니다', '두 달째 여덟 시간을 자도 아침에 몸이 무겁습니다. 체중도 조금 줄었습니다.', 'public', '2026-06-01', 'unchanged', 'disruptive', ARRAY['rest']::text[], ARRAY['general']::text[], '{}', null, '[]'::jsonb, '{"suggestions":[{"specialty":"family-medicine","label":"가정의학과","matchedKeywords":[],"score":2},{"specialty":"internal-medicine","label":"내과","matchedKeywords":["피로","체중"],"score":2}],"redFlags":[],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, ARRAY['family-medicine', 'internal-medicine']::text[], null, null, false, '2026-07-30T10:00:00.000Z'),
  ('00000000-0000-4000-8000-0000ac0e22a5', '00000000-0000-4000-8000-0000d0b8b5e4', '가슴통증이 있었는데 그냥 둬도 될까요', '어제 가슴 통증이 있었고 식은땀도 났습니다. 지금은 괜찮아졌는데 걱정됩니다.', 'public', '2026-08-08', 'improving', 'disruptive', ARRAY['none']::text[], '{}', '{}', null, '[]'::jsonb, '{"suggestions":[],"redFlags":[{"id":"chest-pain","label":"가슴 통증 또는 압박감","guidance":"심근경색 등 응급 가능성이 있습니다. 지금 119에 연락하거나 응급실로 가세요.","matchedKeywords":["가슴통증","가슴 통증","식은땀"]}],"ruleSetName":"진료과 분류 시연 규칙","ruleSetAsOf":"2026-08-09"}'::jsonb, '{}', null, null, false, '2026-08-09T07:05:00.000Z')
on conflict (id) do nothing;

insert into answers (id, question_id, doctor_id, body, created_at)
values
  ('00000000-0000-4000-8000-00006ad177a3', '00000000-0000-4000-8000-0000c3816faf', '00000000-0000-4000-8000-0000d76bee1e', '2주 넘게 이어지는 코막힘은 단순 감기보다 비염이나 부비동 문제를 함께 봅니다. 밤에 어느 쪽 코가 더 막히는지 확인해 보세요. 진료가 필요하면 프로필에서 이어가실 수 있습니다.', '2026-08-08T12:00:00.000Z'),
  ('00000000-0000-4000-8000-00006ad177a4', '00000000-0000-4000-8000-0000c3816faf', '00000000-0000-4000-8000-000065dfca22', '약국 약으로 2주 이상 변화가 없으면 한 번은 진료로 확인하시는 편이 낫습니다.', '2026-08-08T15:30:00.000Z'),
  ('00000000-0000-4000-8000-000070df9c54', '00000000-0000-4000-8000-0000c3830ca0', '00000000-0000-4000-8000-00007d376277', '저녁에만 반복되는 양상이면 하루 중 시간과 먹은 것, 입은 옷을 2주간 같이 기록해 보시면 좁혀지는 경우가 있습니다.', '2026-07-26T09:00:00.000Z'),
  ('00000000-0000-4000-8000-000070df9c55', '00000000-0000-4000-8000-0000c3830ca0', '00000000-0000-4000-8000-000065dfca7f', '피부만 보지 말고 갑상선이나 다른 전신 원인도 한 번은 확인해 볼 수 있습니다.', '2026-07-27T10:10:00.000Z'),
  ('00000000-0000-4000-8000-0000f1f9cd4f', '00000000-0000-4000-8000-0000acf16a7b', '00000000-0000-4000-8000-0000262a4a5c', '잠들기까지 걸린 시간과 깬 횟수를 2주만 적어 오시면 이야기가 훨씬 빨라집니다.', '2026-08-06T09:20:00.000Z'),
  ('00000000-0000-4000-8000-00009cfe1654', '00000000-0000-4000-8000-0000ac0e30c0', '00000000-0000-4000-8000-0000d76bee1e', '누웠을 때만 심해지는 기침은 코 뒤로 넘어가는 콧물이 원인인 경우가 많습니다. 베개를 조금 높여 재워 보시고, 2주 넘게 이어지면 진료로 확인하세요.', '2026-08-03T09:00:00.000Z'),
  ('00000000-0000-4000-8000-00007c88b03f', '00000000-0000-4000-8000-0000749f856b', '00000000-0000-4000-8000-000065dfca7f', '체중이 함께 줄었다면 수면만의 문제가 아닐 수 있습니다. 기본 혈액검사부터 확인해 보시길 권합니다.', '2026-07-31T11:30:00.000Z')
on conflict (id) do nothing;

insert into empathies (question_id, patient_id, created_at)
values
  ('00000000-0000-4000-8000-0000c3830ca0', '00000000-0000-4000-8000-0000d0b8c228', '2026-08-06T10:00:00.000Z'),
  ('00000000-0000-4000-8000-0000c3830ca0', '00000000-0000-4000-8000-0000d0b8d969', '2026-08-06T10:00:00.000Z'),
  ('00000000-0000-4000-8000-0000c3830ca0', '00000000-0000-4000-8000-0000d0b8b5e4', '2026-08-06T10:00:00.000Z'),
  ('00000000-0000-4000-8000-0000acf16a7b', '00000000-0000-4000-8000-0000d0b8c228', '2026-08-07T21:00:00.000Z'),
  ('00000000-0000-4000-8000-0000acf16a7b', '00000000-0000-4000-8000-0000d0b8d969', '2026-08-07T21:00:00.000Z'),
  ('00000000-0000-4000-8000-0000acf16a7b', '00000000-0000-4000-8000-0000d0b8b5e4', '2026-08-07T21:00:00.000Z'),
  ('00000000-0000-4000-8000-0000c3816faf', '00000000-0000-4000-8000-0000d0b8d969', '2026-08-08T18:00:00.000Z'),
  ('00000000-0000-4000-8000-0000c3816faf', '00000000-0000-4000-8000-0000d0b8b5e4', '2026-08-08T18:00:00.000Z'),
  ('00000000-0000-4000-8000-0000c3816faf', '00000000-0000-4000-8000-0000d0b8c228', '2026-08-08T18:00:00.000Z'),
  ('00000000-0000-4000-8000-0000ac0e22a5', '00000000-0000-4000-8000-0000d0b8d969', '2026-08-09T08:00:00.000Z'),
  ('00000000-0000-4000-8000-0000ac0e22a5', '00000000-0000-4000-8000-0000d0b8b5e4', '2026-08-09T08:00:00.000Z'),
  ('00000000-0000-4000-8000-00004477decb', '00000000-0000-4000-8000-0000d0b8c228', '2026-08-08T09:00:00.000Z'),
  ('00000000-0000-4000-8000-00004477decb', '00000000-0000-4000-8000-0000d0b8d969', '2026-08-08T09:00:00.000Z'),
  ('00000000-0000-4000-8000-00004477decb', '00000000-0000-4000-8000-0000d0b8b5e4', '2026-08-08T09:00:00.000Z')
on conflict do nothing;
