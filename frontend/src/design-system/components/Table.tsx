import { For, type JSX } from "solid-js";
import { cn } from "../../utils/cn";

export interface Column<T> { key: string; header: string; render?: (row: T) => JSX.Element; width?: string; }
interface TableProps<T> { columns: Column<T>[]; data: T[]; onRowClick?: (row: T) => void; class?: string; emptyMessage?: string; }

export function Table<T extends Record<string, any>>(props: TableProps<T>) {
  return (
    <div class={cn("overflow-x-auto rounded-xl border border-white/10", props.class)}>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-white/10 bg-white/5">
            <For each={props.columns}>
              {(col) => (
                <th class={cn("text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted", col.width)}>
                  {col.header}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          {props.data.length === 0 ? (
            <tr><td colspan={props.columns.length} class="text-center py-12 text-muted">{props.emptyMessage ?? "No data"}</td></tr>
          ) : (
            <For each={props.data}>
              {(row) => (
                <tr
                  onClick={() => props.onRowClick?.(row)}
                  class={cn("border-b border-white/5 transition-colors", props.onRowClick ? "cursor-pointer hover:bg-white/5" : "")}
                >
                  <For each={props.columns}>
                    {(col) => (
                      <td class="px-4 py-3 text-secondary">
                        {col.render ? col.render(row) : <span class="text-white">{row[col.key]}</span>}
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          )}
        </tbody>
      </table>
    </div>
  );
}
