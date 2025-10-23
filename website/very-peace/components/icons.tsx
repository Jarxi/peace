import React from 'react';

export const PeaceLogo: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 206 150"
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

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.57-1.023.99-2.11.99-3.217 0-1.207-.53-2.318-1.39-3.217A6.006 6.006 0 006 7.734a6.003 6.003 0 00-3.359 5.482 9.095 9.095 0 003.742.479m4.5-3.218a3.24 3.24 0 00.99-3.217 3.24 3.24 0 00-1.39-3.217 6.008 6.008 0 00-6.963 0 3.24 3.24 0 00-1.39 3.217 3.24 3.24 0 00.99 3.217m6.006-6.42a8.973 8.973 0 00-1.5-3.216 8.973 8.973 0 00-11.01 0c-1.036 1.25-1.5 3.216-1.5 5.482s.464 4.232 1.5 5.482c2.061 2.474 5.345 4.01 8.996 4.01s6.935-1.536 8.996-4.01c1.036-1.25 1.5-3.216 1.5-5.482s-.464-4.232-1.5-5.482z" />
  </svg>
);

export const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.838-5.514A1.875 1.875 0 0018.614 6H6.386a1.875 1.875 0 00-1.789 1.401L2.64 11.25M15 12h-3v3h3v-3z" />
    </svg>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345h5.364c.54 0 .782.73.345 1.087l-4.337 3.16a.563.563 0 00-.182.635l2.125 5.111a.563.563 0 01-.84.609l-4.337-3.16a.563.563 0 00-.635 0l-4.337 3.16a.563.563 0 01-.84-.609l2.125-5.111a.563.563 0 00-.182-.635l-4.337-3.16a.563.563 0 01.345-1.087h5.364a.563.563 0 00.475-.345l2.125-5.111z" />
    </svg>
);

export const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
