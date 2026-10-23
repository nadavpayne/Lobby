// Creates (or refreshes) the demo building, resident, business and code, then prints the demo link.
// Run after the migrations: npm run seed:demo
import { createClient } from "@supabase/supabase-js";
import { DEMO_CODE, DEMO_PIN } from "../src/lib/demo/constants.ts";
import { seedDemo } from "../src/lib/demo/demo.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first");

const { accessSlug } = await seedDemo(createClient(url, key, { auth: { persistSession: false } }));
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

console.log(`
Demo ready.
  Terminal link: ${site}/b/${accessSlug}
  PIN:           ${DEMO_PIN}
  Demo code:     ${DEMO_CODE}
`);
