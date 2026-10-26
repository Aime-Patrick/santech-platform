<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# SAN TECH Platform Engineering Rules

These rules are mandatory for all new code and refactors in this project.

## Client server-state: TanStack React Query

- Every client-side read or write of remote/server state must go through TanStack React Query.
- React components must never call fetch, Axios, a server action, or another remote Promise directly.
- Reads use feature-level useQuery hooks. Writes use feature-level useMutation hooks.
- Components call mutation.mutate(...) / mutation.mutateAsync(...) or consume query state; components do not implement manual isLoading, isSaving, or remote error lifecycle state.
- Each feature owns:
  - features/<feature>/api/: plain, typed async fetchers with one endpoint responsibility each.
  - features/<feature>/hooks/: thin useQuery/useMutation wrappers.
  - features/<feature>/queryKeys.ts: typed query-key factory; no inline magic query keys.
  - features/<feature>/types.ts: lean request/response contracts.
  - features/<feature>/index.ts: the public feature API; consumers avoid deep imports.
- Mutations must invalidate or update every affected query using the feature's query-key factory.
- Prefer optimistic updates only when rollback behavior is safe and explicitly implemented.
- The shared QueryClient is configured once in src/lib/queryClient.ts and mounted once through QueryProvider.

### React Query boundary

React Query is a client-side server-state orchestration layer. It must not be forced into code where React hooks cannot run:

- Server Components may load initial data through server services and may dehydrate/prefetch React Query where interactive client ownership is needed.
- Route handlers authenticate, validate, call domain services/repositories, and return typed responses.
- Server actions, middleware, background jobs, Prisma repositories, domain services, migration scripts, and pure utilities remain server-native.
- Plain async functions and Promises are allowed inside fetchers and server code; they must not be invoked directly by client UI components for server-state operations.
- Local UI state such as dialog visibility, selected tabs, and unsaved input remains React state and does not belong in React Query.

## UI system: shadcn/ui

- Before writing custom UI, inspect installed shadcn components and consult the applicable shadcn documentation.
- Reuse and compose project components instead of creating one-off buttons, dialogs, tables, badges, alerts, empty states, separators, spinners, or form controls.
- Use semantic design tokens such as bg-background, text-foreground, text-muted-foreground, and bg-primary instead of raw colors unless a documented SAN TECH brand token requires otherwise.
- Use shadcn form composition, accessible titles for dialogs/sheets/drawers, full Card composition, grouped menu items, and project-standard loading/feedback components.
- Use the reusable DataTable for tabular management views; keep columns schema-driven and actions in the final overflow menu.
- Preserve the established SAN TECH visual language and do not introduce an unrelated design system.

## React and component architecture

- Apply Vercel React best practices: avoid waterfalls, parallelize independent server work, minimize client bundles and serialized props, and keep render paths inexpensive.
- Apply Vercel composition patterns: prefer composition and explicit variants over boolean-prop proliferation; use providers/compound components for complex reusable behavior.
- Apply SOLID at module level: one primary responsibility per module, minimal contracts, predictable types, and dependency boundaries between UI, feature hooks, API fetchers, routes, services, and persistence.
- Do not put database access, authentication, validation, fetch logic, mutation orchestration, and UI rendering in the same module.

## Conditional skills

- Use react-mcp only when implementing end-user-managed MCP server connections in an assistant UI. It is not a general data-fetching layer.
- Use vercel-react-native-skills only for React Native/Expo code or a future native client. Do not apply native-only APIs or patterns to this Next.js web application.

## Required verification

- Run TypeScript validation for changed application code.
- Run the production build for changes affecting routes, providers, server/client boundaries, or shared UI.
- Confirm authenticated and permission-restricted mutations enforce the same authorization in their API route or server boundary; hiding UI is never sufficient authorization.
