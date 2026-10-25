import { CategoryIcon, type Tint } from "@/components/ui";

const TINT_BG: Record<Tint, string> = {
  white: "from-white to-cream", sky: "from-sky to-white", peach: "from-peach to-white", mint: "from-mint to-white",
  lilac: "from-lilac to-white", rose: "from-rose to-white", navy: "from-navy to-navy/80", amber: "from-amber to-peach",
};

interface Props {
  coverUrl: string | null;
  icon: string;
  tint: Tint;
  className?: string;
}

/** Business photo, or (until the business uploads one) a soft tinted panel with its category icon. */
export function BusinessCover({ coverUrl, icon, tint, className = "" }: Props) {
  if (coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- remote business photos; sizes vary per business
    return <img src={coverUrl} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div aria-hidden className={`grid place-items-center bg-gradient-to-br ${TINT_BG[tint]} ${className}`}>
      <CategoryIcon name={icon} className="size-14 text-navy/25" />
    </div>
  );
}

/** Round business logo, or its first letter on navy. */
export function BusinessLogo({ name, logoUrl, className = "size-12" }: { name: string; logoUrl: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- remote business logos
    return <img src={logoUrl} alt="" className={`rounded-full border-2 border-white object-cover shadow-soft ${className}`} />;
  }
  return (
    <span aria-hidden className={`grid place-items-center rounded-full border-2 border-white bg-navy text-xl font-bold text-cream shadow-soft ${className}`}>
      {name.trim().charAt(0)}
    </span>
  );
}
