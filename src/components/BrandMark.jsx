// src/components/BrandMark.jsx
// The Elites Mobile Cafe logo mark: a graduation cap rising as steam from a coffee cup.
export default function BrandMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-label="The Elites Mobile Cafe" role="img">
      <defs>
        <linearGradient id="brandBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16233F" />
          <stop offset="55%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#0B5D54" />
        </linearGradient>
        <linearGradient id="brandGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E4A93D" />
          <stop offset="100%" stopColor="#C87F0A" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="256" fill="url(#brandBg)" />
      <path d="M156 268 h176 l-14 118 a26 26 0 0 1-26 23 H196 a26 26 0 0 1-26-23 Z" fill="#FBF8F2" />
      <path d="M332 288 c40 -6 62 20 58 52 c-4 34 -34 50 -66 46" fill="none" stroke="#FBF8F2" strokeWidth="16" strokeLinecap="round" />
      <rect x="146" y="268" width="196" height="14" rx="7" fill="#E4A93D" />
      <path d="M198 250 c-10 -20 8 -28 0 -48 c-8 -20 8 -30 2 -46" fill="none" stroke="#2DD4BF" strokeWidth="10" strokeLinecap="round" opacity="0.85" />
      <path d="M256 250 c-10 -22 10 -30 0 -52 c-8 -20 10 -30 2 -46" fill="none" stroke="#2DD4BF" strokeWidth="10" strokeLinecap="round" />
      <path d="M312 250 c-10 -20 8 -28 0 -48 c-8 -20 8 -30 2 -46" fill="none" stroke="#2DD4BF" strokeWidth="10" strokeLinecap="round" opacity="0.85" />
      <g transform="translate(256 128)">
        <path d="M0 -34 L96 4 L0 42 L-96 4 Z" fill="url(#brandGold)" />
        <path d="M-52 16 L52 16 L52 44 a52 30 0 0 1-104 0 Z" fill="#16233F" />
        <circle cx="0" cy="4" r="8" fill="#FBF8F2" />
        <path d="M92 6 L92 54" stroke="#FBF8F2" strokeWidth="6" strokeLinecap="round" />
        <circle cx="92" cy="60" r="9" fill="#FBF8F2" />
      </g>
    </svg>
  );
}
