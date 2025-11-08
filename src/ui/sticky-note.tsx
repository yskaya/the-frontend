"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface StickyNoteProps {
  value: string;
  placeholder?: string;
  isEditing?: boolean;
  tone?: "light" | "dark";
  onClick?: () => void;
  onChange?: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  prefixLabel?: string;
}

export function StickyNote({
  value,
  placeholder = "Click to add a note...",
  isEditing = false,
  tone = "light",
  onClick,
  onChange,
  onSave,
  onCancel,
  autoFocus = false,
  disabled = false,
  prefixLabel = "NOTE: ",
}: StickyNoteProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const ensurePrefixed = (raw: string) =>
    raw.startsWith(prefixLabel) ? raw : `${prefixLabel}${raw}`;

  const stripPrefix = (raw: string) =>
    raw.startsWith(prefixLabel) ? raw.slice(prefixLabel.length) : raw;

  const normalizedValue = ensurePrefixed(value ?? "");
  const contentValue = stripPrefix(value ?? "");
  const isEmpty = contentValue.trim().length === 0;

  useEffect(() => {
    if (isEditing && autoFocus && textareaRef.current) {
      const textarea = textareaRef.current;
      const nextValue = ensurePrefixed(value ?? "");
      if (textarea.value !== nextValue) {
        textarea.value = nextValue;
        if (!(value ?? "").startsWith(prefixLabel)) {
          onChange?.(nextValue);
        }
      }
      textarea.focus();
      const caret = Math.min(prefixLabel.length, textarea.value.length);
      textarea.setSelectionRange(caret, caret);
    }
  }, [isEditing, autoFocus, value, prefixLabel, onChange]);

  const handleContainerClick = () => {
    if (!isEditing && !disabled) {
      onClick?.();
    }
  };

  return (
    <div
      className={cn(
        "group flex h-12 w-full items-center overflow-hidden rounded-2xl border px-4 transition-all",
        tone === "dark"
          ? "border-white/20 bg-gradient-to-r from-white/15 via-white/10 to-white/5 text-white"
          : "border-purple-200 bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 text-purple-800",
        disabled && "opacity-60"
      )}
      onClick={handleContainerClick}
      role={!isEditing && onClick ? "button" : undefined}
      tabIndex={!isEditing && onClick ? 0 : undefined}
    >
      <div className="flex-1">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              defaultValue={normalizedValue}
              onChange={(event) => onChange?.(event.target.value)}
              className={cn(
                "h-8 w-full resize-none border-none bg-transparent text-sm leading-tight text-current outline-none",
                "placeholder:text-purple-400/70"
              )}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
            />
          ) : (
            <p
              className={cn(
                "text-sm leading-tight truncate",
                isEmpty && "italic opacity-70"
              )}
            >
              {isEmpty ? placeholder : normalizedValue}
            </p>
          )}
      </div>

      {isEditing && (
        <div className="ml-4 flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-full border border-purple-300 bg-white/20 text-purple-600",
              tone === "dark" && "border-white/40 text-white"
            )}
            onClick={(event) => {
              event.stopPropagation();
              onSave?.();
            }}
            disabled={disabled}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-full border border-purple-300 bg-white/10 text-purple-500",
              tone === "dark" && "border-white/30 text-white/80"
            )}
            onClick={(event) => {
              event.stopPropagation();
              onCancel?.();
            }}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
