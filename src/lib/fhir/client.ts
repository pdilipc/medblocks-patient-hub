import type {
  FhirBundle,
  FhirCondition,
  FhirMedicationRequest,
  FhirObservation,
  FhirPatient,
} from "./types";
import { VITAL_CODES } from "./types";

const BASE = "/api/fhir";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    headers: { Accept: "application/fhir+json", "Content-Type": "application/fhir+json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`FHIR ${init?.method ?? "GET"} ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function listPatients(name?: string): Promise<FhirPatient[]> {
  const qs = new URLSearchParams({ _count: "100", _sort: "-_lastUpdated" });
  if (name && name.trim()) qs.set("name", name.trim());
  const bundle = await request<FhirBundle<FhirPatient>>(`Patient?${qs.toString()}`);
  return (bundle.entry ?? []).map((e) => e.resource).filter(Boolean);
}

export async function getPatient(id: string): Promise<FhirPatient> {
  return request<FhirPatient>(`Patient/${id}`);
}

export async function createPatient(patient: FhirPatient): Promise<FhirPatient> {
  return request<FhirPatient>("Patient", { method: "POST", body: JSON.stringify(patient) });
}

export async function updatePatient(id: string, patient: FhirPatient): Promise<FhirPatient> {
  return request<FhirPatient>(`Patient/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...patient, id }),
  });
}

export async function listVitalObservations(patientId: string): Promise<FhirObservation[]> {
  const codes = [
    VITAL_CODES.heartRate,
    VITAL_CODES.temperature,
    VITAL_CODES.respiratoryRate,
    VITAL_CODES.oxygenSaturation,
    VITAL_CODES.height,
    VITAL_CODES.weight,
    VITAL_CODES.bmi,
    VITAL_CODES.bloodPressure,
  ].join(",");
  const qs = new URLSearchParams({
    subject: `Patient/${patientId}`,
    code: codes,
    _count: "500",
    _sort: "-date",
  });
  const bundle = await request<FhirBundle<FhirObservation>>(`Observation?${qs.toString()}`);
  return (bundle.entry ?? []).map((e) => e.resource).filter(Boolean);
}

export async function listConditions(patientId: string): Promise<FhirCondition[]> {
  const qs = new URLSearchParams({ patient: patientId, _count: "200" });
  const bundle = await request<FhirBundle<FhirCondition>>(`Condition?${qs.toString()}`);
  return (bundle.entry ?? []).map((e) => e.resource).filter(Boolean);
}

export async function listMedications(patientId: string): Promise<FhirMedicationRequest[]> {
  const qs = new URLSearchParams({ patient: patientId, _count: "200" });
  const bundle = await request<FhirBundle<FhirMedicationRequest>>(
    `MedicationRequest?${qs.toString()}`,
  );
  return (bundle.entry ?? []).map((e) => e.resource).filter(Boolean);
}

export function formatPatientName(p: FhirPatient | undefined | null): string {
  if (!p?.name?.length) return "Unnamed patient";
  const n = p.name[0];
  if (n.text) return n.text;
  const given = (n.given ?? []).join(" ");
  return [given, n.family].filter(Boolean).join(" ") || "Unnamed patient";
}
