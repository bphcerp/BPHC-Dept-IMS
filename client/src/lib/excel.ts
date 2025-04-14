import ExcelJS from "exceljs";

export function generateExcel(
  headers: string[],
  data: Record<string, string>[]
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");
  worksheet.addRow(headers);
  for (const row of data) {
    const rowData = headers.map((h) => row[h]);
    worksheet.addRow(rowData);
  }

  return workbook;
}
