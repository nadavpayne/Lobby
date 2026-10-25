/** The Lobby mark: a round elevator "L" button (navy circle, orange ring). Same drawing as /logo.svg. */
export function Logo({ className = "size-9", label }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="256" cy="256" r="240" fill="#1F3A5F" />
      <circle cx="256" cy="256" r="202" fill="none" stroke="#F2A33A" strokeWidth="26" />
      <path d="M192 156 H244 V310 H326 V356 H192 Z" fill="#F5F1EA" />
    </svg>
  );
}
