/**
 * Public base URL for links we hand out (verify links, invites): the host this request came in on.
 * Also right for the future native app, whose API calls go to the real domain (never the webview origin).
 */
export const siteUrl = (request: Request) => new URL(request.url).origin;
