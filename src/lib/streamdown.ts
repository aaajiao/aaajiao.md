/**
 * Shared Streamdown config. Streamdown's memo() comparator checks `linkSafety`
 * by reference, so this must stay a stable module-level object rather than an
 * inline literal at each call site.
 */
export const LINK_SAFETY = { enabled: false } as const
