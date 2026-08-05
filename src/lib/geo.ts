// Helpers de geolocalização (puros, sem dependência de API/DOM).
// Suportam o "Cadastro de Locais" (carteira de escolas/empresas) com coordenadas
// manuais e link "Ver no mapa" — geocoding automático fica para etapa futura.

export function isValidLat(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLng(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function hasCoords(lat: number | null | undefined, lng: number | null | undefined): boolean {
  return isValidLat(lat) && isValidLng(lng);
}

/**
 * URL do Google Maps a partir de coordenadas (preferencial) ou, na ausência
 * delas, de um endereço textual. Retorna null se não houver nada utilizável.
 */
export function buildMapsUrl(input: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}): string | null {
  if (hasCoords(input.lat, input.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${input.lat},${input.lng}`;
  }
  const address = (input.address || "").trim();
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return null;
}

/** Converte string de input para coordenada: vazio → null; inválido → NaN. */
export function parseCoord(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (trimmed === "") return null;
  return Number(trimmed);
}
