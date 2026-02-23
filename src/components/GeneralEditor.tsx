import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface GeneralSettings {
  PayloadDisplayName: string;
  PayloadIdentifier: string;
  PayloadOrganization: string;
  PayloadDescription: string;
  ConsentText: string;
  PayloadRemovalDisallowed: string;
  RemovalDate: string;
}

export const defaultGeneralSettings: GeneralSettings = {
  PayloadDisplayName: "Senza nome",
  PayloadIdentifier: "",
  PayloadOrganization: "",
  PayloadDescription: "",
  ConsentText: "",
  PayloadRemovalDisallowed: "always",
  RemovalDate: "never",
};

interface Props {
  values: GeneralSettings;
  onChange: (values: GeneralSettings) => void;
}

const GeneralEditor = ({ values, onChange }: Props) => {
  const update = (key: keyof GeneralSettings, val: string) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Generali</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Impostazioni generali del profilo di configurazione
          </p>
        </div>

        <div className="space-y-6">
          {/* Nome */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-sm font-medium">Nome</Label>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Nome visualizzato del profilo (mostrato sul dispositivo)
            </p>
            <Input
              value={values.PayloadDisplayName}
              onChange={(e) => update("PayloadDisplayName", e.target.value)}
              placeholder="Senza nome"
              className="h-9"
            />
          </div>

          {/* Identificatore */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-sm font-medium">Identificatore</Label>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Identificatore unico del profilo (l'installazione del profilo su un
              dispositivo sostituirà qualsiasi profilo installato con lo stesso
              identificatore)
            </p>
            <Input
              value={values.PayloadIdentifier}
              onChange={(e) => update("PayloadIdentifier", e.target.value)}
              placeholder="com.example.profile"
              className="h-9 font-mono text-sm"
            />
          </div>

          {/* Organizzazione */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-sm font-medium">Organizzazione</Label>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Nome dell'organizzazione che ha creato il profilo
            </p>
            <Input
              value={values.PayloadOrganization}
              onChange={(e) => update("PayloadOrganization", e.target.value)}
              placeholder="[campo facoltativo]"
              className="h-9"
            />
          </div>

          {/* Descrizione */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-sm font-medium">Descrizione</Label>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Breve descrizione del contenuto o dello scopo del profilo
            </p>
            <Textarea
              value={values.PayloadDescription}
              onChange={(e) => update("PayloadDescription", e.target.value)}
              placeholder="[campo facoltativo]"
              className="min-h-[80px] resize-y"
            />
          </div>

          {/* Messaggio di consenso */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-sm font-medium">Messaggio di consenso</Label>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Un messaggio che verrà mostrato durante l'installazione del profilo
            </p>
            <Textarea
              value={values.ConsentText}
              onChange={(e) => update("ConsentText", e.target.value)}
              placeholder="[campo facoltativo]"
              className="min-h-[80px] resize-y"
            />
          </div>

          {/* Sicurezza */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-sm font-medium">Sicurezza</Label>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Controlla quando il profilo può essere rimosso
            </p>
            <Select
              value={values.PayloadRemovalDisallowed}
              onValueChange={(v) => update("PayloadRemovalDisallowed", v)}
            >
              <SelectTrigger className="h-9 w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Sempre</SelectItem>
                <SelectItem value="with-auth">Con autorizzazione</SelectItem>
                <SelectItem value="never">Mai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rimuovi profilo automaticamente */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-sm font-medium">
              Rimuovi profilo automaticamente
            </Label>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Impostazioni per la rimozione automatica del profilo
            </p>
            <Select
              value={values.RemovalDate}
              onValueChange={(v) => update("RemovalDate", v)}
            >
              <SelectTrigger className="h-9 w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Mai</SelectItem>
                <SelectItem value="after-interval">Dopo un intervallo</SelectItem>
                <SelectItem value="on-date">In una data specifica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default GeneralEditor;
