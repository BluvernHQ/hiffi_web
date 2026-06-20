// localStorage replaced with real API — see lib/api/migration-requests.ts
// Keeping only the stable UI constants used across components.

import { STUDIO_HOME } from "@/lib/studio-routes"

export const MIGRATION_REQUESTS_SECTION_ID = "migration-requests"
export const MIGRATION_REQUESTS_STUDIO_URL = `${STUDIO_HOME}#${MIGRATION_REQUESTS_SECTION_ID}`
