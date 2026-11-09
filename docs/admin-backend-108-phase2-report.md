# Backend 108 — Phase 2: استعادة حالة «من نحن»

**تاريخ الاستعادة:** 7 نوفمبر 2026  
**نوع المهمة:** استعادة حالة وأدلة فقط؛ لم يُعاد تنفيذ Phase 2، ولم تُشغّل اختبارات أو بناء أو متصفح ضمن مهمة الاستعادة هذه.  
**النطاق:** واجهة إدارة «من نحن» فقط. لا يشمل هذا التقرير أي عمل Phase 1 أو Phase 3/4.

## A. النتيجة التنفيذية

Phase 2 **مُنفَّذة محليًا في شجرة العمل، وليست مجرد خطة أو ملفات مولّدة جزئيًا**. توجد route محمية، عنصر تنقّل مشترك لـ `ADMIN` و`SUPER_ADMIN`، محرر كامل، طبقة API وhooks، اختبار عقدي/وحدات واختبار Chromium معزولان.

لكن لا يوجد اختبار قبول حيّ موثق لجلسة إنتاجية لـ `GET /api/v1/admin/about`، ولا يجوز تنفيذ `PATCH` حيًّا لإنشاء/تغيير singleton. كما أن سجل Chromium المحفوظ لا يحتوي تشغيلًا موحدًا أخيرًا للسيناريوهات الأربعة كلها بعد إصلاح locator؛ لذلك حكم مرحلة الاستعادة هو **PARTIAL** لا PASS كامل.

لا يوجد `docs/admin-backend-108-phase2-report.md` سابق لاستبداله؛ هذا هو التقرير الذي كان مفقودًا.

## B. مصفوفة تغطية المتطلبات

| المتطلب | الحالة | الدليل الفعلي |
|---|---|---|
| Route إدارية بعنوان «من نحن» | IMPLEMENTED AND VERIFIED (static) | `app/admin/about/page.tsx` يغلّف `AboutPage` داخل `AdminProtectedShell` مع `activeItem="about"`. |
| إتاحة ADMIN وSUPER_ADMIN | IMPLEMENTED AND VERIFIED (mock/contract) | `lib/admin.ts` يضع `about` في `sharedNavigation` بلا `restrictedTo`؛ اختبار `tests/backend108-about.test.tsx` يتحقق من الدورين. لا يوجد قبول RBAC حيّ لـ endpoint في هذا العمل. |
| إدماج القائمة العربية | IMPLEMENTED AND VERIFIED (static) | `lib/admin.ts` («من نحن») و`components/layout/admin-shell.tsx` (المسار `/admin/about` والأيقونة). |
| GET singleton إداري | IMPLEMENTED AND VERIFIED (mock/contract) | `lib/api-client/about.ts` يطلب فقط `GET /admin/about` عبر `apiClient`؛ Zod يفك envelope `{ success: true, data }`. |
| PATCH singleton/إنشاء أول سجل | IMPLEMENTED AND VERIFIED (mock/contract) | `aboutApi.update` يستخدم فقط `PATCH /admin/about`، ولا يوجد POST في API أو allowlist؛ سيناريو Chromium يتحقق أن أول حفظ مسودة هو PATCH وأن النتيجة تُرطّب المحرر. |
| 404 `CONTENT_NOT_FOUND` المتوقعة | IMPLEMENTED AND VERIFIED (mock/contract) | فقط envelope 404 بالكود نفسه يتحول إلى `null`؛ الصفحة تعرض محررًا فارغًا ورسالة إنشاء. 404 الأخرى تبقى error. |
| DRAFT / PUBLISHED / ARCHIVED | IMPLEMENTED AND VERIFIED (mock/contract) | schema/status selector في `lib/about-schemas.ts` و`components/about/about-page.tsx`؛ سيناريو Chromium يغطي مسودة ونشر وأرشفة وحفظ `publishedAt` الأول. |
| حقول عربي/إنجليزي والمحتوى طويل الأسطر | IMPLEMENTED AND VERIFIED (mock/contract) | 27 حقلًا محررًا عبر `aboutSections`: Hero text، Introduction، Mission، Vision، CTA text، SEO؛ textareas تحفظ السطر العربي المتعدد. |
| Hero image الثابت | IMPLEMENTED AND VERIFIED (mock/contract) | `aboutUpdateSchema` لا يسمح بـ `heroImageUrl` أو alt أو timestamps؛ سيناريو Chromium يتحقق غياب controls وحفظ قيم Hero غير المعدلة. |
| صورة Introduction الاختيارية | IMPLEMENTED AND VERIFIED (mock/intercepted) | `ImageUpload resource="about"` مع `mediaResources` المحدّثة في `lib/api-client/images.ts`; لا يوجد رفع إنتاجي. |
| PATCH جزئي، omission وnull صريح | IMPLEMENTED AND VERIFIED (mock/contract) | `aboutChanges` لا يرسل الحقول غير المتغيرة، Checkbox «مسح الحقل صراحة» يرسل `null` فقط عند الاختيار؛ الاختبار يغطي omission/blank/null. |
| تحقق النشر العربي | IMPLEMENTED AND VERIFIED (mock/contract) | الحقول الأربع `heroTitleAr`, `heroSubtitleAr`, `introTitleAr`, `introBodyAr` فقط مطلوبة عند `PUBLISHED` بعد دمج baseline والتغييرات؛ الإنجليزية اختيارية. |
| أخطاء 401/403/500/Network وحقول 400 | IMPLEMENTED AND VERIFIED (mock/intercepted) | query/mutation تبلّغ 401 إلى session recovery، والصفحة تفرّق 403 ورسائل الشبكة/الخادم وfield errors/retry؛ Chromium يحاكي الحالات دون تحويلها إلى empty state. |
| cache/session safety | IMPLEMENTED AND VERIFIED (isolated hook) | مفاتيح المستخدم في `queryKeys.admin.about(userId)`، و`captureContentSession`/`assertContentSession` قبل وبعد PATCH؛ اختبار stale logout/account-switch يمنع عودة رد قديم إلى cache. |
| Mock isolation | IMPLEMENTED AND VERIFIED (static) | `useAboutQuery` معطّل في mock mode؛ `AboutPage` لا يرسل بيانات المعاينة؛ allowlist التطوير محصور في GET/PATCH/OPTIONS، ومغلق في production. |
| GET عام `/api/v1/about` | NOT IMPLEMENTED (by design) | لا تستعمله واجهة الإدارة؛ المتطلب الإداري هو GET/PATCH الموثقان. لم يُنشأ استهلاك عام أو تعديل للموقع العام. |
| اختبار حي مصادق لـ GET الإداري | BLOCKED | لا توجد جلسة إنتاج معتمدة أو دليل network محفوظ لهذه المرحلة؛ لم يُجرّب لتجنّب تجاوز قيد read-only/session. |
| PATCH/رفع/نشر حي | BLOCKED (intentional) | ممنوعان في الإنتاج، ولا توجد محاولة أو محتوى تجريبي. |

## C. تفاصيل العقد وAPI

- `GET /api/v1/admin/about`: يمر عبر base URL المعتمد و`apiClient` ذي `withCredentials: true`. يستقبل success envelope فقط. 404 يتحول إلى editor فارغ **فقط** إذا كان `error.code === CONTENT_NOT_FOUND`; 401/403/5xx/network لا تُعامل كسجل مفقود.
- `PATCH /api/v1/admin/about`: يمرر `AboutUsUpdateRequest` متحققًا بـ Zod. لا يوجد endpoint POST مخترَع. نجاح PATCH يوقف أي GET مطابق، يحدّث exact actor-scoped cache بالكيان المحفوظ، ثم invalidates بلا refetch فوري.
- semantics: الحقول المعدلة فقط ترسل؛ الحقل الاختياري لا يصبح `null` من empty string؛ `null` يحتاج checkbox مقصود. التحقق لا ينشئ `publishedAt` ولا يسمح بإرساله.
- قائمة proxy التطوير في `lib/admin-dev-api-proxy.ts` تضيف حصراً `/admin/about` مع `GET`, `PATCH`, `OPTIONS`. وهي ليست BFF إنتاجيًا ولا تجعل mock mode مسار fallback.

## D. الملفات التي تعود إلى Phase 2

### ملفات أُنشئت

- `app/admin/about/page.tsx`
- `components/about/about-page.tsx`
- `lib/about-schemas.ts`
- `lib/api-client/about.ts`
- `hook/queries/use-about-query.ts`
- `hook/mutations/use-about-mutation.ts`
- `tests/fixtures/about.ts`
- `tests/backend108-about.test.tsx`
- `tests/audit/browser/backend108-phase2.spec.ts`

### ملفات موجودة عُدّلت لتوصيل الميزة

- `lib/admin.ts` — navigation ID/label المشترك.
- `components/layout/admin-shell.tsx` — route/icon.
- `lib/api-client/query-keys.ts` — key مستقل actor-scoped.
- `lib/api-client/images.ts` — مورد upload المسموح `about`.
- `lib/admin-dev-api-proxy.ts` — allowlist الدقيق للتطوير.

هذه الملفات ما زالت uncommitted مع أعمال مراحل أخرى في الشجرة؛ لا يُستنتج من حالة Git أن كل تعديل فيها حصري لـ Phase 2. لا يظهر أي ملف About جزئي أو placeholder غير مكتمل.

## E. دليل الاختبارات المتاح وحدوده

### ما هو موجود كاختبارات

- `tests/backend108-about.test.tsx`: ثمانية اختبارات Node عند احتساب ثلاث حالات transition المنفصلة (`none`, `logout`, `switch`). تغطي التنقّل/الحدود، schema والـ URI/lengths، omission/null/multiline، publication merge، GET/error/cancellation وPATCH cache/session race.
- `tests/audit/browser/backend108-phase2.spec.ts`: أربع حالات Chromium مع intercepted responses: إنشاء ADMIN، نشر/أرشفة SUPER_ADMIN، GET errors + retry، وPATCH 400 مع explicit retry. الاختبارات تمنع المسارات غير المعتمدة وتستخدم data صناعية فقط.

### دليل التشغيل المحفوظ

1. توجد نتيجة Playwright أولى في `test-results/backend108-phase2/.last-run.json` بحالة `failed` مع فشل واحد في سيناريو SUPER_ADMIN. `error-context.md` يحدد السبب: locator اختباري قديم استخدم label غير مربوط للـ select.
2. المصدر الحالي لذلك الاختبار يستخدم `getByRole("combobox", { name: "الحالة التحريرية", exact: true })` بدل locator الفاشل.
3. توجد نتيجة إعادة تشغيل مركزة لاحقة في `test-results/backend108-phase2-publication/.last-run.json` بحالة `passed` و`failedTests: []` (7 نوفمبر 2026، 14:20). هذه دليل على نجاح إعادة السيناريو المصحح، لا سجل موحدًا جديدًا لكل الحالات الأربع.
4. سجل التنفيذ السابق المتاح لسياق العمل يذكر نجاح اختبارات Node الثمانية وسيناريوهات Chromium الأربعة بعد هذا التصحيح، لكن لا يوجد log runner مستقل محفوظ في الشجرة لتدقيقه من الصفر الآن. التزامًا بمهمة الاستعادة، لم تُعد الاختبارات للتحقق من ذلك.
5. يوجد دليل build منفصل `.next-backend108-phase2/` من التنفيذ السابق، لكنه ليس بحد ذاته log نجاح build؛ لا يُعامل كبديل لنتيجة build مطبوعة.

بالتالي: **الاختبارات موجودة ومحددة جيدًا؛ النجاح السابق مدعوم جزئيًا بآثار Playwright وبسجل التنفيذ السياقي، لا بإخراج موحد قابل لإعادة المراجعة داخل Git.** لا يوجد في هذا التقرير PASS جديد ناتج من إعادة تشغيل.

## F. الاستثناءات المقصودة وعدم التوسع

- لا يوجد Marketing Hero/CTA image management ولا Student Journey management ولا صفحة Marketing.
- Hero image (`heroImageUrl`, `heroImageAltAr`, `heroImageAltEn`) ثابت ولا يظهر كمحرر.
- لا تغيير للموقع العام؛ لا عميل public About مضاف للوحة.
- لا localStorage/sessionStorage للتوكنات؛ النقل المعتمد يبقى cookie/`withCredentials`.

## G. علاقة Phase 1 ونتيجة الانقطاع

- تقرير Phase 1 الحالي (`docs/admin-backend-108-phase1-report.md`) يذكر صراحةً تأجيل/عدم إضافة محرر About ضمن Phase 1؛ لا توجد علامة أن Phase 1 closure كتب فوق ملفات About أو حذفها.
- ملفات About المؤرخة في 7 نوفمبر 2026 بين 14:12 و14:20، ووجود `.next-backend108-phase2` ونتائج Playwright، يثبت أن التنفيذ وصل إلى مرحلة الاختبار قبل انتقال السياق إلى إغلاق Phase 1.
- عدم وجود تقرير Phase 2 هو أثر الانقطاع الإداري/التوثيقي. ليس دليلًا على عدم اكتمال الكود.
- لا تعارض سلوكي ظاهر مع تحسينات Phase 1: feature تستخدم بنية Axios/TanStack/session الحالية وملفات client/hooks المعتمدة. لم تُجرَ مراجعة أو إعادة تنفيذ Phase 1 في مهمة الاستعادة.

## H. الأعمال المتبقية لإنهاء Phase 2 بالكامل

1. عند توافر جلسة Admin/SUPER_ADMIN موثوقة: تنفيذ **GET واحد read-only** إلى `/api/v1/admin/about` عبر التطبيق والتحقق من status/envelope/عرض DRAFT أو PUBLISHED أو 404 `CONTENT_NOT_FOUND` دون تسجيل cookies أو محتوى حساس.
2. لا تنفيذ PATCH أو upload أو publication حيًا بلا إذن منفصل وصريح، لأن PATCH قد ينشئ singleton أو يغير محتوى الإنتاج.
3. للحصول على دليل محلي قابل للتدقيق لاحقًا، يمكن بإذن مهمة تحقق منفصلة تشغيل test Node المستهدف وملف Chromium المستهدف وحفظ outputs؛ لم يحدث ذلك هنا احترامًا لتعليمات عدم إعادة الاختبارات.
4. لا توجد أعمال Phase 3 أو تسويقية مطلوبة لإغلاق Phase 2.

## I. الحكم النهائي

**PARTIAL**

التنفيذ المحلي وغطاء الاختبار موجدان، ويظهران مكتملين ضمن النطاق؛ لكن لا يوجد تحقق قبول حيّ مصادق لـ GET، ولا يجوز اختبار POST/PATCH حيًا. كذلك لا يوجد log موحد متبقٍ يؤكد تشغيل مجموعة Chromium كاملة بعد آخر تعديل locator، رغم وجود نتيجة rerun مصححة ناجحة وسجل تنفيذ سابق. Phase 2 جاهزة لمراجعة الكود/الاختبارات، وليست جاهزة بعد لإعلان قبول إنتاجي كامل.
