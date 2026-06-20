/**
 * Demo SynPhNe device report, structured for ingestion into the FHIR EHR
 * via a FHIR facade. Values are taken from the bundled
 * "Combined Baseline and Progress Report" PDF (patient: UnniGopal Iyer,
 * Left MCA infarct, 12-session block).
 */

export type AgAntObservation = {
  muscle: string;
  agonist: number; // 0..1 quality of agonist contraction
  antagonist: number; // 0..1 antagonist interference (lower is better)
  note: string;
};

export type SessionTrend = { session: number; pre: number; post: number };

export type SynPhNeReport = {
  patient: {
    name: string;
    age: number;
    gender: "Male" | "Female";
    occupation: string;
    condition: string; // free text
    conditionSnomed?: string;
    durationOfCondition: string;
  };
  session: {
    date: string; // ISO
    rangeFrom?: string;
    rangeTo?: string;
    sessions: number;
    trainer: string;
  };
  emg: {
    calibration: AgAntObservation[];
    training: AgAntObservation[];
    adl: AgAntObservation[];
  };
  eeg: {
    brainSymmetryPre: number;
    brainSymmetryPost: number;
    attentionResponseIndex: number;
    smileyIndex: number; // percentage
  };
  trends: {
    relativeAlpha: SessionTrend[];
    deltaAlphaRatio: SessionTrend[];
    totalAsymmetry: SessionTrend[];
  };
  observations: string[];
  recommendations: string[];
};

export const SAMPLE_SYNPHNE_REPORT: SynPhNeReport = {
  patient: {
    name: "UnniGopal Iyer",
    age: 63,
    gender: "Male",
    occupation: "Business",
    condition: "Left MCA infarct",
    conditionSnomed: "422504002", // Ischaemic stroke
    durationOfCondition: "1 year",
  },
  session: {
    date: "2022-02-16",
    rangeFrom: "2022-02-24",
    rangeTo: "2022-03-24",
    sessions: 12,
    trainer: "Dr. Ankita Mehendale",
  },
  emg: {
    calibration: [
      {
        muscle: "Supinator",
        agonist: 0.05,
        antagonist: 0.9,
        note: "No isolated agonist contraction; antagonist activity throughout.",
      },
      {
        muscle: "Pronator",
        agonist: 0.2,
        antagonist: 0.85,
        note: "Some isolated agonist contraction; maximum antagonist activity.",
      },
      {
        muscle: "Thumb",
        agonist: 0,
        antagonist: 0.95,
        note: "No agonist contraction; antagonist activity throughout.",
      },
      {
        muscle: "Wrist extensor",
        agonist: 0.75,
        antagonist: 0.35,
        note: "Good isolated agonist contraction; some antagonist in between.",
      },
      {
        muscle: "Wrist flexor",
        agonist: 0.05,
        antagonist: 0.9,
        note: "No agonist contraction; antagonist activity only.",
      },
      {
        muscle: "Finger extensor",
        agonist: 0.7,
        antagonist: 0.25,
        note: "Good agonist contraction; minimum antagonist activity.",
      },
      {
        muscle: "Finger flexor",
        agonist: 0.05,
        antagonist: 0.9,
        note: "No agonist activation; antagonist throughout.",
      },
    ],
    training: [
      {
        muscle: "Wrist extension",
        agonist: 0.8,
        antagonist: 0.2,
        note: "Good isolated agonist contraction but no relaxation.",
      },
      {
        muscle: "Fingers extension",
        agonist: 0.78,
        antagonist: 0.25,
        note: "Good isolated agonist contraction but no relaxation.",
      },
    ],
    adl: [
      {
        muscle: "Picking up a pen",
        agonist: 0.05,
        antagonist: 0.85,
        note: "No agonist; compensating with stronger muscles.",
      },
      {
        muscle: "Grasping a bottle",
        agonist: 0.1,
        antagonist: 0.8,
        note: "No agonist; antagonist activity throughout.",
      },
    ],
  },
  eeg: {
    brainSymmetryPre: -0.1936,
    brainSymmetryPost: -0.841,
    attentionResponseIndex: 2.902,
    smileyIndex: 42.9,
  },
  trends: {
    // Synthetic 12-session series consistent with the PDF's described slopes.
    relativeAlpha: [
      { session: 1, pre: 0.28, post: 0.31 },
      { session: 2, pre: 0.3, post: 0.33 },
      { session: 3, pre: 0.31, post: 0.34 },
      { session: 4, pre: 0.33, post: 0.34 },
      { session: 5, pre: 0.35, post: 0.36 },
      { session: 6, pre: 0.36, post: 0.36 },
      { session: 7, pre: 0.37, post: 0.37 },
      { session: 8, pre: 0.4, post: 0.38 },
      { session: 9, pre: 0.43, post: 0.39 },
      { session: 10, pre: 0.46, post: 0.39 },
      { session: 11, pre: 0.48, post: 0.4 },
      { session: 12, pre: 0.5, post: 0.41 },
    ],
    deltaAlphaRatio: [
      { session: 1, pre: 60, post: 65 },
      { session: 2, pre: 58, post: 63 },
      { session: 3, pre: 55, post: 62 },
      { session: 4, pre: 53, post: 60 },
      { session: 5, pre: 50, post: 58 },
      { session: 6, pre: 47, post: 57 },
      { session: 7, pre: 45, post: 56 },
      { session: 8, pre: 42, post: 55 },
      { session: 9, pre: 40, post: 54 },
      { session: 10, pre: 37, post: 53 },
      { session: 11, pre: 35, post: 52 },
      { session: 12, pre: 32, post: 51 },
    ],
    totalAsymmetry: [
      { session: 1, pre: -0.3, post: -0.25 },
      { session: 2, pre: -0.35, post: -0.2 },
      { session: 3, pre: -0.4, post: -0.15 },
      { session: 4, pre: -0.45, post: -0.1 },
      { session: 5, pre: -0.5, post: -0.05 },
      { session: 6, pre: -0.55, post: 0 },
      { session: 7, pre: -0.6, post: 0.04 },
      { session: 8, pre: -0.62, post: 0.08 },
      { session: 9, pre: -0.65, post: 0.1 },
      { session: 10, pre: -0.7, post: 0.12 },
      { session: 11, pre: -0.72, post: 0.15 },
      { session: 12, pre: -0.78, post: 0.18 },
    ],
  },
  observations: [
    "Slightly reduced tightness in right hand; free shoulder and wrist range of motion.",
    "More antagonist activity in pronators and wrist flexors.",
    "Better attention during session; DAR trend still needs improvement.",
    "Compensating with stronger muscles during ADL tasks (pen, bottle).",
  ],
  recommendations: [
    "Regular SynPhNe training for self-regulation and motor recovery.",
    "Dynamic relaxation training to maintain attention during movement.",
    "Stretching of right upper limb to reduce muscle tightness.",
    "Reaching activities to reduce trunk compensation.",
    "Engage left hemisphere throughout the day for inter-hemispheric symmetry.",
  ],
};

/**
 * Mapping table demonstrating how each metric is projected onto a FHIR
 * resource via the device facade. Used as a transparency footer in the UI.
 */
export const SYNPHNE_FHIR_MAP: {
  metric: string;
  resource: string;
  code: string;
  system: string;
}[] = [
  {
    metric: "EMG agonist/antagonist activation",
    resource: "Observation (laterality.left)",
    code: "76038-1",
    system: "LOINC",
  },
  {
    metric: "Brain Symmetry Index",
    resource: "Observation",
    code: "BSI",
    system: "SynPhNe.local",
  },
  {
    metric: "Attention Response Index",
    resource: "Observation",
    code: "ARI",
    system: "SynPhNe.local",
  },
  {
    metric: "Smiley Index (learning state)",
    resource: "Observation (panel)",
    code: "SMI",
    system: "SynPhNe.local",
  },
  {
    metric: "Session series (Relative Alpha, DAR, Asymmetry)",
    resource: "Observation.component[] per session",
    code: "EEG-PSD",
    system: "LOINC ~ 28637-1",
  },
  {
    metric: "Clinician recommendation",
    resource: "CarePlan.activity",
    code: "734163000",
    system: "SNOMED CT",
  },
  {
    metric: "Encounter (training block)",
    resource: "Encounter",
    code: "AMB",
    system: "v3-ActCode",
  },
];
