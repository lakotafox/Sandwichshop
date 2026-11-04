/**
 * Timing for the intro sequence — the preloader, then the hero DOM reveals,
 * then the WebGL hand fly-in — kept in one place so the three stay in sync.
 * All values are wall-clock ms (react-spring delays/durations are wall-clock,
 * and both the preloader and the reveals pause together when the tab is hidden).
 */

// --- preloader ---
export const PRELOADER_LOAD_MS = 200; // progress bar 0 → 100
export const PRELOADER_WHITE_EXIT_MS = 700; // white curtain lifts
export const PRELOADER_DARK_EXIT_MS = 950; // dark-blue curtain lifts (trails)

// --- hero DOM entrances — start as the curtains lift (overlaps the reveal) ---
export const HERO_REVEAL_DELAY = PRELOADER_LOAD_MS + 400; // ~2400

// --- WebGL hands — fly in a touch earlier, ~when the preloader is 90% gone ---
export const HANDS_REVEAL_DELAY = PRELOADER_LOAD_MS + 500; // ~2500
export const HANDS_FLY_MS = 4200; // longer, gentler fly-in (see easeOutQuint)
