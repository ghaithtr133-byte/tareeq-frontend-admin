# إصلاح تعارض مجلد API مع اكتشاف دوال Vercel

التاريخ: 2026-11-06 — المستودع: `C:/Users/CMerna/Desktop/tareeq-frontend-admin`.

## النتيجة وحدود الاستنتاج

**جاهز لتجربة نشر جديدة على Vercel Hobby بواسطة Project Owner. نجاح النشر وعدد دوال Vercel الفعلي غير متحقق منهما.**

ثبت وجود مجلد جذري `api` يحتوي 13 ملف TypeScript لعملاء Backend ومساعدات، وليس معالجات HTTP فعلية. هذا تعارض مؤكد في موقع الملفات وسبب مرجح بقوة لخطأ اكتشاف دوال إضافية، وليس إثباتًا بأن ناتج النشر احتوى بالضبط13 دالة أو أن التعارض هو السبب الوحيد. لم تتوفر سجلات بناء Vercel أو إعدادات المشروع أو `.vercel/output/functions`؛ لذلك لا يُنسب الخطأ إلى عدد صفحات Next.js الديناميكية ولا يُدّعى زواله على Vercel قبل التجربة.

مرجع Vercel الرسمي يوضح اكتشاف الدوال من المجلد الجذري api: [Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js). حدود عدد الدوال تعتمد على الإطار: [Vercel limits](https://vercel.com/docs/limits). لم يتم تغيير الخطة أو إعدادات الحساب.

## الفحص الفعلي

- الحالة الابتدائية: `main...origin/main`، دون تغييرات محلية عند بدء هذه المهمة. أُبقيت جميع تطبيقات المراحل السابقة.
- الملفات الـ13 صدّرت Axios clients، وظائف استدعاء Backend، أنواعًا ومخططات، مفاتيح Query، وتخزين Mock في الذاكرة. لا نقطة نهاية Vercel حقيقية بينها.
- لا `app/api` أو `src/app/api` أو `pages/api`، ولا `vercel.json` أو Middleware/Proxy convention file في المشروع. `lib/admin-dev-api-proxy.ts` مساعد للـRoute Handler وليس نقطة دخول مستقلة.
- Route Handler الفعلي الوحيد في المصدر هو `app/%5F_dev_api/[...path]/route.ts`: بقي دون أي تعديل، بما في ذلك حظر الإنتاج404. لم يتم نقله أو حذفه.
- `next.config.ts` بقي كما هو؛ لا static export أو SSR conversion أو دمج لمسارات. لا تغيير في build script أو dependencies.
- خريطة `server/app-paths-manifest.json` للبناء الجديد مطابقة للخريطة السابقة:21 مدخل مسار. **هذه مداخل Next.js وليست عدد دوال Vercel.**

## النقل والتوافق

نُقلت هذه الملفات من المجلد الجذري السابق إلى `lib/api-client/`:

```text
auth.ts
client.ts
content.ts
error.ts
faqs.ts
images.ts
mock-content-repository.ts
phase4.ts
query-keys.ts
server-client.ts
site-settings.ts
submissions.ts
university-management.ts
```

- تحديث `@/api/…` إلى `@/lib/api-client/…`، والاستيراد النسبي في اختبار Mock، وdynamic type imports، وقراءة ملفات المصدر داخل اختبارات التدقيق، ومولد inventory، ومراجع README/التقارير. لا alias توافق يُبقي المجلد الجذري.
- شمل التحديث الآلي81 ملفًا يحمل مراجع، منها10 من الوحدات المنقولة؛ الوحدات3 الباقية انتقلت دون تعديل محتواها. التاريخ والنتائج القديمة في التقارير لم تتغير؛ المسارات النصية فقط حُدّثت.
- مقارنة الوحدات المنقولة مع لقطة ما قبل النقل:13/13 متطابقة بعد استبدال مسار الاستيراد وتوحيد CRLF/LF فقط.
- مقارنة119 ملف مصدر/اختبار موجودًا مع HEAD: لا اختلاف سلوكي خارج استبدال المراجع. استُثني الملف المولد `next-env.d.ts` وإعداد Playwright المحدد أدناه من هذه المقارنة.
- لا استيرادات قديمة متبقية وفق البحث واختبار regression. المجلد الجذري أُزيل بعد أن أصبح فارغًا؛ لم تُفقد وحدات أو endpoints.
- بقيت Axios credentials وHttpOnly architecture وURL construction والـexports والعقود والـquery keys والـrefresh deduplication وصلاحيات الأدوار والواجهة وRTL كما هي. `server-client.ts` احتفظ بـ`server-only` وعدم التمرير الضمني للكوكيز.
- أُضيف `tests/api-client-layout.test.ts` إلى `npm run test` لمنع إعادة إنشاء التعارض أو استيرادات قديمة، وفحص مسارات المصادقة وwithCredentials وAPI prefix واستعادة الجلسة بوسيط Axios اصطناعي فقط.
- أتاح إعداد audit Playwright تمرير `NEXT_TEST_DIST_DIR` اختياريًا؛ السلوك الافتراضي محفوظ. استُخدم هذا لتشغيل الاختبارات على البناء الجديد بدل ناتج قديم. أضاف Next.js مراجع الدليل المعزول إلى `next-env.d.ts` و`tsconfig.json` تلقائيًا.

## نتائج التحقق المنفذة

| الفحص | النتيجة الفعلية |
| --- | --- |
| TypeScript — `npm run typecheck` | PASS |
| ESLint — `npm run lint` | PASS، صفر أخطاء؛ تحذير سابق واحد unused action في `components/dashboard/admin-dashboard.tsx:26`، ملف غير معدل |
| `npm run test` بعد إضافة regression |49 PASS،0 FAIL،0 SKIPPED |
| اختبارات audit/serialization/session-cache/password الإضافية |27 PASS،0 FAIL؛ نُفذت ضمن تشغيل30 اختبارًا شمل أيضًا اختبارات النقل3، ولا تُحسب مرتين |
| إجمالي unit/contract الفريد لهذه المهمة |76 PASS |
| Chromium على البناء الجديد |25 PASS،0 FAIL،0 SKIPPED،23.4s |
| Build — `npm run build` |PASS،Webpack،دليل معزول `.next-hobby-layout-build` |
| `git diff --check` |PASS |
| Route manifest ومقارنة محتوى الوحدات |PASS،المسارات ثابتة والمحتوى محفوظ |
| actual Vercel Function count |NOT VERIFIED،لا ناتج Vercel متاح؛ لم يُشغّل نشر |

البناء استخدم متغيرات مؤقتة للعملية فقط: `NEXT_PUBLIC_API_BASE_URL=https://api.tareeq-academy.com/api/v1`، `ADMIN_DEV_MOCK_ACCESS=disabled`، `NEXT_TEST_DIST_DIR=.next-hobby-layout-build`. لم يُعدّل أي ملف أسرار أو إعداد Vercel.

أوامر الاختبارات الإضافية:

```text
TZ=Asia/Amman node node_modules/tsx/dist/cli.mjs --test tests/api-client-layout.test.ts tests/audit/contract-gaps.test.ts tests/audit/remediation.test.ts tests/audit/content-session-race.test.tsx
ADMIN_AUDIT_PRODUCTION=enabled NEXT_TEST_DIST_DIR=.next-hobby-layout-build node node_modules/@playwright/test/cli.js test --config=tests/audit/playwright.config.ts
```

نُفذت تعيينات المتغيرات بصيغة PowerShell. اختبارات Chromium تفحص المحررات والروابط المتعددة والتواريخ والفلترة واختيار العلاقات وحالات الخطأ وحماية الجلسة والقائمة وRTL والرفع المعترض في المحررات الخمسة وتغيير كلمة المرور الاصطناعي لكلا الدورين. جميع طلبات Backend داخل المتصفح معترضة؛ فحص runtime المباشر الوحيد هو GET محلي للـdevelopment proxy للتحقق من404. اختبارات الوحدة تعترض transport أيضًا؛ لا كتابة حقيقية أو رفع أو تغيير كلمة مرور أو طلب اعتماد حقيقي.

الحفاظ على Login وme وRefresh وLogout مثبت بمقارنة الكود واختبارات Axios الاصطناعية، وليس بجلسة إنتاج جديدة. لم نكرر مصادقة حقيقية أو نطلب كلمات مرور. نجاح next build **ليس** إثبات قبول نشر Vercel.

## الملفات الأخرى المعدلة

بالإضافة إلى الوحدات13 المنقولة والاختبار والتقرير الجديدين، هذه قائمة الملفات المتتبعة المعدلة. معظمها استبدال مراجع فقط؛ الاستثناءات المحدودة موضحة أعلاه:

```text
README.md
app/admin/login/login-form.tsx
components/content/article-block-editor.tsx
components/content/article-scholarships.tsx
components/content/content-form-page.tsx
components/content/content-list-page.tsx
components/content/status-badge.tsx
components/faqs/faq-editor.tsx
components/faqs/faq-order.tsx
components/faqs/faq-page.tsx
components/layout/admin-protected-shell.tsx
components/layout/dev-admin-controls.tsx
components/media/image-upload.tsx
components/phase4/accounts-page.tsx
components/phase4/query-state.tsx
components/settings/site-settings-page.tsx
components/submissions/submission-detail-page.tsx
components/submissions/submission-list-page.tsx
components/submissions/submission-ui.tsx
components/universities/controls.tsx
components/universities/directory-page.tsx
components/universities/section-editor.tsx
components/universities/university-workspace.tsx
docs/admin-audit-remediation-report.md
docs/admin-full-coverage-audit.md
docs/admin-phase2-report.md
docs/admin-phase3-report.md
docs/admin-phase4-report.md
docs/admin-submissions-phase1-report.md
hook/mutations/use-account-mutation.ts
hook/mutations/use-change-password-mutation.ts
hook/mutations/use-content-mutations.ts
hook/mutations/use-faq-mutation.ts
hook/mutations/use-image-upload.ts
hook/mutations/use-login-mutation.ts
hook/mutations/use-logout-mutation.ts
hook/mutations/use-site-settings-mutation.ts
hook/mutations/use-submission-mutation.ts
hook/mutations/use-university-management.ts
hook/queries/use-content-queries.ts
hook/queries/use-faq-queries.ts
hook/queries/use-phase4-queries.ts
hook/queries/use-session-query.ts
hook/queries/use-site-settings-query.ts
hook/queries/use-submission-queries.ts
hook/queries/use-university-management.ts
lib/admin-session-cache.ts
lib/admin.ts
lib/change-password.ts
lib/content-config.ts
lib/content-form.ts
lib/content-session.ts
lib/phase4-presentation.ts
lib/privileged-access.ts
lib/submissions.ts
lib/university-form.ts
next-env.d.ts
package.json
providers/admin-access-provider.tsx
providers/query-provider.tsx
tests/admin-dev-mock.test.ts
tests/admin-live-contract.test.ts
tests/admin-phase4.test.ts
tests/admin-site-management.test.ts
tests/admin-submissions.test.ts
tests/admin-university-management.test.ts
tests/audit/content-session-race.test.tsx
tests/audit/contract-gaps.test.ts
tests/audit/openapi-inventory.mjs
tests/audit/playwright.config.ts
tests/audit/remediation.test.ts
tests/fixtures/submissions.ts
tests/fixtures/university-management.ts
tests/submissions-e2e/submissions.spec.ts
tsconfig.json
```

## التسليم للمالك

1. تجربة نشر جديدة بالإعداد الحالي لإطار Next.js وجذر مستودع Admin الصحيح. لا حاجة لتغيير SSR أو ديناميكية الصفحات أو ترقية الخطة لهذا الإصلاح.
2. فحص سجل Vercel وقائمة/ناتج الدوال الفعلي بعد البناء؛ التأكد أن وحدات Backend helper لم تعد تُكتشف كنقاط دخول مستقلة.
3. إذا استمر خطأ12: يلزم ناتج functions أو deployment build log وإعداد Framework Preset/Root Directory لتحديد السبب المتبقي، قبل أي تعديل في التوجيه أو rendering. لا نفترض أن كل مسار ديناميكي يساوي دالة.
4. متغيرات Production الفعلية واختبارات المصادقة على النطاق المنشور والاعتماد العام تظل مسؤولية المالك؛ نجاح النقل لا يغلق تبعيات Backend/acceptance المسجلة سابقًا.

لم تُنفذ commits أو pushes أو pulls أو merges أو resets أو نشر. لم تُعدل بيانات الإنتاج أو Backend أو مستودع Public frontend. كل التغييرات الحالية محلية ومتاحة للمراجعة.

