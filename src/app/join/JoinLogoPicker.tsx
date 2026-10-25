"use client";

import { Camera, ImageUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { shrinkImage } from "@/lib/images/shrinkImage";

interface Props {
  /** The shrunk photo, or null until one is picked. */
  logo: Blob | null;
  onChange: (logo: Blob | null) => void;
  error?: string;
}

/**
 * Sign-up's first step: the business's one photo (required). We recommend the logo, because it is the business's
 * profile picture on every benefit card residents see. The photo is shrunk in the browser and sent with the form.
 */
export function JoinLogoPicker({ logo, onChange, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  // Show the picked photo; free the preview URL when it changes.
  const preview = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  /** Shrinks the picked photo; refuses files the browser can't read as an image. */
  async function onPick(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setReadError(null);
    try {
      onChange(await shrinkImage(file));
    } catch {
      setReadError("לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת.");
    } finally {
      setReading(false);
      if (input.current) input.current.value = "";
    }
  }

  const shownError = readError ?? error;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-xl font-bold">הלוגו של העסק</legend>
      <div className="flex items-center gap-4">
        <span className={`grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 bg-white shadow-soft ${shownError ? "border-red-600" : "border-white"}`}>
          {preview
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the picked photo
            ? <img src={preview} alt="הלוגו שנבחר" className="size-full object-cover" />
            : <Camera aria-hidden className="size-8 text-navy/40" />}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm text-muted">
            מומלץ להעלות את <strong className="text-navy">הלוגו של העסק</strong>: זו תמונת הפרופיל שלכם, והיא מופיעה על כרטיס ההטבה אצל כל הדיירים.
          </p>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="בחירת הלוגו של העסק"
            aria-invalid={!!shownError}
            data-logo-input
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={reading}
            className={`inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-4 font-bold transition active:scale-[0.97] disabled:opacity-50 ${logo ? "border-2 border-navy text-navy" : "bg-amber text-navy"}`}
          >
            {logo ? <ImageUp aria-hidden className="size-4" /> : <Camera aria-hidden className="size-4" />}
            {reading ? "מכינים תמונה…" : logo ? "החלפת תמונה" : "העלאת לוגו"}
          </button>
          {shownError && <span role="alert" className="text-sm text-red-700">{shownError}</span>}
        </div>
      </div>
    </fieldset>
  );
}
