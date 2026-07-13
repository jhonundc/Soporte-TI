"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

interface SearchableSelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  /** @deprecated Usar solo `placeholder` — el buscador es el mismo campo superior. */
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesQuery(label: string, query: string) {
  const q = normalize(query.trim());
  if (!q) return true;

  const normalized = normalize(label);
  if (normalized.includes(q)) return true;

  const words = normalized.split(/\s+/).filter(Boolean);
  const initials = words.map((word) => word[0] ?? "").join("");
  const compactQuery = q.replace(/\s+/g, "");

  if (initials.includes(compactQuery)) return true;

  const parts = q.split(/\s+/).filter(Boolean);
  return parts.every((part) => normalized.includes(part));
}

export function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Seleccione una opción",
  searchPlaceholder,
  emptyMessage = "Sin coincidencias",
  className,
  disabled = false,
  allowCustom = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasFocusedRef = useRef(false);

  const fieldPlaceholder = searchPlaceholder ?? placeholder;

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? "",
    [options, value]
  );

  const filteredOptions = useMemo(
    () => options.filter((option) => matchesQuery(option.label, query)),
    [options, query]
  );

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open && wasFocusedRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, query]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex h-8 w-full items-center gap-1 rounded-lg border border-input bg-transparent px-2 shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : (selectedLabel || value)}
          placeholder={fieldPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            setQuery(value);
            wasFocusedRef.current = true;
          }}
          onBlur={() => {
            wasFocusedRef.current = false;
            if (allowCustom && query !== value) {
              onValueChange(query);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
              inputRef.current?.blur();
            }
          }}
        />
        <span className="flex shrink-0 items-center gap-0.5">
          {value && !disabled ? (
            <button
              type="button"
              aria-label="Limpiar selección"
              className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onValueChange("");
                setQuery("");
                setOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            tabIndex={-1}
            aria-label={open ? "Cerrar opciones" : "Abrir opciones"}
            disabled={disabled}
            className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (disabled) return;
              if (open) {
                close();
                inputRef.current?.blur();
              } else {
                setOpen(true);
                setQuery("");
                inputRef.current?.focus();
              }
            }}
          >
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </span>
      </div>

      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-elevated)]"
          aria-label={placeholder}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  className={cn(
                    "w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                    value === option.value && "bg-primary/10 text-primary"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onValueChange(option.value);
                    close();
                    inputRef.current?.blur();
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))
          ) : (
            <li className="px-2.5 py-3 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
