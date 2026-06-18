/**
 * Resolução de escopo de acesso (áreas/unidades) para o Dashboard.
 *
 * Cada usuário pode ter o acesso restrito a um conjunto de áreas (user_areas)
 * e/ou de unidades (user_units). A semântica é de UNIÃO: o usuário enxerga uma
 * unidade se ela estiver explicitamente liberada OU se pertencer a uma área
 * liberada. Escopo totalmente vazio = sem restrição (vê tudo).
 */

export interface UserScope {
  areaIds: string[];
  unitIds: string[];
}

interface ScopableUnit {
  id: string;
  area_id: string | null;
}

/** True quando o usuário tem alguma restrição de escopo. */
export function isScoped(scope: UserScope): boolean {
  return scope.areaIds.length > 0 || scope.unitIds.length > 0;
}

/**
 * Filtra as unidades que o usuário pode acessar.
 * Sem restrição → retorna todas.
 */
export function filterUnitsByScope<T extends ScopableUnit>(
  units: T[],
  scope: UserScope,
): T[] {
  if (!isScoped(scope)) return units;
  const allowedAreas = new Set(scope.areaIds);
  const allowedUnits = new Set(scope.unitIds);
  return units.filter(
    (u) =>
      allowedUnits.has(u.id) ||
      (u.area_id != null && allowedAreas.has(u.area_id)),
  );
}

/**
 * Filtra as áreas exibidas para um usuário com escopo, mantendo apenas as que
 * possuem ao menos uma unidade acessível. Sem restrição → retorna todas.
 */
export function filterAreasByScope<A extends { id: string }>(
  areas: A[],
  visibleUnits: ScopableUnit[],
  scope: UserScope,
): A[] {
  if (!isScoped(scope)) return areas;
  const referenced = new Set(
    visibleUnits
      .map((u) => u.area_id)
      .filter((id): id is string => id != null),
  );
  return areas.filter((a) => referenced.has(a.id));
}
