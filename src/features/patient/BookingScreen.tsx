import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DoctorPortrait } from '../../components/DoctorPortrait'
import { demoNowIso, demoToday } from '../../data/demoCalendar'
import { findClinic } from '../../data/demoClinics'
import { findDoctor } from '../../data/demoDoctors'
import { bookingDays, firstOpenDay } from '../../domain/booking'
import { weekdayLabels } from '../../domain/clinicHours'
import { useCommunity } from '../../state/CommunityContext'

const DAY_COUNT = 14

export function BookingScreen() {
  const { doctorId } = useParams()
  const { state, requestBooking } = useCommunity()
  const navigate = useNavigate()

  const doctor = findDoctor(doctorId ?? '')
  const clinic = doctor ? findClinic(doctor.clinicId) : undefined

  const days = clinic ? bookingDays(clinic, demoToday, DAY_COUNT) : []
  const [selectedDate, setSelectedDate] = useState(() => firstOpenDay(days)?.date ?? '')
  const [selectedTime, setSelectedTime] = useState('')

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
  const confirmed = state.bookings.find((item) => item.id === bookingId)

  const submit = () => {
    requestBooking({
      id: bookingId,
      doctorId: doctor.id,
      clinicId: clinic.id,
      date: selectedDate,
      time: selectedTime,
      requestedAt: demoNowIso,
    })
  }

  return (
    <div className="screen">
      <h1>초진 대면 진료 예약</h1>

      <section className="booking-doctor" aria-labelledby="booking-doctor-heading">
        <DoctorPortrait doctor={doctor} size={52} />
        <div>
          <h2 id="booking-doctor-heading">{doctor.name}</h2>
          <p className="doctor-clinic">
            {clinic.name} · {clinic.address}
          </p>
        </div>
      </section>

      <section aria-labelledby="booking-date-heading">
        <h2 id="booking-date-heading">날짜 선택</h2>
        <ul className="date-strip" aria-label="예약 가능 날짜">
          {days.map((day) => (
            <li key={day.date}>
              <button
                type="button"
                className={`date-chip ${day.date === selectedDate ? 'is-active' : ''}`}
                disabled={!day.isOpen}
                aria-pressed={day.date === selectedDate}
                aria-label={`${day.date} ${weekdayLabels[day.weekday]}요일${day.isOpen ? '' : ' 휴진'}`}
                onClick={() => {
                  setSelectedDate(day.date)
                  setSelectedTime('')
                }}
              >
                <span className="date-weekday">{weekdayLabels[day.weekday]}</span>
                <span className="date-day">{Number(day.date.slice(8, 10))}</span>
                {!day.isOpen && <span className="date-closed">휴진</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="booking-time-heading">
        <h2 id="booking-time-heading">시간 선택</h2>
        {!selectedDay || selectedDay.slots.length === 0 ? (
          <p className="empty-note">이 날은 진료하지 않습니다. 다른 날을 골라 주세요.</p>
        ) : (
          <ul className="slot-grid" aria-label="예약 가능 시간">
            {selectedDay.slots.map((slot) => (
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
        )}
        {clinic.lunchBreak && <p className="field-hint">점심시간 {clinic.lunchBreak}은 제외했습니다.</p>}
      </section>

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
              {selectedDate || '날짜'} {selectedTime || '시간'} · {clinic.name}
            </p>
            <button
              type="button"
              className="primary-cta"
              disabled={!selectedDate || !selectedTime}
              onClick={submit}
            >
              희망 시간 전달
            </button>
          </>
        )}

        <p className="clinical-caveat">
          MediVU가 예약을 확정하지 않습니다. 희망 시간을 병원에 전달하는 시연이며 실제로 전송되지
          않고 브라우저 메모리에만 저장됩니다.
        </p>
        <a className="secondary-button" href={clinic.bookingUrl}>
          병원 예약 페이지로 <span aria-hidden="true">›</span>
        </a>
      </section>
    </div>
  )
}
