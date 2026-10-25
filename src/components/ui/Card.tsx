import type { HTMLAttributes } from "react";
import { TINT_CLASS, type Tint } from "./tints";

interface Props extends HTMLAttributes<HTMLElement> {
  tint?: Tint;
  /** Lifts on hover and shrinks on press (for tappable cards). */
  interactive?: boolean;
  as?: "section" | "article" | "div";
}

/** Rounded, softly shadowed surface. The base of every card in all three apps. */
export function Card({ tint = "white", interactive = false, as: Tag = "section", className = "", ...rest }: Props) {
  const motion = interactive ? "transition hover:shadow-lift active:scale-[0.98]" : "";
  return <Tag className={`rounded-3xl p-5 shadow-soft ${TINT_CLASS[tint]} ${motion} ${className}`} {...rest} />;
}
