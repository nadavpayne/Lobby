// Word search over the resident's benefits, tuned for Hebrew. Pure: runs in the browser on the loaded feed.
import { CATEGORIES, taxonomyLabel } from "../businesses/categories.ts";
import type { ResidentOffer } from "./types.ts";

const FINALS: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

/** Lowercase, no niqqud or punctuation, final letters as regular ones: "פיצה!" and "פִּיצָה" compare equal. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/["'״׳`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * The forms of one typed word worth matching: as typed, without a one-letter prefix (ו/ה/ב/ל/מ/ש/כ: "בפיצרייה"),
 * and without a common ending (ים/ות/ה/י: "דגים" → "דג", "פיצה" → "פיצ", which also finds "פיצרייה").
 */
export function wordForms(word: string): string[] {
  const forms = new Set([word]);
  const bases = [word, ...(word.length >= 4 && "והבלמשכ".includes(word[0]) ? [word.slice(1)] : [])];
  for (const base of bases) {
    forms.add(base);
    const stem = base.replace(/(ים|ות|יות|ה|י)$/, "");
    if (stem.length >= 2 && stem !== base) forms.add(stem);
  }
  return [...forms];
}

/** Searchable fields and how much a hit in each counts. */
function fields(o: ResidentOffer): [string, number][] {
  return [
    [o.businessName, 6],
    [CATEGORIES[o.category] ?? "", 4],
    [o.subcategories.map(taxonomyLabel).join(" "), 4],
    [o.title, 3],
    [o.tags.map(taxonomyLabel).join(" "), 2],
    [`${o.description} ${o.businessDescription ?? ""}`, 1],
    [[o.address, ...o.branches.map((b) => `${b.name} ${b.address}`)].join(" "), 1],
  ].map(([text, weight]) => [normalize(text as string), weight as number]);
}

/** How well one typed word matches a field: 2 = a whole word, 1 = the start of a word, 0 = not at all. */
function hit(field: string, forms: string[]): number {
  const words = field.split(" ");
  if (forms.some((f) => words.includes(f))) return 2;
  return forms.some((f) => words.some((w) => w.startsWith(f) || (f.length >= 3 && w.includes(f)))) ? 1 : 0;
}

/** Score of an offer for the query, or 0 if any typed word matches nothing (every word must match somewhere). */
export function scoreOffer(o: ResidentOffer, query: string): number {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return 0;
  const f = fields(o);
  let total = 0;
  for (const word of words) {
    const forms = wordForms(word);
    const best = Math.max(...f.map(([text, weight]) => hit(text, forms) * weight));
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export interface SearchFilters {
  query: string;
  /** Primary category ID, or null for all. */
  category: string | null;
  /** Subcategory ID within the category, or null for all. */
  subcategory: string | null;
}

/** Offers matching the words and category, best match first (then nearest); with no words, nearest first. */
export function searchOffers(offers: ResidentOffer[], f: SearchFilters): ResidentOffer[] {
  const inCategory = offers.filter((o) => (!f.category || o.category === f.category) && (!f.subcategory || o.subcategories.includes(f.subcategory)));
  const near = (a: ResidentOffer, b: ResidentOffer) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
  if (!normalize(f.query)) return [...inCategory].sort(near);
  return inCategory
    .map((o) => ({ o, score: scoreOffer(o, f.query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || near(a.o, b.o))
    .map((x) => x.o);
}
