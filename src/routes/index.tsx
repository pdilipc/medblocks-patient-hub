import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Plus, Search, UserRound, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, differenceInYears, parseISO } from "date-fns";
import {
  createPatient,
  formatPatientName,
  listPatients,
  updatePatient,
} from "@/lib/fhir/client";
import type { FhirPatient } from "@/lib/fhir/types";
import {
  PatientForm,
  formValuesToPatient,
  patientToFormValues,
} from "@/components/patient/PatientForm";
import type { PatientFormValues } from "@/lib/fhir/validation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Patients — Verada Neurorehab Readiness" },
      { name: "description", content: "Search, create, and manage neurorehabilitation patients." },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; patient?: FhirPatient } | null>(null);
  const qc = useQueryClient();

  useMemo(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["patients", debounced],
    queryFn: () => listPatients(debounced || undefined),
  });

  const create = useMutation({
    mutationFn: (v: PatientFormValues) => createPatient(formValuesToPatient(v)),
    onSuccess: () => {
      toast.success("Patient created");
      qc.invalidateQueries({ queryKey: ["patients"] });
      setDialog(null);
    },
    onError: (e: Error) => toast.error("Failed to create patient", { description: e.message }),
  });

  const update = useMutation({
    mutationFn: ({ id, values, base }: { id: string; values: PatientFormValues; base: FhirPatient }) =>
      updatePatient(id, formValuesToPatient(values, base)),
    onSuccess: () => {
      toast.success("Patient updated");
      qc.invalidateQueries({ queryKey: ["patients"] });
      setDialog(null);
    },
    onError: (e: Error) => toast.error("Failed to update patient", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find, create, and review patient records from the FHIR server.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 sm:w-72"
            />
          </div>
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="mr-1.5 h-4 w-4" />
            New patient
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {query.isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load patients: {(query.error as Error).message}
          </div>
        ) : (query.data ?? []).length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">No patients found.</p>
            <Button className="mt-4" variant="outline" onClick={() => setDialog({ mode: "create" })}>
              <Plus className="mr-1.5 h-4 w-4" /> Create the first patient
            </Button>
          </div>
        ) : (
          <AnimatedList>
            {(query.data ?? []).map((p) => (
              <li key={p.id} className="patient-row group flex items-center gap-3 p-3 transition hover:bg-accent/40">
                <Link
                  to="/patient/$id"
                  params={{ id: p.id! }}
                  className="flex flex-1 items-center gap-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{formatPatientName(p)}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>ID: <span className="font-mono">{p.id}</span></span>
                      {p.birthDate ? <span>· DOB {format(parseISO(p.birthDate), "d MMM yyyy")} ({differenceInYears(new Date(), parseISO(p.birthDate))} y)</span> : null}
                    </div>
                  </div>
                  {p.gender ? (
                    <Badge variant="secondary" className="capitalize">{p.gender}</Badge>
                  ) : null}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); setDialog({ mode: "edit", patient: p }); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="ml-1.5">Edit</span>
                </Button>
              </li>
            ))}
          </AnimatedList>
        )}
      </Card>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit patient" : "New patient"}</DialogTitle>
            <DialogDescription>
              Demographic fields are validated and written back to the FHIR server.
            </DialogDescription>
          </DialogHeader>
          {dialog ? (
            <PatientForm
              defaultValues={dialog.mode === "edit" && dialog.patient ? patientToFormValues(dialog.patient) : undefined}
              submitting={create.isPending || update.isPending}
              onCancel={() => setDialog(null)}
              onSubmit={(values) => {
                if (dialog.mode === "edit" && dialog.patient?.id) {
                  update.mutate({ id: dialog.patient.id, values, base: dialog.patient });
                } else {
                  create.mutate(values);
                }
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
