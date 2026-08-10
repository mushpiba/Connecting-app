import type { Doctor } from '../domain/types'

/**
 * 의사 사진 자리. 실제 인물 사진 대신 id에서 색을 뽑아 그린 가상 초상이다.
 * 실존 인물의 얼굴을 쓰지 않으면서 사진이 들어갈 자리와 크기를 보여준다.
 */
function toneOf(id: string): { skin: string; hair: string; coat: string; back: string } {
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const palettes = [
    { skin: '#f2d3bd', hair: '#2f2a28', coat: '#e9eef3', back: '#dceef1' },
    { skin: '#e8c3a5', hair: '#3a2f2a', coat: '#eef1f5', back: '#e2ecf7' },
    { skin: '#f4dcc6', hair: '#4a3a2c', coat: '#eaeef2', back: '#e6f0e8' },
    { skin: '#e5bfa0', hair: '#241f1d', coat: '#edf1f4', back: '#f0eadf' },
  ]
  return palettes[seed % palettes.length]
}

interface DoctorPortraitProps {
  doctor: Doctor
  size: number
}

export function DoctorPortrait({ doctor, size }: DoctorPortraitProps) {
  const tone = toneOf(doctor.id)
  const clipId = `portrait-clip-${doctor.id}`

  return (
    <svg
      className="doctor-portrait"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${doctor.name} 가상 프로필 사진`}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="64" height="64" fill={tone.back} />
        <path d="M6 64c2-14 12-20 26-20s24 6 26 20z" fill={tone.coat} />
        <path d="M26 44h12v8H26z" fill={tone.skin} />
        <circle cx="32" cy="27" r="13" fill={tone.skin} />
        <path d="M19 26c0-9 6-14 13-14s13 5 13 14c-3-4-7-6-13-6s-10 2-13 6z" fill={tone.hair} />
        <circle cx="27" cy="28" r="1.6" fill="#3a3330" />
        <circle cx="37" cy="28" r="1.6" fill="#3a3330" />
        <path
          d="M29 34c1.8 1.4 4.2 1.4 6 0"
          fill="none"
          stroke="#b98a72"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M32 44l-5 20h10z" fill="#ffffff" opacity="0.85" />
        <circle cx="32" cy="53" r="1.8" fill="#2373aa" />
      </g>
    </svg>
  )
}
