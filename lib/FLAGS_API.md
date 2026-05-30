# Content Flags API (Frontend)

Maps the Hiffi Content Flags backend to this web app. Backend base paths: `/flags` (users), `/admin/flags` (admins).

## Proxies (same-origin, avoids CORS)

| Browser path | Backend | Methods |
|--------------|---------|---------|
| `/proxy/flags/config` | `/flags/config` | GET |
| `/proxy/flags` | `/flags` | POST |
| `/proxy/flags/self` | `/flags/self` | GET |
| `/proxy/admin-flags` | `/admin/flags` | GET |
| `/proxy/admin-flags/{flagId}` | `/admin/flags/{flagId}` | GET, PATCH |

Implementation: [`lib/api/flags.ts`](api/flags.ts), routes under [`app/proxy/flags/`](../app/proxy/flags/) and [`app/proxy/admin-flags/`](../app/proxy/admin-flags/).

## User UI

| Feature | Location |
|---------|----------|
| Report video | Watch page |
| Report comment | Comment section |
| Report user | Profile (non-owner) |
| My reports list | `/support/reports` |
| Case detail | `/support/reports/[referenceId]` |

## Admin UI

| Feature | Location |
|---------|----------|
| Reports queue | `/admin/dashboard?section=flags` |
| Case detail + PATCH | `?section=flags&flagId={uuid}` |

Admin list filters: `status`, `report_type` (from config), `reference_id`, `target_id`, `target_type`, `reporter_id`.

## Not implemented in UI

- Attachments upload (API accepts URL array; always `[]` on create)
- Report entry points for stream, livestream, chat, copyright, feature_request, etc. (API supports via config)

## Client module

- Types: [`lib/types/content-flag.ts`](types/content-flag.ts)
- API: [`lib/api/flags.ts`](api/flags.ts) via [`lib/api-client.ts`](api-client.ts)
