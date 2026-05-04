"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within <Tabs>");
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled,
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs();
  const isActive = selectedValue === value;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onValueChange(value);
    }
  };

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onValueChange(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex w-full items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabs();
  const isActive = selectedValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn("mt-4 focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}
