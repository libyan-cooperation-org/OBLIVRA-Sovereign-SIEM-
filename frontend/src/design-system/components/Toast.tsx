import { For } from "solid-js";
import { toastStore } from "../../stores/registry";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-solid";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
const colors = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

export const ToastContainer = () => {
  const { toasts, setToasts } = toastStore;
  return (
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <For each={toasts()}>
        {(t) => {
          const Icon = icons[t.type];
          return (
            <div class={`flex items-center gap-3 px-4 py-3 rounded-xl border glass-card pointer-events-auto ${colors[t.type]} animate-in slide-in-from-right-4 duration-300`} style="min-width:280px">
              <Icon size={16} />
              <span class="text-sm flex-1 text-white">{t.message}</span>
              <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} class="text-muted hover:text-white transition-colors"><X size={14} /></button>
            </div>
          );
        }}
      </For>
    </div>
  );
};
