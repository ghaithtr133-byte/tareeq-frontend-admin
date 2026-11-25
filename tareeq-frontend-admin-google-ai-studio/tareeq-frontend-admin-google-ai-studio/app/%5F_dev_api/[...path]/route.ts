import type { NextRequest } from "next/server";

import {
  ADMIN_DEV_API_UPSTREAM,
  createNormalizedUpstreamHeaders,
  createPublicSettingsHeaders,
  createProxyResponseHeaders,
  getAllowedDevApiEndpoint,
  isAdminDevApiProxyEnabled,
  validateTrustedDevelopmentRequest,
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

  const trustedRequest = validateTrustedDevelopmentRequest(request.headers, request.method);
  if (!trustedRequest.trusted) {
    return rejectedResponse(403, "DEV_PROXY_UNTRUSTED_LOCAL_REQUEST", "The request did not satisfy the local development proxy boundary.");
  }

  const target = new URL(`${ADMIN_DEV_API_UPSTREAM}${endpoint.path}`);
  target.search = request.nextUrl.search;

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (endpoint.path === "/admin/uploads/images") {
      const maxBytes = 4_100_000;
      if (Number(request.headers.get("content-length")) > maxBytes) return rejectedResponse(413, "PAYLOAD_TOO_LARGE", "Image upload request exceeds the documented limit.");
      const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let length = 0;
      if (reader) { while (true) { const chunk = await reader.read(); if (chunk.done) break; length += chunk.value.byteLength; if (length > maxBytes) { await reader.cancel(); return rejectedResponse(413, "PAYLOAD_TOO_LARGE", "Image upload request exceeds the documented limit."); } chunks.push(chunk.value); } }
      const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; } body = bytes.buffer;
    } else body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: endpoint.path === "/site-settings" ? createPublicSettingsHeaders() : createNormalizedUpstreamHeaders(request.headers),
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
export const DELETE = forward;
export const OPTIONS = forward;
