import { useCallback } from "react";
import type { PayloadDefinition, FieldDefinition } from "@/types/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  payloadKey: string;
  definition: PayloadDefinition;
  values: Record<string, unknown>;
  onChange: (key: string, field: string, value: unknown) => void;
  instanceIndex?: number;
  totalInstances?: number;
  isMultiple?: boolean;
}

/* ── Array of strings ── */
const ArrayOfStringsInput = ({
  value,
  onValueChange,
  itemLabel,
}: {
  value: unknown;
  onValueChange: (val: unknown) => void;
  itemLabel: string;
}) => {
  const items = Array.isArray(value) ? (value as string[]) : [];

  const update = (index: number, v: string) => {
    const next = [...items];
    next[index] = v;
    onValueChange(next);
  };
  const add = () => onValueChange([...items, ""]);
  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onValueChange(next.length > 0 ? next : undefined);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`${itemLabel} ${i + 1}`}
            className="h-9 flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={() => remove(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={add}
      >
        <Plus className="h-3.5 w-3.5" />
        Aggiungi
      </Button>
    </div>
  );
};

/* ── Array of dictionaries ── */
const ArrayOfDictsInput = ({
  value,
  onValueChange,
  subkeys,
}: {
  value: unknown;
  onValueChange: (val: unknown) => void;
  subkeys: Record<string, FieldDefinition>;
}) => {
  // Determine fields inside the dictionary from the subkeys' own subkeys or keep it as free-form key/value
  // Most dict subkeys don't specify inner fields, so we offer a free-form key/value editor
  const items = Array.isArray(value)
    ? (value as Record<string, string>[])
    : [];

  const add = () => onValueChange([...items, {}]);
  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onValueChange(next.length > 0 ? next : undefined);
  };

  const updateField = (index: number, key: string, val: string) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: val };
    onValueChange(next);
  };

  const addField = (index: number) => {
    const next = [...items];
    const existing = Object.keys(next[index] || {});
    const newKey = `key${existing.length + 1}`;
    next[index] = { ...next[index], [newKey]: "" };
    onValueChange(next);
  };

  const removeField = (index: number, key: string) => {
    const next = [...items];
    const copy = { ...next[index] };
    delete copy[key];
    next[index] = copy;
    onValueChange(next);
  };

  const renameField = (index: number, oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const next = [...items];
    const copy = { ...next[index] };
    copy[newKey] = copy[oldKey];
    delete copy[oldKey];
    next[index] = copy;
    onValueChange(next);
  };

  // Get the first subkey description
  const subkeyEntry = Object.values(subkeys)[0];
  const dictLabel = subkeyEntry?.description || "Elemento";

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-background p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {dictLabel} {i + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {Object.entries(item).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <Input
                value={key}
                onChange={(e) => renameField(i, key, e.target.value)}
                className="h-8 w-32 shrink-0 font-mono text-xs"
                placeholder="chiave"
              />
              <Input
                value={val}
                onChange={(e) => updateField(i, key, e.target.value)}
                className="h-8 flex-1 text-xs"
                placeholder="valore"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground"
                onClick={() => removeField(i, key)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground"
            onClick={() => addField(i)}
          >
            <Plus className="h-3 w-3" />
            Aggiungi campo
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={add}
      >
        <Plus className="h-3.5 w-3.5" />
        Aggiungi elemento
      </Button>
    </div>
  );
};

/* ── Single field input ── */
const FieldInput = ({
  name,
  field,
  value,
  onValueChange,
}: {
  name: string;
  field: FieldDefinition;
  value: unknown;
  onValueChange: (val: unknown) => void;
}) => {
  // Enum values
  if (field.values && field.values.length > 0 && field.type === "string") {
    return (
      <Select
        value={(value as string) ?? ""}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Seleziona..." />
        </SelectTrigger>
        <SelectContent>
          {field.values.map((v) => (
            <SelectItem key={String(v)} value={String(v)}>
              {String(v)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Array type
  if (field.type === "array" && field.subkeys) {
    const firstSubkey = Object.values(field.subkeys)[0];
    if (firstSubkey?.type === "string") {
      return (
        <ArrayOfStringsInput
          value={value}
          onValueChange={onValueChange}
          itemLabel={name}
        />
      );
    }
    // dictionary or other complex subkeys
    return (
      <ArrayOfDictsInput
        value={value}
        onValueChange={onValueChange}
        subkeys={field.subkeys}
      />
    );
  }

  switch (field.type) {
    case "boolean":
      return (
        <Switch
          checked={value === true || value === "true"}
          onCheckedChange={onValueChange}
        />
      );
    case "integer":
      return (
        <Input
          type="number"
          step="1"
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) =>
            onValueChange(e.target.value ? parseInt(e.target.value) : undefined)
          }
          placeholder={field.default !== null ? String(field.default) : ""}
          className="h-9"
        />
      );
    case "real":
      return (
        <Input
          type="number"
          step="any"
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) =>
            onValueChange(
              e.target.value ? parseFloat(e.target.value) : undefined
            )
          }
          placeholder={field.default !== null ? String(field.default) : ""}
          className="h-9"
        />
      );
    case "string":
      if (name.toLowerCase().includes("description")) {
        return (
          <Textarea
            value={(value as string) ?? ""}
            onChange={(e) => onValueChange(e.target.value || undefined)}
            placeholder={field.default !== null ? String(field.default) : ""}
            className="min-h-[80px] resize-y"
          />
        );
      }
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onValueChange(e.target.value || undefined)}
          placeholder={field.default !== null ? String(field.default) : ""}
          className="h-9"
        />
      );
    default:
      return (
        <Input
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) => onValueChange(e.target.value || undefined)}
          placeholder={`Tipo: ${field.type}`}
          className="h-9"
        />
      );
  }
};

const PayloadEditor = ({ payloadKey, definition, values, onChange, instanceIndex = 0, totalInstances = 1, isMultiple = false }: Props) => {
  const platforms = Object.entries(definition.platforms)
    .filter(([, v]) => v.introduced !== "n/a");

  const fields = Object.entries(definition.fields);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {definition.displayName}
            {isMultiple && totalInstances > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                #{instanceIndex + 1}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {payloadKey}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {platforms.map(([p, info]) => (
              <Badge key={p} variant="secondary" className="text-xs">
                {p} {info.introduced}+
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {fields.map(([name, field]) => (
            <div
              key={name}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium font-mono">
                    {name}
                  </Label>
                  {field.required && (
                    <Badge
                      variant="destructive"
                      className="ml-2 text-[10px] px-1.5 py-0"
                    >
                      Richiesto
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {field.type}
                </Badge>
              </div>
              {field.description && (
                <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
                  {field.description.replace(/`/g, "")}
                </p>
              )}
              <FieldInput
                name={name}
                field={field}
                value={values[name]}
                onValueChange={(val) => onChange(payloadKey, name, val)}
              />
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default PayloadEditor;
