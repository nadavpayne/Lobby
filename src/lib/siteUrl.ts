/** Public base URL for links we hand out (verify links, invites). Must be the real domain, never a webview origin. */
export const siteUrl = (request: Request) => process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
