import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/ui";

/** /biz — dashboard. Placeholder until the business CRM (part 4). */
export default function BizHome() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">לוח בקרה</h1>
      <EmptyState icon={<LayoutDashboard />} title="הדשבורד בדרך">
        כאן יופיעו המימושים, ההכנסות דרך לובי והלקוחות החוזרים שלכם.
      </EmptyState>
    </div>
  );
}
