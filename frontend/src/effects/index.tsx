// Spotlight mouse-tracking light effect
export const Spotlight = () => {
  let el: HTMLDivElement | undefined;
  const onMove = (e: MouseEvent) => {
    if (!el) return;
    el.style.setProperty("--x", `${e.clientX}px`);
    el.style.setProperty("--y", `${e.clientY}px`);
  };
  document.addEventListener("mousemove", onMove);
  return (
    <div
      ref={el!}
      class="pointer-events-none fixed inset-0 z-0"
      style={{
        background: "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(99,102,241,0.04), transparent 40%)",
        "--x": "50%",
        "--y": "50%",
      } as any}
    />
  );
};

// Animated atmospheric blob background
export const CinematicBlobs = () => (
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-[0.03]"
      style="background: radial-gradient(circle, #6366f1, transparent); animation: pulse 8s ease-in-out infinite;" />
    <div class="absolute top-1/2 -right-40 w-80 h-80 rounded-full opacity-[0.02]"
      style="background: radial-gradient(circle, #4f46e5, transparent); animation: pulse 12s ease-in-out infinite;" />
    <div class="absolute -bottom-40 left-1/3 w-64 h-64 rounded-full opacity-[0.025]"
      style="background: radial-gradient(circle, #818cf8, transparent); animation: pulse 10s ease-in-out infinite;" />
  </div>
);

// Subtle grid overlay
export const TechnicalGrid = () => (
  <div
    class="pointer-events-none fixed inset-0 z-0 opacity-[0.015]"
    style={{
      "background-image": "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
      "background-size": "40px 40px",
    }}
  />
);

// Animated pulse status indicator
export const PulseIndicator = (props: { active?: boolean; color?: string }) => (
  <span class="relative flex h-2.5 w-2.5">
    {props.active !== false && (
      <span
        class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: props.color ?? "#22c55e" }}
      />
    )}
    <span
      class="relative inline-flex rounded-full h-2.5 w-2.5"
      style={{ background: props.color ?? "#22c55e" }}
    />
  </span>
);
