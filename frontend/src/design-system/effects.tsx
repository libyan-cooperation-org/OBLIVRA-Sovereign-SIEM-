import { createSignal, onMount, onCleanup } from "solid-js";

export const Spotlight = () => {
  const [pos, setPos] = createSignal({ x: -9999, y: -9999 });
  const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
  onMount(() => window.addEventListener("mousemove", handler));
  onCleanup(() => window.removeEventListener("mousemove", handler));
  return (
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        class="absolute -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] transition-all duration-300 ease-out"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,1) 0%, transparent 70%)", left: `${pos().x}px`, top: `${pos().y}px` }}
      />
    </div>
  );
};

export const CinematicBlobs = () => (
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/[0.03] blur-3xl" style={{ animation: "blob 18s ease-in-out infinite" }} />
    <div class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/[0.04] blur-3xl" style={{ animation: "blob 22s ease-in-out infinite 3s" }} />
    <div class="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-violet-900/[0.03] blur-3xl" style={{ animation: "blob 26s ease-in-out infinite 7s" }} />
  </div>
);

export const TechnicalGrid = () => (
  <div class="pointer-events-none fixed inset-0 z-0" style={{
    "background-image": "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
    "background-size": "48px 48px"
  }} />
);

export const PulseIndicator = (props: { active?: boolean; class?: string }) => (
  <span class={`relative inline-flex h-2.5 w-2.5 ${props.class || ""}`}>
    {props.active && <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
    <span class={`relative inline-flex rounded-full h-2.5 w-2.5 ${props.active ? "bg-emerald-500" : "bg-slate-600"}`} />
  </span>
);
