"use client";

import { useEffect } from "react";

/**
 * Dispara `onEscape` quando o usuário pressiona Esc.
 * Quando `enabled` é false, listener não é registrado (útil para modais que
 * só estão abertos ocasionalmente).
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape, enabled]);
}
