export function sanitize(text: string): string {
  return text.replace(/[<>]/g, "");
}

export function sanitizeRecord<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitize(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeRecord(value as Record<string, unknown>);
    }
  }
  return result as T;
}

export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (allowedDomains?.length && !allowedDomains.some((d) => parsed.hostname.endsWith(d))) return false;
    return true;
  } catch {
    return false;
  }
}
