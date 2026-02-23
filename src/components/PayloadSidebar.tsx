import { Search, Plus, Check, Settings } from "lucide-react";
import { useState, useMemo } from "react";
import type { SchemaMap } from "@/types/schema";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  schema: SchemaMap;
  activePayloads: string[];
  selectedPayload: string | null;
  onSelectPayload: (key: string) => void;
  onTogglePayload: (key: string) => void;
}

const PayloadSidebar = ({
  schema,
  activePayloads,
  selectedPayload,
  onSelectPayload,
  onTogglePayload,
}: Props) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const entries = Object.entries(schema);
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      ([key, val]) =>
        key.toLowerCase().includes(q) ||
        val.displayName.toLowerCase().includes(q)
    );
  }, [schema, search]);

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-sidebar">
      <div className="border-b border-sidebar-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca payload..."
            className="h-8 bg-secondary pl-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5">
          {/* Generali - always first */}
          <div
            className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              selectedPayload === "__general__"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-secondary"
            }`}
            onClick={() => onSelectPayload("__general__")}
          >
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Generali</span>
          </div>

          <div className="my-1.5 border-t border-sidebar-border" />

          {filtered.map(([key, val]) => {
            const isActive = activePayloads.includes(key);
            const isSelected = selectedPayload === key;
            return (
              <div
                key={key}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-secondary"
                }`}
                onClick={() => {
                  if (isActive) {
                    onSelectPayload(key);
                  } else {
                    onTogglePayload(key);
                    onSelectPayload(key);
                  }
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePayload(key);
                    if (isActive && selectedPayload === key) {
                      onSelectPayload("");
                    } else if (!isActive) {
                      onSelectPayload(key);
                    }
                  }}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {isActive && <Check className="h-3 w-3" />}
                  {!isActive && (
                    <Plus className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </button>
                <span className="truncate">{val.displayName}</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-sidebar-border px-3 py-2 text-xs text-muted-foreground">
        {activePayloads.length} payload attivi
      </div>
    </div>
  );
};

export default PayloadSidebar;
