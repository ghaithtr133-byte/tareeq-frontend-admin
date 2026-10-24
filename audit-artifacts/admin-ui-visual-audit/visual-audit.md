# Tareeq Academy Admin — visual audit (Step 1)

**Date:** 2026-10-21  
**Scope:** read-only UI/UX review of the locally running Admin application.  
**Mode:** `ADMIN_DEV_MOCK_ACCESS=enabled`; in-memory mock access only. The page itself confirmed that no session or content is sent to the server in this mode.

No application source, application configuration, authentication, or Backend resource was changed during this audit.

## Screenshot index

All paths below are relative to this directory. Screenshots are from the running local application, not generated mockups.

**Artifact root:** `C:\Users\CMerna\Desktop\tareeq-frontend-admin\audit-artifacts\admin-ui-visual-audit`

| Page / state | 1440px | 768px | 390px | 350px |
|---|---|---|---|---|
| Login | CAPTURED — `login-1440.png` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Dashboard | CAPTURED — `dashboard-1440.png` | CAPTURED — `dashboard-768.png` | CAPTURED — `dashboard-390.png` | CAPTURED — `dashboard-350.png` |
| Mobile navigation | NOT VERIFIED | NOT VERIFIED | CAPTURED — `mobile-menu-390.png` | NOT VERIFIED |
| SUPER_ADMIN navigation | CAPTURED — `super-admin-navigation-1440.png` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Countries list / filters / pagination | CAPTURED — `countries-list-1440.png` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Countries forms | NOT VERIFIED | CAPTURED — `countries-form-edit-768.png` | CAPTURED — `countries-form-new-390.png`, `countries-validation-390.png` | NOT VERIFIED |
| Countries empty state | NOT VERIFIED | CAPTURED — `countries-empty-768.png` | NOT VERIFIED | NOT VERIFIED |
| Universities list / forms | CAPTURED — `universities-list-1440.png` | CAPTURED — `universities-form-edit-768.png` | CAPTURED — `universities-form-new-390.png` | NOT VERIFIED |
| Scholarships list / forms | CAPTURED — `scholarships-list-1440.png` | CAPTURED — `scholarships-form-edit-768.png` | CAPTURED — `scholarships-form-new-390.png` | NOT VERIFIED |
| Services list / forms | CAPTURED — `services-list-1440.png` | CAPTURED — `services-form-edit-768.png` | CAPTURED — `services-form-new-390.png` | NOT VERIFIED |
| Articles list / editor | CAPTURED — `articles-list-1440.png` | CAPTURED — `articles-form-edit-768.png`, `articles-selector-768.png` | CAPTURED — `articles-form-new-390.png` | NOT VERIFIED |

### State checks without a retained standalone state screenshot

The running local UI visibly rendered the Arabic loading state (`جارٍ التحميل`) for Countries and the recoverable 500 error card (`تعذّر إتمام الطلب`) for Services, including the retry action. These transient states were verified in the browser. The two earlier capture retries named `countries-loading-768.png` and `countries-error-768.png` do **not** reliably preserve those transient states, so they are intentionally not used as screenshot evidence.

## Current design strengths to preserve

- The navy and restrained gold palette is cohesive and reads as a professional, trustworthy administrative surface.
- RTL hierarchy is strong in the desktop sidebar, form labels, status chips, and list layouts. Published, draft, and archived states are easy to distinguish without depending on color alone.
- Responsive navigation works well: the 390px drawer is readable, has an obvious close affordance, and preserves the current role context.
- Shared list patterns place search, filters, pagination, and record actions consistently across all five content modules.
- The form structure remains usable at 390px: fields form one column without visible horizontal overflow, labels stay adjacent to controls, and Arabic validation feedback appears directly beneath the relevant fields.
- The article editor retains its approved flat-block interface; its relationship selector handles a selected result beyond the initial page and presents search plus selection clearly.
- Empty, loading, and recoverable error feedback are concise, Arabic, and avoid exposing technical detail.
- SUPER_ADMIN-only navigation is clearly differentiated, while unavailable areas are visibly disabled and labelled `قريبًا` rather than appearing to fail.

## Confirmed findings

| ID | Priority | Page / viewport | Observed problem and usability impact | Evidence | Targeted recommendation | Scope |
|---|---|---|---|---|---|---|
| UI-01 | MEDIUM | All long content forms, 390px | New Countries, Scholarships, and Articles forms require a long vertical traversal before the only visible Save/Cancel actions at the end. On a small touch screen this makes reviewing or correcting a field near the top require losing the primary action context. There was no clipping or overflow. | `countries-form-new-390.png`, `scholarships-form-new-390.png`, `articles-form-new-390.png` | Add a mobile-only sticky action footer (respecting safe-area spacing) or an equivalent persistent Save/Cancel affordance. Keep the existing action wording and confirmation rules. | MEDIUM |
| UI-02 | MEDIUM | University and Article edit forms, 768px | English content entered into the Arabic RTL form inherits RTL direction except for URL controls. English text and punctuation therefore read with awkward bidi placement, making optional English editorial fields harder to scan and edit accurately. | `universities-form-edit-768.png`, `articles-form-edit-768.png` | Apply `dir="ltr"` to English-only text inputs and textareas while preserving Arabic fields as RTL. Keep URLs LTR as they are; do not change payloads or validation. | SMALL |
| UI-03 | LOW | Narrow dashboard header, 350px / 390px | The signed-in identity is visually truncated in the compact header. It remains available in the accessibility tree, but the on-screen context is incomplete for a human auditor, especially when mock controls take substantial vertical space. This is not a navigation failure. | `dashboard-350.png`, `dashboard-390.png` | At compact widths, prioritize a short display name/role or give the truncated identity a conventional tooltip or expandable account control. Treat the local-only mock toolbar separately from production UI. | SMALL |

No HIGH-priority visual defect was confirmed. In particular, the audited mobile layouts showed no visible horizontal overflow, obscured drawer controls, clipped form fields, or unreadable status controls at the captured widths.

## Responsive, role, RTL, and accessibility review

- **350px / 390px:** Dashboard and forms remain within the viewport. The mobile drawer opens from the RTL-appropriate side and exposes every approved content module. Long forms, rather than overflow, are the principal small-screen concern.
- **768px:** Two-column forms, filters, the article editor, and relationship selectors remain legible. English fields are the notable bidi refinement opportunity.
- **1440px:** Sidebar proportions, active navigation, list density, filters, status pills, and pagination form a consistent desktop workflow. The welcome dashboard is intentionally quiet rather than populated with invented metrics; preserve that restraint.
- **ADMIN / SUPER_ADMIN:** ADMIN shows the approved content workflow. SUPER_ADMIN adds the planned management/navigation entries and labels unavailable destinations as `قريبًا`; no unauthorized path was inferred or exercised.
- **Keyboard / semantics inspectable in the running page:** menu controls expose open/close names, fields are labelled, disabled future links provide explanatory help, and error/empty/loading cards use heading text. A complete keyboard-only traversal and contrast-ratio measurement were not performed in this visual pass, so they are not claimed as verified.

## Audit boundaries and verification

- Used the local in-memory mock role switcher and scenario controls only; no real Backend request, production data, or real authentication was used.
- Local scenario checks confirmed empty, validation, loading, and recoverable server-error feedback. No create/edit/publish/archive operation was persisted beyond isolated in-memory mock interactions used to display existing UI states.
- No source test was added or modified. This visual-only pass did not rerun production build, lint, or typecheck because no application code changed.
- The 350px dashboard check was captured. Additional 350px module-list captures are **NOT VERIFIED** rather than inferred.

## Git / artifact status

The audit created only this directory and its screenshots/report:

`audit-artifacts/admin-ui-visual-audit/`

All pre-existing repository changes remain untouched. No Git synchronization, commit, push, pull, merge, rebase, reset, deployment, or Backend interaction occurred.

## Recommendation for Step 2

Prioritize UI-01 and UI-02 only: persistent small-screen form actions and deliberate directionality for English editorial fields. Preserve the existing navigation shell, list/filter pattern, status treatment, RTL hierarchy, and flat-block article editor.
