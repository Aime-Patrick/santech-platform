# Strapi production migration inventory

Source dump: `santech_cms.dump` (restored to an isolated PostgreSQL 17 database on 2026-10-21).

This is a read-only baseline for the migration importer. No platform records were written.

## Verified source counts

| Strapi table | Records |
| --- | ---: |
| `san_hub_catalog_items` | 106 |
| `course_categories` | 32 |
| `course_skills` | 0 |
| `course_tools` | 0 |
| `tech_pulse_articles` | 32 |
| `company_values` | 18 |
| `files` | 63 |
| `driving_change_stories` | 36 |
| `innovation_solutions` | 22 |
| `innovation_services` | 16 |
| `innovation_products` | 12 |
| `faq_items` | 10 |
| `team_members` | 26 |
| `testimonials` | 10 |

The complete restored database contains 89 public tables, including Strapi component and relation tables.

## Migration notes

- Cloudinary files are represented by Strapi `files` metadata. The migration should preserve provider, public ID, URL, format, dimensions, and alternative text; it must not re-upload assets.
- `course_skills` and `course_tools` are empty in the production dump. Catalog relationships must therefore be imported as empty unless a later verified backup contains taxonomy rows.
- Catalog order must be generated from the source creation sequence and assigned consecutively in the platform; editors must not manually edit the order.
- This inventory is a baseline only. The importer must run a dry-run validation for duplicate slugs, missing relations, invalid media references, and unsupported component shapes before writing platform data.
## Canonical document result

The dry-run importer canonicalizes Strapi 5 draft/published row pairs by document_id, preferring the published row and falling back to the latest draft. The result is **53 unique catalog documents** and **16 unique category documents**, with no duplicate slugs. Fourteen catalog documents currently have no category relation and will be imported without a category unless content review assigns one.
