// Lobby's WhatsApp number for house committees, international format without "+" (e.g. "972501234567").
// The "talk to us" button on the home page is hidden while this is empty.
export const CONTACT_WHATSAPP = "";

/** WhatsApp chat link with a prefilled message, or null if no number is set. */
export const whatsappLink = (text: string) =>
  CONTACT_WHATSAPP ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}` : null;
