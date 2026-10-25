import type { Metadata } from "next";
import { BizShell } from "./BizShell";

export const metadata: Metadata = { title: "העסק שלי | לובי", robots: { index: false, follow: false } };

/** /biz/* — business owner CRM (business_owner role only; enforced again by every /api/biz route). */
export default function BizLayout({ children }: LayoutProps<"/biz">) {
  return <BizShell>{children}</BizShell>;
}
