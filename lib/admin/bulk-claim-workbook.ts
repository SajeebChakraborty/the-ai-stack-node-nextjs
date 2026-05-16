import "server-only";

import * as XLSX from "xlsx";
import { BULK_CLAIM_HEADERS, BULK_CLAIM_SAMPLE_ROWS } from "@/lib/admin/bulk-claim";

export function buildBulkClaimSampleWorkbook(): Buffer {
  const instructions = [
    {
      note: "Use the claims sheet. Leave user_id and founder_id empty to create unassigned approved listings."
    },
    {
      note: "founder_id takes priority over user_id when both are set. Separate lists with commas or pipe (|)."
    },
    {
      note: "pricing_model: free, freemium, paid, usage-based, enterprise. All imported claims are auto-approved."
    }
  ];

  const workbook = XLSX.utils.book_new();
  const claimsSheet = XLSX.utils.json_to_sheet(BULK_CLAIM_SAMPLE_ROWS, { header: [...BULK_CLAIM_HEADERS] });
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);

  XLSX.utils.book_append_sheet(workbook, claimsSheet, "claims");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "instructions");

  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

export function parseBulkClaimWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames.includes("claims") ? "claims" : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}
