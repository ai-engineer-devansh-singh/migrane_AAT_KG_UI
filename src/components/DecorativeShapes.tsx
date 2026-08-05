export function DecorativeShapes({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background peach blob */}
      <ellipse
        cx="290"
        cy="130"
        rx="100"
        ry="75"
        className="fill-brand-peach"
        opacity="0.9"
      />
      {/* Ochre blob */}
      <circle cx="150" cy="190" r="85" className="fill-brand-ochre" opacity="0.85" />
      {/* Lavender blob */}
      <ellipse
        cx="230"
        cy="250"
        rx="90"
        ry="60"
        className="fill-brand-lavender"
        opacity="0.8"
      />
      {/* Mint accent */}
      <circle cx="345" cy="230" r="32" className="fill-brand-mint" opacity="0.95" />
      {/* Coral dot */}
      <circle cx="95" cy="115" r="22" className="fill-brand-coral" opacity="0.9" />
      {/* Small pink spark */}
      <circle cx="330" cy="95" r="14" className="fill-brand-pink" opacity="0.85" />
    </svg>
  );
}
