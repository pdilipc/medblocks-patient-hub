/**
 * Demo clinical scale scores for a single post-stroke patient ("Eleanor"),
 * shaped as FHIR Observation resources so the UI can render exactly what
 * the EHR would receive from the FHIR facade.
 *
 * Scales modelled:
 *  - PHQ-9   depression          LOINC 44249-1
 *  - GAD-7   anxiety             LOINC 69737-5
 *  - GDS-15  geriatric depression LOINC 48543-2
 *  - SIS-16  stroke impact scale LOINC 71802-3 (one parent Observation
 *            with 8 component domains, NOT 59 separate Observations)
 */

import type { FhirObservation } from "@/lib/fhir/types";

export type ScaleBand = "normal" | "mild" | "moderate" | "severe";

export type ScaleSummary = {
  key: "phq9" | "gad7" | "gds15" | "sis";
  label: string;
  loinc: string;
  score: number;
  max: number;
  band: ScaleBand;
  interpretation: string;
  effectiveDateTime: string;
  observation: FhirObservation;
};

const PATIENT_REF = "Patient/p_stroke_7741";
const TODAY = "2026-06-21T10:15:00Z";

/** PHQ-9 — moderate-severe depression */
const phq9: FhirObservation = {
  resourceType: "Observation",
  id: "obs-phq9-eleanor-2026",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "44249-1", display: "PHQ-9 depression panel" },
    ],
    text: "PHQ-9",
  },
  effectiveDateTime: TODAY,
  valueQuantity: { value: 14, unit: "{score}" },
  subject: { reference: PATIENT_REF },
};

/** GAD-7 — moderate anxiety */
const gad7: FhirObservation = {
  resourceType: "Observation",
  id: "obs-gad7-eleanor-2026",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "69737-5", display: "GAD-7 anxiety panel" },
    ],
    text: "GAD-7",
  },
  effectiveDateTime: TODAY,
  valueQuantity: { value: 11, unit: "{score}" },
  subject: { reference: PATIENT_REF },
};

/** GDS-15 — mild depression range */
const gds15: FhirObservation = {
  resourceType: "Observation",
  id: "obs-gds15-eleanor-2026",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "48543-2", display: "Geriatric depression scale (15-item)" },
    ],
    text: "GDS-15",
  },
  effectiveDateTime: TODAY,
  valueQuantity: { value: 6, unit: "{score}" },
  subject: { reference: PATIENT_REF },
};

/** SIS — 8 domain components on one parent Observation. */
export type SisDomain = {
  code: string;
  label: string;
  /** 0–100 normalised domain score */
  score: number;
};

export const SIS_DOMAINS: SisDomain[] = [
  { code: "strength",       label: "Strength",                score: 42 },
  { code: "memory",         label: "Memory & thinking",       score: 71 },
  { code: "emotion",        label: "Emotion",                 score: 38 },
  { code: "communication",  label: "Communication",           score: 78 },
  { code: "adl",            label: "ADL / IADL",              score: 55 },
  { code: "mobility",       label: "Mobility",                score: 60 },
  { code: "hand",           label: "Hand function",           score: 25 },
  { code: "participation",  label: "Social participation",    score: 44 },
];

const sis: FhirObservation = {
  resourceType: "Observation",
  id: "obs-sis-eleanor-2026",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "71802-3", display: "Stroke Impact Scale" },
    ],
    text: "SIS (8 domains)",
  },
  effectiveDateTime: TODAY,
  subject: { reference: PATIENT_REF },
  component: SIS_DOMAINS.map((d) => ({
    code: { coding: [{ system: "http://synphne.local/sis", code: d.code, display: d.label }] },
    valueQuantity: { value: d.score, unit: "{score}" },
  })),
};

function phq9Band(v: number): { band: ScaleBand; text: string } {
  if (v >= 20) return { band: "severe", text: "Severe depression" };
  if (v >= 15) return { band: "severe", text: "Moderately severe" };
  if (v >= 10) return { band: "moderate", text: "Moderate depression" };
  if (v >= 5) return { band: "mild", text: "Mild depression" };
  return { band: "normal", text: "Minimal" };
}
function gad7Band(v: number): { band: ScaleBand; text: string } {
  if (v >= 15) return { band: "severe", text: "Severe anxiety" };
  if (v >= 10) return { band: "moderate", text: "Moderate anxiety" };
  if (v >= 5) return { band: "mild", text: "Mild anxiety" };
  return { band: "normal", text: "Minimal" };
}
function gdsBand(v: number): { band: ScaleBand; text: string } {
  if (v >= 10) return { band: "severe", text: "Severe depression" };
  if (v >= 5) return { band: "moderate", text: "Suggestive of depression" };
  return { band: "normal", text: "Normal" };
}
function sisBand(avg: number): { band: ScaleBand; text: string } {
  if (avg < 40) return { band: "severe", text: "Severe impact" };
  if (avg < 60) return { band: "moderate", text: "Moderate impact" };
  if (avg < 80) return { band: "mild", text: "Mild impact" };
  return { band: "normal", text: "Minimal impact" };
}

const sisAvg = Math.round(
  SIS_DOMAINS.reduce((s, d) => s + d.score, 0) / SIS_DOMAINS.length,
);

export const SAMPLE_SCALE_SCORES: ScaleSummary[] = [
  {
    key: "phq9",
    label: "PHQ-9 · Depression",
    loinc: "44249-1",
    score: 14,
    max: 27,
    ...phq9Band(14),
    band: phq9Band(14).band,
    interpretation: phq9Band(14).text,
    effectiveDateTime: TODAY,
    observation: phq9,
  },
  {
    key: "gad7",
    label: "GAD-7 · Anxiety",
    loinc: "69737-5",
    score: 11,
    max: 21,
    ...gad7Band(11),
    band: gad7Band(11).band,
    interpretation: gad7Band(11).text,
    effectiveDateTime: TODAY,
    observation: gad7,
  },
  {
    key: "gds15",
    label: "GDS-15 · Geriatric mood",
    loinc: "48543-2",
    score: 6,
    max: 15,
    ...gdsBand(6),
    band: gdsBand(6).band,
    interpretation: gdsBand(6).text,
    effectiveDateTime: TODAY,
    observation: gds15,
  },
  {
    key: "sis",
    label: "SIS · Stroke Impact (avg)",
    loinc: "71802-3",
    score: sisAvg,
    max: 100,
    ...sisBand(sisAvg),
    band: sisBand(sisAvg).band,
    interpretation: sisBand(sisAvg).text,
    effectiveDateTime: TODAY,
    observation: sis,
  },
];

export const SAMPLE_SIS_OBSERVATION = sis;
