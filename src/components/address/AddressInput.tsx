"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { inputClass } from "@/components/Field";
import type { AddressSuggestion } from "@/lib/address/types";
import { fetchSuggestions, resolveSuggestion } from "@/lib/api/address";
import { isApiError } from "@/lib/api/http";
import type { Point } from "@/lib/geo/distance";
import { MapView } from "./MapView";

/** An address picked from the list (never free text). pin: where the owner dragged the map pin, if they did. */
export interface PickedAddress {
  placeId: string;
  address: string;
  city: string;
  point: Point;
  pin: Point | null;
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;
const MUST_PICK = "נא לבחור את הכתובת מהרשימה";

/** True when the address lookup is configured; otherwise forms keep their plain address/city fields. */
export const addressLookupOn = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY;

/**
 * The one address field: type 3+ letters, pick a suggestion (Israel, Hebrew), get a map preview.
 * Free text can't be submitted: the hidden placeId/address/city inputs stay empty until a pick with a house number.
 * movablePin: the business owner may drag the pin to the exact storefront.
 */
export function AddressInput({ label = "כתובת", hint, error, initialText = "", movablePin = false, onChange }: {
  label?: string;
  hint?: string;
  error?: string;
  initialText?: string;
  movablePin?: boolean;
  onChange?: (picked: PickedAddress | null) => void;
}) {
  const id = useId();
  const [text, setText] = useState(initialText);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [picked, setPicked] = useState<PickedAddress | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const session = useRef("");
  /** The current billing session for this address (created in the browser on first use). */
  const sessionId = () => (session.current ||= crypto.randomUUID());
  const [typed, setTyped] = useState(false);
  const [left, setLeft] = useState(false);

  // Debounced suggestions while the user types (not after a pick fills the box).
  useEffect(() => {
    if (!typed || picked || text.trim().length < MIN_CHARS) return;
    const timer = setTimeout(async () => {
      const res = await fetchSuggestions(text.trim(), sessionId());
      if (isApiError(res)) return setProblem(res.error);
      setProblem(null);
      setSuggestions(res.suggestions);
      setActive(-1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, picked, typed]);

  /** Sets the picked address and tells the parent. */
  function update(next: PickedAddress | null) {
    setPicked(next);
    onChange?.(next);
  }

  /** Typing again drops the previous pick: only a fresh pick counts. */
  function onType(value: string) {
    setTyped(true);
    setLeft(false);
    if (value.trim().length < MIN_CHARS) setSuggestions([]);
    setText(value);
    if (picked) update(null);
  }

  /** Resolves a suggestion on our server and keeps it only if it's an exact building address. */
  async function choose(s: AddressSuggestion) {
    setTyped(false); // filling in the pick is not typing: no new search
    setSuggestions([]);
    setText([s.main, s.secondary].filter(Boolean).join(", "));
    setBusy(true);
    const res = await resolveSuggestion(s.placeId, sessionId());
    session.current = ""; // the pick ends Google's billing session
    setBusy(false);
    if (isApiError(res)) return setProblem(res.error);
    setProblem(res.problem);
    if (res.problem) return update(null);
    const a = res.address;
    setText(a.formattedAddress.replace(/, ישראל$/, ""));
    update({ placeId: a.providerPlaceId, address: `${a.street} ${a.houseNumber}`, city: a.city, point: { lat: a.lat, lng: a.lng }, pin: null });
  }

  /** Arrow keys move through the list, Enter picks, Escape closes. */
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  }

  const unpicked = typed && left && !picked && !busy && text.trim() !== "";
  const message = problem ?? error ?? (unpicked ? MUST_PICK : null);
  const open = suggestions.length > 0;

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">{label}</label>
      <input
        id={id}
        value={text}
        onChange={(e) => onType(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => { setSuggestions([]); setLeft(true); }, 150)}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        aria-invalid={!!message}
        autoComplete="off"
        placeholder="רחוב, מספר בית ועיר"
        maxLength={100}
        className={inputClass}
      />
      <input type="hidden" name="placeId" value={picked?.placeId ?? ""} />
      <input type="hidden" name="address" value={picked?.address ?? ""} />
      <input type="hidden" name="city" value={picked?.city ?? ""} />

      {open && (
        <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl bg-white shadow-lift">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(s)}
              className={`flex min-h-12 cursor-pointer flex-col justify-center px-3 py-1 ${i === active ? "bg-navy/10" : "hover:bg-navy/5"}`}
            >
              <span className="font-medium">{s.main}</span>
              {s.secondary && <span className="text-sm text-navy/70">{s.secondary}</span>}
            </li>
          ))}
          <li role="presentation" dir="ltr" className="px-3 py-1 text-end text-xs text-muted">powered by Google</li>
        </ul>
      )}

      {busy && <span className="text-sm text-navy/70">בודקים את הכתובת…</span>}
      {message ? <span role="alert" className="text-sm text-red-700">{message}</span> : hint && <span className="text-sm text-navy/70">{hint}</span>}

      {picked && (
        <div className="mt-2 flex flex-col gap-1">
          <MapView
            center={picked.point}
            label={picked.address}
            onPinMove={movablePin ? (pin) => update({ ...picked, pin }) : undefined}
          />
          {movablePin && <span className="text-sm text-navy/70">אפשר לגרור את הסיכה למיקום המדויק של הכניסה לעסק.</span>}
        </div>
      )}
    </div>
  );
}
