export type Cell = string | number | null;

/** One CSV cell: quoted when needed; text that a spreadsheet would run as a formula is defused with a leading '. */
function cell(value: Cell): string {
  if (value === null) return "";
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** A CSV file Excel opens correctly in Hebrew: UTF-8 BOM, CRLF line ends. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  return "﻿" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
