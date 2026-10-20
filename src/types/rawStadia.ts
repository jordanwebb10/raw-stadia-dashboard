export type IndexName = 'Impact' | 'Energy' | 'Grip';

export type SessionObjective = 'Recovery' | 'Metabolic' | 'Reaction' | 'Speed' | 'Baseline';

export type ReferenceModeId =
  | 'ntc-baseline'
  | 'all-camp'
  | 'raw-stadia-scale'
  | string; // or any specific PitchEvaluation.id

export interface MetricReferenceStats {
  mean: number;
  sd: number;
  bandMin: number;
  bandMax: number;
  bandLow: number;
  bandHigh: number;
  min: number;
  max: number;
}

export interface ReferenceBaselineProfile {
  id: ReferenceModeId;
  label: string;
  shortLabel: string;
  description: string;
  formulaNote: string;
  metrics: Record<IndexName, MetricReferenceStats>;
  zones: PitchZone[];
}

export interface PitchZone {
  zone: number; // 1 to 18
  posX: number; // 1 (Bottom/Right Touchline), 2 (Center), 3 (Top/Left Touchline)
  posY: number; // 1 (Left Goal Box) to 6 (Right Goal Box)
  metrics: Record<IndexName, number>;
}

export interface PitchStatSummary {
  mean: number;
  sd: number;
  min: number;
  max: number;
}

export interface PitchHotspot {
  zone: number;
  posX: number;
  posY: number;
  metric: IndexName;
  value: number;
  severity: 'caution' | 'critical';
  reason: string;
}

export interface PitchEvaluation {
  id: string;
  pitchName: string;
  venue: string;
  surfaceType: string;
  date: string; // YYYY-MM-DD
  datetimeDisplay: string;
  analysisId?: number;
  sourceType: 'CSV_18_ZONE' | 'EMAIL_STADIUM_REPORT';
  sessionObjective: SessionObjective;
  notes: string;
  averages: Record<IndexName, number>;
  stats: Record<IndexName, PitchStatSummary>;
  stdDevs: Record<IndexName, number>;
  mins: Record<IndexName, number>;
  maxs: Record<IndexName, number>;
  uniformityScore: number;
  hotspots: PitchHotspot[];
  zones: PitchZone[];
}

export interface RawPitchSeed {
  id: string;
  pitchName: string;
  venue: string;
  surfaceType: string;
  date: string;
  analysisId?: number;
  sourceType: 'CSV_18_ZONE' | 'EMAIL_STADIUM_REPORT';
  sessionObjective: SessionObjective;
  notes: string;
  impact: number[]; // 18 zones
  energy: number[]; // 18 zones
  grip: number[]; // 18 zones
}

export interface SpectrumPoleSpec {
  title: string;
  loadLabel: string;
  feelsLabel: string;
  secondaryAttributeLabel?: string;
  secondaryAttributeValue?: string;
  usedFor: string;
  injuryRiskWatch: string; // Framed as suggested watch-area from PDF
  tacticalUse: string;
}

export interface IndexKnowledgeSpec {
  name: IndexName;
  shortLabel: string;
  subtitle: string;
  hardwareTester: string;
  mechanicalProperties: string[];
  quote: string;
  lowSpectrum: SpectrumPoleSpec;
  highSpectrum: SpectrumPoleSpec;
}
