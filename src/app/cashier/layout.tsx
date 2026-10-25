import type { Metadata } from "next";
import { CashierApp } from "./CashierApp";

export const metadata: Metadata = { title: "קופה | לובי", robots: { index: false, follow: false } };

/** /cashier — scan-only app for cashier logins (cashier role; every API call checks it again). */
export default function CashierLayout() {
  return <CashierApp />;
}
