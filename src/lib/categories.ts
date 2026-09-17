/**
 * The one list of post categories.
 *
 * It used to be copy-pasted into the board page, the posts API, the post
 * form and the filters; four copies was survivable at seven values and a
 * bug waiting to happen at seventeen. Everything that needs the list —
 * including the Zod schema that guards the API — imports it from here.
 *
 * Order is deliberate and shared by the form and the filters: hands-on
 * work first, then care and learning, then admin, then culture. OTHER
 * stays last, where a fallback belongs.
 *
 * Adding one means: add the value here, add the same value to the
 * `Category` enum in prisma/schema.prisma, migrate, and add a label under
 * `categories.` in all three locale files. NOTHING CHECKS THE LABELS —
 * there is no test suite, and a missing one ships as the literal string
 * "categories.YOUR_KEY" on every card, in every language. Grep the three
 * files in src/i18n/locales/ before you push.
 */
export const CATEGORY_KEYS = [
  "MANUAL_WORK",
  "MOVING",
  "GARDENING",
  "ANIMALS",
  "COOKING",
  "CARE",
  "HEALTH",
  "EDUCATION",
  "LANGUAGES",
  "PAPERWORK",
  "LEGAL",
  "TECHNOLOGY",
  "COMMUNICATION",
  "CREATIVE",
  "MUSIC",
  "EVENTS",
  "OTHER",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** Most posts are one thing. The cap stops a post claiming the whole board. */
export const MAX_CATEGORIES_PER_POST = 3;

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

/** Parse a `?category=A,B` filter value into known keys, ignoring junk. */
export function parseCategoryParam(raw: string | undefined | null): CategoryKey[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(isCategoryKey))];
}
