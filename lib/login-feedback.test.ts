import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, CanceledError } from "axios";
import { loginFailureMessage } from "@/lib/login-feedback";

test("login feedback distinguishes credentials, authorization, proxy, and transport failures without revealing account details", () => {
  const credentials = new AxiosError("Unauthorized", undefined, undefined, undefined, { status: 401, statusText: "Unauthorized", headers: {}, config: {} as never, data: { success: false } });
  const forbidden = new AxiosError("Forbidden", undefined, undefined, undefined, { status: 403, statusText: "Forbidden", headers: {}, config: {} as never, data: { success: false, error: { code: "FORBIDDEN" } } });
  const proxy = new AxiosError("Forbidden", undefined, undefined, undefined, { status: 403, statusText: "Forbidden", headers: {}, config: {} as never, data: { success: false, error: { code: "DEV_PROXY_UNTRUSTED_LOCAL_REQUEST" } } });
  const unavailable = new AxiosError("Bad Gateway", undefined, undefined, undefined, { status: 502, statusText: "Bad Gateway", headers: {}, config: {} as never, data: { success: false } });
  const network = new AxiosError("Network", "ERR_NETWORK", undefined, {});
  assert.equal(loginFailureMessage(credentials), "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  assert.equal(loginFailureMessage(forbidden), "هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة. تواصل مع مدير النظام.");
  assert.equal(loginFailureMessage(proxy), "تعذّر الاتصال بالخادم عبر إعداد التطوير المحلي. تحقق من عنوان التشغيل ثم حاول مرة أخرى.");
  assert.equal(loginFailureMessage(unavailable), "الخادم غير متاح حاليًا. حاول مرة أخرى لاحقًا.");
  assert.equal(loginFailureMessage(network), "تعذّر الاتصال بالخادم. تحقق من الاتصال ثم حاول مرة أخرى.");
  assert.equal(loginFailureMessage(new CanceledError()), undefined);
});
