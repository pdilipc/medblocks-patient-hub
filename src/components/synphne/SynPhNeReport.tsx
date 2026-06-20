import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Activity, Brain, Cpu, Sparkles, ChevronDown, FileDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import {
  SAMPLE_SYNPHNE_REPORT,
  SYNPHNE_FHIR_MAP,
  type SessionTrend,
  type SynPhNeReport,
} from "@/lib/synphne/sampleReport";

export function SynPhNeReportPanel({
  report = SAMPLE_SYNPHNE_REPORT,
}: {
  report?: SynPhNeReport;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".synphne-section", {
        y: 12,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.08,
      });
      ref.current!.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count ?? "0");
        const decimals = Number(el.dataset.decimals ?? "0");
        const suffix = el.dataset.suffix ?? "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.1,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = `${obj.v.toFixed(decimals)}${suffix}`;
          },
        });
      });
      gsap.from(".synphne-bar", {
        scaleX: 0,
        transformOrigin: "left",
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.03,
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Cpu className="h-4 w-4 text-primary" />
            SynPhNe device report
            <Badge variant="secondary" className="ml-1 gap-1 text-[10px]">
              <Sparkles className="h-3 w-3" /> Ingested via FHIR facade
            </Badge>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Session {report.session.sessions} block ·{" "}
            {report.session.rangeFrom
              ? `${format(parseISO(report.session.rangeFrom), "d MMM")}–${format(parseISO(report.session.rangeTo!), "d MMM yyyy")}`
              : format(parseISO(report.session.date), "d MMM yyyy")}{" "}
            · {report.session.trainer}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowMap((v) => !v)}>
          <FileDown className="mr-1.5 h-3.5 w-3.5" />
          FHIR mapping
          <ChevronDown
            className={`ml-1 h-3.5 w-3.5 transition-transform ${showMap ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      {/* Brain state */}
      <Card className="synphne-section p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
          <Brain className="h-4 w-4 text-primary" />
          Brain state (EEG)
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Brain symmetry"
            value={report.eeg.brainSymmetryPost}
            decimals={2}
            interpretation={
              report.eeg.brainSymmetryPost < 0
                ? { tone: "warning", text: "Right-hemisphere compensation" }
                : { tone: "success", text: "Symmetrical" }
            }
            reference="< 0 right · 0 ideal · > 0 left"
          />
          <MetricCard
            label="Attention response"
            value={report.eeg.attentionResponseIndex}
            decimals={2}
            interpretation={
              report.eeg.attentionResponseIndex > 1.1
                ? { tone: "warning", text: "Poor attention" }
                : report.eeg.attentionResponseIndex < 0.9
                  ? { tone: "success", text: "Good attention" }
                  : { tone: "neutral", text: "No change" }
            }
            reference="> 1.1 poor · < 0.9 good"
          />
          <MetricCard
            label="Smiley index"
            value={report.eeg.smileyIndex}
            decimals={1}
            suffix="%"
            interpretation={
              report.eeg.smileyIndex >= 70
                ? { tone: "success", text: "Ideal learning state" }
                : { tone: "warning", text: "Below learning threshold" }
            }
            reference="≥ 70% ideal"
          />
        </div>
      </Card>

      {/* Body state */}
      <Card className="synphne-section p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
          <Activity className="h-4 w-4 text-primary" />
          Body state (EMG) · calibration
        </div>
        <div className="space-y-2.5">
          {report.emg.calibration.map((m) => (
            <MuscleRow key={m.muscle} muscle={m} />
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SubGroup title="During training" rows={report.emg.training} />
          <SubGroup title="During ADL tasks" rows={report.emg.adl} />
        </div>
      </Card>

      {/* Session trends */}
      <Card className="synphne-section p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Session trends · {report.session.sessions} sessions
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <TrendChart
            label="Relative alpha (relaxation)"
            data={report.trends.relativeAlpha}
            preferHigher
          />
          <TrendChart
            label="Delta/Alpha ratio"
            data={report.trends.deltaAlphaRatio}
            preferHigher={false}
          />
          <TrendChart
            label="Total asymmetry"
            data={report.trends.totalAsymmetry}
            preferHigher
            zeroLine
          />
        </div>
      </Card>

      {/* Notes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="synphne-section p-5">
          <div className="mb-3 text-sm font-medium text-foreground">Observations</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.observations.map((o, i) => (
              <li key={i} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="synphne-section p-5">
          <div className="mb-3 text-sm font-medium text-foreground">Recommendations</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {showMap ? (
        <Card className="synphne-section overflow-hidden p-0">
          <div className="border-b border-border bg-muted/40 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            FHIR resource mapping
          </div>
          <div className="divide-y divide-border text-sm">
            {SYNPHNE_FHIR_MAP.map((m) => (
              <div
                key={m.metric}
                className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[1.5fr_1fr_1fr]"
              >
                <div className="text-foreground">{m.metric}</div>
                <div className="text-muted-foreground">{m.resource}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {m.system}:{m.code}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function MetricCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  interpretation,
  reference,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  interpretation: { tone: "success" | "warning" | "neutral"; text: string };
  reference: string;
}) {
  const toneClass =
    interpretation.tone === "success"
      ? "text-success"
      : interpretation.tone === "warning"
        ? "text-warning"
        : "text-muted-foreground";
  return (
    <div className="rounded-md border border-border bg-background/60 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className="mt-1 text-2xl font-semibold tabular-nums text-foreground"
        data-count={value}
        data-decimals={decimals}
        data-suffix={suffix}
      >
        0{suffix}
      </div>
      <div className={`mt-1 text-xs font-medium ${toneClass}`}>{interpretation.text}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{reference}</div>
    </div>
  );
}

function MuscleRow({ muscle }: { muscle: { muscle: string; agonist: number; antagonist: number; note: string } }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 text-sm">
      <div className="col-span-12 truncate font-medium text-foreground sm:col-span-3">
        {muscle.muscle}
      </div>
      <div className="col-span-12 sm:col-span-7">
        <div className="flex h-2 overflow-hidden rounded bg-muted">
          <div
            className="synphne-bar h-full"
            style={{ width: `${muscle.agonist * 50}%`, background: "var(--success)" }}
            title={`Agonist ${(muscle.agonist * 100).toFixed(0)}%`}
          />
          <div className="h-full w-px bg-border" />
          <div
            className="synphne-bar h-full"
            style={{ width: `${muscle.antagonist * 50}%`, background: "var(--destructive)" }}
            title={`Antagonist ${(muscle.antagonist * 100).toFixed(0)}%`}
          />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{muscle.note}</div>
      </div>
      <div className="col-span-12 flex gap-2 text-[11px] tabular-nums sm:col-span-2 sm:justify-end">
        <span className="text-success">{Math.round(muscle.agonist * 100)}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-destructive">{Math.round(muscle.antagonist * 100)}</span>
      </div>
    </div>
  );
}

function SubGroup({
  title,
  rows,
}: {
  title: string;
  rows: { muscle: string; agonist: number; antagonist: number; note: string }[];
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <MuscleRow key={r.muscle} muscle={r} />
        ))}
      </div>
    </div>
  );
}

function TrendChart({
  label,
  data,
  preferHigher,
  zeroLine,
}: {
  label: string;
  data: SessionTrend[];
  preferHigher: boolean;
  zeroLine?: boolean;
}) {
  const w = 260;
  const h = 90;
  const all = data.flatMap((d) => [d.pre, d.post]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * (w - 8) + 4;
  const y = (v: number) => h - 6 - ((v - min) / range) * (h - 12);
  const path = (key: "pre" | "post") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");
  const last = data[data.length - 1];
  const delta = preferHigher ? last.post - data[0].post : data[0].post - last.post;
  const positive = delta >= 0;

  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div
          className={`text-[11px] tabular-nums ${positive ? "text-success" : "text-destructive"}`}
        >
          {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full">
        {zeroLine && min < 0 && max > 0 ? (
          <line
            x1={0}
            x2={w}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--border)"
            strokeDasharray="2 3"
          />
        ) : null}
        <path d={path("pre")} fill="none" stroke="var(--chart-1)" strokeWidth={1.5} />
        <path d={path("post")} fill="none" stroke="var(--chart-3)" strokeWidth={1.5} />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.post)} r={1.6} fill="var(--chart-3)" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1 w-3 rounded" style={{ background: "var(--chart-1)" }} />
          Pre
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1 w-3 rounded" style={{ background: "var(--chart-3)" }} />
          Post
        </span>
      </div>
    </div>
  );
}
