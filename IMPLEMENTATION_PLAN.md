# SAN TECH Platform Implementation Plan

## 1. Product direction

Build `santech-platform` as a single full-stack Next.js application using the existing starter.

The application will have one shared dashboard rather than separate dashboards for learners, instructors, and administrators. The dashboard will render navigation, data, and actions according to the signed-in user's roles and permissions.

The public marketing/CMS application remains separate in `santech-f`.

### Locked project decisions

- File uploads and generated certificate assets will use Cloudinary.
- Transactional email will support Resend and SMTP, selected through environment configuration.
- SAN TECH branding assets, colors, fonts, and imagery will be reused from `santech-f`.

## 2. Technical foundation

- Next.js App Router and TypeScript
- PostgreSQL as the primary database
- Prisma for schema, migrations, and typed queries
- Server Actions for internal form mutations
- Route Handlers for API endpoints, uploads, webhooks, and integrations
- Secure server-side sessions with HTTP-only cookies
- Zod validation at every request boundary
- Shared UI primitives from the current starter
- Cloudinary for application files and generated certificates
- Resend and SMTP adapters for important notifications

Server components should read data through domain services. Client components should handle interaction and presentation only; they must not contain authorization decisions or direct database access.

## 3. Core data model

### Required business tables

- `users` — identity, profile, status, and timestamps
- `roles` — administrator-created access groups
- `permissions` — granular capabilities such as `courses.create`
- `user_roles` — many-to-many user and role assignments
- `role_permissions` — many-to-many role and permission assignments
- `courses` — catalog information and publishing state
- `lessons` — ordered course content
- `enrollments` — learner-course relationship and status
- `cohorts` — scheduled groups attached to courses
- `attendance` — learner attendance per cohort session
- `applications` — fellowship, job, or training applications
- `certificates` — completion certificates and verification data

### Supporting tables

- `sessions` — active login sessions and expiry
- `course_instructors` — instructor assignments
- `cohort_members` — learner membership in cohorts
- `lesson_progress` — learner completion state
- `application_files` — uploaded file metadata and storage keys
- `notifications` — in-app notification records
- `audit_logs` — security and administrative activity history

### Authorization rules

- Permissions are the source of truth for actions.
- Roles are reusable permission bundles created and managed by administrators.
- Users may have multiple roles.
- Instructor access can be scoped to assigned courses or cohorts.
- The last active administrator cannot be removed or deactivated.
- Every sensitive mutation creates an audit-log entry.

## 4. Permission catalog

Permissions will use stable names grouped by domain:

```text
dashboard.view
users.view
users.manage
roles.view
roles.manage
permissions.view
courses.view
courses.create
courses.update
courses.delete
lessons.manage
cohorts.manage
enrollments.apply
enrollments.review
attendance.view
attendance.mark
grades.view
grades.manage
applications.create
applications.review
files.upload
certificates.view
certificates.issue
certificates.revoke
notifications.manage
audit_logs.view
```

The permission list will be seeded with a protected system administrator role. Administrators can create additional roles and assign available permissions through the dashboard.

## 5. Application structure

```text
src/
├─ app/
│  ├─ dashboard/
│  │  ├─ page.tsx
│  │  ├─ courses/
│  │  ├─ enrollments/
│  │  ├─ attendance/
│  │  ├─ applications/
│  │  ├─ certificates/
│  │  ├─ users/
│  │  └─ roles/
│  ├─ login/
│  ├─ register/
│  └─ api/
├─ components/
│  ├─ dashboard/
│  ├─ forms/
│  ├─ tables/
│  ├─ layout/
│  └─ ui/
├─ lib/
│  ├─ auth/
│  ├─ authorization/
│  ├─ db/
│  ├─ validation/
│  └─ services/
└─ prisma/
   ├─ schema.prisma
   └─ seed.ts
```

Each service should have one responsibility, for example `course-service`, `enrollment-service`, and `role-service`. UI components receive data and callbacks rather than importing database clients directly.

## 6. Delivery phases

### Phase 1 — Foundation

- [x] Add Prisma and PostgreSQL configuration
- [x] Create the initial schema and migrations
- [x] Add seed data for permissions and the system administrator role
- [x] Add environment validation
- [x] Replace the template API URL with the platform's own server layer

### Phase 2 — Authentication and authorization

- [x] Implement registration and sign-in
- [x] Implement secure HTTP-only sessions
- [x] Add sign-out and session expiry
- [x] Add `getCurrentUser()` and `requirePermission()` server utilities
- [ ] Protect dashboard routes and mutations
- [ ] Add unauthorized and forbidden states

### Phase 3 — Shared dashboard

- [x] Replace the placeholder dashboard home
- [x] Build permission-filtered navigation
- [ ] Add reusable data-table, form, modal, and empty-state patterns
- [x] Add responsive layouts for desktop and laptop screens
- [x] Add loading, error, and success states

### Phase 4 — Administration

- [x] User list and user status management
- [x] Role creation and editing
- [x] Permission assignment to roles
- [x] Role assignment to users
- [x] Effective-permission preview
- [x] Audit-log viewer

### Phase 5 — Courses and learner experience

- [x] Course catalog and course detail view
- [x] Course creation and publishing workflow
- [x] Lesson management
- [x] Learner application and enrollment flow
- [x] Learner dashboard with progress and attendance
- [x] Cohort enrollment and membership

### Phase 6 — Instructor operations

- [x] Instructor course and cohort view
- [x] Lesson and session management
- [x] Attendance marking and correction workflow
- [x] Grade entry and learner progress updates
- [x] Instructor access scoping

### Phase 7 — Applications and certificates

- [x] Fellowship, job, and training application forms
- [x] File upload validation and storage
- [x] Application review and status workflow
- [x] Completion rules
- [x] Certificate generation and verification page
- [x] Certificate issue and revoke permissions

### Phase 8 — Notifications and hardening

- [ ] Email notifications for account, enrollment, application, and certificate events
- [ ] In-app notification center
- [ ] Audit sensitive operations
- [ ] Rate-limit authentication and upload endpoints
- [ ] Add permission-boundary and workflow tests
- [ ] Run responsive QA and production build checks

### Phase 9 — CMS and platform integration

- [x] Add administrator-only CMS-to-platform SSO handoff
- [x] Map CMS Super Admin/Admin users to platform administrator access
- [ ] Add course content fields required by the public single-course page
- [ ] Define CMS-to-platform course synchronization contract
- [ ] Keep platform enrollment, attendance, grading, applications, and certificates as the transactional source of truth
- [ ] Add CMS course publishing webhook and platform sync job

## 7. Initial milestone

The first implementation slice will deliver a working vertical foundation:

1. PostgreSQL and Prisma configured
2. Users, roles, permissions, and sessions implemented
3. Seeded administrator account and permission catalog
4. Secure sign-in and sign-out
5. One dashboard shell with permission-filtered navigation
6. Admin role and permission management

After this milestone, course enrollment can be added without changing the dashboard architecture.

## 8. Quality and security requirements

- Authorization is enforced on the server for every protected read and mutation.
- Client-side visibility is treated as a usability feature, never as security.
- Request payloads are validated with small, domain-specific schemas.
- Database access is isolated behind services or repositories.
- Sensitive actions are auditable.
- Uploaded files are validated by type and size and stored outside the application server.
- No secrets are exposed through `NEXT_PUBLIC_*` environment variables.
- Every phase must pass lint, type checking, build, and targeted permission tests.
