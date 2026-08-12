import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DoctorPortrait } from '../../components/DoctorPortrait'
import { bookingDays, firstOpenDay } from '../../domain/booking'
import { weekdayLabels } from '../../domain/clinicHours'
import { documentOptions, groupSlots } from '../../domain/documents'
import { isLiveMode } from '../../data/supabaseClient'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import type { DocumentType } from '../../domain/types'

const DAY_COUNT = 14

type Step = 'date' | 'time' | 'confirm'

const stepLabels: Record<Step, string> = {
  date: '1 / 3 · 날짜',
  time: '2 / 3 · 시간',
  confirm: '3 / 3 · 확인',
}

export function BookingScreen() {
  const { doctorId } = useParams()
  const { state, requestBooking } = useCommunity()
  const navigate = useNavigate()
  const { findDoctor, findClinic } = useDirectory()

  const doctor = findDoctor(doctorId ?? '')
  const clinic = doctor ? findClinic(doctor.clinicId) : undefined

  const days = clinic ? bookingDays(clinic, todayIso(), DAY_COUNT, nowIso().slice(11, 16)) : []
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState(() => firstOpenDay(days)?.date ?? '')
  const [selectedTime, setSelectedTime] = useState('')
  const [documents, setDocuments] = useState<DocumentType[]>([])

  if (!doctor || !clinic) {
    return (
      <div className="screen">
        <p className="empty-note">의사 정보를 찾지 못했습니다.</p>
        <button type="button" className="secondary-button" onClick={() => navigate('/board')}>
          게시판으로
        </button>
      </div>
    )
  }

  const selectedDay = days.find((day) => day.date === selectedDate)
  const bookingId = `${doctor.id}:${selectedDate}:${selectedTime}`
  /*
   * id 로 찾지 않는다. 서버가 자기 id 를 만들기 때문에 화면이 지어낸 id 와는
   * 영영 만나지 않고, 그러면 전달해 놓고도 전달했다는 화면이 안 뜬다.
   * 의사·날짜·시간이 이 예약을 가리키는 진짜 열쇠다. 서버도 그 셋으로 중복을 막는다.
   */
  const confirmed = state.bookings.find(
    (item) =>
      item.doctorId === doctor.id && item.date === selectedDate && item.time === selectedTime,
  )

  const submit = () => {
    requestBooking({
      id: bookingId,
      doctorId: doctor.id,
      clinicId: clinic.id,
      date: selectedDate,
      time: selectedTime,
      requestedAt: nowIso(),
      documentTypes: documents,
    })
  }

  const toggleDocument = (type: DocumentType) =>
    setDocuments((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    )

  return (
    <div className="screen">
      <h1>초진 대면 진료 예약</h1>
      <p className="step-indicator">{stepLabels[step]}</p>

      <section className="booking-doctor" aria-labelledby="booking-doctor-heading">
        <DoctorPortrait doctor={doctor} size={52} />
        <div>
          <h2 id="booking-doctor-heading">{doctor.name}</h2>
          <p className="doctor-clinic">
            {clinic.name} · {clinic.address}
          </p>
        </div>
      </section>

      {/* 날짜와 시간을 한 화면에 두면 칸이 예순 개를 넘어 어디까지 했는지 사라진다. */}
      {step === 'date' && (
        <section aria-labelledby="booking-date-heading">
          <h2 id="booking-date-heading">언제 진료받으시겠어요</h2>
          <ul className="date-strip" aria-label="예약 가능 날짜">
            {days.map((day) => (
              <li key={day.date}>
                <button
                  type="button"
                  className={`date-chip ${day.date === selectedDate ? 'is-active' : ''}`}
                  disabled={!day.bookable}
                  aria-pressed={day.date === selectedDate}
                  aria-label={`${day.date} ${weekdayLabels[day.weekday]}요일${
                    day.bookable ? '' : day.isOpen ? ' 예약 마감' : ' 휴진'
                  }`}
                  onClick={() => {
                    setSelectedDate(day.date)
                    setSelectedTime('')
                  }}
                >
                  <span className="date-weekday">{weekdayLabels[day.weekday]}</span>
                  <span className="date-day">{Number(day.date.slice(8, 10))}</span>
                  {!day.bookable && (
                    <span className="date-closed">{day.isOpen ? '마감' : '휴진'}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="primary-cta"
            disabled={!selectedDay?.bookable}
            onClick={() => setStep('time')}
          >
            다음
          </button>
        </section>
      )}

      {step === 'time' && (
        <section aria-labelledby="booking-time-heading">
          <h2 id="booking-time-heading">{selectedDate} 몇 시가 좋으세요</h2>

          {!selectedDay || selectedDay.slots.length === 0 ? (
            <p className="empty-note">이 날은 진료하지 않습니다. 다른 날을 골라 주세요.</p>
          ) : (
            groupSlots(selectedDay.slots).map((group) => (
              <div key={group.band} className="slot-band">
                <h3>{group.label}</h3>
                {group.note && <p className="slot-note">{group.note}</p>}
                <ul className="slot-grid" aria-label={`${group.label} 예약 가능 시간`}>
                  {group.slots.map((slot) => (
                    <li key={slot}>
                      <button
                        type="button"
                        className={`slot-chip ${slot === selectedTime ? 'is-active' : ''}`}
                        aria-pressed={slot === selectedTime}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}

          {clinic.lunchBreak && (
            <p className="field-hint">점심시간 {clinic.lunchBreak}은 제외했습니다.</p>
          )}

          <div className="step-actions">
            <button type="button" className="secondary-button" onClick={() => setStep('date')}>
              이전
            </button>
            <button
              type="button"
              className="primary-cta"
              disabled={selectedTime === ''}
              onClick={() => setStep('confirm')}
            >
              다음
            </button>
          </div>
        </section>
      )}

      {step === 'confirm' && (
        <section className="booking-confirm" aria-labelledby="booking-confirm-heading">
          <h2 id="booking-confirm-heading">확인</h2>

          {confirmed ? (
            <div className="booking-receipt">
              <p role="status">
                {confirmed.date} {confirmed.time} 희망 시간을 전달했습니다.
              </p>
              <p className="field-hint">
                병원이 확인해야 예약이 확정됩니다. 확정 연락은 {clinic.phone}에서 옵니다.
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate(`/doctors/${doctor.id}`)}
              >
                프로필로 돌아가기
              </button>
            </div>
          ) : (
            <>
              <p className="booking-preview">
                {selectedDate} {selectedTime} · {clinic.name}
              </p>

              {/* 서류가 진료의 목적인 경우가 있다. 실손 청구나 회사 제출이 그렇다. */}
              <fieldset className="document-picker">
                <legend>진료 후 필요한 서류가 있나요 (선택)</legend>
                {documentOptions.map((option) => (
                  <label key={option.type} className="document-option">
                    <input
                      type="checkbox"
                      checked={documents.includes(option.type)}
                      onChange={() => toggleDocument(option.type)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.purpose}</small>
                    </span>
                  </label>
                ))}
                <p className="field-hint">발급은 병원이 합니다. 신청 내용에 함께 전달됩니다.</p>
              </fieldset>

              <div className="step-actions">
                <button type="button" className="secondary-button" onClick={() => setStep('time')}>
                  이전
                </button>
                <button type="button" className="primary-cta" onClick={submit}>
                  희망 시간 전달
                </button>
              </div>
            </>
          )}

          {/*
            어디에 남는지를 사실대로 적는다. 실제로는 서버에 보내면서 화면으로는
            브라우저에만 둔다고 말하고 있었다. 의료 서비스에서 이건 문구 오류가
            아니라 동의를 잘못 받은 것이다.
          */}
          <p className="clinical-caveat">
            MediVU가 예약을 확정하지 않습니다. 희망 시간을 병원에 전달하는 시연입니다.{' '}
            {isLiveMode
              ? '고른 날짜와 시간은 함께 테스트하는 서버에 저장되고 해당 의사 계정에서 볼 수 있습니다.'
              : '이 브라우저에만 저장되며 어디로도 전송되지 않습니다.'}
          </p>
          <a className="secondary-button" href={clinic.bookingUrl}>
            병원 예약 페이지로 <span aria-hidden="true">›</span>
          </a>
        </section>
      )}
    </div>
  )
}
