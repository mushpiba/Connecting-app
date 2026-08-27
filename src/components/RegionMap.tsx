import type { NearbyClinic } from '../domain/clinicFinder'

interface RegionMapProps {
  region: string
  clinics: NearbyClinic[]
}

/** 핀 자리는 id에서 뽑는다. 실제 좌표가 아니므로 배치만 안정적이면 된다. */
function spotOf(id: string, index: number): { x: number; y: number } {
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const columns = [58, 132, 206, 268]
  return {
    x: columns[(seed + index) % columns.length],
    y: 40 + ((seed * 7 + index * 53) % 90),
  }
}

export function RegionMap({ region, clinics }: RegionMapProps) {
  return (
    <div className="region-map">
      <svg
        viewBox="0 0 320 180"
        role="img"
        aria-label={`${region} 주변 의료기관 약도`}
        className="clinic-map-canvas"
      >
        <rect width="320" height="180" fill="#edf2f1" />
        <path d="M0 128h320" stroke="#d8e2e0" strokeWidth="16" />
        <path d="M0 62h320" stroke="#e2ebe9" strokeWidth="11" />
        <path d="M168 0v180" stroke="#d8e2e0" strokeWidth="13" />
        <path d="M0 128h320" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8 9" />
        <path d="M168 0v180" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8 9" />

        {clinics.map((item, index) => {
          const spot = spotOf(item.clinic.id, index)
          const open = item.firstVisitTelemedicine === 'allowed'
          return (
            <g key={item.clinic.id} transform={`translate(${spot.x} ${spot.y})`}>
              <path
                d="M10 0A10 10 0 0 0 0 10c0 6.8 10 17 10 17s10-10.2 10-17A10 10 0 0 0 10 0z"
                fill={open ? '#0f5c58' : '#8a9c99'}
              />
              <circle cx="10" cy="10" r="3.8" fill="#ffffff" />
            </g>
          )
        })}

        <text x="300" y="172" textAnchor="end" fontSize="7.5" fill="#8a9c99">
          가상 약도
        </text>
      </svg>

      <p className="map-legend">
        <span className="legend-dot is-open" aria-hidden="true" /> 초진 비대면 가능
        <span className="legend-dot is-closed" aria-hidden="true" /> 대면 진료만
      </p>
    </div>
  )
}
