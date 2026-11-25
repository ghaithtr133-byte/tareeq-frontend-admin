import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { dashboardQuickActions } from "@/components/dashboard/admin-dashboard";
import { navigationForRole } from "@/lib/admin";
import { faqScopes, selectableFaqScopes } from "@/lib/faq-schemas";
import {
  isManagementResourceSuspended,
  isSuspendedManagementPath,
} from "@/lib/services-management-suspension";

test("TA-105: Services stays visible but disabled for ADMIN and SUPER_ADMIN", () => {
  for (const role of ["ADMIN", "SUPER_ADMIN"] as const) {
    const services = navigationForRole(role).find((item) => item.id === "services");
    assert.deepEqual(services && {
      href: services.href,
      disabled: services.disabled,
      label: services.label,
    }, {
      href: "/admin/services",
      disabled: true,
      label: "الخدمات",
    });
  }

  const sidebar = readFileSync(join(process.cwd(), "components/layout/admin-shell.tsx"), "utf8");
  assert.match(sidebar, /aria-disabled="true"/);
  assert.match(sidebar, />\s*ملغاة\s*</);
});

test("TA-105: Dashboard contains no Service management shortcut or clickable workflow link", () => {
  assert.deepEqual(
    dashboardQuickActions.map((action) => action.resource),
    ["countries", "universities", "scholarships", "articles"],
  );
  assert.ok(dashboardQuickActions.some((action) => action.resource === "articles"));

  const dashboard = readFileSync(join(process.cwd(), "components/dashboard/admin-dashboard.tsx"), "utf8");
  assert.doesNotMatch(dashboard, /إضافة خدمة|\/admin\/services/);
  assert.match(dashboard, /item\.group === group && !item\.disabled/);
});

test("TA-105: centralized Services guard covers direct and nested routes without mounting Service UI", () => {
  for (const segments of [
    ["services"],
    ["services", "new"],
    ["services", "record-id"],
    ["services", "record-id", "legacy-detail"],
  ]) {
    assert.equal(isSuspendedManagementPath(segments), true);
  }
  assert.equal(isSuspendedManagementPath(["articles"]), false);
  assert.equal(isManagementResourceSuspended("services"), true);
  assert.equal(isManagementResourceSuspended("articles"), false);

  const route = readFileSync(join(process.cwd(), "app/admin/services/[[...segments]]/page.tsx"), "utf8");
  const unavailable = readFileSync(join(process.cwd(), "components/layout/suspended-services-management-page.tsx"), "utf8");
  for (const source of [route, unavailable]) {
    assert.doesNotMatch(source, /ContentListPage|ContentFormPage|DetailCollectionManager|useContent(?:Detail|List|Selectors)|useCreateContent|useUpdateContent/);
  }
  assert.match(unavailable, /إدارة الخدمات ملغاة حاليًا/);
});

test("TA-105: other content remains available and historical Service FAQs remain represented", () => {
  const articles = navigationForRole("ADMIN").find((item) => item.id === "articles");
  assert.equal(articles?.disabled, undefined);
  assert.equal(articles?.href, "/admin/articles");
  assert.equal(faqScopes.includes("SERVICE"), true);
  assert.equal(selectableFaqScopes.includes("SERVICE" as never), false);
});
