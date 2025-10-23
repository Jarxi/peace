import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 206 150"
    {...props}
  >
    <g stroke="#2C3642" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Handle */}
      <path d="M54 44.5C38.5 44.5 32 28.5 44 21.5" />
      
      {/* Yellow Side */}
      <path fill="#FFB60A" d="M141.5 50.5L181.5 28.5V94.5L141.5 116.5V50.5Z" />
      
      {/* Blue Top */}
      <path fill="#1B8CFE" d="M59.5 50.5H141.5L181.5 28.5H99.5L59.5 50.5Z" />
      
      {/* Green Front (Speech Bubble) */}
      <path fill="#209781" d="M59.5 50.5V116.5H89.5L109.5 142.5L129.5 116.5H141.5V50.5H59.5Z" />

      {/* Dots */}
      <g fill="#2C3642" stroke="none">
        <circle cx="91" cy="83" r="7" />
        <circle cx="111" cy="83" r="7" />
        <circle cx="131" cy="83" r="7" />
      </g>
    </g>
  </svg>
);
