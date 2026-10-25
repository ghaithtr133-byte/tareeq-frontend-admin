import type { NextRequest } from "next/server";

import {
  ADMIN_DEV_API_UPSTREAM,
  createProxyResponseHeaders,
  createUpstreamHeaders,
  getAllowedDevApiEndpoint,
  isAdminDevApiProxyEnabled,
} from "@/lib/admin-dev-api-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ path: string[] }> };

function unavailableResponse(): Response {
  return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
}

function rejectedResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { success: false, error: { code, message, details: {} } },
    { status, headers: { "cache-control": "no-store" } },
  );
}

async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
  if (!isAdminDevApiProxyEnabled()) return unavailableResponse();

  const { path } = await context.params;
  const endpoint = getAllowedDevApiEndpoint(path);
  if (!endpoint) return unavailableResponse();
  if (!endpoint.methods.includes(request.method)) {
    return rejectedResponse(405, "METHOD_NOT_ALLOWED", "The requested method is not supported by this development proxy.");
  }

  const target = new URL(`${ADMIN_DEV_API_UPSTREAM}${endpoint.path}`);
  target.search = request.nextUrl.search;

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: createUpstreamHeaders(request.headers),
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return rejectedResponse(502, "DEV_PROXY_UPSTREAM_UNAVAILABLE", "The development API proxy could not reach the approved upstream service.");
  }

  // The approved API has no redirect contracts. Do not turn this route into an
  // arbitrary external redirector if the upstream configuration changes.
  if (upstream.status >= 300 && upstream.status < 400) {
    return rejectedResponse(502, "DEV_PROXY_UNEXPECTED_REDIRECT", "The approved upstream returned an unexpected redirect.");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: createProxyResponseHeaders(upstream.headers),
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const OPTIONS = forward;
