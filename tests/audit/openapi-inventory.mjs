// Read-only, reproducible contract inventory. Prints Markdown; never writes files or sends requests.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const raw = readFileSync(process.env.ADMIN_AUDIT_SPEC ?? "C:/Users/CMerna/Downloads/tareeq-academy-api.json", "utf8");
const spec = JSON.parse(raw);
const operations = Object.entries(spec.paths).flatMap(([path, item]) => Object.entries(item).filter(([method]) => ["get", "post", "patch", "put", "delete"].includes(method)).map(([method, operation]) => ({ path: path.replace("/api/v1", ""), method: method.toUpperCase(), ...operation })));
function category(op) { if (op.path.startsWith("/auth/")) return "Admin-only authentication (both roles)"; if (op.path === "/site-settings") return "Public consumed by Admin"; if (op.path.startsWith("/admin/")) return /^SUPER_ADMIN only\./.test(op.description) ? "SUPER_ADMIN-only" : "Shared ADMIN/SUPER_ADMIN"; return op.path === "/health" ? "Internal/operational; no Dashboard consumer" : "Public Website-only; NOT APPLICABLE"; }
function family(op) {
  if (op.path.startsWith("/auth/")) return ["Auth", "api/auth.ts → session/login/logout hooks → protected shell/Login", "A", "FULLY IMPLEMENTED", ""];
  if (op.path === "/site-settings" || op.path === "/admin/site-settings") return ["Settings", "api/site-settings.ts → site-settings hooks → /admin/settings", "P3", "FULLY IMPLEMENTED", "Minor documented contract clarifications; no live PATCH acceptance"];
  if (op.path.startsWith("/admin/faqs")) return ["FAQs", "api/faqs.ts → faq hooks → /admin/faqs", "P3", "FULLY IMPLEMENTED", "Live baseline GLOBAL only; scoped/order writes mocked"];
  if (op.path.startsWith("/admin/analytics")) return ["Analytics", "api/phase4.ts → use-phase4-queries → /admin/analytics", "P4", op.path.endsWith("summary") ? "BACKEND BLOCKED" : "PARTIALLY IMPLEMENTED", op.path.endsWith("summary") ? "Existing live HTTP500; frontend mocked PASS" : "ctaId/engagementType schema blocked; not rendered"];
  if (op.path.startsWith("/admin/users")) return ["Accounts", "api/phase4.ts → phase4/account hooks → /admin/admins", "P4", "FULLY IMPLEMENTED", "PATCH only isolated/intercepted; no production account change"];
  if (op.path.startsWith("/admin/audit-logs")) return ["Audit", "api/phase4.ts → useAuditLogs → /admin/audit-log", "P4", "PARTIALLY IMPLEMENTED", "AUD-09: safe metadata incorrectly omits RESOLVED"];
  if (/^\/admin\/(applications|inquiries)/.test(op.path)) return ["Submissions", "api/submissions.ts → submission hooks → /admin/applications or /admin/inquiries", "P1", "FULLY IMPLEMENTED", "No search contract; status/note writes mocked only"];
  if (op.path === "/admin/uploads/images") return ["Media", "api/images.ts → use-image-upload → ImageUpload in all five editors + Gallery", "P2", "FULLY IMPLEMENTED", "No live upload acceptance; no standalone media library contract"];
  if (/^\/admin\/(academic-majors|cities)/.test(op.path)) return ["Catalogs", "api/university-management.ts → directory hooks → /admin/academic-majors or /admin/cities", "P2", "FULLY IMPLEMENTED", "Create mocked only; no edit/delete API"];
  if (/programs|admission-requirements|gallery/.test(op.path)) { const part = op.path.includes("programs") || op.path.includes("admission-requirements"); return ["University sections", "api/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor", "P2", part ? "PARTIALLY IMPLEMENTED" : "FULLY IMPLEMENTED", op.path.includes("programs") ? "Tuition response/history BACKEND BLOCKED; input supports one-year upsert" : op.path.includes("admission") ? "Nullable studyLevel schema BACKEND BLOCKED" : "Existing invalid Gallery asset; >100 full-order limitation; writes mocked only"]; }
  const resource = op.path.split("/")[2]; const write = ["POST", "PATCH"].includes(op.method);
  return [resource, "api/content.ts → content hooks → /admin/" + resource + " (list/new/UUID editor)", "C", resource === "universities" || resource === "scholarships" && (write || !op.path.includes("{")) || resource === "articles" && (write || op.path.includes("{")) || write ? "PARTIALLY IMPLEMENTED" : "FULLY IMPLEMENTED", resource === "universities" ? "Nullable type clearing BACKEND BLOCKED; full PATCH baseline, not changed-fields diff" : resource === "scholarships" ? write ? "AUD-02 deadline; AUD-06 stale University; AUD-03 slug; full baseline PATCH" : !op.path.includes("{") ? "AUD-04: eight university* filters missing" : "Core fields mapped; current detail mapping newly live checked" : resource === "articles" ? "AUD-01: ordered scholarshipIds/relatedScholarships absent from adapter/UI; AUD-03 slug" : write ? "AUD-03 slug min2 not enforced; full baseline PATCH" : "Original mock evidence; new SUPER_ADMIN baseline GET/UI evidence"];
}
function deref(schema) { return schema?.$ref ? spec.components.schemas[schema.$ref.split("/").at(-1)] : schema; }
function props(schema, seen = new Set()) {
  if (!schema || seen.has(schema)) return {}; seen.add(schema); const value = deref(schema); let result = { ...(value?.properties ?? {}) };
  for (const branch of value?.allOf ?? []) result = { ...result, ...props(branch, seen) };
  for (const branch of value?.anyOf ?? value?.oneOf ?? []) result = { ...result, ...props(branch, seen) };
  return result;
}
function fields(schema) { const p = props(schema); return Object.keys(p).join(", ") || "—"; }
function schemaName(schema) { return schema?.$ref?.split("/").at(-1) ?? "inline"; }
function constraint(schema) { return JSON.stringify(schema, (key, value) => ["example", "examples"].includes(key) ? undefined : value).replaceAll("|", "\\|"); }
const output = [];
const out = text => output.push(text);
out("## Appendix A — complete authoritative operation inventory\n");
out(`Source SHA-256: \`${createHash("sha256").update(raw).digest("hex")}\`. ${operations.length} operations, ${Object.keys(spec.paths).length} paths, ${Object.keys(spec.components.schemas).length} named schemas. No undocumented internal/outbox endpoint inferred.\n`);
out("| # | Operation (relative to /api/v1) | Classification |\n| --- | --- | --- |");
operations.forEach((op, i) => out(`| ${i + 1} | ${op.method} \`${op.path}\` | ${category(op)} |`));
out("\n## Appendix B — every Dashboard-relevant operation\n");
out("Evidence aliases: C=original content/mock + four content transport tests; P1=Phase1; P2=Phase2; P3=Phase3; P4=Phase4; A=accepted authentication evidence. See main report for exact test/live boundaries and superseding audit FAILs. FULLY IMPLEMENTED describes the implemented contract surface with local evidence, NOT production persistence. Every production write remains unverified. Named request/response schemas and all property constraints follow in Appendix C; no schema reference is a blanket field-level PASS.\n");
out("| Module | Method/path | Role | API → hooks → UI | Parameters covered / omitted | Request fields | Response fields handled / caveat | Status | Evidence | Missing/blocked |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const op of operations.filter(op => op.path.startsWith("/admin/") || op.path.startsWith("/auth/") || op.path === "/site-settings")) {
  let [module, ui, evidence, status, gap] = family(op); const role = category(op).startsWith("SUPER") ? "SUPER_ADMIN" : op.path === "/site-settings" ? "Public GET; both roles view" : "ADMIN / SUPER_ADMIN";
  if (op.path === "/auth/change-password") { status = "MISSING"; gap = "AUD-05: allowlisted by proxy only; no API/hook/form"; ui = "No frontend consumer"; evidence = "new contract/source FAIL"; }
  const body = Object.values(op.requestBody?.content ?? {})[0]?.schema;
  const response = op.responses["200"]?.content?.["application/json"]?.schema ?? op.responses["201"]?.content?.["application/json"]?.schema;
  const data = props(response).data; const dataProps = props(data); const item = dataProps.items?.items; const responseModel = item ?? data;
  let requestFields = fields(body); if (op.path.startsWith("/admin/articles") && body) requestFields += " (scholarshipIds MISSING; legacy field only)";
  let responseFields = fields(responseModel); if (dataProps.items) responseFields += "; pagination page/limit/total/totalPages";
  if (op.path.includes("articles") && op.path.includes("{")) responseFields += "; scholarshipIds/relatedScholarships NOT modeled/displayed";
  if (op.path.includes("program")) responseFields += "; tuition/tuitionFees opaque";
  let params = (op.parameters ?? []).map(p => `${p.in}:${p.name}${p.required ? "*" : ""}`).join(", ") || "—";
  if (op.path === "/admin/scholarships" && op.method === "GET") params += "; OMITTED: universitySearch,universityCountry,universityMajor,universityStudyLevel,universityLanguage,universityCity,universityType,universityFeatured";
  if (op.path.startsWith("/auth")) params += "; cookies per OpenAPI; no JS tokens";
  out(`| ${module} | ${op.method} \`${op.path}\` | ${role} | ${ui} | ${params} | ${schemaName(body)}: ${requestFields} | ${schemaName(response)}: ${responseFields} | ${status} | ${evidence}; audit findings supersede | ${gap || "No additional field gap identified; coverage is sampled, not exhaustive live acceptance"} |`);
}
out("\n## Appendix C — exact contract constraints and response structure\n");
out("This mechanically extracted appendix preserves required/optional/nullable fields, enums, formats, defaults, min/max/patterns, additionalProperties, composition, operation security, business descriptions and documented error statuses. It omits examples to avoid implying example data is required. Inheritance is explicit through $ref/allOf; contradictory definitions remain unchanged. Implementation exceptions are enumerated above and in the defect register; fields not displayed may legitimately be response-only IDs/timestamps, never editable payload fields.\n");
const referenced = new Set();
function collect(schema) { if (!schema || typeof schema !== "object") return; if (schema.$ref) { const name = schema.$ref.split("/").at(-1); if (referenced.has(name)) return; referenced.add(name); collect(spec.components.schemas[name]); } for (const value of Object.values(schema)) if (typeof value === "object") { if (Array.isArray(value)) value.forEach(collect); else collect(value); } }
for (const op of operations) {
  if (!(op.path.startsWith("/admin/") || op.path.startsWith("/auth/") || op.path === "/site-settings")) continue;
  out(`\n### ${op.method} ${op.path}\n`);
  out(op.description + "\n");
  out("Security: `" + JSON.stringify(op.security ?? []) + "`. Errors/statuses: " + Object.entries(op.responses).map(([status, value]) => `${status}: ${value.description}`).join("; ") + ".\n");
  if (op.parameters?.length) { out("| Parameter | Required | Schema |\n| --- | --- | --- |"); for (const p of op.parameters) { out(`| ${p.in}.${p.name} | ${p.required ? "yes" : "no"} | \`${constraint(p.schema)}\` |`); collect(p.schema); } }
  for (const [mime, content] of Object.entries(op.requestBody?.content ?? {})) { out(`\nRequest ${mime}: \`${constraint(content.schema)}\`\n`); collect(content.schema); }
  const response = op.responses["200"]?.content?.["application/json"]?.schema ?? op.responses["201"]?.content?.["application/json"]?.schema;
  if (response) { out(`Success response: \`${constraint(response)}\`\n`); collect(response); }
  for (const response of Object.values(op.responses)) for (const content of Object.values(response.content ?? {})) collect(content.schema);
}
out("\n### Referenced named schemas (unaltered except omitted examples)\n");
for (const name of [...referenced].sort()) out(`\n<details><summary>${name}</summary>\n\n\`\`\`json\n${JSON.stringify(spec.components.schemas[name], (key, value) => ["example", "examples"].includes(key) ? undefined : value, 2)}\n\`\`\`\n\n</details>\n`);
if (operations.length !== 81 || operations.filter(op => op.path.startsWith("/admin/") || op.path.startsWith("/auth/") || op.path === "/site-settings").length !== 58) throw new Error("Inventory changed: re-audit classifications before producing report.");
console.log(output.join("\n"));
