import { createFileRoute } from "@tanstack/react-router";

const FHIR_HEADERS_OUT = {
  "Content-Type": "application/fhir+json",
};

async function proxy(request: Request, splat: string) {
  const base = process.env.FHIR_BASE_URL;
  const token = process.env.FHIR_BEARER_TOKEN;
  if (!base || !token) {
    return new Response(
      JSON.stringify({ error: "FHIR_BASE_URL or FHIR_BEARER_TOKEN not configured" }),
      { status: 500, headers: FHIR_HEADERS_OUT },
    );
  }
  const url = new URL(request.url);
  const target = `${base.replace(/\/$/, "")}/${splat}${url.search}`;

  const init: RequestInit = {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/fhir+json",
      "Content-Type": "application/fhir+json",
    },
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const res = await fetch(target, init);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/fhir+json",
    },
  });
}

export const Route = createFileRoute("/api/fhir/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => proxy(request, params._splat ?? ""),
      POST: async ({ request, params }) => proxy(request, params._splat ?? ""),
      PUT: async ({ request, params }) => proxy(request, params._splat ?? ""),
      DELETE: async ({ request, params }) => proxy(request, params._splat ?? ""),
    },
  },
});
