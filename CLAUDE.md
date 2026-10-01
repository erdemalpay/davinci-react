# davinci-react

Vite + React 18 + TypeScript admin panel for the Da Vinci board game cafe (orders/tables, menu, stock and accounting, shifts, online sales). It talks to the NestJS API in `../davinci-api`, and most features touch both repos.

## Commands

```bash
yarn start            # vite dev server (port 3001)
yarn build            # tsc && vite build; tsc is the real typecheck
yarn test             # vitest run (src/**/*.test.ts[x])
npx vitest run src/components/orders/orderPayment/orderList/customDiscount.test.ts
yarn lint             # eslint
```

- The API URL comes from `VITE_API_URL` in `.env`.
- Deployed on Vercel (SPA rewrite in `vercel.json`).
- CI only runs an AI review, so run `yarn build` and `yarn test` before pushing.

## Architecture and conventions

- **API layer:** `src/utils/api/`. Endpoint base paths are in the `Paths` object in `src/utils/api/factory.ts`.
  - One file per domain (e.g. `utils/api/break.ts`) exports hooks built on the factory: `useGet` / `useGetList` for queries and `useMutationApi({ baseQuery })` for create/update/delete with optimistic updates, toasts and invalidation.
  - Don't call `axiosClient` or `useQuery` directly in components when a factory hook fits.
  - Query keys are the request paths, which websocket invalidation relies on.
- **Realtime:** the API emits socket events like `orderChanged`. `src/hooks/socketConstant.ts` maps each event to the query keys to invalidate, and `src/hooks/useWebSocket.ts` wires them up. A new backend `emitXChanged()` needs an entry here.
- **Types:** `src/types/index.ts` is a hand-maintained mirror of backend schemas/DTOs. When an API field changes, update it here too. IDs are numbers (backend uses auto-increment `_id`).
- **Routing:**
  - Route paths are the `Routes` enum in `src/navigation/constants.ts`, together with the page/route definitions.
  - `src/navigation/routes.tsx` renders them.
  - Sidebar/page visibility comes from backend panel-control pages (`permissionRoles`, see `src/hooks/useFilteredRoutes.ts`).
- **State:** server state belongs in React Query. Contexts in `src/context/` hold UI and session state:
  - `Location`, `User`, `Date`, `Order`, `General`, `Filter`. `Filter.context.tsx` holds per-page filter panels.
  - `Data.context.tsx` preloads common lists.
  - Prefer local state or URL params for new page-specific filters instead of growing `Filter.context`.
- **UI:** Tailwind. Reuse `src/components/panelComponents/` (`GenericTable`, `GenericAddEditPanel`, form elements) for tables and forms instead of building new ones.
- **i18n:** react-i18next with `useTranslation()`. Keys are the English strings. Add every new key to both `src/locales/en/translation.json` and `src/locales/tr/translation.json`.
- Several components are very large (`pages/Tables.tsx`, `components/tables/TableCard.tsx`, `GenericTable.tsx`). Read the relevant section, and extract new pieces into separate components.

## Tests

Vitest + Testing Library (`src/test/setup.ts`), tests next to the code as `*.test.ts(x)`. Coverage is small and concentrated in order payment/discount logic.
