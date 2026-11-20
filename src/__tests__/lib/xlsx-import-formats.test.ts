// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { findPlanoSheet, validatePlanoHeaders, parsePlanRows, COL } from "@/lib/planos-import";

/** Mesmo caminho das rotas de importação: read → aba PLANO DE AÇÃO → sheet_to_json → valida cabeçalho. */
function parseLikeImport(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = findPlanoSheet(wb.SheetNames);
  expect(sheetName).toBeTruthy();
  const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName!], { header: 1, defval: "" });
  const { headerRow, errors } = validatePlanoHeaders(rows);
  return { rows, headerRow, errors };
}

describe("importação de planilhas (SheetJS 0.20.3)", () => {
  const modelo = fs.readFileSync(path.join(process.cwd(), "public/modelo-plano-acao.xlsx"));

  it("usa a versão corrigida do SheetJS", () => {
    expect(XLSX.version).toBe("0.20.3");
  });

  it("lê o modelo oficial .xlsx e valida o cabeçalho", () => {
    const { errors } = parseLikeImport(modelo);
    expect(errors).toEqual([]);
  });

  it.each(["xls", "xlsb", "xlsx"] as const)("lê o mesmo conteúdo salvo como .%s", (bookType) => {
    const wb = XLSX.read(modelo, { type: "buffer" });
    const sheet = findPlanoSheet(wb.SheetNames)!;
    // Acrescenta uma linha de ação logo após o cabeçalho para exercitar o parse de dados.
    const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" });
    const { headerRow } = validatePlanoHeaders(rows);
    const linha: unknown[] = [];
    linha[COL.MACRO] = "Brindes";
    linha[COL.ACAO] = "Distribuir brindes na feira";
    const comDados = [...rows.slice(0, headerRow + 1), linha];
    const out = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(out, XLSX.utils.aoa_to_sheet(comDados), sheet);
    const buf = Buffer.from(XLSX.write(out, { type: "buffer", bookType }));

    const parsed = parseLikeImport(buf);
    expect(parsed.errors).toEqual([]);
    const { groups, items } = parsePlanRows(parsed.rows.slice(parsed.headerRow + 1));
    expect(groups.map((g) => g.name)).toEqual(["BRINDES"]);
    expect(items).toHaveLength(1);
  });
});
