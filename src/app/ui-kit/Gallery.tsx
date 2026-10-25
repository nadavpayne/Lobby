"use client";

import { ChevronLeft, Clock, Coins, MapPin, Receipt, Store, Users } from "lucide-react";
import { Suspense, useState, type ReactNode } from "react";
import {
  Button, Card, CategoryIcon, Chip, ChipRow, DataTable, EmptyState, Logo, Modal, Skeleton, SkeletonCard, StatTile, Tag,
  TINT_CYCLE, type Column,
} from "@/components/ui";
import { ResidentSamples } from "./ResidentSamples";

// Sample data for the gallery only.
const CATEGORIES = [
  ["food", "אוכל", "utensils"], ["home", "לבית", "sofa"], ["beauty", "ביוטי", "sparkles"],
  ["kids", "ילדים", "baby"], ["fitness", "ספורט", "dumbbell"], ["services", "שירותים", "wrench"],
] as const;

interface Customer { name: string; building: string; visits: number; spent: number; last: string }
const CUSTOMERS: Customer[] = [
  { name: "מיכל", building: "רוטשילד 45", visits: 6, spent: 842, last: "24.10" },
  { name: "יוסי", building: "ז'בוטינסקי 120", visits: 3, spent: 310, last: "19.10" },
  { name: "נועה", building: "הרצל 30", visits: 1, spent: 95, last: "02.10" },
];
const COLUMNS: Column<Customer>[] = [
  { key: "name", header: "שם", render: (c) => <span className="font-medium">{c.name}</span> },
  { key: "building", header: "בניין", render: (c) => c.building },
  { key: "visits", header: "ביקורים", align: "end", render: (c) => c.visits },
  { key: "spent", header: "סה״כ קנייה", align: "end", render: (c) => `₪${c.spent}` },
  { key: "last", header: "ביקור אחרון", render: (c) => c.last },
];

/** A titled block on the gallery page. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** All design-system components with sample content. */
export function Gallery() {
  const [category, setCategory] = useState("food");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center gap-3">
        <Logo className="size-14" label="Lobby" />
        <div>
          <h1 className="text-3xl font-bold">ספריית הרכיבים של לובי</h1>
          <p className="text-navy/70">אותם רכיבים באפליקציית הדיירים, ב-CRM לעסקים ובניהול.</p>
        </div>
      </header>

      <Section title="פיד הדיירים">
        {/* Suspense: the hours list reads today's date, which can't be prerendered. */}
        <Suspense><ResidentSamples /></Suspense>
      </Section>

      <Section title="כפתורים">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="md">השתמש בהטבה</Button>
          <Button size="md" variant="navy">שמירה</Button>
          <Button size="md" variant="secondary">ביטול</Button>
          <Button size="md" variant="ghost">
            לכל ההטבות <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <Button size="sm" variant="danger">חסימה</Button>
          <Button size="md" disabled>לא זמין</Button>
        </div>
        <div className="max-w-sm"><Button>כפתור ראשי ברוחב מלא</Button></div>
      </Section>

      <Section title="צ׳יפים של קטגוריות">
        <ChipRow label="קטגוריות">
          {CATEGORIES.map(([slug, name, icon]) => (
            <Chip key={slug} selected={category === slug} onClick={() => setCategory(slug)} icon={<CategoryIcon name={icon} />}>
              {name}
            </Chip>
          ))}
        </ChipRow>
      </Section>

      <Section title="תגיות">
        <div className="flex flex-wrap gap-2">
          <Tag icon={<Clock />}>מסתיים ב-31.12</Tag>
          <Tag tint="peach" icon={<Store />}>למימוש בסניף</Tag>
          <Tag tint="mint">שולם</Tag>
          <Tag tint="rose">ממתין לתשלום</Tag>
          <Tag tint="lilac">לקוח חוזר</Tag>
          <Tag tint="navy" icon={<MapPin />}>350 מ׳ מהבניין</Tag>
        </div>
      </Section>

      <Section title="כרטיסים בגוונים">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(["white", ...TINT_CYCLE, "navy"] as const).map((tint) => (
            <Card key={tint} tint={tint} interactive className="flex h-24 items-end font-bold">{tint}</Card>
          ))}
        </div>
      </Section>

      <Section title="כרטיסי נתונים">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="מימושים החודש" value="128" icon={<Receipt />} hint="+18% מהחודש שעבר" />
          <StatTile label="הכנסות דרך לובי" value="₪14,320" icon={<Coins />} tint="peach" />
          <StatTile label="לקוחות חדשים" value="37" icon={<Users />} tint="mint" />
          <StatTile label="עמלה לתשלום" value="₪716" tint="navy" hint="לחודש אוקטובר" />
        </div>
      </Section>

      <Section title="טבלה">
        <DataTable columns={COLUMNS} rows={CUSTOMERS} rowKey={(c) => c.name} />
      </Section>

      <div className="grid gap-10 md:grid-cols-2">
        <Section title="מצב ריק">
          <EmptyState icon={<Receipt />} title="עוד אין מימושים" action={<Button size="md">להטבות בבניין</Button>}>
            ברגע שתשתמשו בהטבה הראשונה, היא תופיע כאן יחד עם כמה חסכתם.
          </EmptyState>
        </Section>
        <Section title="טעינה">
          <SkeletonCard />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </Section>
      </div>

      <Section title="חלון (מגירה בטלפון)">
        <div><Button size="md" variant="navy" onClick={() => setOpen(true)}>פתיחת חלון</Button></div>
        <Modal open={open} onClose={() => setOpen(false)} title="תנאי ההטבה">
          <p>הטבה אחת לדירה בחודש, בהצגת הקוד בקופה. לא כולל מבצעים אחרים.</p>
          <Button onClick={() => setOpen(false)}>הבנתי</Button>
        </Modal>
      </Section>
    </div>
  );
}
