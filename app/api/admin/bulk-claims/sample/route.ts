import { buildBulkClaimSampleWorkbook } from "@/lib/admin/bulk-claim-workbook";
import { requireAdminApi } from "@/lib/auth/admin-api";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const buffer = buildBulkClaimSampleWorkbook();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="bulk-claims-sample.xlsx"'
    }
  });
}
