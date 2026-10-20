export type PerformanceIndexName = 'Impact' | 'Energy' | 'Grip';
export type TrainingGoalName = 'Speed' | 'Endurance' | 'Recovery' | 'Power' | 'Reaction' | 'Metabolic';
export type IndexName = PerformanceIndexName | 'Boot' | TrainingGoalName;

export type ZoneMetrics = Record<IndexName, number>;

export interface PitchZone {
  zone: number; // 1..18 in Raw Stadia snake order
  posX: number; // 3 (Top touchline), 2 (Center spine), 1 (Bottom touchline)
  posY: number; // 1..6 (Left goal third to Right goal third)
  metrics: ZoneMetrics;
}

export interface HardwareMetrics {
  hardnessGm: number;              // Clegg / RAA peak deceleration (Gm), FIFA/Raw Stadia optimal ~65–85 Gm
  shockAbsorptionPct: number;      // Force reduction (%), FIFA optimal ~55–70%
  energyRestitutionPct: number;    // Returned mechanical energy (%), optimal ~15–22%
  rotationalResistanceNm: number;  // RTT Peak Torque (Nm), FIFA optimal ~30–50 Nm (>65 Nm high knee/ankle risk)
  studDepthMm: number;             // RTT Stud penetration depth (mm), optimal ~9–14 mm
  moisturePct: number;             // Volumetric soil moisture (%)
}

export interface RawPitchSeed {
  id: string;
  pitchName: string;
  venue: string;
  surfaceType: string;
  date: string;
  sourceType: 'CSV_18_ZONE' | 'EMAIL_MATCHDAY_REPORT' | 'USER_UPLOAD';
  sessionObjective: string;
  notes: string;
  hardwareMetrics: HardwareMetrics;
  impact: number[]; // 18 values in zone 1..18 snake order
  energy: number[]; // 18 values in zone 1..18 snake order
  grip: number[];   // 18 values in zone 1..18 snake order
  boot: number[];   // 18 values in zone 1..18 snake order
}

export interface PitchEvaluation {
  id: string;
  pitchName: string;
  venue: string;
  surfaceType: string;
  date: string;
  sourceType: 'CSV_18_ZONE' | 'EMAIL_MATCHDAY_REPORT' | 'USER_UPLOAD';
  sessionObjective: string;
  notes: string;
  hardwareMetrics: HardwareMetrics;
  averages: ZoneMetrics;
  stdDevs: ZoneMetrics;
  mins: ZoneMetrics;
  maxs: ZoneMetrics;
  uniformityScore: number; // 0-100 spatial consistency score across the 18 zones
  hotspots: {
    zone: number;
    posX: number;
    posY: number;
    metric: IndexName;
    value: number;
    severity: 'warning' | 'critical';
    reason: string;
  }[];
  zones: PitchZone[];
}

export interface EmailReport {
  id: string;
  slug: string;
  date: string;
  sentAt: string;
  from: string;
  subject: string;
  sessionObjective: 'Recovery' | 'Metabolic' | 'Reaction' | 'Speed' | 'Methodology';
  reportCategory: 'NTC Daily Training' | 'Orlando MD-1 / MD' | 'Match Day Stadium' | 'Staff Design Feedback';
  attachmentName: string;
  pitchesTested: string[];
  recommendedPitch: string;
  keyTakeaways: string[];
  metricsSummary: {
    pitch: string;
    impact: string;
    energy: string;
    grip: string;
    bootNote?: string;
  }[];
  rawHtml: string;
}

export interface IndexSpectrumSide {
  title: string;
  rangeLabel: string;
  mechanicalOrPhysiologicalLoad: string;
  surfaceFeel: string;
  recommendedUse: string;
  injuryRiskFocus: string;
  tacticalUse: string;
}

export interface IndexKnowledgeSpec {
  name: IndexName;
  category: 'Performance Index' | 'Footwear Index' | 'Training Goal Index';
  shortLabel: string;
  unitOrScale: string;
  optimalRange: [number, number];
  cautionLow: number;
  cautionHigh: number;
  formulaDisplay: string;
  hardwareTester: 'Raw Artificial Athlete (RAA)' | 'Rotational Traction Tester (RTT)' | 'Combined RAA + RTT Engine';
  mechanicalProperties: string[];
  quote: string;
  description: string;
  lowSpectrum: IndexSpectrumSide;
  highSpectrum: IndexSpectrumSide;
}
