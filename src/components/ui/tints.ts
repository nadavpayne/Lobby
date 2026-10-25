/** Soft brand tints shared by Card, StatTile and Tag. */
export type Tint = "white" | "sky" | "peach" | "mint" | "lilac" | "rose" | "navy" | "amber";

/** Background + text classes for each tint. */
export const TINT_CLASS: Record<Tint, string> = {
  white: "bg-white text-navy",
  sky: "bg-sky text-navy",
  peach: "bg-peach text-navy",
  mint: "bg-mint text-navy",
  lilac: "bg-lilac text-navy",
  rose: "bg-rose text-navy",
  navy: "bg-navy text-cream",
  amber: "bg-amber text-navy",
};

/** Tints to cycle through for lists of colorful items (category chips, card placeholders). */
export const TINT_CYCLE: Tint[] = ["peach", "sky", "mint", "lilac", "rose"];
