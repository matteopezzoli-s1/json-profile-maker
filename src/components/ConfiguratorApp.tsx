import { useState, useCallback, useMemo } from "react";
import { Download, ArrowLeft, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMobileconfig } from "@/lib/mobileconfig";
import type { SchemaMap } from "@/types/schema";
import { supportsMultiple } from "@/lib/payloadUtils";
import PayloadSidebar from "./PayloadSidebar";
import PayloadEditor from "./PayloadEditor";
import GeneralEditor, { defaultGeneralSettings, type GeneralSettings } from "./GeneralEditor";

interface Props {
  schema: SchemaMap;
  fileName: string;
  onReset: () => void;
}

const ConfiguratorApp = ({ schema, fileName, onReset }: Props) => {
  const [activePayloads, setActivePayloads] = useState<string[]>([]);
  const [selectedPayload, setSelectedPayload] = useState<string | null>("__general__");
  const [selectedInstance, setSelectedInstance] = useState(0);
  const [payloadValues, setPayloadValues] = useState<
    Record<string, Record<string, unknown>[]>
  >({});
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    ...defaultGeneralSettings,
    PayloadIdentifier: `com.configurator.${crypto.randomUUID().slice(0, 8)}`,
  });

  const multiSet = useMemo(
    () => new Set(Object.keys(schema).filter((k) => supportsMultiple(schema[k]))),
    [schema]
  );

  const handleTogglePayload = useCallback((key: string) => {
    setActivePayloads((prev) => {
      if (prev.includes(key)) {
        // Remove
        setPayloadValues((pv) => {
          const next = { ...pv };
          delete next[key];
          return next;
        });
        return prev.filter((k) => k !== key);
      }
      // Add with one instance
      setPayloadValues((pv) => ({ ...pv, [key]: [{}] }));
      return [...prev, key];
    });
  }, []);

  const handleAddInstance = useCallback((key: string) => {
    setPayloadValues((prev) => ({
      ...prev,
      [key]: [...(prev[key] || [{}]), {}],
    }));
  }, []);

  const handleRemoveInstance = useCallback(
    (key: string, index: number) => {
      setPayloadValues((prev) => {
        const arr = [...(prev[key] || [])];
        arr.splice(index, 1);
        if (arr.length === 0) return prev; // keep at least 1
        return { ...prev, [key]: arr };
      });
      // Adjust selected instance if needed
      if (selectedPayload === key) {
        setSelectedInstance((si) => {
          const len = (payloadValues[key]?.length || 1) - 1;
          return si >= len ? Math.max(0, len - 1) : si;
        });
      }
    },
    [selectedPayload, payloadValues]
  );

  const handleValueChange = useCallback(
    (payloadKey: string, field: string, value: unknown) => {
      setPayloadValues((prev) => {
        const instances = [...(prev[payloadKey] || [{}])];
        instances[selectedInstance] = {
          ...instances[selectedInstance],
          [field]: value,
        };
        return { ...prev, [payloadKey]: instances };
      });
    },
    [selectedInstance]
  );

  const handleDownload = useCallback(() => {
    const plist = buildMobileconfig(activePayloads, payloadValues, schema, generalSettings);
    const blob = new Blob([plist], {
      type: "application/x-apple-aspen-config",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile.mobileconfig";
    a.click();
    URL.revokeObjectURL(url);
  }, [activePayloads, payloadValues, schema, generalSettings]);

  const selectedDef = selectedPayload && selectedPayload !== "__general__" ? schema[selectedPayload] : null;
  const currentInstances = selectedPayload ? payloadValues[selectedPayload] || [{}] : [{}];

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
        </div>
        <Button onClick={handleDownload} disabled={activePayloads.length === 0} size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Esporta Profilo
        </Button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <PayloadSidebar
          schema={schema}
          activePayloads={activePayloads}
          selectedPayload={selectedPayload}
          selectedInstance={selectedInstance}
          payloadValues={payloadValues}
          multiSet={multiSet}
          onSelectPayload={(k, idx) => {
            setSelectedPayload(k || null);
            setSelectedInstance(idx ?? 0);
          }}
          onTogglePayload={handleTogglePayload}
          onAddInstance={handleAddInstance}
          onRemoveInstance={handleRemoveInstance}
        />

        <main className="flex-1 overflow-hidden bg-background">
          {selectedPayload === "__general__" ? (
            <GeneralEditor values={generalSettings} onChange={setGeneralSettings} />
          ) : selectedDef && selectedPayload ? (
            <PayloadEditor
              payloadKey={selectedPayload}
              definition={selectedDef}
              values={currentInstances[selectedInstance] || {}}
              onChange={handleValueChange}
              instanceIndex={selectedInstance}
              totalInstances={currentInstances.length}
              isMultiple={multiSet.has(selectedPayload)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <FileJson className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Seleziona un payload</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scegli un payload dalla barra laterale per configurarlo
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ConfiguratorApp;
