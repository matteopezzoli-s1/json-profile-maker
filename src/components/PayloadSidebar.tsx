import { Search, Plus, Check, Settings, Trash2, RotateCcw } from "lucide-react";
import { useState, useMemo } from "react";
import type { SchemaMap } from "@/types/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  schema: SchemaMap;
  activePayloads: string[];
  selectedPayload: string | null;
  selectedInstance: number;
  payloadValues: Record<string, Record<string, unknown>[]>;
  multiSet: Set<string>;
  onSelectPayload: (key: string, instanceIndex?: number) => void;
  onTogglePayload: (key: string) => void;
  onAddInstance: (key: string) => void;
  onRemoveInstance: (key: string, index: number) => void;
  onClearAll: () => void;
}

const PayloadSidebar = ({
  schema,
  activePayloads,
  selectedPayload,
  selectedInstance,
  payloadValues,
  multiSet,
  onSelectPayload,
  onTogglePayload,
  onAddInstance,
  onRemoveInstance,
  onClearAll,
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
      <div className="flex-1 overflow-y-auto">
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
            const isMulti = multiSet.has(key);
            const instances = payloadValues[key] || [];
            const instanceCount = instances.length;

            return (
              <div key={key}>
                <div
                  className={`group flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected && !isMulti
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : isSelected && isMulti
                      ? "bg-sidebar-accent/50"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => {
                    if (isActive) {
                      onSelectPayload(key, 0);
                    } else {
                      onTogglePayload(key);
                      onSelectPayload(key, 0);
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
                        onSelectPayload(key, 0);
                      }
                    }}
                    className={`mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
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
                  <span className="min-w-0 flex-1 truncate">{val.displayName}</span>
                  {isActive && isMulti && (
                    <button
                      className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddInstance(key);
                      }}
                      title="Aggiungi configurazione"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sub-instances for multi-capable active payloads */}
                {isActive && isMulti && instanceCount > 0 && (
                  <div className="ml-7 space-y-0.5 py-0.5">
                    {instances.map((_, idx) => (
                      <div
                        key={idx}
                        className={`group/inst flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                          isSelected && selectedInstance === idx
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-secondary text-muted-foreground"
                        }`}
                        onClick={() => onSelectPayload(key, idx)}
                      >
                        <span className="flex-1 truncate">
                          Configurazione {idx + 1}
                        </span>
                        {instanceCount > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 shrink-0 opacity-0 group-hover/inst:opacity-100 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveInstance(key, idx);
                            }}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-2">
        <span className="text-xs text-muted-foreground">{activePayloads.length} payload attivi</span>
        {activePayloads.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={onClearAll}
          >
            <RotateCcw className="h-3 w-3" />
            Cancella tutto
          </Button>
        )}
      </div>
    </div>
  );
};

export default PayloadSidebar;
