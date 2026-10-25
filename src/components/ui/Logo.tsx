const NAVY = "#14254A";
const ORANGE = "#F28E2A";

/** The Lobby mark: a house with an orange roof and an "L". `tone="dark"` is the white house for navy backgrounds. Same drawing as /logo.svg. */
export function Logo({ className = "size-9", label, tone = "light" }: { className?: string; label?: string; tone?: "light" | "dark" }) {
  const house = tone === "dark" ? "#FFFFFF" : NAVY;
  const letter = tone === "dark" ? NAVY : "#FFFFFF";
  return (
    <svg viewBox="0 0 120 120" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d="M16 56 L60 18 L104 56 V102 Q104 112 94 112 H26 Q16 112 16 102 Z" fill={house} />
      <path d="M51 62 V88 H69" fill="none" stroke={letter} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 56 L60 14 L110 56" fill="none" stroke={ORANGE} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
