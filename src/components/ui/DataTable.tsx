import type { ReactNode } from "react";

export interface Column<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  /** "end" for numbers and money. */
  align?: "start" | "end";
}

interface Props<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Shown instead of the table when there are no rows. */
  empty?: ReactNode;
  onRowClick?: (row: Row) => void;
}

/** Friendly CRM table: rounded white card, zebra-free soft dividers, scrolls sideways on small screens. */
export function DataTable<Row>({ columns, rows, rowKey, empty, onRowClick }: Props<Row>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
      <table className="w-full text-start">
        <thead>
          <tr className="border-b border-navy/10 text-sm text-navy/60">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`whitespace-nowrap px-4 py-3 font-medium ${c.align === "end" ? "text-end" : "text-start"}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick && (() => onRowClick(row))}
              className={`border-b border-navy/5 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-cream/60" : ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`whitespace-nowrap px-4 py-3 ${c.align === "end" ? "text-end tabular-nums" : ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
