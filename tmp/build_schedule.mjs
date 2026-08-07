import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workDir = "C:/Projects/2yards-studios";
const data = JSON.parse(await fs.readFile(`${workDir}/tmp/schedule_tables.json`, "utf8"));
const outputDir = `${workDir}/outputs/schedule_pdf_to_excel`;
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const purple = "#7030A0";
const paleGreen = "#E2F0D9";
const gold = "#FFC000";
const sundayBlue = "#DDEBF7";
const peach = "#FCE4D6";
const examBlue = "#DDEBF7";
const cream = "#FFF2CC";
const border = "#000000";
const widths = [42, 48, 92, 184, 198, 164, 158, 244, 196];

for (let pageIndex = 0; pageIndex < data.length; pageIndex++) {
  const sheet = wb.worksheets.add(`Page ${pageIndex + 1}`);
  sheet.showGridLines = false;
  const source = data[pageIndex];
  if (!source.length) continue;
  const rows = source.slice(2).map((row) => Array.from({ length: 9 }, (_, i) => row?.[i] ?? ""));
  const lastRow = Math.max(4, rows.length + 3);

  sheet.getRange("A1:I1").merge();
  sheet.getRange("A1").values = [["EXCELLENCIA JUNIOR COLLEGE"]];
  sheet.getRange("A1").format = { fill: "#FFFFFF", font: { bold: true, color: purple }, horizontalAlignment: "center", verticalAlignment: "center" };
  sheet.getRange("A1:I1").format.rowHeightPx = 34;
  sheet.getRange("A2:I2").merge();
  sheet.getRange("A2").values = [[String(source[0]?.[0] ?? "JR MEC - TEACHING SCHEDULE (2025-26)")]];
  sheet.getRange("A2").format = { fill: paleGreen, font: { bold: true, color: purple }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: border } };
  sheet.getRange("A2:I2").format.rowHeightPx = 22;
  sheet.getRange("A3:I3").values = [["S.NO", "DAY", "DATE", "MATHS", "ECONOMICS", "COMMERCE", "", "Activites", "EXAM SYLLABUS"]];
  sheet.getRange("F3:G3").merge();
  sheet.getRange("F3").values = [["COMMERCE"]];
  sheet.getRange("A3:I3").format = { fill: gold, font: { bold: true }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: border } };
  sheet.getRange("A3:I3").format.rowHeightPx = 28;

  if (rows.length) {
    sheet.getRange(`A4:I${lastRow}`).values = rows;
    sheet.getRange(`A4:I${lastRow}`).format = { font: { color: "#000000" }, verticalAlignment: "top", wrapText: true, borders: { preset: "all", style: "thin", color: border } };
    sheet.getRange(`A4:C${lastRow}`).format.horizontalAlignment = "center";
    sheet.getRange(`D4:I${lastRow}`).format.horizontalAlignment = "left";
    for (let index = 0; index < rows.length; index++) {
      const rowNumber = index + 4;
      const day = String(rows[index][1] || "").toUpperCase();
      const exam = String(rows[index][8] || "");
      if (day === "SUN") {
        sheet.getRange(`A${rowNumber}:I${rowNumber}`).format.fill = sundayBlue;
        sheet.getRange(`A${rowNumber}:C${rowNumber}`).format.font = { bold: true, color: "#FF0000" };
      }
      if (/EXAM/i.test(exam)) {
        sheet.getRange(`I${rowNumber}`).format.fill = gold;
        sheet.getRange(`I${rowNumber}`).format.font = { bold: true };
        sheet.getRange(`I${rowNumber}`).format.horizontalAlignment = "center";
      } else if (/Maths/i.test(exam)) sheet.getRange(`I${rowNumber}`).format.fill = peach;
      else if (/Economics/i.test(exam)) sheet.getRange(`I${rowNumber}`).format.fill = examBlue;
      else if (/Commerce/i.test(exam)) sheet.getRange(`I${rowNumber}`).format.fill = cream;
      sheet.getRange(`A${rowNumber}:I${rowNumber}`).format.rowHeightPx = 42;
    }
  }
  widths.forEach((width, column) => sheet.getRangeByIndexes(0, column, lastRow, 1).format.columnWidthPx = width);
  sheet.freezePanes.freezeRows(3);
}

const check = await wb.inspect({ kind: "table", range: "'Page 1'!A1:I12", include: "values,formulas", tableMaxRows: 12, tableMaxCols: 9 });
console.log(check.ndjson);
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 50 }, summary: "formula error scan" });
console.log(errors.ndjson);
const preview = await wb.render({ sheetName: "Page 1", range: "A1:I14", scale: 1.2, format: "png" });
await fs.writeFile(`${outputDir}/editable_preview_page1.png`, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(`${outputDir}/JR_MEC_Schedules_2026-27_Editable.xlsx`);
console.log(`${outputDir}/JR_MEC_Schedules_2026-27_Editable.xlsx`);
