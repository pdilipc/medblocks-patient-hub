import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Brain, ChevronDown, HeartPulse, Activity, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import {
  SAMPLE_SCALE_SCORES,
  SIS_DOMAINS,
  type ScaleBand,
  type ScaleSummary,
} from "@/lib/scales/sampleScales";

const BAND_COLOR: Record<ScaleBand, string> = {
  normal:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  mild:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  moderate: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  severe:   "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const BAND_BAR: Record<ScaleBand, string> = {
  normal:   "from-emerald-400 to-emerald-500",
  mild:     "from-amber-400 to-amber-500",
  moderate: "from-orange-400 to-orange-500",
  severe:   "from-rose-400 to-rose-500",
};

const ICONS = {
  phq9: HeartPulse,
  gad7: Activity,
  gds15: Brain,
  sis: Users,
} as const;

export function ScaleScoresPanel({
  scales = SAMPLE_SCALE_SCORES,
}: {
  scales?: ScaleSummary[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showFhir, setShowFhir] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".scale-card", {
        y: 14,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.06,
      });
      gsap.from(".scale-bar > div", {
        scaleX: 0,
        transformOrigin: "left",
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.2,
      });
      ref.current!.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count ?? "0");
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toString();
          },
        });
      });
      gsap.from(".sis-bar > div", {
        scaleX: 0,
        transformOrigin: "left",
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.05,
        delay: 0.3,
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Clinical scale scores</h2>
          <p className="text-xs text-muted-foreground">
            Ingested via FHIR facade · {format(parseISO(scales[0].effectiveDateTime), "d MMM yyyy")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFhir((s) => !s)}
          className="text-xs"
        >
          FHIR mapping
          <ChevronDown
            className={`ml-1 h-3.5 w-3.5 transition-transform ${showFhir ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {scales.map((s) => {
          const Icon = ICONS[s.key];
          const pct = Math.min(100, Math.round((s.score / s.max) * 100));
          return (
            <Card key={s.key} className="scale-card relative overflow-hidden p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-mono">LOINC {s.loinc}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">{s.label}</div>
                </div>
                <Badge variant="outline" className={`border ${BAND_COLOR[s.band]} capitalize`}>
                  {s.band}
                </Badge>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span data-count={s.score} className="text-3xl font-semibold tabular-nums text-foreground">
                  0
                </span>
                <span className="text-sm text-muted-foreground">/ {s.max}</span>
              </div>

              <div className="scale-bar mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${BAND_BAR[s.band]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">{s.interpretation}</p>
            </Card>
          );
        })}
      </div>

      {/* SIS 8-domain breakdown — one parent Observation, 8 components */}
      <Card className="scale-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Stroke Impact Scale — 8 domains
            </h3>
            <p className="text-xs text-muted-foreground">
              Single <span className="font-mono">Observation</span> with 8{" "}
              <span className="font-mono">component[]</span> entries (LOINC 71802-3)
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-[10px]">
            component × {SIS_DOMAINS.length}
          </Badge>
        </div>

        <div className="space-y-2.5">
          {SIS_DOMAINS.map((d) => {
            const band: ScaleBand =
              d.score < 40 ? "severe" : d.score < 60 ? "moderate" : d.score < 80 ? "mild" : "normal";
            return (
              <div key={d.code} className="grid grid-cols-[140px_1fr_48px] items-center gap-3">
                <div className="text-xs text-muted-foreground">{d.label}</div>
                <div className="sis-bar h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${BAND_BAR[band]}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <div className="text-right text-xs font-medium tabular-nums text-foreground">
                  {d.score}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {showFhir ? (
        <Card className="scale-card p-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            FHIR resources emitted by the facade
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-1.5 text-left font-medium">Scale</th>
                  <th className="py-1.5 text-left font-medium">Resource</th>
                  <th className="py-1.5 text-left font-medium">LOINC</th>
                  <th className="py-1.5 text-left font-medium">Shape</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {scales.map((s) => (
                  <tr key={s.key} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5">{s.observation.code.text}</td>
                    <td className="py-1.5">Observation</td>
                    <td className="py-1.5">{s.loinc}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {s.key === "sis"
                        ? `1 parent + ${SIS_DOMAINS.length} component[]`
                        : "valueQuantity"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
