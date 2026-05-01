"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  options: Array<CustomSelectOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: "sm" | "md";
  variant?: "outline" | "ghost";
  tone?: "blue" | "purple";
  align?: "left" | "right";
  usePortal?: boolean;
}

export default function CustomSelect<T extends string = string>({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  size = "md",
  variant = "outline",
  tone = "blue",
  align = "left",
  usePortal = true,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const focusRing = tone === "purple" ? "focus:ring-purple-500/30 focus:border-purple-500" : "focus:ring-blue-500/30 focus:border-blue-500";
  const selectedBg = tone === "purple" ? "bg-purple-50" : "bg-blue-50";
  const selectedIcon = tone === "purple" ? "text-purple-600" : "text-blue-600";

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: align === "right" ? rect.right : rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    // Calculate initial position
    updatePosition();

    // Update position on scroll/resize
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, align]);

  const dropdownContent = (
    <>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={cn(
              "w-full px-3 py-2.5 text-left transition-colors flex items-start gap-2",
              isSelected ? selectedBg : "hover:bg-gray-50"
            )}
          >
            <span className="h-4 w-4 flex items-center justify-center shrink-0 mt-0.5">
              {isSelected ? <Check className={cn("h-4 w-4", selectedIcon)} /> : null}
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-gray-900 truncate">{option.label}</span>
              {option.description ? (
                <span className="block text-xs text-gray-500 truncate">{option.description}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </>
  );

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={cn(
          "w-full rounded-xl text-left transition disabled:opacity-50 disabled:cursor-not-allowed",
          size === "sm" ? "px-3 py-2 text-xs" : "px-3.5 py-2.5 text-sm",
          variant === "ghost"
            ? cn("border-0 bg-transparent", focusRing)
            : cn("border border-gray-200 bg-white text-gray-900", focusRing),
          "focus:outline-none focus:ring-2",
          triggerClassName
        )}
      >
        <span className="flex items-center justify-between gap-2">
          <span className={cn("truncate", selected ? "text-gray-900" : "text-gray-400")}>
            {selected?.label ?? placeholder ?? "Select"}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && usePortal && position && typeof document !== "undefined"
        ? createPortal(
            <div
              className={cn(
                "fixed rounded-xl border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden animate-fade-in py-1",
                menuClassName
              )}
              style={{
                top: `${position.top}px`,
                left: align === "right" ? "auto" : `${position.left}px`,
                right: align === "right" ? `${window.innerWidth - position.left}px` : "auto",
                width: menuClassName ? undefined : `${position.width}px`,
              }}
            >
              {dropdownContent}
            </div>,
            document.body
          )
        : open && !usePortal
        ? (
            <div
              className={cn(
                "absolute top-full left-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-2xl z-40 overflow-hidden animate-fade-in py-1",
                align === "right" && "right-0 left-auto",
                menuClassName
              )}
            >
              {dropdownContent}
            </div>
          )
        : null}
    </div>
  );
}
