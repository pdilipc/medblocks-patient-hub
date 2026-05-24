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

export const FUGL_MEYER_CODE = "97711-6";

export interface FuglMeyerCohortEntry {
  patient: FhirPatient;
  baseline: { value: number; date?: string } | null;
  final: { value: number; date?: string } | null;
  count: number;
  delta: number | null;
}

interface MixedBundleEntry {
  resource: FhirPatient | FhirObservation;
  fullUrl?: string;
}

export async function listFuglMeyerCohort(): Promise<FuglMeyerCohortEntry[]> {
  const qs = new URLSearchParams({
    code: FUGL_MEYER_CODE,
    _include: "Observation:subject",
    _count: "500",
  });
  const bundle = await request<{ entry?: MixedBundleEntry[] }>(
    `Observation?${qs.toString()}`,
  );
  const entries = bundle.entry ?? [];
  const patients = new Map<string, FhirPatient>();
  const scoresByPatient = new Map<string, { value: number; date?: string }[]>();

  for (const e of entries) {
    const r = e.resource;
    if (!r) continue;
    if (r.resourceType === "Patient" && r.id) {
      patients.set(r.id, r);
    } else if (r.resourceType === "Observation") {
      const obs = r as FhirObservation;
      const ref = obs.subject?.reference ?? "";
      const id = ref.startsWith("Patient/") ? ref.slice(8) : ref;
      const val = obs.valueQuantity?.value;
      if (!id || val == null) continue;
      const arr = scoresByPatient.get(id) ?? [];
      arr.push({ value: val, date: obs.effectiveDateTime ?? obs.issued });
      scoresByPatient.set(id, arr);
    }
  }

  const cohort: FuglMeyerCohortEntry[] = [];
  for (const [pid, raw] of scoresByPatient.entries()) {
    const patient = patients.get(pid);
    if (!patient) continue;
    const sorted = [...raw].sort((a, b) => {
      const da = a.date ? Date.parse(a.date) : 0;
      const db = b.date ? Date.parse(b.date) : 0;
      return da - db;
    });
    const baseline = sorted[0] ?? null;
    const final = sorted.length > 1 ? sorted[sorted.length - 1] : null;
    cohort.push({
      patient,
      baseline,
      final,
      count: sorted.length,
      delta:
        baseline && final ? Number((final.value - baseline.value).toFixed(1)) : null,
    });
  }
  cohort.sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));
  return cohort;
}
