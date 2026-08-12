import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TriageSummary } from '../../components/TriageSummary'
import { appClassifier } from '../../data/classifier'
import { demoClinics, demoRegions } from '../../data/demoClinics'
import { triageRuleSet } from '../../data/rules/triageRules'
import { triage } from '../../domain/triage'
import { chipGroupsFor } from '../../data/rules/symptomChips'
import { questionsFor } from '../../data/rules/questionBank'
import { isLiveMode } from '../../data/supabaseClient'
import { canChoosePriorClinicOnly, inferAreas, symptomDurationDays } from '../../domain/intake'
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

function answerValues(answers: IntakeForm['intakeAnswers'], questionId: string): string[] {
  return answers.find((item) => item.questionId === questionId)?.values ?? []
}

function withAnswer(
  answers: IntakeForm['intakeAnswers'],
  questionId: string,
  values: string[],
): IntakeForm['intakeAnswers'] {
  const kept = answers.filter((item) => item.questionId !== questionId)
  return values.length === 0 ? kept : [...kept, { questionId, values }]
}

const painLabels: Record<number, string> = {
  1: '거의 안 아픔',
  10: '참기 어려움',
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
  selectedSymptoms: [],
  painLevel: null,
  intakeAnswers: [],
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

  /**
   * 부위 체크를 건너뛰어도 적은 내용에서 범주를 잡아 그 범주의 문항을 연다.
   * 환자가 자기 증상이 어느 과인지 아는 경우는 드물다.
   */
  const activeAreas = inferAreas(
    form.bodyAreas,
    triage(`${form.title} ${form.body}`, triageRuleSet),
  )

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
    // 분류를 기다리는 동안에도 화면은 넘어간다. 늦는 것이 막는 것이 되면 안 된다.
    setStep('result')
    setResult(
      await appClassifier.classify({
        text: `${form.title} ${form.body}`,
        bodyAreas: form.bodyAreas,
      }),
    )
  }

  const publish = async () => {
    if (!result) return
    const question: Question = {
      id: `q-local-${state.questions.length + 1}`,
      patientId: state.patientId,
      title: form.title,
      body: form.body,
      createdAt: nowIso(),
      triage: result,
      priorVisit: form.priorVisit,
      sameSymptoms: form.sameSymptoms,
      visibility: form.visibility,
      onsetDate: form.onsetDate,
      course: form.course,
      dailyImpact: form.dailyImpact,
      triedRemedies: form.triedRemedies,
      bodyAreas: form.bodyAreas,
      selectedSymptoms: form.selectedSymptoms,
      painLevel: form.painLevel,
      intakeAnswers: form.intakeAnswers,
    }
    try {
      setPosted(await publishQuestion(question))
    } catch {
      // 실패 사유는 상단 안내에 이미 떠 있다.
    }
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
          <button
            type="button"
            className="ask-submit"
            aria-label="사연 등록"
            onClick={() => void publish()}
          >
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
          {/*
            고칠 수 없다는 것은 다 쓰고 나서 알려 줄 일이 아니다. 그때 알면 이미
            늦었고, 되돌리려면 처음부터 다시 써야 한다.
          */}
          <p className="publish-warning">
            <strong>올린 뒤에는 고칠 수 없습니다.</strong> 답변이 무엇을 보고 쓴 것인지 남아야
            하기 때문입니다. 빠뜨린 내용은 나중에 덧붙일 수 있습니다.
          </p>

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
          {/*
            글이 어디로 가는지는 구현 세부가 아니라 동의를 받아야 하는 사실이다.
            어느 과인지 고르려고 적은 글을 모델 제공자에게 보낸다.
          */}
          {isLiveMode && (
            <p className="field-hint">
              어느 과로 가면 좋을지 고르기 위해 적어 주신 글을 인공지능 분석에 보냅니다. 이
              데모에는 실제 증상이나 개인정보를 적지 마세요.
            </p>
          )}
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
            max={todayIso()}
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

          {chipGroupsFor(activeAreas).map((group) => (
            <fieldset key={group.area} className="symptom-chip-group">
              <legend>{group.label} 증상</legend>
              <p className="tip-line">TIP {group.tip}</p>
              <div className="symptom-chips">
                {group.chips.map((chip) => {
                  const on = form.selectedSymptoms.includes(chip.keyword)
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      className={`symptom-chip ${on ? 'is-active' : ''}`}
                      aria-pressed={on}
                      onClick={() =>
                        update({ selectedSymptoms: toggle(form.selectedSymptoms, chip.keyword) })
                      }
                    >
                      <span aria-hidden="true">{on ? '✓' : '+'}</span> {chip.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}

          {/*
            여기부터는 없어도 글이 올라간다. 아픈 사람이 스물여섯 칸을 다 보고
            시작하면 거기서 그만둔다. 꼭 필요한 것만 펼쳐 두고 나머지는 접는다.
            지우지는 않는다. 적어 준 만큼 답변이 정확해지는 것도 사실이다.
          */}
          <details className="optional-block">
            <summary>
              <strong>더 적으면 답변이 정확해져요</strong>
              <span>아픈 정도, 추가 문진, 일상 지장, 해본 것 · 안 적어도 올라갑니다</span>
            </summary>

          <fieldset className="pain-scale">
            <legend>아픈 정도를 골라주세요 (선택)</legend>
            <p className="field-hint">
              환자분이 느끼는 대로 고르시면 됩니다. 이 숫자로 판정하지 않고 의사에게 그대로
              전달합니다.
            </p>
            <div className="pain-buttons" role="group" aria-label="아픈 정도 1에서 10">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`pain-button ${form.painLevel === level ? 'is-active' : ''}`}
                  aria-pressed={form.painLevel === level}
                  onClick={() => update({ painLevel: form.painLevel === level ? null : level })}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="pain-legend">
              <span>{painLabels[1]}</span>
              <span>{painLabels[10]}</span>
            </div>
            <p className="source-note">NRS 숫자통증척도</p>
          </fieldset>

          {/* 부위를 고르면 그 부위에서 의사가 실제로 묻는 것들이 열린다. */}
          {questionsFor(activeAreas, form.selectedSymptoms).map((question) => {
            const values = answerValues(form.intakeAnswers, question.id)
            const setValues = (next: string[]) =>
              update({ intakeAnswers: withAnswer(form.intakeAnswers, question.id, next) })

            return (
              <fieldset key={question.id} className="bank-question">
                <legend>{question.label}</legend>
                {question.help && <p className="field-hint">{question.help}</p>}

                {question.kind === 'number' && (
                  <span className="number-answer">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={question.min}
                      max={question.max}
                      value={values[0] ?? ''}
                      aria-label={question.label}
                      onChange={(event) =>
                        setValues(event.target.value === '' ? [] : [event.target.value])
                      }
                    />
                    {question.unit && <span className="unit">{question.unit}</span>}
                  </span>
                )}

                {(question.kind === 'single' || question.kind === 'multi') && (
                  <div className="option-chips">
                    {question.options?.map((option) => {
                      const on = values.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`symptom-chip ${on ? 'is-active' : ''}`}
                          aria-pressed={on}
                          onClick={() =>
                            setValues(
                              question.kind === 'multi'
                                ? toggle(values, option.value)
                                : on
                                  ? []
                                  : [option.value],
                            )
                          }
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {question.source && <p className="source-note">{question.source}</p>}
              </fieldset>
            )
          })}

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

          </details>

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
                max={todayIso()}
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

      {step === 'result' && !result && (
        <p className="empty-note">적어 주신 내용을 정리하는 중입니다…</p>
      )}

      {step === 'result' && result && (
        <div className="result-block">
          <TriageSummary triage={result} />

          {posted ? (
            <div className="posted-note">
              <p role="status">
                질문을 등록했습니다.{' '}
                {isLiveMode
                  ? '함께 테스트하는 서버에 저장했고, 고른 공개 범위 안의 사람들이 볼 수 있습니다.'
                  : '이 브라우저에만 저장했습니다.'}
              </p>
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
              {/*
                고칠 수 없다면서 무엇을 올리는지는 안 보여 주고 있었다. 확인 화면에
                진료과 판단만 있었다. 올릴 내용을 그대로 세우고, 고칠 자리를 준다.
              */}
              <section className="publish-review" aria-labelledby="publish-review-heading">
                <h2 id="publish-review-heading">이대로 올립니다</h2>
                <dl>
                  <div>
                    <dt>제목</dt>
                    <dd>{form.title}</dd>
                  </div>
                  <div>
                    <dt>증상</dt>
                    <dd className="review-body">{form.body}</dd>
                  </div>
                  <div>
                    <dt>시작한 날</dt>
                    <dd>
                      {form.onsetDate} · {symptomDurationDays(form.onsetDate, todayIso())}일째
                    </dd>
                  </div>
                  {form.painLevel !== null && (
                    <div>
                      <dt>아픈 정도</dt>
                      <dd>10점 중 {form.painLevel}점</dd>
                    </div>
                  )}
                  <div>
                    <dt>공개 범위</dt>
                    <dd>
                      {visibilityOptions.find((option) => option.value === form.visibility)?.label}
                    </dd>
                  </div>
                </dl>
                <div className="review-edits">
                  <button type="button" className="text-action" onClick={() => setStep('symptom')}>
                    증상 고치기
                  </button>
                  <button type="button" className="text-action" onClick={() => setStep('visibility')}>
                    공개 범위 고치기
                  </button>
                </div>
              </section>

              <p className="publish-warning">
                <strong>올린 뒤에는 고칠 수 없습니다.</strong> 지나간 증상 설명이 바뀌면 그 위에
                달린 답변이 무엇을 보고 쓴 것인지 알 수 없어집니다. 빠뜨린 내용은 사연 화면에서
                덧붙일 수 있습니다.
              </p>
              <button type="button" className="primary-cta" onClick={() => void publish()}>
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
