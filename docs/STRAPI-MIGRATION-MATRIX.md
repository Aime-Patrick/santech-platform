# Strapi to SAN TECH Platform Migration Matrix

Status: Phase 0 inventory baseline (read-only)

## Locked architecture

- `santech-f` remains the public website.
- `santech-platform` becomes the CMS, learning platform, admin system, API, and source of truth.
- `cms` (Strapi) is migrated and retired after validation.
- Website requests go through platform public APIs; the website does not connect directly to PostgreSQL.
- Cloudinary remains the media store.

## Inventory discovered

The local Strapi project contains 33 API content types and seven reusable components. All inspected content types have draft/publish enabled. Media is stored through Strapi references to Cloudinary assets and must be migrated as metadata/references, not copied as database blobs.

### Content domains

| Domain | Strapi content types | Platform destination | Priority |
| --- | --- | --- | --- |
| Learning/catalog | `san-hub-catalog-item`, `course-category`, `course-skill`, `course-tool` | Extend `Course`, `Lesson`, and add catalog/supporting models | P0 |
| Learning/books | `san-hub-book`, `san-hub-book-category` | Add platform book/content models | P1 |
| Tech Pulse | `tech-pulse-article` | Add article/category/content models | P1 |
| Site configuration | `site-setting`, `site-stat`, `contact-info`, `partner-brand` | Add site settings and brand/contact models | P1 |
| Company/legacy | `legacy-page`, `company-value`, `focus-area`, `journey-stage`, `standard`, `recognition`, `certificate`, `team-member` | Add company/legacy content models; certificate must be separated from issued learner certificates | P1 |
| Innovation | `innovation-product`, `innovation-service`, `innovation-solution`, `technology-category` | Add innovation/content models | P1 |
| Programs/opportunities | `opportunity`, `trainee-award`, `testimonial` | Add program/supporting content models | P1 |
| Product content | `e-visitors-feature`, `product-milestone`, `faq-item` | Add product/FAQ models | P1 |
| Driving change | `driving-change-story`, `driving-change-topic` | Add story/topic models with rich content | P1 |
| Homepage | `home-story-slide` | Add homepage slide/content model | P1 |

## Reusable Strapi components to preserve

- `course/detail`
- `course/list-item`
- `course/series-item`
- `course/stat`
- `course/testimonial`
- `shared/seo`
- `shared/social-link`

These should become typed relational or JSON-backed platform fields only where the content is genuinely variable. We should not create an opaque generic content table that loses validation and relationships.

## Existing platform alignment

The platform already has Prisma models for:

- Courses and lessons
- Users, roles, permissions, and sessions
- Cohorts and instructors
- Enrollments and lesson progress
- Applications and files
- Certificates, notifications, and audit logs

The migration must extend these models instead of creating duplicate course, user, enrollment, or certificate systems.

## Data preservation requirements

Every migrated content record must preserve:

- Original Strapi numeric ID and document ID where available
- Slug and title
- Draft/published state and publication date
- Created/updated timestamps where useful
- Sort order
- Relations and relation ordering
- Cloudinary media URL/public ID and alternative text
- Rich-text/block content
- SEO and social metadata

## Phase 0 exit criteria

- [x] Local Strapi API schema inventory completed
- [x] Reusable component inventory completed
- [x] Existing platform Prisma model inventory completed
- [ ] Production Strapi database backup supplied and verified by the owner
- [ ] Cloudinary asset/reference inventory generated
- [ ] Field-level mapping completed for all 33 content types
- [ ] Platform schema changes approved before migration code is written

## Next implementation step

Create the field-level mapping for the P0 learning/catalog domain, then update the platform Prisma schema and CMS/API contracts before importing any data.
