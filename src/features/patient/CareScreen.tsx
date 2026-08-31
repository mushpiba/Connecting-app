import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegionMap } from '../../components/RegionMap'
import { todayIso } from '../../data/appClock'
import { demoClinics, demoRegions } from '../../data/demoClinics'
import { eligibilityRuleSet } from '../../data/rules/eligibilityRules'
import { priorCarePlaces, upcomingCare } from '../../domain/careTab'
import { findNearbyClinics } from '../../domain/clinicFinder'
import { encounterTrack } from '../../domain/encounterTrack'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { usePatientSettings } from '../../state/PatientSettingsContext'

type MapFilter = 'all' | 'telemedicine' | 'open'

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="section-error" role="alert">
      <p>이 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>
      <button type="button" className="secondary-button" onClick={onRetry}>
        다시 불러오기
      </button>
    </div>
  )
}

function SectionSkeleton({ rows, label }: { rows: number; label: string }) {
  return (
    <div className="card-list" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div className="card-skeleton" key={index} aria-hidden="true">
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}

/**
 * 진료 탭 — 예정된 것 · 다니던 곳 · 주변.
 *
 * 「볼 의사를 아는 환자」라는 한 상태를 통째로 받는 자리다. 지도와 진료 이력을
 * 별개 탭으로 쪼개면 5개 자리에 안 들어가고, 사용자에게도 같은 일이 두 곳에
 * 있는 것처럼 보인다.
 *
 * **위에서부터 급한 순이다.** 진행 중인 것 > 이미 아는 곳 > 새로 찾는 곳. 지도를
 * 맨 위에 두면 이미 예약이 잡힌 사람에게 「또 찾으라」고 말하는 화면이 된다.
 *
 * 그리고 재진의 두 출처를 **섞지 않는다.** 뱃지로 구분하면 스크롤하면서 놓치므로
 * 섹션을 나눈다. 검증 안 된 것이 검증된 것처럼 보이는 것은 배신이다.
 */
export function CareScreen() {
  const { state, loading, loadFailed, reload, addSelfReportedClinic, removeSelfReportedClinic } =
    useCommunity()
  const { settings } = usePatientSettings()
  const { findDoctor, findClinic, clinics, doctors } = useDirectory()
  const navigate = useNavigate()
  const today = todayIso()

  const [region, setRegion] = useState(settings.address.region || state.precheck.region)
  const [filter, setFilter] = useState<MapFilter>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newVisitedOn, setNewVisitedOn] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const upcoming = upcomingCare(state.bookings, state.encounters, state.patientId, today)
  const visited = priorCarePlaces(
    state.bookings,
    state.encounters,
    clinics,
    doctors,
    state.patientId,
    today,
  )
  const selfReported = [...state.selfReportedClinics]
    .filter((item) => item.patientId === state.patientId)
    .sort((left, right) => right.lastVisitedOn.localeCompare(left.lastVisitedOn))

  const nearby = findNearbyClinics(demoClinics, region, eligibilityRuleSet, today)
  const visibleClinics = nearby.filter((item) => {
    if (filter === 'telemedicine') return item.firstVisitTelemedicine === 'allowed'
    if (filter === 'open') return item.openToday
    return true
  })

  const submitNewClinic = (event: FormEvent) => {
    event.preventDefault()
    addSelfReportedClinic(newName.trim(), newVisitedOn)
    setNewName('')
    setNewVisitedOn('')
    setAddOpen(false)
  }

  return (
    <div className="screen">
      <h1>진료</h1>
      <p className="screen-lead">
        예정된 진료와 다니던 곳, 그리고 주변 의원을 한곳에서 봅니다.
      </p>

      {/* 1구역 — 지금 진행 중인 것. 자리를 없애지 않는다. */}
      <section className="care-section" aria-labelledby="care-upcoming-heading">
        <h2 id="care-upcoming-heading">예정된 예약·진료방</h2>
        <p className="sort-note">
          진료방이 열린 것을 맨 위에, 그다음 예약 예정과 신청 대기, 받지 못한 신청 순으로 놓습니다.
          같으면 최신순입니다.
        </p>

        {loading ? (
          <SectionSkeleton rows={2} label="예정된 진료를 불러오는 중" />
        ) : loadFailed ? (
          <SectionError onRetry={reload} />
        ) : upcoming.length === 0 ? (
          <div className="empty-state">
            <h3>예정된 진료가 없어요</h3>
            <p>예약하거나 비대면 진료를 신청하면 여기에서 진행 상황을 봅니다.</p>
          </div>
        ) : (
          <div className="card-list">
            {upcoming.map((item) => {
              if (item.encounter) {
                const track = encounterTrack(
                  item.encounter,
                  findDoctor(item.encounter.doctorId)?.name ?? '의사',
                )
                return (
                  <article
                    className={`encounter-track ${track.roomOpen ? 'is-open' : ''}`}
                    key={item.id}
                  >
                    <h3>{track.headline}</h3>
                    <p className="encounter-track-detail">{track.detail}</p>
                    <ol className="encounter-steps">
                      {track.steps.map((step) => (
                        <li
                          key={step.id}
                          className={`${step.done ? 'is-done' : ''} ${step.current ? 'is-current' : ''}`}
                        >
                          <span aria-hidden="true">{step.done ? '●' : '○'}</span> {step.label}
                        </li>
                      ))}
                    </ol>
                    {track.roomOpen && (
                      <button
                        type="button"
                        className="primary-cta"
                        onClick={() => navigate(`/visit/${track.encounterId}`)}
                      >
                        진료방 들어가기 <span aria-hidden="true">›</span>
                      </button>
                    )}
                  </article>
                )
              }

              const booking = item.booking!
              return (
                <article className="appointment-card" key={item.id}>
                  <span className="status-chip">확정 전</span>
                  <h3>{findClinic(booking.clinicId)?.name ?? '가상 병원'}</h3>
                  <p>
                    {booking.date} · {booking.time}
                  </p>
                  <small>
                    {findDoctor(booking.doctorId)?.name ?? '가상 의사'}에게 희망 시간을
                    전달했습니다.
                  </small>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate(`/doctors/${booking.doctorId}`)}
                  >
                    의사 프로필 보기
                  </button>
                </article>
              )
            })}
          </div>
        )}

        <p className="clinical-caveat">
          병원이 확인하기 전까지 예약은 확정되지 않습니다. 진료방은 신청한 본인만 들어갈 수
          있습니다.
        </p>
      </section>

      {/* 2구역 — 재진. 두 출처를 섹션으로 가른다. */}
      <section className="care-section" aria-labelledby="care-visited-heading">
        <h2 id="care-visited-heading">내가 진료봤던 곳</h2>
        <p className="sort-note">
          마지막 진료일이 가까운 순서로 놓습니다. 두 출처를 섞지 않아 서로 비교되지 않습니다.
        </p>

        {loading ? (
          <SectionSkeleton rows={2} label="진료 이력을 불러오는 중" />
        ) : loadFailed ? (
          <SectionError onRetry={reload} />
        ) : visited.length === 0 && selfReported.length === 0 && !addOpen ? (
          <div className="empty-state">
            <h3>아직 등록된 곳이 없어요</h3>
            <p>
              앱에서 예약하거나 진료를 받으면 자동으로 쌓입니다. 앱 밖에서 다니던 곳은 직접
              추가할 수 있어요.
            </p>
            <div className="empty-state-actions">
              <button type="button" className="primary-cta" onClick={() => setAddOpen(true)}>
                다니는 곳 추가
              </button>
            </div>
          </div>
        ) : (
          <>
            {visited.length > 0 && (
              <>
                <h3 className="care-source-title">앱에서 진료받은 곳</h3>
                <div className="list-card">
                  {visited.map((place) => (
                    <div className="list-row is-static" key={place.clinicId}>
                      <span className="row-title">{place.name}</span>
                      <span className="row-note">
                        마지막 진료 {place.lastVisitedOn}
                        {place.doctorNames.length > 0 ? ` · ${place.doctorNames.join(', ')}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selfReported.length > 0 && (
              <>
                <h3 className="care-source-title">내가 직접 적은 곳</h3>
                <p className="trust-note">
                  내가 적은 내용이며 MediVU가 확인하지 않았습니다. 이 기록으로는 비대면 재진
                  자격이 생기지 않습니다.
                </p>
                <div className="list-card">
                  {selfReported.map((item) => (
                    <div className="list-row is-static" key={item.id}>
                      <span className="row-title">{item.name}</span>
                      <span className="row-note">마지막 진료 {item.lastVisitedOn}</span>
                      <button
                        type="button"
                        className="text-link is-danger"
                        onClick={() => setConfirmRemoveId(item.id)}
                      >
                        지우기
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {confirmRemoveId && (
          <div className="delete-confirm" role="alert">
            <p>직접 적은 기록을 지우면 되돌릴 수 없습니다.</p>
            <div className="step-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmRemoveId(null)}
              >
                그대로 두기
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  removeSelfReportedClinic(confirmRemoveId)
                  setConfirmRemoveId(null)
                }}
              >
                지우기
              </button>
            </div>
          </div>
        )}

        {addOpen ? (
          <form className="settings-form" onSubmit={submitNewClinic}>
            <label>
              의료기관 이름
              <input
                value={newName}
                placeholder="예) 미추홀이비인후과"
                onChange={(event) => setNewName(event.target.value)}
              />
            </label>
            <label>
              마지막 진료일
              <input
                type="date"
                value={newVisitedOn}
                onChange={(event) => setNewVisitedOn(event.target.value)}
              />
            </label>
            <p className="settings-note">
              지역과 전화번호는 받지 않습니다. 확인할 수 없는 값을 늘릴 이유가 없습니다.
            </p>
            <div className="step-actions">
              <button type="button" className="secondary-button" onClick={() => setAddOpen(false)}>
                그만두기
              </button>
              <button
                type="submit"
                className="primary-cta"
                disabled={newName.trim().length < 2 || newVisitedOn === ''}
              >
                추가
              </button>
            </div>
          </form>
        ) : visited.length > 0 || selfReported.length > 0 ? (
          <button type="button" className="secondary-button" onClick={() => setAddOpen(true)}>
            다니는 곳 추가
          </button>
        ) : null}

        <p className="clinical-caveat">
          의료기관 연계로 진료 이력을 「불러오기」는 아직 없습니다. 연결 방식이 정해지면 이 자리에
          들어옵니다.
        </p>
      </section>

      {/* 3구역 — 주변. 제34조의9 예외(지역 내 종합 안내)에 정확히 앉아 있어야 한다. */}
      <section className="care-section" aria-labelledby="care-nearby-heading">
        <h2 id="care-nearby-heading">주변 의원</h2>
        <p className="screen-lead">
          내 지역을 기준으로 초진 비대면 진료가 열리는 곳을 함께 표시합니다. 재진은 지역 제한을
          받지 않습니다.
        </p>

        <label htmlFor="care-region">기준 지역</label>
        <select
          id="care-region"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
        >
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

        <p className="sort-note">
          내 지역을 먼저, 그다음 진료 가능 여부, 같으면 이름 가나다순으로 늘어놓습니다. 노출
          순서를 팔지 않습니다.
        </p>

        {visibleClinics.length === 0 ? (
          <div className="empty-state">
            <h3>조건에 맞는 병원이 없어요</h3>
            <p>기준 지역을 바꾸거나 전체 목록에서 확인해 보세요.</p>
            <div className="empty-state-actions">
              <button type="button" className="secondary-button" onClick={() => setFilter('all')}>
                전체 보기
              </button>
            </div>
          </div>
        ) : (
          <div className="card-list">
            {visibleClinics.map((item) => {
              const clinicDoctors = doctors.filter(
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

                  {clinicDoctors.length > 0 && (
                    <div className="clinic-result-doctors">
                      {clinicDoctors.map((doctor) => (
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
      </section>
    </div>
  )
}
