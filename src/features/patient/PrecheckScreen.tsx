import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoRegions } from '../../data/demoClinics'
import { eligibilityRuleSet } from '../../data/rules/eligibilityRules'
import { carePrepProgress } from '../../domain/carePrep'
import { isPrecheckComplete } from '../../domain/telemedicine'
import { usePatientSettings } from '../../state/PatientSettingsContext'
import type { EligibilityException } from '../../domain/types'
import { useCommunity } from '../../state/CommunityContext'

const exceptionOptions: { value: EligibilityException; label: string }[] = [
  { value: 'none', label: '해당 없음' },
  { value: 'rare-disease', label: '희귀질환' },
  { value: 'type1-diabetes', label: '1형 당뇨' },
  { value: 'post-op-followup', label: '수술 후 경과관찰' },
  { value: 'correctional-facility', label: '교정시설 수용' },
]

export function PrecheckScreen() {
  const { state, completePrecheck } = useCommunity()
  const { settings } = usePatientSettings()
  const navigate = useNavigate()
  const [region, setRegion] = useState(state.precheck.region)
  const [identityVerified, setIdentityVerified] = useState(state.precheck.identityVerified)
  const [agreed, setAgreed] = useState(state.precheck.agreedToTerms)
  const [count, setCount] = useState(state.precheck.monthlyTelemedicineCount)
  const [exception, setException] = useState<EligibilityException>(state.precheck.exception)

  const done = isPrecheckComplete(state.precheck)
  const prep = carePrepProgress(state.precheck, settings.address.savedAt !== null)
  const params = eligibilityRuleSet.params

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    completePrecheck({
      completedAt: nowIso(),
      identityVerified,
      region,
      monthlyTelemedicineCount: count,
      exception,
      agreedToTerms: agreed,
    })
  }

  return (
    <div className="screen precheck-screen">
      <button type="button" className="text-action" onClick={() => navigate('/me')}>
        ← MY로 돌아가기
      </button>
      <h1>비대면 진료 사전 확인</h1>
      <p className="screen-lead">
        한 번만 확인해 두면 의사 프로필에서 비대면 진료가 가능한지 바로 보입니다.
      </p>

      <ul className="condition-list">
        <li>본인 확인을 마쳐야 합니다.</li>
        <li>
          같은 의료기관에서 최근 {params.revisitValidMonths}개월 안에 같은 증상으로 진료받은 기록이
          있으면 재진으로 봅니다.
        </li>
        <li>초진은 환자와 의료기관이 같은 지역일 때만 가능합니다.</li>
        <li>초진 처방일수는 최대 {params.firstVisitMaxPrescriptionDays}일로 제한됩니다.</li>
        <li>환자 한 명이 한 달에 받을 수 있는 비대면 진료는 {params.monthlyVisitCapPerPatient}회입니다.</li>
        <li>병원급은 희귀질환, 1형 당뇨, 수술 후 경과관찰, 교정시설 등 예외에만 해당합니다.</li>
      </ul>

      <form className="intake-form" onSubmit={submit}>
        <label htmlFor="precheck-region">사는 지역</label>
        <select
          id="precheck-region"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
        >
          {demoRegions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label htmlFor="precheck-count">이번 달 비대면 진료 횟수</label>
        <input
          id="precheck-count"
          type="number"
          min={0}
          max={9}
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
        />

        <label htmlFor="precheck-exception">질환 예외</label>
        <select
          id="precheck-exception"
          value={exception}
          onChange={(event) => setException(event.target.value as EligibilityException)}
        >
          {exceptionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="choice">
          <input
            type="checkbox"
            checked={identityVerified}
            onChange={(event) => setIdentityVerified(event.target.checked)}
          />
          본인 확인을 마쳤습니다 (시연용 체크)
        </label>

        <label className="choice">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          위 조건을 확인했습니다
        </label>

        <button type="submit" className="primary-cta" disabled={!identityVerified || !agreed}>
          사전 확인 마치기
        </button>
      </form>

      <p className="precheck-status" role="status">
        {done ? '비대면 사전 확인 완료' : '비대면 사전 확인 전'}
      </p>

      {/*
        마쳤다는 것이 한 줄 글씨로만 남으면 끝난 줄 모르고 같은 화면을 다시 연다.
        무엇이 끝났고 무엇이 남았는지 낱개로 보이고, 남은 것으로 바로 보낸다.
      */}
      {done && (
        <section className={`precheck-done ${prep.complete ? 'is-complete' : ''}`}>
          <p className="precheck-done-mark" aria-hidden="true">
            {prep.complete ? '✓' : '···'}
          </p>
          <h2>{prep.complete ? '비대면 진료를 받을 수 있습니다' : '사전 확인을 마쳤습니다'}</h2>
          <p className="precheck-done-count">
            {prep.doneCount} / {prep.total} 완료
          </p>
          <ul className="prep-steps">
            {prep.steps.map((step) => (
              <li key={step.id} className={step.done ? 'is-done' : ''}>
                <span aria-hidden="true">{step.done ? '✓' : '○'}</span> {step.label}
              </li>
            ))}
          </ul>
          {prep.complete ? (
            <button type="button" className="primary-cta" onClick={() => navigate('/stories')}>
              답변해 준 의사 찾아보기
            </button>
          ) : (
            <button
              type="button"
              className="primary-cta"
              onClick={() => navigate('/me/address')}
            >
              주소 설정하러 가기
            </button>
          )}
        </section>
      )}
      <p className="clinical-caveat">
        이 확인은 이 기기에만 저장되고 서버로 보내지 않습니다. 실제 본인확인 절차가 아닙니다. 적용 규칙{' '}
        {eligibilityRuleSet.name} · 기준일 {eligibilityRuleSet.asOf}
      </p>
    </div>
  )
}
