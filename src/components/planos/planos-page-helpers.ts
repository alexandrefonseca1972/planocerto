import type { ActionItem, ActionPlan } from "@/types/action-plan";

/**
 * Filtra a árvore de ações por um predicado, preservando a hierarquia pai/filho.
 *
 * Regra: mantém o nó se ele próprio casa (subárvore inteira preservada) OU se
 * algum descendente casa — nesse caso o nó vira cabeçalho do grupo, com os
 * filhos podados para apenas os que casam. Útil para que grupos (macro ações,
 * sem prazo) só apareçam quando têm filhos dentro do filtro.
 */
export function filterItemTree(
  items: ActionItem[],
  pred: (item: ActionItem) => boolean,
): ActionItem[] {
  const out: ActionItem[] = [];
  for (const item of items) {
    if (pred(item)) {
      out.push(item);
      continue;
    }
    const keptChildren = item.children?.length ? filterItemTree(item.children, pred) : [];
    if (keptChildren.length) {
      out.push({ ...item, children: keptChildren });
    }
  }
  return out;
}

export function resolveSelectedPlanId<T extends { id: string }>(
  plans: T[],
  requestedPlanId?: string | null,
): string | null {
  if (requestedPlanId && plans.some((plan) => plan.id === requestedPlanId)) {
    return requestedPlanId;
  }

  return plans[0]?.id ?? null;
}

export function isValidActionText(value: string): boolean {
  return value.trim().length >= 3;
}

/**
 * Grupos que podem ser pai de uma nova ação: raízes do plano (mesmo sem filhos
 * ainda) e qualquer nó que já tenha subações. `flattenItems` zera `children`,
 * então esta função precisa receber a árvore original.
 */
export function collectParentGroups<T extends { id: string; parent_id: string | null; children?: T[] }>(
  items: T[],
  excludeId?: string | null,
): T[] {
  const out: T[] = [];
  function walk(nodes: T[]) {
    for (const node of nodes) {
      const isRoot = !node.parent_id;
      const hasChildren = Boolean(node.children?.length);
      if ((isRoot || hasChildren) && node.id !== excludeId) out.push(node);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(items);
  return out;
}

export function orderParentGroupsByMacroCatalog<T extends { action: string }>(
  groups: T[],
  macroCatalog: { name: string }[] = [],
): T[] {
  if (macroCatalog.length === 0) return groups;

  const macroOrder = new Map(
    macroCatalog.map((item, index) => [item.name.trim().toLowerCase(), index]),
  );

  return [...groups].sort((left, right) => {
    const leftIndex = macroOrder.get(left.action.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = macroOrder.get(right.action.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.action.localeCompare(right.action, "pt-BR");
  });
}

export function buildMacroActionOptions<T extends { id: string; action: string }>(
  groups: T[],
  macroCatalog: { name: string }[] = [],
): Array<{ value: string; label: string; parentId?: string }> {
  const orderedGroups = orderParentGroupsByMacroCatalog(groups, macroCatalog);
  const options: Array<{ value: string; label: string; parentId?: string }> = [];
  const seen = new Set<string>();

  for (const item of macroCatalog) {
    const value = item.name.trim();
    if (!value) continue;
    const matchedGroup = orderedGroups.find((group) => group.action.trim().toLowerCase() === value.toLowerCase());
    options.push({
      value,
      label: value,
      parentId: matchedGroup?.id,
    });
    seen.add(value.toLowerCase());
  }

  for (const group of orderedGroups) {
    const value = group.action.trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    options.push({
      value,
      label: value,
      parentId: group.id,
    });
    seen.add(value.toLowerCase());
  }

  return options;
}

export function filterCatalogByAccess<T extends { id: string }>(
  items: T[],
  allowedIds: string[] = [],
): T[] {
  if (allowedIds.length === 0) return items;
  const allowed = new Set(allowedIds);
  return items.filter((item) => allowed.has(item.id));
}

export function filterPlansByGovernance(
  plans: ActionPlan[],
  filters: {
    exercicio?: number | null;
    visibility?: "public" | "restricted" | null;
    status?: "active" | "archived" | null;
  },
): ActionPlan[] {
  return plans.filter((plan) => {
    const matchesExercicio = filters.exercicio === null || filters.exercicio === undefined
      ? true
      : plan.exercicio === filters.exercicio;
    const matchesVisibility = filters.visibility ? plan.visibility === filters.visibility : true;
    const matchesStatus = filters.status ? plan.status === filters.status : true;

    return matchesExercicio && matchesVisibility && matchesStatus;
  });
}

export function getAvailablePlanExercises(plans: ActionPlan[]): number[] {
  return [...new Set(plans.map((plan) => plan.exercicio).filter((value): value is number => typeof value === "number"))]
    .sort((left, right) => right - left);
}

/** Mapa id → action para resolver o pai (macro ação) de um item. */
export function getActionById(items: ActionItem[]): Map<string, string> {
  const map = new Map<string, string>();
  function walk(nodes: ActionItem[]) {
    for (const node of nodes) {
      map.set(node.id, node.action);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(items);
  return map;
}

/** Mapa id → parent_id, para subir a cadeia de ancestrais de um item. */
export function getParentById(items: ActionItem[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  function walk(nodes: ActionItem[]) {
    for (const node of nodes) {
      map.set(node.id, node.parent_id);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(items);
  return map;
}

export function itemMatchesTipoPa(item: ActionItem, tipoPa: string | null): boolean {
  if (!tipoPa) return true;
  return item.tipo_pa.trim().toLowerCase() === tipoPa.trim().toLowerCase();
}

export function itemMatchesMacroAcao(
  item: ActionItem,
  macroAcao: string | null,
  actionById: Map<string, string>,
  parentById: Map<string, string | null>,
): boolean {
  if (!macroAcao) return true;
  const target = macroAcao.trim().toLowerCase();
  if (item.action.trim().toLowerCase() === target) return true;
  let parentId = item.parent_id;
  const visited = new Set<string>();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    if (actionById.get(parentId)?.trim().toLowerCase() === target) return true;
    parentId = parentById.get(parentId) ?? null;
  }
  return false;
}

export function collectItemClassificationOptions(items: ActionItem[]): {
  tiposPa: string[];
  macroAcoes: string[];
} {
  const tipos = new Set<string>();
  const macros = new Set<string>();
  function walk(nodes: ActionItem[]) {
    for (const node of nodes) {
      if (node.tipo_pa.trim()) tipos.add(node.tipo_pa.trim());
      if (node.children?.length && node.action.trim()) macros.add(node.action.trim());
      if (node.children?.length) walk(node.children);
    }
  }
  walk(items);
  return {
    tiposPa: [...tipos].sort((a, b) => a.localeCompare(b, "pt-BR")),
    macroAcoes: [...macros].sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}

/** Catálogo primeiro (ordem original), depois valores extras dos itens. */
export function mergeCatalogNames(catalog: { name: string }[], fromItems: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...catalog.map((item) => item.name.trim()), ...fromItems]) {
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}
