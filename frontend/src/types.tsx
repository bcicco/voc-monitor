export interface Sample {
  t_ms: number;
  voc1_ppb: number;
  voc2_ppb: number;
  temp_c: number;
  rh_pct: number;
}

export interface Breath {
  device_id: string;
  breath_id: string;
  started_at: string;
  sample_rate_hz: number;
  firmware?: string;
  meta?: Record<string, unknown>;
  samples: Sample[];
  clinician_notes?: string;
}

export interface BreathSummary {
  device_id: string;
  breath_id: string;
  started_at: string;
  sample_count: number;
  peak_voc1_ppb?: number;
  peak_voc2_ppb?: number;
  duration_ms?: number;
}
