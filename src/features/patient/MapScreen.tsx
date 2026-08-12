import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegionMap } from '../../components/RegionMap'
import { demoClinics, demoRegions } from '../../data/demoClinics'
import { demoDoctors } from '../../data/demoDoctors'
import { eligibilityRuleSet } from '../../data/rules/eligibilityRules'
import { findNearbyClinics } from '../../domain/clinicFinder'
import { useCommunity } from '../../state/CommunityContext'
import { usePatientSettings } from '../../state/PatientSettingsContext'

type MapFilter = 'all' | 'telemedicine' | 'open'

export function MapScreen() {
  const { state } = useCommunity()
  const { settings } = usePatientSettings()
  const navigate = useNavigate()

  const [region, setRegion] = useState(settings.address.region || state.precheck.region)
  const [filter, setFilter] = useState<MapFilter>('all')

  const nearby = findNearbyClinics(demoClinics, region, eligibilityRuleSet, todayIso())
  const visible = nearby.filter((item) => {
    if (filter === 'telemedicine') return item.firstVisitTelemedicine === 'allowed'
    if (filter === 'open') return item.openToday
    return true
  })

  return (
    <div className="screen">
      <h1>내 주변 병원</h1>
      <p className="screen-lead">
        내 지역을 기준으로 초진 비대면 진료가 열리는 곳을 함께 표시합니다. 재진은 지역 제한을 받지
        않습니다.
      </p>

      <label htmlFor="map-region">기준 지역</label>
      <select id="map-region" value={region} onChange={(event) => setRegion(event.target.value)}>
        {demoRegions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <RegionMap region={region} clinics={nearby} />

      <div className="segment-tabs" role="tablist" aria-label="병원 필터">
        {([
          ['all', '전체'],
          ['telemedicine', '초진 비대면 가능'],
          ['open', '오늘 진료'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={filter === value ? 'is-active' : ''}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <h2>조건에 맞는 병원이 없어요</h2>
          <p>기준 지역을 바꾸거나 전체 목록에서 확인해 보세요.</p>
        </div>
      ) : (
        <div className="card-list">
          {visible.map((item) => {
            const doctors = demoDoctors.filter(
              (doctor) => doctor.clinicId === item.clinic.id && doctor.licenseVerified,
            )
            return (
              <article className="clinic-result" key={item.clinic.id}>
                <div className="clinic-result-head">
                  <strong>{item.clinic.name}</strong>
                  {item.sameRegion && <span className="specialty-chip">내 지역</span>}
                </div>
                <p className="clinic-result-meta">
                  {item.clinic.region} · {item.clinic.level === 'hospital' ? '병원급' : '의원급'} ·{' '}
                  {item.todayLabel}
                </p>

                {item.firstVisitTelemedicine === 'allowed' ? (
                  <span className="telemedicine-badge">
                    <span aria-hidden="true">◍</span> 초진 비대면 가능
                  </span>
                ) : (
                  <p className="gate-reason">{item.blockedReason}</p>
                )}

                {doctors.length > 0 && (
                  <div className="clinic-result-doctors">
                    {doctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        className="text-link"
                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                      >
                        {doctor.name} <span aria-hidden="true">›</span>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <p className="clinical-caveat">
        실제 지도와 위치 정보가 아닌 가상 약도입니다. 판정 기준 {eligibilityRuleSet.name} · 기준일{' '}
        {eligibilityRuleSet.asOf}
      </p>
    </div>
  )
}
