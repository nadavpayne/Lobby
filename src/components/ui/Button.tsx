import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "navy" | "ghost" | "danger";
export type ButtonSize = "lg" | "md" | "sm";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-amber text-navy shadow-soft hover:brightness-105",
  secondary: "border-2 border-navy text-navy hover:bg-navy/5",
  navy: "bg-navy text-cream shadow-soft hover:brightness-110",
  ghost: "text-navy hover:bg-navy/5",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

const SIZES: Record<ButtonSize, string> = {
  lg: "min-h-14 w-full rounded-xl px-4 text-xl",
  md: "min-h-11 rounded-xl px-4 text-base",
  sm: "min-h-9 rounded-lg px-3 text-sm",
};

/** Class string for a button-looking element (use on <Link> too). Presses shrink slightly. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "lg"): string {
  return `inline-flex items-center justify-center gap-2 font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]}`;
}

/** Full-width primary action (orange), 56px tall. */
export const primaryButton = buttonClass("primary", "lg");

/** Full-width secondary action (navy outline), 56px tall. */
export const secondaryButton = buttonClass("secondary", "lg");

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Brand button. Defaults to type="button" so it never submits a form by accident. */
export function Button({ variant, size, className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={`${buttonClass(variant, size)} ${className}`} {...rest} />;
}
