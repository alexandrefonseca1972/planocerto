/**
 * Re-export do helper de intervalo (movido para `@/lib/date-range`, home neutro
 * compartilhado entre Dashboard e Planos). Mantido para não quebrar importadores
 * existentes do Dashboard.
 */
export { isWithinRange } from "@/lib/date-range";
