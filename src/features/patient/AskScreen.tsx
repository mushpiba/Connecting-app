import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TriageSummary } from '../../components/TriageSummary'
import { demoClassifier } from '../../data/classifier'
import { demoNowIso, demoToday } from '../../data/demoCalendar'
import { demoClinics, demoRegions } from '../../data/demoClinics'
import { canChoosePriorClinicOnly } from '../../domain/intake'
import { useCommunity } from '../../state/CommunityContext'
import type {
  BodyArea,
  DailyImpact,
  IntakeForm,
  PostVisibility,
  Question,
  SymptomCourse,
  TriageResult,
  TriedRemedy,
} from '../../domain/types'

type Step = 'symptom' | 'history' | 'visibility' | 'result'

const courseOptions: { value: SymptomCourse; label: string }[] = [
  { value: 'worsening', label: '점점 심해져요' },
  { value: 'unchanged', label: '그대로예요' },
  { value: 'fluctuating', label: '좋았다 나빴다 해요' },
  { value: 'improving', label: '좋아지는 중이에요' },
]

const impactOptions: { value: DailyImpact; label: string }[] = [
  { value: 'none', label: '거의 없어요' },
  { value: 'mild', label: '조금 불편해요' },
  { value: 'disruptive', label: '일상에 지장이 있어요' },
  { value: 'severe', label: '잠을 못 잘 정도예요' },
]

const areaOptions: { value: BodyArea; label: string }[] = [
  { value: 'ent', label: '코·목·귀' },
  { value: 'eye', label: '눈' },
  { value: 'skin', label: '피부' },
  { value: 'digestive', label: '배·소화' },
  { value: 'musculoskeletal', label: '허리·관절·근육' },
  { value: 'mind', label: '마음·수면' },
  { value: 'urinary', label: '소변' },
  { value: 'womens', label: '여성 건강' },
  { value: 'child', label: '아이 문제' },
  { value: 'general', label: '감기·몸살·전반' },
  { value: 'unsure', label: '잘 모르겠어요' },
]

const remedyOptions: { value: TriedRemedy; label: string }[] = [
  { value: 'otc', label: '약국 약' },
  { value: 'clinic', label: '병원 진료' },
  { value: 'rest', label: '찜질·휴식' },
  { value: 'none', label: '아무것도 안 함' },
]

const visibilityOptions: { value: PostVisibility; label: string; hint: string }[] = [
  { value: 'public', label: '공개 — 누구나 볼 수 있어요', hint: '여러 과의 의사가 볼 수 있습니다.' },
  {
    value: 'specialty-only',
    label: '비공개 — 관련 진료과 의사에게만',
    hint: '분류된 진료과 의사에게만 보입니다.',
  },
  {
    value: 'prior-clinic-only',
    label: '비공개 — 내가 진료받았던 의사에게만',
    hint: '밝히신 의료기관 소속 의사에게만 보입니다.',
  },
]

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

const emptyForm: IntakeForm = {
  title: '',
  body: '',
  onsetDate: '',
  course: 'unchanged',
  bodyAreas: [],
  dailyImpact: 'mild',
  triedRemedies: [],
  region: demoRegions[0],
  priorVisit: null,
  sameSymptoms: false,
  visibility: 'public',
}

export function AskScreen() {
  const { state, publishQuestion } = useCommunity()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('symptom')
  const [form, setForm] = useState<IntakeForm>(emptyForm)
  const [hasPriorVisit, setHasPriorVisit] = useState(false)
  const [priorClinicId, setPriorClinicId] = useState(demoClinics[0].id)
  const [priorVisitedOn, setPriorVisitedOn] = useState('')
  const [result, setResult] = useState<TriageResult | null>(null)
  const [posted, setPosted] = useState<Question | null>(null)

  const update = (patch: Partial<IntakeForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const priorVisit = hasPriorVisit
    ? { clinicId: priorClinicId, visitedOn: priorVisitedOn, selfReported: true as const }
    : null

  const submitSymptom = (event: React.FormEvent) => {
    event.preventDefault()
    setStep('history')
  }

  const submitHistory = (event: React.FormEvent) => {
    event.preventDefault()
    const next: IntakeForm = {
      ...form,
      priorVisit,
      visibility:
        form.visibility === 'prior-clinic-only' && priorVisit === null ? 'public' : form.visibility,
    }
    setForm(next)
    setStep('visibility')
  }

  const submitVisibility = async (event: React.FormEvent) => {
    event.preventDefault()
    const triage = await demoClassifier.classify({
      text: `${form.title} ${form.body}`,
      bodyAreas: form.bodyAreas,
    })
    setResult(triage)
    setStep('result')
  }

  const publish = () => {
    if (!result) return
    const question: Question = {
      id: `q-local-${state.questions.length + 1}`,
      patientId: state.patientId,
      title: form.title,
      body: form.body,
      createdAt: demoNowIso,
      triage: result,
      priorVisit: form.priorVisit,
      sameSymptoms: form.sameSymptoms,
      visibility: form.visibility,
      onsetDate: form.onsetDate,
      course: form.course,
      dailyImpact: form.dailyImpact,
      triedRemedies: form.triedRemedies,
      bodyAreas: form.bodyAreas,
    }
    publishQuestion(question)
    setPosted(question)
  }

  return (
    <div className="screen ask-screen">
      <div className="ask-header">
        <button type="button" aria-label="질문 작성 닫기" onClick={() => navigate('/home')}>
          <span aria-hidden="true">×</span>
        </button>
        <h1>증상 적어보기</h1>
        {/* 마지막 단계에서만 상단 완료를 연다. 앱에서 익숙한 자리다. */}
        {step === 'result' && result && !posted ? (
          <button type="button" className="ask-submit" aria-label="사연 등록" onClick={publish}>
            <span aria-hidden="true">✓</span>
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
      <p className="step-indicator">
        {step === 'symptom' && '1 / 3 · 증상'}
        {step === 'history' && '2 / 3 · 진료 이력'}
        {step === 'visibility' && '3 / 3 · 공개 범위'}
        {step === 'result' && '정리한 내용을 확인하세요'}
      </p>

      {step === 'symptom' && (
        <form className="intake-form" onSubmit={submitSymptom}>
          <label htmlFor="ask-title">질문 제목</label>
          <input
            id="ask-title"
            type="text"
            maxLength={40}
            required
            placeholder="예) 2주째 콧물과 코막힘이 안 나아요"
            value={form.title}
            onChange={(event) => update({ title: event.target.value })}
          />

          <label htmlFor="ask-body">증상을 자유롭게 적어주세요</label>
          <p className="field-hint" id="ask-body-hint">
            언제부터, 어떤 느낌인지, 무엇을 하면 심해지는지 적어 주시면 도움이 됩니다.
          </p>
          <textarea
            id="ask-body"
            rows={6}
            required
            minLength={10}
            aria-describedby="ask-body-hint"
            value={form.body}
            onChange={(event) => update({ body: event.target.value })}
          />

          <label htmlFor="ask-onset">증상이 시작된 날</label>
          <input
            id="ask-onset"
            type="date"
            required
            max={demoToday}
            value={form.onsetDate}
            onChange={(event) => update({ onsetDate: event.target.value })}
          />

          <fieldset>
            <legend>그 뒤로 어떻게 변했나요</legend>
            {courseOptions.map((option) => (
              <label key={option.value} className="choice">
                <input
                  type="radio"
                  name="course"
                  value={option.value}
                  checked={form.course === option.value}
                  onChange={() => update({ course: option.value })}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>불편한 곳을 골라주세요 (여러 개 가능)</legend>
            {areaOptions.map((option) => (
              <label key={option.value} className="choice">
                <input
                  type="checkbox"
                  checked={form.bodyAreas.includes(option.value)}
                  onChange={() => update({ bodyAreas: toggle(form.bodyAreas, option.value) })}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>일상생활에 얼마나 지장이 있나요</legend>
            {impactOptions.map((option) => (
              <label key={option.value} className="choice">
                <input
                  type="radio"
                  name="impact"
                  value={option.value}
                  checked={form.dailyImpact === option.value}
                  onChange={() => update({ dailyImpact: option.value })}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>지금까지 해본 것</legend>
            {remedyOptions.map((option) => (
              <label key={option.value} className="choice">
                <input
                  type="checkbox"
                  checked={form.triedRemedies.includes(option.value)}
                  onChange={() =>
                    update({ triedRemedies: toggle(form.triedRemedies, option.value) })
                  }
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <button type="submit" className="primary-cta">
            다음
          </button>
          <p className="clinical-caveat">
            증상 정리를 돕는 양식입니다. 진단이나 응급 판단을 대신하지 않습니다.
          </p>
        </form>
      )}

      {step === 'history' && (
        <form className="intake-form" onSubmit={submitHistory}>
          <label htmlFor="ask-region">사는 지역</label>
          <select
            id="ask-region"
            value={form.region}
            onChange={(event) => update({ region: event.target.value })}
          >
            {demoRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <fieldset>
            <legend>최근 6개월 안에 이 증상으로 병원에 간 적이 있나요</legend>
            <label className="choice">
              <input
                type="radio"
                name="prior"
                checked={hasPriorVisit}
                onChange={() => setHasPriorVisit(true)}
              />
              예
            </label>
            <label className="choice">
              <input
                type="radio"
                name="prior"
                checked={!hasPriorVisit}
                onChange={() => setHasPriorVisit(false)}
              />
              아니오
            </label>
          </fieldset>

          {hasPriorVisit && (
            <div className="nested-fields">
              <label htmlFor="ask-clinic">어느 병원이었나요</label>
              <select
                id="ask-clinic"
                value={priorClinicId}
                onChange={(event) => setPriorClinicId(event.target.value)}
              >
                {demoClinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>

              <label htmlFor="ask-visited">언제 진료받으셨나요</label>
              <input
                id="ask-visited"
                type="date"
                required
                max={demoToday}
                value={priorVisitedOn}
                onChange={(event) => setPriorVisitedOn(event.target.value)}
              />

              <fieldset>
                <legend>그때와 같은 증상인가요</legend>
                <label className="choice">
                  <input
                    type="radio"
                    name="same"
                    checked={form.sameSymptoms}
                    onChange={() => update({ sameSymptoms: true })}
                  />
                  예
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="same"
                    checked={!form.sameSymptoms}
                    onChange={() => update({ sameSymptoms: false })}
                  />
                  아니오
                </label>
              </fieldset>
            </div>
          )}

          <p className="clinical-caveat">
            병원 이름과 진료받은 날은 환자분이 직접 밝힌 내용이며, 해당 의료기관 의사에게만 보입니다.
          </p>
          <button type="submit" className="primary-cta">
            다음
          </button>
        </form>
      )}

      {step === 'visibility' && (
        <form className="intake-form" onSubmit={submitVisibility}>
          <fieldset>
            <legend>이 글을 누구에게 보여줄까요</legend>
            {visibilityOptions.map((option) => {
              const blocked =
                option.value === 'prior-clinic-only' && !canChoosePriorClinicOnly(form)
              return (
                <label key={option.value} className={`choice ${blocked ? 'is-muted' : ''}`}>
                  <input
                    type="radio"
                    name="visibility"
                    disabled={blocked}
                    checked={form.visibility === option.value}
                    onChange={() => update({ visibility: option.value })}
                  />
                  {option.label}
                  <span className="choice-hint">
                    {blocked ? '진료 이력을 입력하면 선택할 수 있어요.' : option.hint}
                  </span>
                </label>
              )
            })}
          </fieldset>

          <button type="submit" className="primary-cta">
            정리해서 보기
          </button>
        </form>
      )}

      {step === 'result' && result && (
        <div className="result-block">
          <TriageSummary triage={result} />

          {posted ? (
            <div className="posted-note">
              <p role="status">질문을 등록했습니다. 브라우저 메모리에만 저장했습니다.</p>
              <button
                type="button"
                className="primary-cta"
                onClick={() => navigate(`/questions/${posted.id}`)}
              >
                올린 질문 보기
              </button>
            </div>
          ) : (
            <div className="result-actions">
              <button type="button" className="primary-cta" onClick={publish}>
                게시판에 올리기
              </button>
              <button type="button" className="secondary-button" onClick={() => setStep('symptom')}>
                다시 쓰기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
