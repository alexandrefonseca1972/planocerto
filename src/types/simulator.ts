export interface SimulatorScenario {
  id: string;
  tenant_id: string;
  unit_id: string | null;
  name: string;
  reference_label: string;
  meta_real_aa: number;
  is_baseline: boolean;
  notes: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimulatorChannelMetric {
  id: string;
  scenario_id: string;
  channel_id: string;
  inscritos: number;
  mat_financeira: number;
  mat_academica: number;
  created_at: string;
  updated_at: string;
}

export interface SimulatorChannelRow {
  channel_id: string;
  channel_name: string;
  inscritos: number;
  mat_financeira: number;
  mat_academica: number;
  share: number;
  conv_in_mf: number;
  conv_mf_ma: number;
}

export interface SimulatorFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export function computeChannelDerived(
  rows: { channel_id: string; channel_name: string; inscritos: number; mat_financeira: number; mat_academica: number }[]
): SimulatorChannelRow[] {
  const totalMA = rows.reduce((s, r) => s + (r.mat_academica || 0), 0);
  return rows.map((r) => ({
    ...r,
    share: totalMA > 0 ? r.mat_academica / totalMA : 0,
    conv_in_mf: r.inscritos > 0 ? r.mat_financeira / r.inscritos : 0,
    conv_mf_ma: r.mat_financeira > 0 ? r.mat_academica / r.mat_financeira : 0,
  }));
}
