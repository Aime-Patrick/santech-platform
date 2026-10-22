# SAN TECH Platform Design Plan

## 1. Design direction

Create a professional learning and operations platform that feels clear, trustworthy, and easy to operate on a laptop, tablet, or phone.

The product will use one dashboard shell for every user. The dashboard changes according to permissions instead of splitting the product into separate learner, instructor, and admin applications.

The platform will reuse the SAN TECH branding system and approved assets from `santech-f`.

Primary design goals:

- Make the next useful action obvious.
- Keep high-value information visible without creating dense screens.
- Use consistent patterns for lists, forms, review flows, and status changes.
- Make permission boundaries understandable rather than confusing.
- Support keyboard, touch, and responsive laptop layouts.

## 2. Visual language

### Brand character

- Institutional but approachable
- Calm, precise, and operational
- Strong SAN TECH navy as the foundation
- Cyan used for active actions and progress
- Light neutral surfaces for workspace areas
- Clear status colors used sparingly and consistently

### Color roles

```text
Navy       Primary navigation, headings, primary buttons
Cyan       Active states, links, progress, focus accents
White      Cards, forms, dialogs, main content surfaces
Slate      Body text, borders, muted labels
Green      Successful completion and approved states
Amber      Pending, needs review, or attention states
Red        Errors, rejection, destructive actions
```

Colors should be defined as semantic tokens rather than repeated directly inside feature components.

### Typography

- Strong, readable display headings for page titles
- Comfortable body text for course and application descriptions
- Compact uppercase labels for metadata and status categories
- No font-size changes based on the selected language
- Text must wrap naturally before controls become horizontally scrollable

## 3. Shared application shell

### Desktop layout

```text
┌────────────────────────────────────────────────────────────┐
│ Top bar: workspace name · search · notifications · profile │
├───────────────┬────────────────────────────────────────────┤
│ Sidebar       │ Breadcrumbs                                │
│ permission-   │ Page title + primary action                │
│ filtered      │ Summary cards                              │
│ navigation    │ Main table, form, or workspace             │
└───────────────┴────────────────────────────────────────────┘
```

### Responsive layout

- Desktop: fixed collapsible sidebar with a spacious content area
- Laptop: compact sidebar and reduced card padding
- Tablet: sidebar becomes a drawer
- Mobile: top bar with menu trigger; tables become stacked records or horizontal overflow only when necessary
- No page should create horizontal scrolling from decorative elements or oversized headings

### Shared shell components

- `AppShell` — owns the global workspace layout
- `Sidebar` — receives permission-filtered navigation items
- `Topbar` — search, notifications, profile, and menu controls
- `Breadcrumbs` — current location context
- `PageHeader` — title, description, and permitted primary action
- `PermissionGate` — renders an action only when the permission is present
- `AccessDenied` — explains missing access without exposing sensitive data
- `EmptyState` — consistent icon, message, and permitted next action
- `ConfirmDialog` — destructive and irreversible actions
- `StatusBadge` — shared status vocabulary and colors

## 4. Dashboard home

The dashboard home is personalized by permissions, not by a hard-coded role switch.

### Shared sections

- Welcome and current-user summary
- Pending actions requiring attention
- Recent activity
- Progress or operational summary cards
- Quick actions allowed by the current user
- Upcoming sessions, deadlines, or application events

### Examples by access

- Learner: enrolled courses, progress, upcoming lessons, attendance
- Instructor: assigned cohorts, sessions needing attendance, grading queue
- Administrator: enrollment approvals, applications needing review, platform activity

If a user has no data for a section, show a useful empty state rather than an empty card.

## 5. Navigation and permissions

Navigation is defined as data with a required permission:

```text
Overview          dashboard.view
Courses           courses.view
Enrollments       enrollments.apply or enrollments.review
Attendance        attendance.view or attendance.mark
Applications      applications.create or applications.review
Certificates      certificates.view or certificates.issue
Users             users.view
Roles             roles.view
Audit log         audit_logs.view
```

The UI may hide links and buttons the user cannot use, but every page load, query, and mutation must enforce the same permission on the server.

## 6. Core feature designs

### Courses

Course catalog cards should show title, summary, level, duration, instructor, cohort availability, and enrollment state.

Course detail should include:

- Course overview
- Learning outcomes
- Lesson list
- Cohort and schedule information
- Enrollment action when permitted
- Progress state for enrolled learners

Course management should use a step-based form for basic information, lessons, cohorts, and publishing.

### Enrollments

Use a review table with filters for status, course, cohort, and date.

Enrollment statuses:

```text
Draft → Submitted → Under review → Approved
                              └──→ Rejected
Approved → Active → Completed
```

Actions must show the next valid transition only. Rejections require a reason.

### Learner experience

- My learning dashboard
- Course progress cards
- Lesson viewer with completion control
- Attendance history
- Certificate status and download
- Profile and notification preferences

### Instructor experience

- Assigned course and cohort list
- Cohort detail with learner roster
- Session attendance marking
- Learner progress and grading
- Notes and follow-up actions

Instructor data is limited to assigned courses and cohorts unless an additional permission grants broader access.

### Applications

Use a two-column desktop review layout:

```text
Application list | Applicant details, submitted files, review history, decision actions
```

On small screens, the list becomes a drawer or separate route before the details view.

Application states:

```text
Draft → Submitted → Under review → Shortlisted
                              ├──→ Rejected
                              └──→ Accepted
```

### Roles and permissions

The role editor should contain:

- Role name and description
- Active/inactive status
- Permission groups with checkboxes
- Assigned users summary
- Effective permission preview
- Save and cancel actions

Dangerous permissions such as user management, role management, and certificate revocation should have clear warnings.

The system must prevent removal of the last active administrator and should display an audit confirmation after role changes.

### Certificates

- Completion summary before issue
- Certificate preview
- Issue, revoke, and verify actions based on permissions
- Public verification page using a non-guessable certificate identifier
- Downloadable PDF with consistent SAN TECH branding

## 7. Common component system

Build components by responsibility so feature pages compose them rather than duplicate them:

- Data table with sorting, filtering, pagination, and empty state
- Form field, select, combobox, date picker, and file upload
- Search toolbar and filter chips
- Status badge and status timeline
- Summary card and metric card
- Stepper for multi-stage workflows
- Drawer for mobile detail views
- Dialog for confirmation and focused forms
- Toast or inline feedback for mutations
- Skeleton loading states matching final layout

Feature components should accept typed data and callbacks. They should not fetch their own database data or make authorization decisions.

## 8. State design

Every data-driven screen must define these states:

- Loading
- Loaded with data
- Loaded with no data
- Validation error
- Request error
- Unauthorized
- Forbidden
- Mutation pending
- Mutation success

Destructive actions must use confirmation dialogs. Long forms should preserve entered values after validation errors.

## 9. Accessibility and responsive quality

- Keyboard navigation for all controls
- Visible focus rings
- Labels for every form control
- Accessible dialog focus management
- Sufficient color contrast
- Status meaning must not depend on color alone
- Tables must expose headers to assistive technology
- Touch targets should be comfortable on mobile
- Test at narrow mobile, tablet, 1024px laptop, 1440px desktop, and large desktop widths

## 10. Design delivery order

### Stage 1 — Foundation

- [ ] Define semantic color and typography tokens
- [ ] Refine the existing starter shell
- [ ] Build responsive sidebar, topbar, breadcrumbs, and page header
- [ ] Add shared loading, error, empty, and forbidden states

### Stage 2 — Dashboard

- [ ] Build permission-filtered navigation
- [ ] Build dashboard summary cards
- [ ] Build pending-actions and recent-activity sections
- [ ] Add responsive dashboard layouts

### Stage 3 — Administration

- [ ] Design users table
- [ ] Design role editor
- [ ] Design permission groups and warnings
- [ ] Design audit-log viewer

### Stage 4 — Learning workflows

- [ ] Design course catalog and detail screens
- [ ] Design enrollment and approval flows
- [ ] Design learner progress screens
- [ ] Design instructor cohort and attendance screens

### Stage 5 — Operations

- [ ] Design application review workspace
- [ ] Design file upload states
- [ ] Design certificate preview and verification
- [ ] Design notification center

### Stage 6 — Validation

- [ ] Review all permission states
- [ ] Test empty, loading, error, and forbidden states
- [ ] Test keyboard and screen-reader behavior
- [ ] Test responsive layouts at target laptop widths
- [ ] Remove unnecessary page and container scrolling

## 11. Design quality gates

Before a feature is considered complete:

- It uses shared shell and component patterns.
- Its actions are permission-aware.
- It has loading, empty, error, unauthorized, and forbidden states.
- It works at laptop and mobile widths without accidental horizontal scrolling.
- It has accessible labels, focus states, and semantic structure.
- It does not place database or authorization logic inside presentation components.
