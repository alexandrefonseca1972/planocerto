import { describe, expect, it } from "vitest";
import { isValidLat, isValidLng, hasCoords, buildMapsUrl, parseCoord } from "@/lib/geo";

describe("geo helpers", () => {
  it("isValidLat / isValidLng respeitam a faixa", () => {
    expect(isValidLat(-1.45)).toBe(true);
    expect(isValidLat(90)).toBe(true);
    expect(isValidLat(91)).toBe(false);
    expect(isValidLat(null)).toBe(false);
    expect(isValidLng(-180)).toBe(true);
    expect(isValidLng(180)).toBe(true);
    expect(isValidLng(181)).toBe(false);
    expect(isValidLng(NaN)).toBe(false);
  });

  it("hasCoords exige ambas válidas", () => {
    expect(hasCoords(-1.45, -48.5)).toBe(true);
    expect(hasCoords(-1.45, null)).toBe(false);
    expect(hasCoords(null, null)).toBe(false);
  });

  it("buildMapsUrl prioriza coordenadas", () => {
    expect(buildMapsUrl({ lat: -1.45, lng: -48.5 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=-1.45,-48.5",
    );
  });

  it("buildMapsUrl cai no endereço quando não há coordenadas", () => {
    expect(buildMapsUrl({ lat: null, lng: null, address: "Rua A, Belém" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%20Bel%C3%A9m",
    );
  });

  it("buildMapsUrl retorna null sem coords nem endereço", () => {
    expect(buildMapsUrl({})).toBeNull();
    expect(buildMapsUrl({ address: "   " })).toBeNull();
  });

  it("parseCoord: vazio → null, número → number, inválido → NaN", () => {
    expect(parseCoord("")).toBeNull();
    expect(parseCoord(null)).toBeNull();
    expect(parseCoord("-1.45")).toBe(-1.45);
    expect(Number.isNaN(parseCoord("abc") as number)).toBe(true);
  });
});
