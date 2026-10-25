import { Tag, type Tint } from "@/components/ui";
import type { DisputeStatus as Status, ResidentDispute } from "@/lib/disputes/types";
import { formatAgorot } from "@/lib/qr/money";

const LABEL: Record<Status, [string, Tint]> = {
  OPEN: ["דיווח פתוח", "peach"],
  IN_REVIEW: ["בבדיקה", "sky"],
  CORRECTED: ["תוקן", "mint"],
  DISMISSED: ["נדחה", "white"],
};

/** Where the apartment's amount report stands: a tag, plus the outcome once it's resolved. */
export function DisputeStatus({ dispute, billAgorot }: { dispute: ResidentDispute; billAgorot: number }) {
  const [label, tint] = LABEL[dispute.status];
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-cream p-3 text-sm">
      <span className="flex items-center gap-2"><Tag tint={tint}>{label}</Tag> דיווח על הסכום</span>
      {dispute.status === "CORRECTED" && (
        <p>הסכום תוקן מ-<bdi dir="ltr">{formatAgorot(dispute.originalBillAgorot)}</bdi> ל-<bdi dir="ltr" className="font-bold">{formatAgorot(billAgorot)}</bdi>, וההנחה עודכנה בהתאם.</p>
      )}
      {dispute.status === "DISMISSED" && dispute.resolutionNote && <p>{dispute.resolutionNote}</p>}
      {dispute.status === "CORRECTED" && dispute.resolutionNote && <p className="text-muted">{dispute.resolutionNote}</p>}
    </div>
  );
}
