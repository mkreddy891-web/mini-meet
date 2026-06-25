export default function CameraOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 6.5A2.5 2.5 0 0 1 5.5 4h6A2.5 2.5 0 0 1 14 6.5v.7M16 9.7V17.5A2.5 2.5 0 0 1 13.5 20h-8A2.5 2.5 0 0 1 3 17.5v-7c0-.4.08-.78.23-1.12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16.5 10.2 21 7.5v9l-4.5-2.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
