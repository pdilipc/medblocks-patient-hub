import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const ParticleFieldImpl = lazy(() =>
  import("./ParticleField").then((m) => ({ default: m.ParticleField })),
);

export function ParticleFieldClient() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <ParticleFieldImpl />
      </Suspense>
    </ClientOnly>
  );
}
