import React from 'react';

const Logo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="superlink-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#06B6D4" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Stylized S with interlocking links */}
      <path
        d="M44 16c0-6-8-8-12-4-4 4-2 10 4 12l4 2c6 2 8 8 4 12-4 4-12 2-12-4"
        stroke="url(#superlink-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />
      {/* Add a subtle shadow ellipse for depth */}
      <ellipse
        cx="32"
        cy="56"
        rx="16"
        ry="3"
        fill="#06B6D4"
        opacity="0.15"
      />
    </svg>
    <span
      style={{
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
        fontWeight: 700,
        fontSize: size / 2.5,
        letterSpacing: '0.02em',
        color: 'var(--logo-text, #222)',
        background: 'linear-gradient(90deg, #4F46E5 30%, #06B6D4 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
      }}
    >
      Superlink
    </span>
  </div>
);

export default Logo;
