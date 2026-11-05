// src/components/BrandMark.jsx
// The Elites Mobile Cafe logo mark: a gold graduation cap over a bold "E" on a teal tile.
export default function BrandMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-label="The Elites Mobile Cafe" role="img">
      <defs>
        <linearGradient id="brandBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14907F" />
          <stop offset="1" stopColor="#063F37" />
        </linearGradient>
        <linearGradient id="brandGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD25E" />
          <stop offset="1" stopColor="#E39A1F" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#brandBg)" />
      <path d="M190 152 v46 q66 36 132 0 v-46 z" fill="#052F29" />
      <path d="M256 70 L408 130 L256 190 L104 130 Z" fill="url(#brandGold)" />
      <path d="M408 130 v62" stroke="#FFD25E" strokeWidth="8" strokeLinecap="round" />
      <circle cx="408" cy="202" r="12" fill="#FFD25E" />
      <g fill="#FFFFFF">
        <rect x="164" y="236" width="62" height="208" rx="16" />
        <rect x="164" y="236" width="184" height="52" rx="16" />
        <rect x="164" y="314" width="144" height="52" rx="16" />
        <rect x="164" y="392" width="184" height="52" rx="16" />
      </g>
    </svg>
  );
}
