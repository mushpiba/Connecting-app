/**
 * 픽스처에서 데모 시드 SQL을 뽑는다. 테스트 러너를 빌린 이유는 TypeScript
 * 픽스처를 그대로 import 하기 위해서다. triage 결과를 손으로 옮겨 적으면
 * 규칙이 바뀔 때 조용히 어긋난다.
 *
 * 실행: npx vitest run scripts/emit-demo-seed.test.ts
 */
import { writeFileSync } from 'node:fs'
import { demoAnswers, demoEmpathies, demoPatients, demoQuestions } from '../src/data/demoQuestions'
import { demoDoctors } from '../src/data/demoDoctors'

const NAMESPACE = '00000000-0000-4000-8000-'

/** 픽스처 id를 고정 uuid로 바꾼다. 여러 번 실행해도 같은 값이 나온다. */
function uuidFor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return `${NAMESPACE}${hash.toString(16).padStart(12, '0')}`
}

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function arrayLiteral(values: string[]): string {
  return values.length === 0 ? `'{}'` : `ARRAY[${values.map(quote).join(', ')}]::text[]`
}

function authUser(id: string, name: string): string {
  return `  (${quote(id)}, ${quote(`${name.replace(/\s/g, '')}@demo.invalid`)})`
}

describe('demo seed', () => {
  it('시드 SQL을 만든다', () => {
    const lines: string[] = []

    lines.push('-- 데모 시드 · 픽스처에서 생성한 파일이다. 직접 고치지 않는다.')
    lines.push('-- 만드는 법: npx vitest run scripts/emit-demo-seed.test.ts')
    lines.push('--')
    lines.push('-- 소개용 사연이 미리 들어 있어야 데모를 보여줄 수 있다. 여기에 참여자가')
    lines.push('-- 올린 사연이 얹힌다. 가상 계정은 로그인하지 않는다.')
    lines.push('')

    const people = [
      ...demoPatients.map((patient) => ({ id: uuidFor(patient.id), name: patient.displayName })),
      ...demoDoctors.map((doctor) => ({ id: uuidFor(doctor.id), name: doctor.name })),
    ]

    lines.push('insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)')
    lines.push('values')
    lines.push(
      people
        .map(
          (person) =>
            `  (${quote(person.id)}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${quote(
              `${person.id.slice(-12)}@demo.invalid`,
            )}, now(), now())`,
        )
        .join(',\n'),
    )
    lines.push('on conflict (id) do nothing;')
    lines.push('')

    lines.push(
      'insert into profiles (id, display_name, role, region, license_verified, clinic_id, specialty)',
    )
    lines.push('values')
    lines.push(
      [
        ...demoPatients.map(
          (patient) =>
            `  (${quote(uuidFor(patient.id))}, ${quote(patient.displayName)}, 'patient', ${quote(
              patient.region,
            )}, false, null, null)`,
        ),
        ...demoDoctors.map(
          (doctor) =>
            `  (${quote(uuidFor(doctor.id))}, ${quote(doctor.name)}, 'doctor', '인천 미추홀구', ${
              doctor.licenseVerified
            }, ${quote(doctor.clinicId)}, ${quote(doctor.specialty)})`,
        ),
      ].join(',\n'),
    )
    lines.push('on conflict (id) do nothing;')
    lines.push('')

    lines.push(
      'insert into questions (id, author_id, title, body, visibility, onset_date, course, daily_impact, tried_remedies, body_areas, selected_symptoms, pain_level, intake_answers, triage, specialties, prior_clinic_id, prior_visited_on, same_symptoms, created_at)',
    )
    lines.push('values')
    lines.push(
      demoQuestions
        .map((question) =>
          [
            `  (${quote(uuidFor(question.id))}`,
            quote(uuidFor(question.patientId)),
            quote(question.title),
            quote(question.body),
            quote(question.visibility),
            quote(question.onsetDate),
            quote(question.course),
            quote(question.dailyImpact),
            arrayLiteral(question.triedRemedies),
            arrayLiteral(question.bodyAreas),
            arrayLiteral(question.selectedSymptoms),
            question.painLevel === null ? 'null' : String(question.painLevel),
            `${quote(JSON.stringify(question.intakeAnswers))}::jsonb`,
            `${quote(JSON.stringify(question.triage))}::jsonb`,
            arrayLiteral(question.triage.suggestions.map((item) => item.specialty)),
            question.priorVisit ? quote(question.priorVisit.clinicId) : 'null',
            question.priorVisit ? quote(question.priorVisit.visitedOn) : 'null',
            String(question.sameSymptoms),
            `${quote(question.createdAt)})`,
          ].join(', '),
        )
        .join(',\n'),
    )
    lines.push('on conflict (id) do nothing;')
    lines.push('')

    lines.push('insert into answers (id, question_id, doctor_id, body, created_at)')
    lines.push('values')
    lines.push(
      demoAnswers
        .map(
          (answer) =>
            `  (${quote(uuidFor(answer.id))}, ${quote(uuidFor(answer.questionId))}, ${quote(
              uuidFor(answer.doctorId),
            )}, ${quote(answer.body)}, ${quote(answer.createdAt)})`,
        )
        .join(',\n'),
    )
    lines.push('on conflict (id) do nothing;')
    lines.push('')

    /** 공감은 참여자마다 한 줄이라 가상 환자 셋으로 압축한다. */
    const empathyRows = demoEmpathies.slice(0, 24).map((empathy, index) => {
      const patient = demoPatients[index % demoPatients.length]
      return { questionId: empathy.questionId, patientId: patient.id, at: empathy.at }
    })
    const seen = new Set<string>()
    const uniqueEmpathies = empathyRows.filter((row) => {
      const key = `${row.questionId}:${row.patientId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    lines.push('insert into empathies (question_id, patient_id, created_at)')
    lines.push('values')
    lines.push(
      uniqueEmpathies
        .map(
          (row) =>
            `  (${quote(uuidFor(row.questionId))}, ${quote(uuidFor(row.patientId))}, ${quote(row.at)})`,
        )
        .join(',\n'),
    )
    lines.push('on conflict do nothing;')
    lines.push('')

    writeFileSync('supabase/seed-demo.sql', lines.join('\n'), 'utf-8')
    expect(lines.length).toBeGreaterThan(20)
  })
})
