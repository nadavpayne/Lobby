/** One row in the address suggestions list. */
export interface AddressSuggestion {
  placeId: string;
  /** "הרצל 10" */
  main: string;
  /** "תל אביב-יפו, ישראל" */
  secondary: string;
}

/** A picked address, normalized to Lobby's own fields (so switching providers keeps old rows valid). */
export interface ResolvedAddress {
  providerPlaceId: string;
  lat: number;
  lng: number;
  street: string;
  /** "" when the place has none (a whole street or a city): Lobby needs the exact building. */
  houseNumber: string;
  city: string;
  postalCode: string;
  formattedAddress: string;
}

/**
 * The only way Lobby talks to an address service. Add a second provider (e.g. Photon + OpenStreetMap) by
 * implementing this and returning it from getAddressProvider().
 */
export interface AddressProvider {
  /** Suggestions for what the user typed; sessionToken groups keystrokes + the final pick into one billed session. */
  autocomplete(query: string, sessionToken: string): Promise<AddressSuggestion[]>;
  /** Full address and location of a picked suggestion (ends the session). */
  resolve(placeId: string, sessionToken?: string): Promise<ResolvedAddress>;
  /** Best match for free text, for the one-time backfill of old rows; null when nothing matches. */
  findPlaceId(text: string): Promise<string | null>;
}
