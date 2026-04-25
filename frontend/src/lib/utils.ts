import { clsx, type ClassValue } from "clsx";

/**
 * Merges Tailwind class names conditionally.
 * Usage: cn("base-class", isActive && "active-class")
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
