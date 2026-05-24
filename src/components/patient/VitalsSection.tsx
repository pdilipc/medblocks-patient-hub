import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FhirObservation } from "@/lib/fhir/types";
import { VITAL_CODES, VITAL_LABELS } from "@/lib/fhir/types";

interface Props {
  observations: FhirObservation[];
}

interface Series {
  code: string;
  label: string;
  unit?: string;
  points: Array<{ t: number; date: string; value?: number; systolic?: number; diastolic?: number }>;
  isBP?: boolean;
}

function obsTime(o: FhirObservation): number | null {
  const s = o.effectiveDateTime ?? o.issued;
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

function obsCode(o: FhirObservation): string | undefined {
  return o.code?.coding?.find((c) => c.system?.includes("loinc"))?.code ?? o.code?.coding?.[0]?.code;
}

export function VitalsSection({ observations }: Props) {
  const series = useMemo(() => buildSeries(observations), [observations]);
  const [view, setView] = useState<"chart" | "table">("chart");

  if (observations.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">No vital sign observations available.</Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Vital signs</h2>
        <Tabs value={view} onValueChange={(v) => setView(v as "chart" | "table")}>
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "chart" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {series.map((s) => (
            <Card key={s.code} className="p-4">
              <div className="mb-1 flex items-baseline justify-between">
                <h3 className="text-sm font-medium text-foreground">{s.label}</h3>
                {s.unit ? <span className="text-xs text-muted-foreground">{s.unit}</span> : null}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{s.points.length} measurements</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={s.points} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="t"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(t) => format(new Date(t), "MMM d")}
                      stroke="currentColor"
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      minTickGap={24}
                    />
                    <YAxis
                      stroke="currentColor"
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      width={36}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(t) => format(new Date(t as number), "PPpp")}
                    />
                    {s.isBP ? (
                      <>
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="systolic" name="Systolic" stroke="var(--color-chart-3)" dot={false} strokeWidth={2} isAnimationActive={false} />
                        <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} isAnimationActive={false} />
                      </>
                    ) : (
                      <Line type="monotone" dataKey="value" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} isAnimationActive={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vital sign</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flattenForTable(observations).map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{row.date}</TableCell>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="tabular-nums">{row.value}</TableCell>
                  <TableCell className="text-muted-foreground">{row.unit ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function buildSeries(obs: FhirObservation[]): Series[] {
  const codes = [
    VITAL_CODES.heartRate,
    VITAL_CODES.temperature,
    VITAL_CODES.respiratoryRate,
    VITAL_CODES.oxygenSaturation,
    VITAL_CODES.height,
    VITAL_CODES.weight,
    VITAL_CODES.bmi,
    VITAL_CODES.bloodPressure,
  ];

  return codes
    .map((code) => {
      const meta = VITAL_LABELS[code];
      const isBP = code === VITAL_CODES.bloodPressure;
      const filtered = obs.filter((o) => obsCode(o) === code);
      const points = filtered
        .map((o) => {
          const t = obsTime(o);
          if (t == null) return null;
          if (isBP) {
            const sys = o.component?.find((c) => obsCodeOf(c.code) === VITAL_CODES.bpSystolic)?.valueQuantity?.value;
            const dia = o.component?.find((c) => obsCodeOf(c.code) === VITAL_CODES.bpDiastolic)?.valueQuantity?.value;
            if (sys == null && dia == null) return null;
            return { t, date: new Date(t).toISOString(), systolic: sys, diastolic: dia };
          }
          const v = o.valueQuantity?.value;
          if (v == null) return null;
          return { t, date: new Date(t).toISOString(), value: v };
        })
        .filter((p): p is NonNullable<typeof p> => p != null)
        .sort((a, b) => a.t - b.t);
      return { code, label: meta?.label ?? code, unit: meta?.unit, points, isBP };
    })
    .filter((s) => s.points.length > 0);
}

function obsCodeOf(cc?: { coding?: { system?: string; code?: string }[] }) {
  return cc?.coding?.find((c) => c.system?.includes("loinc"))?.code ?? cc?.coding?.[0]?.code;
}

function flattenForTable(obs: FhirObservation[]) {
  const rows: Array<{ t: number; date: string; label: string; value: string; unit?: string }> = [];
  for (const o of obs) {
    const t = obsTime(o);
    if (t == null) continue;
    const code = obsCode(o);
    if (!code) continue;
    const meta = VITAL_LABELS[code];
    const date = format(parseISO(new Date(t).toISOString()), "yyyy-MM-dd HH:mm");
    if (code === VITAL_CODES.bloodPressure) {
      const sys = o.component?.find((c) => obsCodeOf(c.code) === VITAL_CODES.bpSystolic)?.valueQuantity?.value;
      const dia = o.component?.find((c) => obsCodeOf(c.code) === VITAL_CODES.bpDiastolic)?.valueQuantity?.value;
      if (sys != null || dia != null) {
        rows.push({ t, date, label: "Blood pressure", value: `${sys ?? "—"} / ${dia ?? "—"}`, unit: "mmHg" });
      }
    } else if (o.valueQuantity?.value != null) {
      rows.push({
        t,
        date,
        label: meta?.label ?? code,
        value: String(o.valueQuantity.value),
        unit: o.valueQuantity.unit ?? meta?.unit,
      });
    }
  }
  return rows.sort((a, b) => b.t - a.t);
}
