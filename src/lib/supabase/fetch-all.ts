/** Linhas pedidas por página. O PostgREST pode devolver menos (db-max-rows). */
const PAGE_ROWS = 1000;

/** Quantos ids cabem num `.in()` sem inflar demais a URL. */
export const IDS_PER_QUERY = 100;

/**
 * Lê todas as linhas de uma consulta, em páginas. Avança pelo que veio de fato (não pelo
 * tamanho pedido), então funciona com qualquer teto de linhas do servidor. A consulta
 * precisa de ordenação estável (ex.: `.order("sort_order").order("id")`).
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; ) {
    const { data, error } = await page(from, from + PAGE_ROWS - 1);
    if (error) throw error;
    if (!data?.length) return out;
    out.push(...data);
    from += data.length;
  }
}

export function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
