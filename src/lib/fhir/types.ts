export type Gender = "male" | "female" | "other" | "unknown";

export interface FhirHumanName {
  use?: string;
  family?: string;
  given?: string[];
  text?: string;
}

export interface FhirPatient {
  resourceType: "Patient";
  id?: string;
  name?: FhirHumanName[];
  gender?: Gender;
  birthDate?: string;
  meta?: { lastUpdated?: string };
}

export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirQuantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
}

export interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
}

export interface FhirObservation {
  resourceType: "Observation";
  id?: string;
  status?: string;
  code: FhirCodeableConcept;
  effectiveDateTime?: string;
  issued?: string;
  valueQuantity?: FhirQuantity;
  component?: FhirObservationComponent[];
  subject?: { reference?: string };
}

export interface FhirCondition {
  resourceType: "Condition";
  id?: string;
  code?: FhirCodeableConcept;
  onsetDateTime?: string;
  recordedDate?: string;
  clinicalStatus?: FhirCodeableConcept;
}

export interface FhirMedicationRequest {
  resourceType: "MedicationRequest";
  id?: string;
  status?: string;
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: { display?: string; reference?: string };
  authoredOn?: string;
}

export interface FhirBundleEntry<T> {
  resource: T;
  fullUrl?: string;
}

export interface FhirBundle<T> {
  resourceType: "Bundle";
  total?: number;
  entry?: FhirBundleEntry<T>[];
}

export const VITAL_CODES = {
  heartRate: "8867-4",
  temperature: "8310-5",
  respiratoryRate: "9279-1",
  oxygenSaturation: "59408-5",
  height: "8302-2",
  weight: "29463-7",
  bmi: "39156-5",
  bloodPressure: "55284-4",
  bpSystolic: "8480-6",
  bpDiastolic: "8462-4",
} as const;

export const VITAL_LABELS: Record<string, { label: string; unit?: string }> = {
  "8867-4": { label: "Heart rate", unit: "bpm" },
  "8310-5": { label: "Temperature", unit: "°C" },
  "9279-1": { label: "Respiratory rate", unit: "/min" },
  "59408-5": { label: "Oxygen saturation", unit: "%" },
  "8302-2": { label: "Height", unit: "cm" },
  "29463-7": { label: "Weight", unit: "kg" },
  "39156-5": { label: "BMI", unit: "kg/m²" },
  "55284-4": { label: "Blood pressure", unit: "mmHg" },
};
