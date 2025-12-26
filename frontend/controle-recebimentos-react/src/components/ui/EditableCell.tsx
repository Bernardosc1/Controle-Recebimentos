import { useState, useRef, useEffect } from "react";
import { Check, X, Loader2 } from "lucide-react";

type EditableCellType = "text" | "number" | "currency" | "select";

interface SelectOption {
  value: string;
  label: string;
}

interface EditableCellProps {
  value: string | number | null;
  type: EditableCellType;
  options?: SelectOption[];
  onSave: (newValue: string | number | null) => Promise<void>;
  displayValue?: string;
  className?: string;
  disabled?: boolean;
}

export function EditableCell({
  value,
  type,
  options = [],
  onSave,
  displayValue,
  className = "",
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const isSavingRef = useRef(false); // Ref síncrona para controle de blur

  // Formatar valor para exibição
  function formatDisplayValue(): string {
    if (displayValue !== undefined) return displayValue;
    if (value === null || value === undefined) return "-";

    if (type === "currency") {
      return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }

    return String(value);
  }

  // Converter valor para edição
  function valueToEditString(): string {
    if (value === null || value === undefined) return "";
    if (type === "currency" || type === "number") {
      return String(value);
    }
    return String(value);
  }

  // Converter valor editado para o tipo correto
  function parseEditValue(val: string): string | number | null {
    if (val.trim() === "") return null;

    if (type === "currency" || type === "number") {
      // Remover formatação e converter para número
      const cleaned = val.replace(/[^\d,.-]/g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }

    return val;
  }

  // Iniciar edição
  function startEditing() {
    if (disabled || isSaving) return;
    setEditValue(valueToEditString());
    setIsEditing(true);
    setSaveStatus("idle");
  }

  // Cancelar edição
  function cancelEditing() {
    setIsEditing(false);
    setEditValue("");
    setSaveStatus("idle");
  }

  // Salvar alteração
  async function saveValue() {
    const newValue = parseEditValue(editValue);

    // Se o valor não mudou, apenas fechar
    if (newValue === value || (newValue === null && value === null)) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setSaveStatus("success");
      setIsEditing(false);

      // Limpar status de sucesso após 2s
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSaveStatus("error");

      // Limpar status de erro após 3s
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }

  // Focar no input quando entrar em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Handler para teclas
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveValue();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  }

  // Estilo base da célula
  const baseStyle = `
    transition-all duration-200
    ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-blue-50"}
    ${saveStatus === "success" ? "bg-emerald-50" : ""}
    ${saveStatus === "error" ? "bg-red-50" : ""}
  `;

  // Modo de exibição
  if (!isEditing) {
    return (
      <div
        onClick={startEditing}
        className={`${baseStyle} ${className} relative group py-1 px-1 -my-1 -mx-1 rounded`}
      >
        <span className={saveStatus === "success" ? "text-emerald-600" : ""}>
          {formatDisplayValue()}
        </span>
        {saveStatus === "success" && (
          <Check className="w-3 h-3 text-emerald-500 inline ml-1" />
        )}
        {saveStatus === "error" && (
          <X className="w-3 h-3 text-red-500 inline ml-1" />
        )}
        {!disabled && (
          <span className="absolute inset-0 border border-transparent group-hover:border-blue-300 rounded pointer-events-none" />
        )}
      </div>
    );
  }

  // Modo de edição - Select
  if (type === "select") {
    // Handler separado para onChange do select
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newVal = e.target.value;

      // Marcar como salvando IMEDIATAMENTE (ref síncrona)
      isSavingRef.current = true;
      setIsSaving(true);
      setEditValue(newVal);

      // Se o valor não mudou, apenas fechar
      if (newVal === String(value)) {
        isSavingRef.current = false;
        setIsSaving(false);
        setIsEditing(false);
        return;
      }

      // Salvar imediatamente quando selecionar uma opção
      onSave(newVal)
        .then(() => {
          setSaveStatus("success");
          setIsEditing(false);
          setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch((error) => {
          console.error("Erro ao salvar:", error);
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
        })
        .finally(() => {
          isSavingRef.current = false;
          setIsSaving(false);
        });
    };

    return (
      <div className="inline-flex items-center gap-1">
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={handleSelectChange}
          onBlur={() => {
            // Usar ref síncrona para checar se está salvando
            // Pequeno delay para garantir que onChange foi processado primeiro
            setTimeout(() => {
              if (!isSavingRef.current) {
                setIsEditing(false);
              }
            }, 100);
          }}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
      </div>
    );
  }

  // Modo de edição - Input (text, number, currency)
  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === "currency" || type === "number" ? "number" : "text"}
        step={type === "currency" ? "0.01" : undefined}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={saveValue}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isSaving && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
    </div>
  );
}
