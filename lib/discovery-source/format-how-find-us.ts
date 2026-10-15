import {
  DISCOVERY_SOURCE_OPTIONS,
  type DiscoverySource,
} from "@/lib/types/inventory"

/** Map claim-form discovery select → API `how_find_us` free text. */
export function formatHowFindUs(
  source: DiscoverySource,
  otherText?: string,
): string {
  if (source === "other") {
    return otherText?.trim() ?? ""
  }
  return DISCOVERY_SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source
}
