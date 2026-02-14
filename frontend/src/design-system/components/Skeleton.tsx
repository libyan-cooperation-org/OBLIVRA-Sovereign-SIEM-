import { cn } from "../../utils/cn";

interface SkeletonProps { class?: string; lines?: number; }

export const Skeleton = (props: SkeletonProps) => (
  <div class={cn("animate-pulse bg-white/5 rounded-lg", props.class)} />
);

export const SkeletonText = (props: { lines?: number; class?: string }) => (
  <div class={cn("space-y-2", props.class)}>
    {Array.from({ length: props.lines || 3 }, (_, i) => (
      <div class={cn("animate-pulse bg-white/5 rounded h-3", i === (props.lines || 3) - 1 ? "w-2/3" : "w-full")} />
    ))}
  </div>
);

export const SkeletonCard = (props: { class?: string }) => (
  <div class={cn("glass-card p-6 space-y-4", props.class)}>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-white/5 rounded-lg animate-pulse" />
      <div class="flex-1 space-y-2">
        <div class="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
        <div class="h-2 bg-white/5 rounded w-1/3 animate-pulse" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);
