import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { Brain, TrendingUp, TrendingDown, Minus, UserRound, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import {
  formatPatientName,
  listFuglMeyerCohort,
  type FuglMeyerCohortEntry,
} from "@/lib/fhir/client";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "Triage — Verada Neurorehab Readiness" },
      {
        name: "description",
        content:
          "Neurorehab cohort filtered by Fugl-Meyer assessment scores (LOINC 97711-6).",
      },
    ],
  }),
  component: TriagePage,
});

function TriagePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fugl-meyer-cohort"],
    queryFn: () => listFuglMeyerCohort(),
  });
  const cohort = data ?? [];
  return (
    <div className="space-y-8">
      <TriageHero cohort={cohort} loading={isLoading} />
      {isError ? (
        <Card className="p-6 text-sm text-destructive">
          Failed to load triage cohort: {(error as Error).message}
        </Card>
      ) : isLoading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Scanning observations for Fugl-Meyer assessments…
        </Card>
      ) : (
        <CohortTable cohort={cohort} />
      )}
    </div>
  );
}

function TriageHero({ cohort, loading }: { cohort: FuglMeyerCohortEntry[]; loading: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const stats = useMemo(() => {
    const withDelta = cohort.filter((c) => c.delta != null);
    const responders = withDelta.filter((c) => (c.delta ?? 0) > 0).length;
    const dropouts = cohort.filter((c) => c.delta == null).length;
    const avgDelta =
      withDelta.length === 0
        ? 0
        : Math.round(
            (withDelta.reduce((s, c) => s + (c.delta ?? 0), 0) / withDelta.length) * 10,
          ) / 10;
    return { total: cohort.length, responders, dropouts, avgDelta, withDelta };
  }, [cohort]);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".triage-hero-stagger", {
        y: 14,
        opacity: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.06,
      });
      // Animated count-up for stat numbers
      ref.current!.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count ?? "0");
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.1,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Number.isInteger(target)
              ? String(Math.round(obj.v))
              : obj.v.toFixed(1);
          },
        });
      });
      // Bars grow in
      gsap.from(".triage-bar", {
        scaleY: 0,
        transformOrigin: "bottom",
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.03,
      });
    }, ref);
    return () => ctx.revert();
  }, [stats.total]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="triage-hero-stagger flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Neurotech cohort
          </div>
          <h1 className="triage-hero-stagger mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Fugl-Meyer triage
          </h1>
          <p className="triage-hero-stagger mt-2 max-w-2xl text-sm text-muted-foreground">
            Patients with a Fugl-Meyer Motor Assessment (LOINC{" "}
            <span className="font-mono text-foreground">97711-6</span>). Sorted by
            improvement delta. Drop-outs flagged.
          </p>
          <div className="triage-hero-stagger mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="In cohort" value={stats.total} />
            <Stat label="Responders" value={stats.responders} tone="success" />
            <Stat label="Drop-outs" value={stats.dropouts} tone="warning" />
            <Stat label="Avg Δ" value={stats.avgDelta} decimals />
          </div>
        </div>
        <div className="triage-hero-stagger">
          <DeltaSparkChart cohort={cohort} loading={loading} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  decimals,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
  decimals?: boolean;
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-xl font-semibold tabular-nums ${color}`} data-count={value}>
        {decimals ? "0.0" : "0"}
      </div>
    </div>
  );
}

function DeltaSparkChart({
  cohort,
  loading,
}: {
  cohort: FuglMeyerCohortEntry[];
  loading: boolean;
}) {
  const bars = cohort
    .filter((c) => c.delta != null)
    .slice(0, 24)
    .map((c) => c.delta as number);
  const max = Math.max(1, ...bars.map((b) => Math.abs(b)));
  if (loading || bars.length === 0) {
    return (
      <div className="h-24 w-full min-w-[220px] rounded-md border border-dashed border-border bg-background/40" />
    );
  }
  return (
    <div className="flex h-24 w-full min-w-[220px] items-center gap-[3px] rounded-md border border-border bg-background/60 px-3 py-2">
      {bars.map((d, i) => {
        const h = Math.max(6, (Math.abs(d) / max) * 64);
        const positive = d >= 0;
        return (
          <div
            key={i}
            className="triage-bar w-1.5 rounded-sm"
            style={{
              height: `${h}px`,
              background: positive ? "var(--success)" : "var(--destructive)",
              opacity: 0.85,
            }}
            title={`Δ ${d}`}
          />
        );
      })}
    </div>
  );
}

function DeltaBadge({ entry }: { entry: FuglMeyerCohortEntry }) {
  if (entry.delta == null) {
    return (
      <Badge variant="outline" className="gap-1 text-warning">
        <Minus className="h-3 w-3" />
        Single score
      </Badge>
    );
  }
  if (entry.delta > 0) {
    return (
      <Badge className="gap-1 bg-success text-success-foreground hover:bg-success">
        <TrendingUp className="h-3 w-3" />+{entry.delta}
      </Badge>
    );
  }
  if (entry.delta < 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        {entry.delta}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Minus className="h-3 w-3" />0
    </Badge>
  );
}

function CohortTable({ cohort }: { cohort: FuglMeyerCohortEntry[] }) {
  const ref = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".cohort-row", {
        y: 10,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.03,
      });
    }, ref);
    return () => ctx.revert();
  }, [cohort.length]);

  if (cohort.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        <Brain className="mx-auto mb-3 h-8 w-8 opacity-50" />
        No patients found with Fugl-Meyer assessments yet.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:grid">
        <div>Patient</div>
        <div>Baseline</div>
        <div>Final</div>
        <div>Δ</div>
        <div className="text-right">Assessments</div>
      </div>
      <ul ref={ref} className="divide-y divide-border">
        {cohort.map((entry) => {
          const p = entry.patient;
          return (
            <li key={p.id} className="cohort-row">
              <Link
                to="/patient/$id"
                params={{ id: p.id! }}
                className="grid grid-cols-2 gap-4 px-4 py-3 transition hover:bg-accent/40 sm:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.8fr] sm:items-center"
              >
                <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {formatPatientName(p)}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      <span className="font-mono">{p.id}</span>
                      {p.gender ? <span className="ml-2 capitalize">· {p.gender}</span> : null}
                    </div>
                  </div>
                </div>
                <ScoreCell label="Baseline" score={entry.baseline} />
                <ScoreCell label="Final" score={entry.final} />
                <div className="flex items-center sm:block">
                  <span className="mr-2 text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
                    Δ
                  </span>
                  <DeltaBadge entry={entry} />
                </div>
                <div className="text-sm text-muted-foreground sm:text-right">
                  {entry.count}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ScoreCell({
  label,
  score,
}: {
  label: string;
  score: { value: number; date?: string } | null;
}) {
  return (
    <div>
      <span className="mr-2 text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
        {label}
      </span>
      {score ? (
        <span>
          <span className="font-mono text-sm text-foreground">{score.value}</span>
          {score.date ? (
            <span className="ml-1 text-xs text-muted-foreground">
              · {format(parseISO(score.date), "d MMM yy")}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}
