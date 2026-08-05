// Helpers puros do widget de Prazos do dashboard (testáveis isoladamente).

export interface DeadlineLike {
  title: string;
  deadline: string;
  unitName: string;
}

export type Grouped<T> = T & { count: number };

/**
 * Agrupa prazos idênticos — mesmo título, data e unidade — numa única entrada
 * com `count`. Resolve o ruído de ações repetidas (a auditoria via o mesmo
 * título/data 6+ vezes no widget). Preserva a ordem de primeira ocorrência
 * (a lista já chega ordenada por data), mantendo o primeiro item como
 * representante (para o deep-link quando count === 1).
 */
export function groupDeadlines<T extends DeadlineLike>(items: T[]): Grouped<T>[] {
  const groups = new Map<string, Grouped<T>>();
  const order: string[] = [];
  for (const item of items) {
    const key = `${item.title}__${item.deadline}__${item.unitName}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { ...item, count: 1 });
      order.push(key);
    }
  }
  return order.map((k) => groups.get(k)!);
}
