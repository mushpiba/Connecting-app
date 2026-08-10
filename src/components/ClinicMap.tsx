import type { Clinic } from '../domain/types'

interface ClinicMapProps {
  clinic: Clinic
}

/**
 * 병원 위치 약도. 지도 API를 부르지 않고 그린 도식이다.
 * 실제 좌표가 아니므로 화면에 약도임을 명시한다.
 */
export function ClinicMap({ clinic }: ClinicMapProps) {
  return (
    <div className="clinic-map">
      <svg
        viewBox="0 0 320 180"
        role="img"
        aria-label={`${clinic.name} 위치 약도`}
        className="clinic-map-canvas"
      >
        <rect width="320" height="180" fill="#eef3f7" />
        <path d="M0 134h320" stroke="#d9e3ea" strokeWidth="16" />
        <path d="M232 0v180" stroke="#d9e3ea" strokeWidth="13" />
        <path d="M0 134h320" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8 9" />
        <path d="M232 0v180" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8 9" />

        <rect x="18" y="16" width="88" height="52" rx="5" fill="#dfe8ee" />
        <rect x="252" y="20" width="56" height="48" rx="5" fill="#dfe8ee" />
        <rect x="22" y="152" width="76" height="20" rx="5" fill="#dfe8ee" />
        <rect x="256" y="150" width="52" height="22" rx="5" fill="#dfe8ee" />

        <g transform="translate(134 24)">
          <path
            d="M14 0A14 14 0 0 0 0 14c0 9.6 14 24 14 24s14-14.4 14-24A14 14 0 0 0 14 0z"
            fill="#1b5f91"
          />
          <circle cx="14" cy="14" r="5.4" fill="#ffffff" />
        </g>

        <g transform="translate(148 76)">
          <rect
            x="-62"
            y="-11"
            width="124"
            height="22"
            rx="11"
            fill="#ffffff"
            stroke="#c9d7e1"
          />
          <text x="0" y="4" textAnchor="middle" fontSize="9.5" fill="#142537">
            {clinic.name.replace(/^가상\s*/, '')}
          </text>
        </g>

        <text x="300" y="172" textAnchor="end" fontSize="7.5" fill="#8fa2b1">
          가상 약도
        </text>
      </svg>

      <dl className="clinic-facts">
        <div>
          <dt>주소</dt>
          <dd>{clinic.address}</dd>
        </div>
        <div>
          <dt>오시는 길</dt>
          <dd>{clinic.landmark}</dd>
        </div>
        <div>
          <dt>전화</dt>
          <dd>{clinic.phone}</dd>
        </div>
      </dl>

      <p className="clinical-caveat">
        실제 지도가 아닌 가상 약도입니다. 주소와 전화번호도 시연용 값입니다.
      </p>
    </div>
  )
}
