import { IndexKnowledgeSpec, IndexName } from '../types/rawStadia';

/**
 * Verbatim specifications from the 3-page document:
 * "Raw Stadia | US Soccer - Indexes.pdf" (IMPACT, ENERGY, GRIP)
 */
export const RAW_STADIA_KNOWLEDGE_SPECS: IndexKnowledgeSpec[] = [
  {
    name: 'Impact',
    shortLabel: 'Surface Layer Compaction & Force Attenuation',
    subtitle:
      "The surface's impact is dependent on the compaction of the different surface layers.",
    hardwareTester: 'Raw Artificial Athlete (RAA)',
    mechanicalProperties: ['Hardness', 'Shock Absorption', 'Surface Deformation'],
    quote:
      'Harder surfaces are known to promote higher running speeds and sprint distance, but expose players to increased levels of peak loading and musculoskeletal stress.',
    lowSpectrum: {
      title: 'SOFT FIELD',
      loadLabel: 'REDUCED MECHANICAL LOAD',
      feelsLabel: 'SOFT | COMPLIANT',
      usedFor: 'RECOVERY | REHAB',
      injuryRiskWatch: 'MUSCLES | LIGAMENTS',
      tacticalUse: 'MAINTAIN BLOCK',
    },
    highSpectrum: {
      title: 'HARD FIELD',
      loadLabel: 'INCREASED MECHANICAL LOAD',
      feelsLabel: 'HARD | SHOCKING',
      usedFor: 'BUILDING ROBUSTNESS',
      injuryRiskWatch: 'TENDONS | JOINTS',
      tacticalUse: 'TRANSITION | COUNTER',
    },
  },
  {
    name: 'Energy',
    shortLabel: 'Surface Elastic Properties & Returned Energy',
    subtitle:
      "The surface's energy is dependent on the elastic properties of the surfaces, the returned energy can be used to facilitate performance.",
    hardwareTester: 'Raw Artificial Athlete (RAA)',
    mechanicalProperties: ['Energy Restitution', 'Spring Rate'],
    quote:
      'Rebounding surfaces are known to return more energy back to players and facilitate endurance and speed. However, dependent on the speed of the returned energy low or high speed running is promoted.',
    lowSpectrum: {
      title: 'DISSIPATING FIELD',
      loadLabel: 'INCREASED PHYSIOLOGICAL LOAD',
      feelsLabel: 'REDUCED MAXIMAL SPEED',
      secondaryAttributeLabel: 'SPEED PROFILE',
      secondaryAttributeValue: 'REDUCED MAXIMAL SPEED',
      usedFor: 'ENDURANCE TRAINING',
      injuryRiskWatch: 'CALVES | CRAMPS',
      tacticalUse: 'LOW PACED GAME',
    },
    highSpectrum: {
      title: 'REBOUNDING FIELD',
      loadLabel: 'REDUCED PHYSIOLOGICAL LOAD',
      feelsLabel: 'INCREASED MAXIMAL SPEED',
      secondaryAttributeLabel: 'SPEED PROFILE',
      secondaryAttributeValue: 'INCREASED MAXIMAL SPEED',
      usedFor: 'HIGH VOLUME EXPOSURE',
      injuryRiskWatch: 'OVERLOAD',
      tacticalUse: 'HIGH PACED GAME',
    },
  },
  {
    name: 'Grip',
    shortLabel: 'Stud Penetration Ease & Available Traction',
    subtitle:
      "The surface's grip is dependent on the ease of stud penetration in the soil and available grip.",
    hardwareTester: 'Rotational Traction Tester (RTT)',
    mechanicalProperties: [
      'Stud Depth',
      'Rotational Traction',
      'Initial Grip',
      'Rotational Stiffness',
    ],
    quote:
      'Sufficient grip is key for peak performance, whilst excessive or insufficient grip exposes players to risk of injury or slipping whilst changing direction.',
    lowSpectrum: {
      title: 'LOW TRACTION FIELD',
      loadLabel: 'INCREASED METABOLIC LOAD',
      feelsLabel: 'REDUCED AGILITY',
      secondaryAttributeLabel: 'MOVEMENT PROFILE',
      secondaryAttributeValue: 'REDUCED AGILITY',
      usedFor: 'POWER GENERATION',
      injuryRiskWatch: 'GROIN | SLIPPING',
      tacticalUse: 'BLOCKED DEFENSE',
    },
    highSpectrum: {
      title: 'HIGH TRACTION FIELD',
      loadLabel: 'REDUCED METABOLIC LOAD',
      feelsLabel: 'INCREASED EXPLOSIVENESS',
      secondaryAttributeLabel: 'MOVEMENT PROFILE',
      secondaryAttributeValue: 'INCREASED EXPLOSIVENESS',
      usedFor: 'REACTIVITY | SSG',
      injuryRiskWatch: 'ANKLE | KNEE',
      tacticalUse: '1V1 | DRIBBLING',
    },
  },
];

export interface IndexSpectrumUiSpec {
  index: IndexName;
  title: string;
  mechanicalProperty: string;
  whatIsIt: string;
  leftSpectrum: {
    title: string;
    subtitle: string;
    effectOnPlayer: string;
    suggestedInjuryWatch: string;
    tacticalUse: string;
  };
  rightSpectrum: {
    title: string;
    subtitle: string;
    effectOnPlayer: string;
    suggestedInjuryWatch: string;
    tacticalUse: string;
  };
}

export const RAW_STADIA_INDEX_SPECS: IndexSpectrumUiSpec[] = RAW_STADIA_KNOWLEDGE_SPECS.map(
  (spec) => ({
    index: spec.name,
    title: `${spec.name.toUpperCase()} INDEX (0–10)`,
    mechanicalProperty: spec.mechanicalProperties.join(' • '),
    whatIsIt: `${spec.subtitle} ${spec.quote}`,
    leftSpectrum: {
      title: spec.lowSpectrum.title,
      subtitle: spec.lowSpectrum.loadLabel,
      effectOnPlayer: spec.lowSpectrum.feelsLabel,
      suggestedInjuryWatch: spec.lowSpectrum.injuryRiskWatch,
      tacticalUse: spec.lowSpectrum.tacticalUse,
    },
    rightSpectrum: {
      title: spec.highSpectrum.title,
      subtitle: spec.highSpectrum.loadLabel,
      effectOnPlayer: spec.highSpectrum.feelsLabel,
      suggestedInjuryWatch: spec.highSpectrum.injuryRiskWatch,
      tacticalUse: spec.highSpectrum.tacticalUse,
    },
  })
);

export const APPENDIX_A_DEFINITIONS: { term: string; definition: string }[] = [
  {
    term: 'Impact Index (0–10) • Soft Field ↔ Hard Field',
    definition:
      'Measured via the Raw Artificial Athlete (RAA) across 18 pitch zones, combining Hardness, Shock Absorption, and Surface Deformation. Lower values indicate a Soft Field (watch: Muscles | Ligaments); higher values indicate a Hard Field (watch: Tendons | Joints).',
  },
  {
    term: 'Energy Index (0–10) • Dissipating Field ↔ Rebounding Field',
    definition:
      'Measured via the Raw Artificial Athlete (RAA), capturing Energy Restitution and Spring Rate. Lower values indicate a Dissipating Field (watch: Calves | Cramps); higher values indicate a Rebounding Field (watch: Overload).',
  },
  {
    term: 'Grip Index (0–10) • Low Traction Field ↔ High Traction Field',
    definition:
      'Measured via the Rotational Traction Tester (RTT), capturing Stud Depth, Rotational Traction, Initial Grip, and Rotational Stiffness. Lower values indicate a Low Traction Field (watch: Groin | Slipping); higher values indicate a High Traction Field (watch: Ankle | Knee).',
  },
  {
    term: 'Empirical Reference Range (Mean ± 1 SD)',
    definition:
      'Instead of arbitrary cutoffs, the Purple REF Line represents the empirical Mean and the Shaded Green Reference Band represents Mean ± 1 SD across the selected reference baseline (e.g., NTC Training Baseline across USSF Super 3, 4, and 5).',
  },
];

export const CORE_METRICS: IndexName[] = ['Impact', 'Energy', 'Grip'];

export function getKnowledgeSpec(metric: IndexName): IndexKnowledgeSpec {
  return (
    RAW_STADIA_KNOWLEDGE_SPECS.find((s) => s.name === metric) ||
    RAW_STADIA_KNOWLEDGE_SPECS[0]
  );
}
