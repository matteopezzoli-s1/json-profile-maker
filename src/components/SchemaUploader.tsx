import { useCallback, useState } from "react";
import { Upload, Globe, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";

interface Props {
  onSchemaLoaded: (schema: unknown, fileName: string) => void;
}

const SchemaUploader = ({ onSchemaLoaded }: Props) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoadUrl = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const name = url.trim().split("/").pop() || "schema.json";
      onSchemaLoaded(json, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, [url, onSchemaLoaded]);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          onSchemaLoaded(json, file.name);
        } catch {
          alert("File JSON non valido.");
        }
      };
      reader.readAsText(file);
    },
    [onSchemaLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      {/* Top bar accent */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary" />
      
      <div className="w-full max-w-lg text-center">
        <div className="mb-10">
          <img src={logoImg} alt="Smartilio" className="mx-auto mb-6 h-16 w-auto" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Profile Configurator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Carica uno schema JSON per iniziare a configurare i profili MDM
          </p>
        </div>

        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="group flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-card p-12 transition-all hover:border-primary/50 hover:bg-accent/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Trascina il file JSON qui
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              oppure clicca per selezionare
            </p>
          </div>
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleChange}
          />
        </label>

        {/* URL loader */}
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">oppure carica da URL</p>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLoadUrl()}
              placeholder="https://example.com/schema.json"
              className="flex-1 text-sm"
            />
            <Button onClick={handleLoadUrl} disabled={loading || !url.trim()} size="default" className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Carica
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default SchemaUploader;
