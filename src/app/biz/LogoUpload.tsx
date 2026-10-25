"use client";

import { Camera, ImageUp } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { uploadLogo } from "@/lib/api/biz";
import { shrinkImage } from "@/lib/images/shrinkImage";

interface Props {
  token: string;
  businessName: string;
  logoUrl: string | null;
  onUploaded: (logoUrl: string) => void;
}

/**
 * The business's one photo: round preview + pick or take a photo. We recommend the logo, because it is also the
 * business's profile picture on every benefit card residents see.
 */
export function LogoUpload({ token, businessName, logoUrl, onUploaded }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Shrinks the picked photo and uploads it. */
  async function onPick(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const res = await uploadLogo(token, await shrinkImage(file));
      if ("error" in res) setError(res.error);
      else onUploaded(res.logoUrl);
    } catch {
      setError("לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת.");
    } finally {
      setPending(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-navy text-3xl font-bold text-white shadow-soft">
        {logoUrl
          // eslint-disable-next-line @next/next/no-img-element -- the business's own uploaded logo
          ? <img src={logoUrl} alt={`הלוגו של ${businessName}`} className="size-full object-cover" />
          : <span aria-hidden>{businessName.trim().charAt(0)}</span>}
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm text-muted">
          מומלץ להעלות את <strong className="text-navy">הלוגו של העסק</strong>: זו תמונת הפרופיל שלכם, והיא מופיעה על כרטיס ההטבה אצל כל הדיירים.
        </p>
        <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="בחירת תמונה" onChange={(e) => onPick(e.target.files?.[0])} />
        <Button size="md" variant={logoUrl ? "secondary" : "primary"} onClick={() => input.current?.click()} disabled={pending} className="self-start">
          {logoUrl ? <ImageUp aria-hidden className="size-4" /> : <Camera aria-hidden className="size-4" />}
          {pending ? "מעלים…" : logoUrl ? "החלפת תמונה" : "העלאת לוגו"}
        </Button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
