import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientFormSchema, type PatientFormValues } from "@/lib/fhir/validation";
import type { FhirPatient } from "@/lib/fhir/types";

interface Props {
  defaultValues?: Partial<PatientFormValues>;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: PatientFormValues) => void;
}

export function PatientForm({ defaultValues, submitting, onCancel, onSubmit }: Props) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      given: defaultValues?.given ?? "",
      family: defaultValues?.family ?? "",
      gender: defaultValues?.gender ?? "unknown",
      birthDate: defaultValues?.birthDate ?? "",
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Given name" error={form.formState.errors.given?.message}>
          <Input autoFocus placeholder="e.g. Alex" {...form.register("given")} />
        </Field>
        <Field label="Family name" error={form.formState.errors.family?.message}>
          <Input placeholder="e.g. Morgan" {...form.register("family")} />
        </Field>
        <Field label="Gender" error={form.formState.errors.gender?.message}>
          <Select
            value={form.watch("gender")}
            onValueChange={(v) => form.setValue("gender", v as PatientFormValues["gender"], { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date of birth" error={form.formState.errors.birthDate?.message}>
          <Input type="date" max={new Date().toISOString().slice(0, 10)} {...form.register("birthDate")} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save patient"}</Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function patientToFormValues(p: FhirPatient): PatientFormValues {
  const n = p.name?.[0];
  return {
    given: (n?.given ?? []).join(" ").trim(),
    family: n?.family ?? "",
    gender: (p.gender ?? "unknown") as PatientFormValues["gender"],
    birthDate: p.birthDate ?? "",
  };
}

export function formValuesToPatient(v: PatientFormValues, base?: FhirPatient): FhirPatient {
  return {
    ...(base ?? {}),
    resourceType: "Patient",
    name: [{ use: "official", family: v.family.trim(), given: v.given.trim().split(/\s+/) }],
    gender: v.gender,
    birthDate: v.birthDate,
  };
}
