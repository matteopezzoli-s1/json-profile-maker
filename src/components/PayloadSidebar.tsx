import { Search, Plus, Check, Settings, Trash2, RotateCcw, Shield } from "lucide-react";
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

const PLATFORMS = ["iOS", "macOS", "tvOS", "watchOS"] as const;

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
  const [selectedPlatform, setSelectedPlatform] = useState<string>("iOS");

  const filtered = useMemo(() => {
    const entries = Object.entries(schema);
    // Debug: log all unique platform keys
    if (entries.length > 0) {
      const allKeys = new Set<string>();
      entries.forEach(([, v]) => Object.keys(v.platforms || {}).forEach(k => allKeys.add(k)));
      console.log("[PayloadSidebar] All platform keys in schema:", [...allKeys]);
      console.log("[PayloadSidebar] Selected platform:", selectedPlatform);
      console.log("[PayloadSidebar] Total entries:", entries.length);
    }
    return entries.filter(([key, val]) => {
      if (search) {
        const q = search.toLowerCase();
        if (!key.toLowerCase().includes(q) && !val.displayName.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedPlatform) {
        const platformKeys = Object.keys(val.platforms || {});
        const match = platformKeys.some((p) => p.toLowerCase() === selectedPlatform.toLowerCase());
        if (!match) return false;
      }
      return true;
    });
  }, [schema, search, selectedPlatform]);

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca payload..."
            className="h-8 bg-background pl-8 text-xs"
          />
        </div>
        {/* Platform filter */}
        <div className="flex gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                selectedPlatform === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-1.5">
          {/* Generali - always first */}
          <div
            className={`group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              selectedPayload === "__general__"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent"
            }`}
            onClick={() => onSelectPayload("__general__")}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Generali</span>
          </div>

          <div className="my-1.5 border-t border-border" />

          {filtered.map(([key, val]) => {
            const isActive = activePayloads.includes(key);
            const isSelected = selectedPayload === key;
            const isMulti = multiSet.has(key);
            const instances = payloadValues[key] || [];
            const instanceCount = instances.length;
            const platformInfo = selectedPlatform
              ? Object.entries(val.platforms || {}).find(([p]) => p.toLowerCase() === selectedPlatform.toLowerCase())?.[1]
              : Object.values(val.platforms || {})[0];
            const isSupervised = platformInfo?.supervised === true;

            return (
              <div key={key}>
                <div
                  className={`group flex cursor-pointer items-center rounded-md px-3 py-2 text-sm transition-colors ${
                    isSelected && !isMulti
                      ? "bg-primary text-primary-foreground"
                      : isSelected && isMulti
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent"
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
                    className={`mr-2 flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-card"
                    }`}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {!isActive && (
                      <Plus className="h-2.5 w-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </button>
                  <span className="min-w-0 flex-1 truncate text-xs">{val.displayName}</span>
                  {isSupervised && (
                    <Shield className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  {isActive && isMulti && (
                    <button
                      className={`ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs ${
                        isSelected && !isMulti ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddInstance(key);
                      }}
                      title="Aggiungi configurazione"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Sub-instances */}
                {isActive && isMulti && instanceCount > 0 && (
                  <div className="ml-7 space-y-0.5 py-0.5">
                    {instances.map((_, idx) => (
                      <div
                        key={idx}
                        className={`group/inst flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors ${
                          isSelected && selectedInstance === idx
                            ? "bg-primary/15 text-primary font-medium"
                            : "hover:bg-accent text-muted-foreground"
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
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="text-[10px] text-muted-foreground">{activePayloads.length} payload attivi</span>
        {activePayloads.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-destructive"
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
