export function HeroDots({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--foreground) 12%, transparent) 1px, transparent 0)",
        backgroundSize: "22px 22px",
        maskImage: "radial-gradient(ellipse at center, black 20%, transparent 72%)",
      }}
    />
  );
}
