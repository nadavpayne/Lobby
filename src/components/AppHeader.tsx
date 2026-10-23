import { Lockup } from "./Lockup";

/** Navy top bar with the brand lockup; extends under the notch. */
export function AppHeader() {
  return (
    <header className="bg-navy px-4 pt-safe pb-3">
      <Lockup />
    </header>
  );
}
