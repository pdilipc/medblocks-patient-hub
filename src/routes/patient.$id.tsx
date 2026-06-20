import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, IdCard, UserRound, AlertCircle } from "lucide-react";
import { format, differenceInYears, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPatientName,
  getPatient,
  listConditions,
  listMedications,
  listVitalObservations,
} from "@/lib/fhir/client";
import { VitalsSection } from "@/components/patient/VitalsSection";
import { SynPhNeReportPanel } from "@/components/synphne/SynPhNeReport";

export const Route = createFileRoute("/patient/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Patient ${params.id} — Verada Neurorehab Readiness` },
      { name: "description", content: "Patient details: demographics, vital signs, conditions, and medications." },
    ],
  }),
  component: PatientDetailsPage,
});

function PatientDetailsPage() {
  const { id } = Route.useParams();
  const [patient, observations, conditions, meds] = useQueries({
    queries: [
      { queryKey: ["patient", id], queryFn: () => getPatient(id) },
      { queryKey: ["patient", id, "vitals"], queryFn: () => listVitalObservations(id) },
      { queryKey: ["patient", id, "conditions"], queryFn: () => listConditions(id) },
      { queryKey: ["patient", id, "medications"], queryFn: () => listMedications(id) },
    ],
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to patients
        </Link>
      </div>

      {/* Header */}
      <Card className="p-6">
        {patient.isLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ) : patient.isError ? (
          <ErrorBox label="patient" message={(patient.error as Error).message} />
        ) : patient.data ? (
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">{formatPatientName(patient.data)}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5" /><span className="font-mono">{patient.data.id}</span></span>
                {patient.data.birthDate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(parseISO(patient.data.birthDate), "d MMM yyyy")} · {differenceInYears(new Date(), parseISO(patient.data.birthDate))} y
                  </span>
                ) : null}
                {patient.data.gender ? <Badge variant="secondary" className="capitalize">{patient.data.gender}</Badge> : null}
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Vitals */}
      <section>
        {observations.isLoading ? (
          <SkeletonGrid />
        ) : observations.isError ? (
          <ErrorBox label="vital signs" message={(observations.error as Error).message} />
        ) : (
          <VitalsSection observations={observations.data ?? []} />
        )}
      </section>

      {/* SynPhNe device report (ingested via FHIR facade) */}
      <SynPhNeReportPanel />



      {/* Conditions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Conditions</h2>
        <Card className="overflow-hidden p-0">
          {conditions.isLoading ? (
            <div className="p-6"><Skeleton className="h-20 w-full" /></div>
          ) : conditions.isError ? (
            <ErrorBox label="conditions" message={(conditions.error as Error).message} />
          ) : (conditions.data ?? []).length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No conditions recorded.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(conditions.data ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">
                      {c.code?.text ?? c.code?.coding?.[0]?.display ?? c.code?.coding?.[0]?.code ?? "Unknown"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.onsetDateTime ? format(parseISO(c.onsetDateTime), "d MMM yyyy") : c.recordedDate ? format(parseISO(c.recordedDate), "d MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {c.clinicalStatus?.coding?.[0]?.code ?? "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>

      {/* Medications */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Medications</h2>
        <Card className="overflow-hidden p-0">
          {meds.isLoading ? (
            <div className="p-6"><Skeleton className="h-20 w-full" /></div>
          ) : meds.isError ? (
            <ErrorBox label="medications" message={(meds.error as Error).message} />
          ) : (meds.data ?? []).length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No medication requests on file.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Authored</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(meds.data ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-foreground">
                      {m.medicationCodeableConcept?.text
                        ?? m.medicationCodeableConcept?.coding?.[0]?.display
                        ?? m.medicationReference?.display
                        ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{m.status ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.authoredOn ? format(parseISO(m.authoredOn), "d MMM yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4"><Skeleton className="h-48 w-full" /></Card>
      ))}
    </div>
  );
}

function ErrorBox({ label, message }: { label: string; message: string }) {
  return (
    <div className="flex items-start gap-2 p-6 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Failed to load {label}: {message}</span>
    </div>
  );
}
