"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/Field";
import { CATEGORIES, SUBCATEGORIES, TAGS } from "@/lib/businesses/categories";
import type { JoinErrors } from "@/lib/businesses/validateJoin";

const MAX_SUBCATEGORIES = 2;

/** Selectable chip that wraps a visually hidden checkbox (keyboard and screen readers still use the checkbox). */
function ChipCheckbox({ name, value, label, checked, disabled = false, invalid = false, onChange }: {
  name: string; value: string; label: string; checked: boolean; disabled?: boolean; invalid?: boolean; onChange: () => void;
}) {
  const look = checked ? "border-navy bg-navy text-cream" : "border-navy/25 bg-white";
  return (
    <label className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber ${look} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
      <input type="checkbox" name={name} value={value} checked={checked} disabled={disabled} aria-invalid={invalid} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}

/**
 * Two-level category picker for the business form: one primary category, then 1–2 of its subcategories,
 * then any tags. Submits IDs (not labels) as form fields "category", "subcategories" and "tags".
 */
export function CategoryPicker({ errors }: { errors: JoinErrors }) {
  const [category, setCategory] = useState("");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const options = SUBCATEGORIES[category] ?? [];

  /** Adds or removes a subcategory, never more than two. */
  const toggleSub = (id: string) =>
    setSubcategories((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX_SUBCATEGORIES ? [...s, id] : s));
  const toggleTag = (id: string) => setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  return (
    <>
      <Field label="קטגוריה ראשית" error={errors.category}>
        <select
          name="category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubcategories([]); // subcategories belong to the old primary
          }}
          aria-invalid={!!errors.category}
          className={inputClass}
        >
          <option value="" disabled>בחרו קטגוריה</option>
          {Object.entries(CATEGORIES).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </Field>

      {options.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 font-medium">
            תת-קטגוריה <span className="text-navy/70">(אחת או שתיים)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => {
              const checked = subcategories.includes(o.id);
              return (
                <ChipCheckbox
                  key={o.id}
                  name="subcategories"
                  value={o.id}
                  label={o.label}
                  checked={checked}
                  disabled={!checked && subcategories.length >= MAX_SUBCATEGORIES}
                  invalid={!!errors.subcategories}
                  onChange={() => toggleSub(o.id)}
                />
              );
            })}
          </div>
          {errors.subcategories && <span role="alert" className="text-sm text-red-700">{errors.subcategories}</span>}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 font-medium">
          תגיות <span className="text-navy/70">(לא חובה)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <ChipCheckbox key={t.id} name="tags" value={t.id} label={t.label} checked={tags.includes(t.id)} onChange={() => toggleTag(t.id)} />
          ))}
        </div>
        {errors.tags && <span role="alert" className="text-sm text-red-700">{errors.tags}</span>}
      </fieldset>
    </>
  );
}
