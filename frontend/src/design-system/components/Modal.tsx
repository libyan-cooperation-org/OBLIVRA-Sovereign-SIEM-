import type { ParentProps } from "solid-js";
import { cn } from "../../utils/cn";

interface ModalProps extends ParentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  class?: string;
}

export const Modal = (props: ModalProps) => {
  if (!props.open) return null;
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={props.onClose} />
      <div class={cn("relative glass-card w-full max-w-lg mx-4 p-6 z-10", props.class)}>
        {props.title && (
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h2 class="text-lg font-semibold">{props.title}</h2>
            <button onClick={props.onClose} class="text-muted hover:text-white transition-colors text-xl leading-none">&times;</button>
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
};
