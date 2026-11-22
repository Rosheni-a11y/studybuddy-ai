import { useState } from 'react'

function SvgMascot({ size }) {
  return (
    <svg
      className="mascot"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label="StudyBuddy mascot"
    >
      <ellipse cx="80" cy="148" rx="42" ry="7" fill="#f1dfcb" />
      <ellipse cx="58" cy="138" rx="15" ry="7" fill="#d89870" />
      <ellipse cx="102" cy="138" rx="15" ry="7" fill="#d89870" />
      <rect x="22" y="38" width="116" height="100" rx="44" fill="#e8bb98" />
      <rect x="31" y="47" width="98" height="82" rx="36" fill="#fff6ea" />
      <path d="M104 36 v28 l9 -7 l9 7 v-28z" fill="#ff9f8a" />
      <g className="eye">
        <circle cx="62" cy="86" r="7" fill="#54323d" />
        <circle cx="64.5" cy="83.5" r="2.4" fill="#fff" />
      </g>
      <g className="eye">
        <circle cx="98" cy="86" r="7" fill="#54323d" />
        <circle cx="100.5" cy="83.5" r="2.4" fill="#fff" />
      </g>
      <ellipse cx="50" cy="100" rx="8" ry="5" fill="#ffbfae" opacity="0.85" />
      <ellipse cx="110" cy="100" rx="8" ry="5" fill="#ffbfae" opacity="0.85" />
      <path
        d="M70 99 Q80 110 90 99"
        fill="none"
        stroke="#54323d"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <g transform="rotate(28 134 104)">
        <rect x="128" y="74" width="12" height="42" rx="3" fill="#ffd66b" />
        <path d="M128 116 h12 l-6 12z" fill="#ffe8c2" />
        <path d="M131.5 124 h5 l-2.5 4z" fill="#54323d" />
        <rect x="128" y="68" width="12" height="9" rx="3" fill="#ff9f8a" />
      </g>
      <path
        className="spark spark-a"
        d="M24 28 Q24 36 32 36 Q24 36 24 44 Q24 36 16 36 Q24 36 24 28z"
        fill="#9be3c4"
      />
      <path
        className="spark spark-b"
        d="M140 22 Q140 28 146 28 Q140 28 140 34 Q140 28 134 28 Q140 28 140 22z"
        fill="#ffc8a8"
      />
    </svg>
  )
}

export default function Mascot({ size = 120 }) {
  const [useImage, setUseImage] = useState(true)

  if (useImage) {
    return (
      <img
        className="mascot mascot-img"
        src="/mascot.webp"
        width={size}
        height={size}
        alt="StudyBuddy mascot"
        onError={() => setUseImage(false)}
      />
    )
  }
  return <SvgMascot size={size} />
}
