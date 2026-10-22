# P0 Learning and SAN HUB Mapping

Status: design mapping; no data imported

## `course-category` → `CourseCategory`

| Strapi field | Platform field | Notes |
| --- | --- | --- |
| `id` / `documentId` | `sourceId` / `sourceDocumentId` | Preserve both when available |
| `name` | `name` | Required |
| `slug` | `slug` | Unique |
| `description` | `description` | Optional |
| `sortOrder` | `sortOrder` | Default `0` |
| `isActive` | `isActive` | Default `true` |
| draft/publish metadata | `status`, `publishedAt` | Map draft to `DRAFT` |

## `san-hub-catalog-item` → `CatalogItem` with optional `Course` relation

Catalog entries are not all courses. Events, programs, apprenticeships, and other offerings need their own `CatalogItem` model. A catalog item may optionally reference a transactional `Course` when it represents an enrollable course. This prevents non-course content from polluting the learning domain.

| Strapi field | Platform destination | Notes |
| --- | --- | --- |
| `id` / `documentId` | `Course.sourceId` / `sourceDocumentId` | Traceability |
| `title` | `CatalogItem.title`; copy to `Course.title` only when linked | Required |
| `slug` | `CatalogItem.slug`; optional linked course slug | Unique |
| `description` | `Course.description` | Required in Strapi; nullable currently in Prisma |
| `level` | `Course.level` | Existing field |
| `duration` | `CatalogItem.durationLabel` plus optional normalized fields | Preserve original string |
| `provider` | Course catalog metadata | Public display field |
| `format` | Course catalog metadata | Public display field |
| `badge` | Course catalog metadata | Public display field |
| `subtitle` | Course catalog metadata | Public display field |
| `instructor` | Course catalog metadata or instructor relation | Do not silently convert a display name into a user |
| `category` | Course catalog metadata enum | Values include Courses, Programs, Events, etc. |
| `courseCategory` | `CourseCategory` relation | Preserve relation |
| `image` | Cloudinary media relation | Preserve URL/public ID/alt text |
| `stats` | `CatalogItem.stats` JSON | Validate with Zod; preserve order |
| `learningOutcomes` | `CatalogItem.learningOutcomes` JSON | Validate with Zod; preserve order |
| `details` | `CatalogItem.details` JSON | Validate with Zod; preserve order |
| `courseSeries` | `CatalogItem.courseSeries` JSON | Validate with Zod; preserve order |
| `courseTestimonials` | `CatalogItem.courseTestimonials` JSON | Validate with Zod; preserve order |
| `skills` | `CourseSkill` many-to-many relation on `CatalogItem` | Preserve relation ordering if present |
| `tools` | `CourseTool` many-to-many relation on `CatalogItem` | Preserve relation ordering if present |
| `rating` | `CatalogItem.rating` | Decimal 0–5 |
| `reviewCount` | `CatalogItem.reviewCountLabel` | Preserve original string |
| `sortOrder` | `CatalogItem.sortOrder` | Default `0` |
| draft/publish metadata | `CatalogItem.status`, `publishedAt` | Published becomes `PUBLISHED` |

## `course-skill` → `CourseSkill`

Preserve `name`, `slug`, `category`, `description`, `sortOrder`, publication state, source IDs, and the many-to-many course relation.

## `course-tool` → `CourseTool`

Preserve `name`, `slug`, `category`, `iconName`, `description`, `sortOrder`, publication state, source IDs, and the many-to-many course relation.

## Reusable course components

These will use validated typed JSON because they are presentational, ordered, and are not queried independently. Zod schemas will validate every admin mutation and public response:

- `course/stat`: `label`, `value`, `detail`
- `course/detail`: `title`, `detail`, `icon`
- `course/list-item`: `value`
- `course/series-item`: `title`, `description`, `duration`
- `course/testimonial`: `initials`, `name`, `quote`

## Locked decisions

1. Catalog-only entries use a separate `CatalogItem` model. A catalog item may optionally link to a transactional `Course`.
2. Presentational course components use typed JSON arrays with Zod validation. Skills, tools, categories, lessons, enrollments, and other queryable entities remain relational tables.
3. Duration preserves the original `durationLabel` and may include optional normalized fields: `durationMin`, `durationMax`, and `durationUnit`. Values that cannot be safely normalized remain label-only. The existing `Course.durationWeeks` remains for transactional course scheduling.
4. Cloudinary assets are migrated by preserving Strapi media ID, Cloudinary public ID, URL, format, dimensions, and alt text. We will not re-upload assets that already exist. Each reference is verified through the Cloudinary API or a signed metadata request, and missing assets are reported before cutover.

These decisions are approved for the Prisma migration design. No P0 import begins until the corresponding schema and Zod contracts are implemented and tested.