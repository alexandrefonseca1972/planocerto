export type DuplicableItem = {
  id: string;
  plan_id: string;
  parent_id: string | null;
  number: string;
  sort_order: number;
  tipo_pa: string;
  area: string;
  prioridade: string;
  subacao: string;
  como: string;
  action: string;
  why: string;
  where: string;
  responsible: string;
  planned_start: string | null;
  planned_end: string | null;
  cost: string;
  expected_result: string;
  observations: string;
  preco: number;
  inscritos_esperado: number;
  mat_fin_esperado: number;
  mat_acad_esperado: number;
};

export type DuplicatedItemRow = {
  id: string;
  plan_id: string;
  parent_id: string | null;
  number: string;
  sort_order: number;
  tipo_pa: string;
  area: string;
  prioridade: string;
  subacao: string;
  como: string;
  action: string;
  why: string;
  where: string;
  responsible: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: null;
  actual_end: null;
  cost: string;
  expected_result: string;
  actual_result: "";
  status: 1;
  observations: string;
  preco: number;
  inscritos_esperado: number;
  inscritos_real: 0;
  mat_fin_esperado: number;
  mat_fin_real: 0;
  mat_acad_esperado: number;
  mat_acad_real: 0;
};

const COPY_SUFFIX = " (cópia)";
const ACTION_MAX = 500;

export function withCopySuffix(action: string): string {
  const text = action.trim();
  if (!text) return COPY_SUFFIX.trim();
  if (text.endsWith(COPY_SUFFIX.trim())) return text.slice(0, ACTION_MAX);
  if (text.length + COPY_SUFFIX.length <= ACTION_MAX) return text + COPY_SUFFIX;
  return text.slice(0, ACTION_MAX - COPY_SUFFIX.length) + COPY_SUFFIX;
}

export function nextSiblingNumber(existingNumbers: string[], sourceNumber: string): string {
  const raw = (sourceNumber || "").trim();
  if (!raw) {
    const tops = existingNumbers
      .map((n) => n.trim())
      .filter((n) => n && !n.includes("."))
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isFinite(n));
    return String((tops.length ? Math.max(...tops) : 0) + 1);
  }

  const parts = raw.split(".");
  const prefix = parts.slice(0, -1).join(".");
  const siblingLast = existingNumbers
    .map((n) => n.trim())
    .filter((n) => {
      const p = n.split(".");
      if (p.length !== parts.length) return false;
      return p.slice(0, -1).join(".") === prefix;
    })
    .map((n) => parseInt(n.split(".").pop() || "", 10))
    .filter((n) => Number.isFinite(n));
  const sourceLast = parseInt(parts[parts.length - 1], 10);
  const maxLast = Math.max(Number.isFinite(sourceLast) ? sourceLast : 0, ...siblingLast);
  const next = String(maxLast + 1);
  return prefix ? `${prefix}.${next}` : next;
}

export function remapCopiedNumber(original: string, sourceNumber: string, newRootNumber: string): string {
  if (!sourceNumber) return newRootNumber;
  if (original === sourceNumber) return newRootNumber;
  if (original.startsWith(`${sourceNumber}.`)) {
    return newRootNumber + original.slice(sourceNumber.length);
  }
  // Numeração pré-existente com drift (não prefixada por sourceNumber): ainda
  // assim prefixa com o novo número raiz, para nunca colidir com o original.
  return `${newRootNumber}.${original}`;
}

export function collectSubtree<T extends { id: string; parent_id: string | null }>(
  items: T[],
  rootId: string,
): T[] {
  const byParent = new Map<string, T[]>();
  for (const item of items) {
    const key = item.parent_id ?? "";
    const list = byParent.get(key);
    if (list) list.push(item);
    else byParent.set(key, [item]);
  }

  const out: T[] = [];
  const seen = new Set<string>();
  function walk(id: string) {
    if (seen.has(id)) return;
    const node = items.find((item) => item.id === id);
    if (!node) return;
    seen.add(id);
    out.push(node);
    for (const child of byParent.get(id) ?? []) walk(child.id);
  }
  walk(rootId);
  return out;
}

/** IDs da subárvore, folhas primeiro, para apagar sem deixar órfãos. */
export function collectSubtreeIds<T extends { id: string; parent_id: string | null }>(
  items: T[],
  rootId: string,
): string[] {
  return collectSubtree(items, rootId).map((item) => item.id).reverse();
}

export function buildDuplicatedRows(
  sourceId: string,
  planItems: DuplicableItem[],
  createId: () => string = () => crypto.randomUUID(),
): DuplicatedItemRow[] {
  const source = planItems.find((item) => item.id === sourceId);
  if (!source) return [];

  const subtree = collectSubtree(planItems, sourceId);
  const siblingNumbers = planItems
    .filter((item) => item.parent_id === source.parent_id)
    .map((item) => item.number);
  const newRootNumber = nextSiblingNumber(siblingNumbers, source.number);
  const siblingSorts = planItems
    .filter((item) => item.parent_id === source.parent_id)
    .map((item) => item.sort_order ?? 0);
  const sortOffset = Math.max(0, ...siblingSorts) + 1 - (source.sort_order ?? 0);

  const idMap = new Map<string, string>();
  for (const item of subtree) idMap.set(item.id, createId());

  return subtree.map((item) => ({
    id: idMap.get(item.id)!,
    plan_id: item.plan_id,
    parent_id: item.id === source.id
      ? item.parent_id
      : (item.parent_id ? idMap.get(item.parent_id) ?? null : null),
    number: remapCopiedNumber(item.number, source.number, newRootNumber),
    sort_order: (item.sort_order ?? 0) + sortOffset,
    tipo_pa: item.tipo_pa,
    area: item.area,
    prioridade: item.prioridade,
    subacao: item.subacao,
    como: item.como,
    action: item.id === source.id ? withCopySuffix(item.action) : item.action,
    why: item.why,
    where: item.where,
    responsible: item.responsible,
    planned_start: item.planned_start,
    planned_end: item.planned_end,
    actual_start: null,
    actual_end: null,
    cost: item.cost,
    expected_result: item.expected_result,
    actual_result: "",
    status: 1,
    observations: item.observations,
    preco: item.preco,
    inscritos_esperado: item.inscritos_esperado,
    inscritos_real: 0,
    mat_fin_esperado: item.mat_fin_esperado,
    mat_fin_real: 0,
    mat_acad_esperado: item.mat_acad_esperado,
    mat_acad_real: 0,
  }));
}
