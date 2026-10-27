# SAN TECH Platform — Feature Status Report

**Date:** 27 Oct 2026
**Stack:** Next.js (App Router) · PostgreSQL (Prisma) · TanStack Query · shadcn UI · Cloudinary · Resend

---

## 1. Working Features ✅

### Authentication & Accounts
- ✅ Email/password registration with email verification (Resend)
- ✅ Login, SSO login, forgot/reset password
- ✅ Session-based auth with role & permission checks
- ✅ User management (list, create, update, activate/deactivate)
- ✅ Role-based access control (granular permissions, permission matrix editor)
- ✅ Admin password reset for users

### Courses & Curriculum
- ✅ Course create/edit (drawer + detail page), publish / draft / archive lifecycle
- ✅ Lesson builder (modules → lessons, ordering, types, free-preview flags)
- ✅ Course media assets, requirements/outcomes, instructors (assign/replace)
- ✅ Course reviews & ratings with admin moderation (approve/reject)
- ✅ Course comments (learner Q&A, admin reply/hide)
- ✅ Course feedback analytics

### Cohorts, Attendance & Certificates
- ✅ Cohort create/manage, assign learners, set schedule
- ✅ Attendance marking with per-date bulk marking, CSV export
- ✅ Learner progress tracking (lesson completion, per-cohort rates)
- ✅ Certificate issue (manual + automatic at 100% progress), PDF generation, revoke, public verify page

### Enrollment & Applications
- ✅ Learner enrollment (own progress + mark lessons complete)
- ✅ Admin enrollment (assign learner to cohort), enrollment detail page with action panel
- ✅ Application review queue (approve/reject with bulk actions), status change with notification
- ✅ Reviewer assignment, bulk transitions, audit trail

### Public Catalog & Website
- ✅ Public catalog: browse/filter/search published courses (skills, tools, categories, free/paid)
- ✅ Course detail pages from catalog (SEO-friendly slugs)
- ✅ Platform option sets (skills, tools, categories with taxonomy organization)

### Media Library
- ✅ Upload to Cloudinary (direct + server-side), thumbnails, metadata
- ✅ Grid + table views, search/filter by type and folder
- ✅ Details sheet: caption & alt-text editing, copy link, download, delete (with Cloudinary cleanup), video playback controls and autoplay
- ✅ Folder management (create/rename/move/delete), multi-select delete, asset replacement, and bulk move to folder

### Website Content Manager (SAN HUB)
- ✅ Catalog content CRUD (articles, videos, resources) with publish states
- ✅ Categories, skills, tags, sources, education levels, program–course links
- ✅ Media library embedded in content editor
- ✅ Public API: option sets, catalog list, course detail

### Appointments
- ✅ Appointment types with availability windows (per weekday, time ranges)
- ✅ Public booking flow + booking confirmation page
- ✅ Admin calendar (month/week/day views)
- ✅ **Google Calendar–style drag-to-select** on the time grid: drag across hours *and* multiple days, edge auto-scroll, opens schedule dialog with selection prefilled

### Platform / System
- ✅ Audit log viewer (who did what, when)
- ✅ Platform settings page (storage modes, timezone, branding)
- ✅ Dashboard home with permission-filtered metric cards
- ✅ Training inquiry system (public form → admin review → email reply)
- ✅ Migration tooling (Strapi → platform content migration scripts)
- ✅ Secure file proxy for S3/Supabase-stored private materials

---

## 2. Partially Working 🟡

- 🟡 Admin reports — core metrics and CSV export are available; advanced analytics and PDF export remain planned

## 3. Expected but Not Yet Implemented 🔴

- 🔴 Instructor management module (dedicated instructors directory + profiles)
- 🔴 Learner management module (dedicated learner directory + profile pages)
- 🔴 Revenue & sales tracking (pricing, transactions, revenue dashboards)
- 🔴 Email campaign management (broadcast campaigns; only transactional emails exist)
- 🔴 Payment gateway integration (courses are currently free)
- 🔴 Certificate QR codes
- 🔴 Webhook management (status webhooks exist for reviews/applications only)
- 🔴 Advanced admin reports (completion funnels, PDF export, and deeper cohort analytics)
- 🔴 Mobile-responsive polish pass for all dashboard pages
- 🔴 Automated test suite (no unit/e2e tests yet)

---

## 4. Recent Fixes (this sprint)

- 🔧 Video assets consolidated in the Media Library with autoplay previews and playable detail drawer
- 🔧 Media replacement and bulk move-to-folder actions wired to Cloudinary and Prisma
- 🔧 Learner reports now support live filtering, KPI metrics, and CSV export

- 🔧 Media details-sheet actions wired and working (save/delete/copy/download)
- 🔧 Card menus rebuilt with dropdown component (auto-positions, no clipping)
- 🔧 Schedule dialogs: submit button fixed + visible error messages (silent failures removed)
- 🔧 File encoding issue fixed that was blocking the cloud build
- 🔧 Database migration added for media captions

---

*Prepared for internal review. For questions on any item, ask the development team.*
