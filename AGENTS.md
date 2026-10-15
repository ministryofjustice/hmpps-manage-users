# hmpps-manage-users

An HMPPS TypeScript/Express service (based on `hmpps-template-typescript`) for managing DPS/NOMIS and "external"
(non-DPS) users, groups, roles, email domains and the user allow-list, via the `manage-users-api`.

## Build, test, lint

- Install: `npm run setup` (runs `npm ci`, not plain `npm install`) — requires node `^24`.
- Dev server (esbuild watch): `npm run start:dev`
- Build: `npm run build` (esbuild), then `npm start` runs `dist/server.js`
- Typecheck: `npm run typecheck` (runs `tsc` for the app, plus separate `tsc -p integration_tests` and `tsc -p assets/js`)
- Lint: `npm run lint` (`eslint --max-warnings 0`); autofix with `npm run lint-fix`
- Unit tests (Jest): `npm test`
  - Single file: `npx jest server/services/groupsService.test.ts`
  - Single test by name: `npx jest server/services/groupsService.test.ts -t "Creates a group"`
  - CI mode (serial): `npm run test:ci`
- Integration tests (Playwright), require wiremock stubs running:
  1. `docker compose -f docker-compose-test.yml up`
  2. `npm run start-feature` (or `start-feature:dev` for auto-restart)
  3. `npm run int-test` (headless) or `npm run int-test-ui`
  - Single spec: `npx playwright test integration_tests/specs/groups/createGroup.spec.ts`

## Architecture

Request flow: `server/app.ts` wires middleware (auth, CSRF, session, current user, security headers) then mounts
`server/routes/index.ts`, which composes one router per feature area (`dpsUser`, `externalUser`, `groups`, `roles`,
`emailDomains`, `crsGroups`, `userAllowList`, `menuRouter`).

- **Routes** (`server/routes/<feature>/`): each feature has an `index.ts` that builds an Express `Router`, registers
  `router.param(...)` handlers to preload entities (e.g. `group`, `childGroup`) onto the request object, and mounts
  sub-routers at paths defined centrally in `server/routes/paths.ts` (built with `static-path`'s `path()` helper, so
  URLs and their typed params are derived from one source of truth). Handlers call services, never the API client
  directly.
- **Reusable "template" routers**: several CRUD flows (e.g. create-group / create-child-group in
  `groups/createRouters.ts`) are implemented as one generic higher-order router function parameterised with
  title/text strings, path providers, and a `groupCreator` callback, then exported as two thin wrappers. Follow this
  pattern rather than duplicating near-identical routers.
- **Services** (`server/services/*Service.ts`): one class per feature, injected with `ManageUsersApiClient` and
  wired up in `server/services/index.ts` (the `services()` factory / `Services` type used everywhere for DI).
  Services contain business logic; keep API calls in the data layer.
- **Data layer** (`server/data/manageUsersApiClient.ts`): a single `RestClient` subclass (from
  `@ministryofjustice/hmpps-rest-client`) with one method per `manage-users-api` endpoint, using `asUser(token)` for
  auth. Types come from the generated `manageUsersApiClient` module (path-mapped in `tsconfig.json`); regenerate with
  `./generate-api-types.sh`.
- **Forms**: `server/middleware/route/formMiddleware.ts` provides `validateFormOrRedirect`,
  `flashBody`/`bodyFromFlash` and `flashErrors`/`formErrorsFromFlash` for the flash-then-redirect validation pattern
  used on POST handlers (validate → flash body/errors → redirect back on failure; render reads flashed state on GET).
  Validation rules live under `server/presentation/validation/`.
- **Auth guards**: `authRoleGuardMiddleware([AuthRole.X])` gates routers/handlers by role, decoded from the user's
  JWT (`res.locals.user.token`).
- **Auditing**: mutating actions call `services.auditService.logAuditEvent({ what: EventType.X, who, subjectId,
  subjectType, details })` — `EventType`/`SubjectType` are defined in `server/routes/audit.ts`.
- **Views**: Nunjucks templates under `server/views/pages/<feature>` and `server/views/components`, using GOV.UK
  Frontend / MoJ Frontend macros.

## Conventions

- Route unit tests build an app via `server/routes/testutils/appSetup.ts` (`appWithAllRoutes({ services, userSupplier
  })`) and drive it with `supertest`; services are mocked per-test rather than hitting a real API client.
- Service unit tests `jest.mock('../data/manageUsersApiClient')` and assert on calls to the mocked client.
- Integration tests use a page-object model (`integration_tests/pages/`) plus Wiremock stubs
  (`integration_tests/mockApis/`) and helpers (`integration_tests/helpers/`) that seed stub data per feature.
- Precommit hooks (`prek`, configured via `.pre-commit-config.yaml`) scan staged files for secrets; they're installed
  automatically by `npm run setup`.
