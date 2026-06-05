/**
 * Creates a sample s6 class list.xlsx for local testing when the real file is missing.
 */
import * as XLSX from "xlsx";
import { resolve } from "path";
import { writeFileSync } from "fs";

const rows = [
  { Name: "Alice Mukamana", Class: "S6A" },
  { Name: "Brian Niyonzima", Class: "S6A" },
  { Name: "Claire Uwase", Class: "S6B" },
  { Name: "David Habimana", Class: "S6B" },
  { Name: "Esther Ingabire", Class: "S6B" },
  { Name: "Frank Irabaruta", Class: "S6A" },
];

const sheet = XLSX.utils.json_to_sheet(rows);
const book = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(book, sheet, "S6");
const out = resolve(process.cwd(), "s6 class list.xlsx");
XLSX.writeFile(book, out);
console.log(`Wrote ${out}`);
