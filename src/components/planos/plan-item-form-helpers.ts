import type { Area, Unit } from "@/types/catalog";

export interface PlanItemUnitPreview {
  derivedArea: string;
  matchedPlanUnit: Unit | null;
  selectedAreaRecord: Area | null;
  filteredUnitsForArea: Unit[];
  visibleUnits: Unit[];
  remainingUnitCount: number;
  isPlanUnitInsideSelectedArea: boolean;
  message: string;
  tone: "default" | "warning";
}

function normalizeCatalogValue(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function findAreaByName(
  catalogAreas: Area[],
  areaName: string | null | undefined,
): Area | null {
  const normalizedName = normalizeCatalogValue(areaName);
  if (!normalizedName) return null;
  return catalogAreas.find((area) => normalizeCatalogValue(area.name) === normalizedName) || null;
}

export function findUnitByName(
  catalogUnits: Unit[],
  unitName: string | null | undefined,
): Unit | null {
  const normalizedName = normalizeCatalogValue(unitName);
  if (!normalizedName) return null;
  return catalogUnits.find((unit) => normalizeCatalogValue(unit.name) === normalizedName) || null;
}

export function resolveInitialItemArea(args: {
  itemArea?: string | null;
  planUnit?: string | null;
  catalogAreas: Area[];
  catalogUnits: Unit[];
}): string {
  const directArea = (args.itemArea || "").trim();
  if (directArea) return directArea;

  const matchedPlanUnit = findUnitByName(args.catalogUnits, args.planUnit);
  if (!matchedPlanUnit?.area_id) return "";

  const matchedArea = args.catalogAreas.find((area) => area.id === matchedPlanUnit.area_id);
  return matchedArea?.name || "";
}

export function buildUnitPreview(args: {
  selectedArea: string;
  planUnit: string;
  catalogAreas: Area[];
  catalogUnits: Unit[];
  maxVisibleUnits?: number;
}): PlanItemUnitPreview {
  const maxVisibleUnits = args.maxVisibleUnits ?? 6;
  const matchedPlanUnit = findUnitByName(args.catalogUnits, args.planUnit);
  const derivedArea = resolveInitialItemArea({
    itemArea: args.selectedArea,
    planUnit: args.planUnit,
    catalogAreas: args.catalogAreas,
    catalogUnits: args.catalogUnits,
  });
  const selectedAreaRecord = findAreaByName(args.catalogAreas, args.selectedArea);
  const filteredUnitsForArea = selectedAreaRecord
    ? args.catalogUnits.filter((unit) => unit.area_id === selectedAreaRecord.id)
    : args.catalogUnits;
  const visibleUnits = filteredUnitsForArea.slice(0, maxVisibleUnits);
  const remainingUnitCount = Math.max(filteredUnitsForArea.length - visibleUnits.length, 0);
  const isPlanUnitInsideSelectedArea = !!(
    selectedAreaRecord &&
    matchedPlanUnit?.area_id &&
    matchedPlanUnit.area_id === selectedAreaRecord.id
  );

  if (!selectedAreaRecord) {
    return {
      derivedArea,
      matchedPlanUnit,
      selectedAreaRecord,
      filteredUnitsForArea,
      visibleUnits,
      remainingUnitCount,
      isPlanUnitInsideSelectedArea,
      message: `Você pode acessar ${args.catalogUnits.length} unidade(s). Selecione uma área para filtrar a lista.`,
      tone: "default",
    };
  }

  if (filteredUnitsForArea.length === 0) {
    return {
      derivedArea,
      matchedPlanUnit,
      selectedAreaRecord,
      filteredUnitsForArea,
      visibleUnits,
      remainingUnitCount,
      isPlanUnitInsideSelectedArea,
      message: `Nenhuma unidade acessível encontrada para a área "${selectedAreaRecord.name}".`,
      tone: "warning",
    };
  }

  if (matchedPlanUnit && !isPlanUnitInsideSelectedArea) {
    return {
      derivedArea,
      matchedPlanUnit,
      selectedAreaRecord,
      filteredUnitsForArea,
      visibleUnits,
      remainingUnitCount,
      isPlanUnitInsideSelectedArea,
      message: `A área "${selectedAreaRecord.name}" não contém a unidade do plano "${matchedPlanUnit.name}".`,
      tone: "warning",
    };
  }

  return {
    derivedArea,
    matchedPlanUnit,
    selectedAreaRecord,
    filteredUnitsForArea,
    visibleUnits,
    remainingUnitCount,
    isPlanUnitInsideSelectedArea,
    message: `Área "${selectedAreaRecord.name}" libera ${filteredUnitsForArea.length} unidade(s).`,
    tone: "default",
  };
}
