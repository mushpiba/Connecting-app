import { clinicScheduleOn, weekFrom, weekdayLabels } from '../domain/clinicHours'
import type { Clinic } from '../domain/types'

interface ClinicScheduleProps {
  clinic: Clinic
  today: string
}

export function ClinicSchedule({ clinic, today }: ClinicScheduleProps) {
  const schedule = clinicScheduleOn(clinic, today)
  const week = weekFrom(clinic)

  return (
    <div className="clinic-schedule">
      <p className={`schedule-status ${schedule.isOpenToday ? 'is-open' : 'is-closed'}`}>
        <span aria-hidden="true">{schedule.isOpenToday ? '●' : '○'}</span>{' '}
        {schedule.isOpenToday
          ? `오늘 진료 ${schedule.today.open}–${schedule.today.close}`
          : `오늘 휴진 · 다음 진료 ${
              schedule.nextOpen ? `${weekdayLabels[schedule.nextOpen.weekday]}요일 ${schedule.nextOpen.open}` : '미정'
            }`}
      </p>

      <ul className="schedule-week">
        {week.map((item) => (
          <li
            key={item.weekday}
            className={item.weekday === schedule.weekday ? 'is-today' : ''}
          >
            <span className="schedule-day">{weekdayLabels[item.weekday]}</span>
            <span className="schedule-time">
              {item.open === null ? '휴진' : `${item.open}–${item.close}`}
            </span>
          </li>
        ))}
      </ul>

      {clinic.lunchBreak && <p className="field-hint">점심시간 {clinic.lunchBreak}</p>}
    </div>
  )
}
