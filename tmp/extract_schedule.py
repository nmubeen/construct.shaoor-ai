import json
import re
from pathlib import Path
import pdfplumber

source = Path(r"C:\Users\nmube\Downloads\12-JR MEC SCHDULES_2026-27_Final 1.pdf")
target = Path(r"C:\Projects\2yards-studios\tmp\schedule_tables.json")
image_dir = Path(r"C:\Projects\2yards-studios\tmp\rendered_schedule")
image_dir.mkdir(parents=True, exist_ok=True)

pages = []

date_pattern = re.compile(r"\d{2}-[A-Za-z]{3}-\d{4}")

def split_combined_row(row):
    row = [(cell or "").strip() for cell in row]
    dates = date_pattern.findall(row[2])
    if len(dates) <= 1:
        return [row]
    count = len(dates)
    result = [["" for _ in row] for _ in range(count)]
    for i in range(count):
        result[i][2] = dates[i]
    for column, text in enumerate(row):
        if column == 2:
            continue
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if column == 0 and len(lines) == count:
            for i, value in enumerate(lines): result[i][column] = value
        elif column == 1 and len(lines) == count:
            for i, value in enumerate(lines): result[i][column] = value
        else:
            # PDF table detection collapses some blank/Sunday rows with the next row.
            # Retain all extracted text in the dated row where it appears visually.
            result[-1][column] = text
    return result
with pdfplumber.open(source) as pdf:
    for page_number, page in enumerate(pdf.pages, start=1):
        tables = page.extract_tables()
        table = max(tables, key=len) if tables else []
        if table:
            expanded = table[:2]
            for row in table[2:]:
                expanded.extend(split_combined_row(row))
            table = expanded
        pages.append(table)
        page.to_image(resolution=150).save(image_dir / f"page_{page_number}.png", format="PNG")

target.write_text(json.dumps(pages, ensure_ascii=False), encoding="utf-8")
print(f"Extracted and rendered {len(pages)} pages to {target}")
