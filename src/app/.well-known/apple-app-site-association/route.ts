// Universal links: which site paths open the iOS app when it's installed (building invites shared in WhatsApp,
// notification links, the app's own areas). Needs APPLE_TEAM_ID (Apple Developer account) and APPLE_BUNDLE_ID.

/** GET /.well-known/apple-app-site-association — JSON, no extension, as Apple requires. */
export function GET() {
  const team = process.env.APPLE_TEAM_ID;
  if (!team) return new Response("APPLE_TEAM_ID is not set", { status: 404 });
  const appID = `${team}.${process.env.APPLE_BUNDLE_ID ?? "il.lobby.app"}`;
  return Response.json({
    applinks: {
      details: [{
        appIDs: [appID],
        components: ["/i/*", "/app", "/app/*", "/biz", "/biz/*", "/cashier", "/cashier/*", "/start", "/account/*"].map((p) => ({ "/": p })),
      }],
    },
  });
}
