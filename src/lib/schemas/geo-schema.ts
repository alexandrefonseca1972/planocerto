import { z } from "zod";

/**
 * Coordenada geográfica opcional para schemas de cadastro (escolas, empresas…).
 * Vazio/null/undefined → null; número fora da faixa → erro de validação.
 * Compartilhado para não duplicar a lógica entre os "locais".
 */
export const coord = (min: number, max: number) =>
  z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
      z.number().min(min, "Coordenada fora da faixa.").max(max, "Coordenada fora da faixa.").nullable(),
    )
    .optional();

export const latitude = () => coord(-90, 90);
export const longitude = () => coord(-180, 180);
