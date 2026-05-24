import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
      <TriageHero count={cohort.length} loading={isLoading} />
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

function TriageHero({ count, loading }: { count: number; loading: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".triage-hero-stagger", {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      });
      gsap.to(".triage-glow", {
        opacity: 0.85,
        scale: 1.08,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-accent/30 p-6 sm:p-8"
    >
      <div className="triage-glow pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 opacity-30 blur-3xl" />
      <div className="triage-glow pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-chart-5/25 opacity-30 blur-3xl" />
      <div className="relative">
        <div className="triage-hero-stagger flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Neurotech cohort
        </div>
        <h1 className="triage-hero-stagger mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Fugl-Meyer triage
        </h1>
        <p className="triage-hero-stagger mt-2 max-w-2xl text-sm text-muted-foreground">
          Patients with at least one Fugl-Meyer Motor Assessment (LOINC{" "}
          <span className="font-mono text-foreground">97711-6</span>). Sorted by
          improvement delta — strongest responders first. Drop-outs (single score) are
          flagged.
        </p>
        <div className="triage-hero-stagger mt-5 flex flex-wrap gap-3 text-sm">
          <div className="rounded-md border border-border bg-background/60 px-3 py-2">
            <div className="text-xs text-muted-foreground">In cohort</div>
            <div className="text-lg font-semibold text-foreground">{count}</div>
          </div>
        </div>
      </div>
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
      <ul className="divide-y divide-border">
        {cohort.map((entry) => {
          const p = entry.patient;
          return (
            <li key={p.id}>
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
