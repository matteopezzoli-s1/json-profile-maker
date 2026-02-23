import { useState, useCallback } from "react";
import { Download, ArrowLeft, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMobileconfig } from "@/lib/mobileconfig";
import type { SchemaMap } from "@/types/schema";
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
  const [payloadValues, setPayloadValues] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    ...defaultGeneralSettings,
    PayloadIdentifier: `com.configurator.${crypto.randomUUID().slice(0, 8)}`,
  });

  const handleTogglePayload = useCallback((key: string) => {
    setActivePayloads((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const handleValueChange = useCallback(
    (payloadKey: string, field: string, value: unknown) => {
      setPayloadValues((prev) => ({
        ...prev,
        [payloadKey]: {
          ...(prev[payloadKey] || {}),
          [field]: value,
        },
      }));
    },
    []
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

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
        </div>
        <Button
          onClick={handleDownload}
          disabled={activePayloads.length === 0}
          size="sm"
          className="gap-2"
        >
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
          onSelectPayload={(k) => setSelectedPayload(k || null)}
          onTogglePayload={handleTogglePayload}
        />

        <main className="flex-1 overflow-hidden bg-background">
          {selectedPayload === "__general__" ? (
            <GeneralEditor
              values={generalSettings}
              onChange={setGeneralSettings}
            />
          ) : selectedDef && selectedPayload ? (
            <PayloadEditor
              payloadKey={selectedPayload}
              definition={selectedDef}
              values={payloadValues[selectedPayload] || {}}
              onChange={handleValueChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <FileJson className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">
                  Seleziona un payload
                </p>
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
