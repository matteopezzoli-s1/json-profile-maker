import { useState, useCallback, useMemo, useRef } from "react";
import { Download, ArrowLeft, FileJson, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMobileconfig } from "@/lib/mobileconfig";
import { parseMobileconfig } from "@/lib/parseMobileconfig";
import type { SchemaMap } from "@/types/schema";
import { supportsMultiple } from "@/lib/payloadUtils";
import PayloadSidebar from "./PayloadSidebar";
import PayloadEditor from "./PayloadEditor";
import GeneralEditor, { defaultGeneralSettings, type GeneralSettings } from "./GeneralEditor";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // All payloads support multiple instances in MDM profiles
  const multiSet = useMemo(
    () => new Set(Object.keys(schema)),
    [schema]
  );

  const handleTogglePayload = useCallback((key: string) => {
    setActivePayloads((prev) => {
      if (prev.includes(key)) {
        setPayloadValues((pv) => {
          const next = { ...pv };
          delete next[key];
          return next;
        });
        return prev.filter((k) => k !== key);
      }
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
        if (arr.length === 0) return prev;
        return { ...prev, [key]: arr };
      });
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

  const handleClearAll = useCallback(() => {
    setActivePayloads([]);
    setPayloadValues({});
    setSelectedPayload("__general__");
    setSelectedInstance(0);
  }, []);

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

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = parseMobileconfig(reader.result as string);
          setGeneralSettings((prev) => ({ ...prev, ...parsed.general }));
          const grouped: Record<string, Record<string, unknown>[]> = {};
          const types: string[] = [];
          for (const p of parsed.payloads) {
            if (!grouped[p.type]) {
              grouped[p.type] = [];
              types.push(p.type);
            }
            grouped[p.type].push(p.values);
          }
          setActivePayloads(types);
          setPayloadValues(grouped);
          setSelectedPayload("__general__");
          setSelectedInstance(0);
          toast({
            title: "Profilo importato",
            description: `Importati ${parsed.payloads.length} payload da ${file.name}`,
          });
        } catch (err) {
          toast({
            title: "Errore di importazione",
            description: err instanceof Error ? err.message : "File non valido",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [toast]
  );

  const selectedDef = selectedPayload && selectedPayload !== "__general__" ? schema[selectedPayload] : null;
  const currentInstances = selectedPayload ? payloadValues[selectedPayload] || [{}] : [{}];

  return (
    <div className="flex h-screen flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".mobileconfig"
        className="hidden"
        onChange={handleFileImport}
      />
      {/* Header - Smartilio MDM style */}
      <header className="flex h-12 items-center justify-between px-4" style={{ background: 'hsl(var(--header-background))', color: 'hsl(var(--header-foreground))' }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="Smartilio" className="h-7 w-auto brightness-0 invert" />
            <span className="text-xs font-medium opacity-70">|</span>
            <span className="text-sm font-medium opacity-90">{fileName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleImport} variant="ghost" size="sm" className="gap-2 text-white/80 hover:text-white hover:bg-white/10 border border-white/20">
            <Upload className="h-4 w-4" />
            Importa
          </Button>
          <Button onClick={handleDownload} disabled={activePayloads.length === 0} size="sm" className="gap-2 bg-white/20 text-white hover:bg-white/30 border border-white/20">
            <Download className="h-4 w-4" />
            Esporta Profilo
          </Button>
        </div>
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
          onClearAll={handleClearAll}
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
