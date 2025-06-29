import React from 'react';

const Favicon: React.FC = () => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background square with gradient */}
      <rect
        width="32"
        height="32"
        rx="8"
        fill="url(#gradient)"
        transform="rotate(45 16 16)"
      />
      
      {/* Letter S */}
      <path
        d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14C12 12.8954 12.8954 12 14 12H18C19.1046 12 20 12.8954 20 14C20 15.1046 19.1046 16 18 16H14C12.8954 16 12 16.8954 12 18C12 19.1046 12.8954 20 14 20H18C19.1046 20 20 19.1046 20 18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient
          id="gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#9333EA" /> {/* purple-600 */}
          <stop offset="50%" stopColor="#A855F7" /> {/* purple-500 */}
          <stop offset="100%" stopColor="#EC4899" /> {/* pink-500 */}
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Favicon; 