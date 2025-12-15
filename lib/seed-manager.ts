/**
 * Seed Manager
 * 
 * Manages a random seed value that:
 * - Is generated once per page session (persists across routes)
 * - Resets on page refresh
 * - Can be accessed from anywhere in the app
 */

const SEED_STORAGE_KEY = 'hiffi_video_seed'
const PAGE_LOAD_FLAG = 'hiffi_page_load_flag'

// Initialize seed check on module load (runs once per page load)
let seedInitialized = false

/**
 * Generates a random seed string
 */
function generateSeed(): string {
  // Generate a random string using crypto if available, otherwise fallback to Math.random
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    return array[0].toString(36) + Date.now().toString(36)
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Checks if this is a page refresh and clears seed if needed
 * This runs once per page load
 */
function initializeSeedOnPageLoad(): void {
  if (typeof window === 'undefined' || seedInitialized) return
  
  seedInitialized = true
  
  // Check if page load flag exists - if not, this is a fresh page load
  const pageLoadFlag = sessionStorage.getItem(PAGE_LOAD_FLAG)
  
  if (!pageLoadFlag) {
    // This is a fresh page load (could be refresh or initial load)
    // Check if there's an existing seed - if so, it's a refresh, clear it
    const existingSeed = sessionStorage.getItem(SEED_STORAGE_KEY)
    if (existingSeed) {
      console.log('[hiffi] Page refresh detected, clearing old seed')
      sessionStorage.removeItem(SEED_STORAGE_KEY)
    }
    // Set page load flag for this session
    sessionStorage.setItem(PAGE_LOAD_FLAG, 'true')
  }
  
  // Clear page load flag on page unload so next load is detected as refresh
  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem(PAGE_LOAD_FLAG)
  })
}

/**
 * Gets the current seed, generating a new one if it doesn't exist
 * Uses sessionStorage so it persists across routes but resets on page refresh
 */
export function getSeed(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder (shouldn't be used)
    return 'server-seed'
  }

  // Initialize seed check on first call (runs once per page load)
  initializeSeedOnPageLoad()

  let seed = sessionStorage.getItem(SEED_STORAGE_KEY)
  
  if (!seed) {
    seed = generateSeed()
    sessionStorage.setItem(SEED_STORAGE_KEY, seed)
    console.log('[hiffi] Generated new seed:', seed)
  }
  
  return seed
}

/**
 * Resets the seed (generates a new one)
 * Useful for testing or manual refresh
 */
export function resetSeed(): string {
  if (typeof window === 'undefined') {
    return 'server-seed'
  }
  
  const newSeed = generateSeed()
  sessionStorage.setItem(SEED_STORAGE_KEY, newSeed)
  console.log('[hiffi] Reset seed to:', newSeed)
  return newSeed
}

// Initialize on module load if in browser
if (typeof window !== 'undefined') {
  initializeSeedOnPageLoad()
}
