"use client";

import { toast } from "react-toastify";
import { formatFirestoreDateTime } from "@/services/firestoreReads";

/**
 * Universal helper to export data to CSV format and trigger user download.
 * @param {Array<string>} headers - Headers row columns
 * @param {Array<string>} rows - Rows as comma separated values
 * @param {string} filename - Output download filename
 */
export function exportCSV(headers, rows, filename = "export.csv") {
  try {
    const csvContent = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported successfully!`);
  } catch (error) {
    toast.error("Failed to export CSV.");
    console.error(error);
  }
}

/**
 * Makes text safe for the PDF content stream.
 *
 * Two problems, both of which bite in a bilingual product. The stream declares
 * its own byte count via /Length, computed from a JS string — but a Blob
 * encodes UTF-8, so a single "é" makes the real byte count larger than the
 * declared one and the file is malformed. And the font is Courier with a
 * single-byte encoding, so multi-byte characters render as mojibake anyway:
 * "Émile Côté" comes out "Ãmile CÃ´tÃ©".
 *
 * Accents are therefore folded to their base letter and typographic
 * punctuation is replaced with ASCII, leaving a string whose character count
 * equals its byte count.
 *
 * Escaping is deliberately NOT done here — see escapePdf. Doing both at once
 * meant "(refund)" measured as 10 characters while occupying 8 columns, so a
 * cell containing a bracket pushed its whole row out of alignment.
 *
 * @param {*} value - Any value destined for the PDF.
 * @return {string} ASCII-only text, unescaped.
 */
function toAscii(value) {
  return String(value ?? "")
      // é → e, ô → o. Decompose, then drop the combining marks.
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[–—]/g, "-")
      .replace(/•/g, "*")
      .replace(/…/g, "...")
      // Collapse any whitespace: a tab or newline inside a cell would break
      // the single-line layout entirely.
      .replace(/\s+/g, " ")
      .trim()
      // Anything still outside ASCII would break the byte count.
      .replace(/[^\x20-\x7e]/g, "?");
}

/**
 * Escapes a string for a PDF literal, at the moment it is written.
 * @param {string} text - ASCII text from toAscii.
 * @return {string} Escaped text.
 */
function escapePdf(text) {
  return text
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
}

/* A4 in points. Courier advances 0.6em per glyph, which is what makes a
   monospaced column layout possible without measuring glyphs. */
const A4_SHORT = 595;
const A4_LONG = 842;
const MARGIN = 40;
const TITLE_SIZE = 14;
const BODY_SIZE = 8;
const CHAR_W = BODY_SIZE * 0.6;
const LINE_H = 12;
const COL_GAP = 3;

/** Characters that fit between the margins at a given page width. */
const capacity = (pageWidth) =>
  Math.floor((pageWidth - MARGIN * 2) / CHAR_W);

const PORTRAIT_CHARS = capacity(A4_SHORT);
const LANDSCAPE_CHARS = capacity(A4_LONG);

/**
 * Whether a column holds numbers, and should be right-aligned.
 *
 * Money left-aligned in a monospaced font is unreadable: the decimal points
 * never line up, so the figures cannot be compared down the column.
 *
 * @param {Array<Array<string>>} rows - ASCII cell values.
 * @param {number} col - Column index.
 * @return {boolean} True when every populated cell looks numeric.
 */
function isNumericColumn(rows, col) {
  const values = rows.map((r) => r[col] || "").filter(Boolean);
  if (values.length === 0) return false;
  return values.every((v) => /^[-+]?\$?\(?[\d,]+(\.\d+)?\)?%?$/.test(v));
}

/**
 * Column widths that fit the page.
 *
 * Each column starts at its natural width — the longest value in it — and the
 * widest is then shaved one character at a time until the row fits between the
 * margins. Previously a single long cell set the width for every row in that
 * column with no upper bound, which produced both the blocks of empty space
 * and the content running off the right-hand edge.
 *
 * @param {Array<string>} headers - ASCII headers.
 * @param {Array<Array<string>>} rows - ASCII cells.
 * @return {Array<number>} Width in characters per column.
 */
function fitColumns(headers, rows, maxChars) {
  const widths = headers.map((h, col) =>
    rows.reduce((max, row) => Math.max(max, (row[col] || "").length), h.length),
  );

  const total = () =>
    widths.reduce((sum, w) => sum + w, 0) + COL_GAP * (widths.length - 1);

  const MIN = 4;
  while (total() > maxChars) {
    const widest = widths.indexOf(Math.max(...widths));
    // Nothing left to give — the table simply has too many columns.
    if (widths[widest] <= MIN) break;
    widths[widest] -= 1;
  }
  return widths;
}

/**
 * Chooses the page orientation from how wide the table actually is.
 *
 * The old export was landscape unconditionally. Most of these reports are
 * three or four narrow columns, so the table occupied about a sixth of the
 * sheet and the rest was blank — which is what "excessive empty space, looks
 * unformatted" describes. Landscape is now used only when the table needs it.
 *
 * @param {Array<string>} headers - ASCII headers.
 * @param {Array<Array<string>>} rows - ASCII cells.
 * @return {{width: number, height: number, maxChars: number}} Page geometry.
 */
function choosePage(headers, rows) {
  const natural = fitColumns(headers, rows, Number.MAX_SAFE_INTEGER);
  const needed =
    natural.reduce((sum, w) => sum + w, 0) + COL_GAP * (natural.length - 1);

  return needed <= PORTRAIT_CHARS ?
    { width: A4_SHORT, height: A4_LONG, maxChars: PORTRAIT_CHARS } :
    { width: A4_LONG, height: A4_SHORT, maxChars: LANDSCAPE_CHARS };
}

/**
 * Fits a value to its column, truncating rather than overflowing.
 *
 * @param {string} value - ASCII cell value.
 * @param {number} width - Column width in characters.
 * @param {boolean} right - Right-align instead of left.
 * @return {string} Exactly `width` characters.
 */
function cell(value, width, right) {
  let text = value || "";
  if (text.length > width) {
    text = width > 2 ? `${text.slice(0, width - 2)}..` : text.slice(0, width);
  }
  return right ? text.padStart(width, " ") : text.padEnd(width, " ");
}

/**
 * Assembles the PDF file from its objects, computing the xref offsets.
 *
 * @param {Array<string>} bodies - Object bodies, in order from object 1.
 * @return {string} The complete PDF.
 */
function assemblePdf(bodies) {
  const header = "%PDF-1.4\n";
  const offsets = [];
  let pdf = header;

  bodies.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const startXref = pdf.length;
  const pad = (n) => String(n).padStart(10, "0");

  let xref = `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    xref += `${pad(offset)} 00000 n \n`;
  });

  return (
    pdf +
    xref +
    `trailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${startXref}\n%%EOF`
  );
}

/**
 * Exports a table to PDF and triggers a download.
 *
 * Written by hand rather than with a PDF library because the project carries
 * no such dependency. The layout is monospaced Courier, which means alignment
 * is entirely a matter of counting characters — so every value is measured
 * unescaped, capped to a width that fits the page, and padded to exactly that
 * width.
 *
 * Long tables paginate. Previously everything was drawn from a single fixed
 * origin on one page, so any report past roughly forty rows simply drew the
 * remainder off the bottom of the sheet, where it could not be seen.
 *
 * @param {string} title - PDF document header title.
 * @param {Array<string>} headers - Table column headers.
 * @param {Array<Array<any>>} rows - Table rows data.
 * @param {string} filename - Download filename.
 */
export function exportPDF(title, headers, rows, filename = "report.pdf") {
  try {
    const safeTitle = toAscii(title);
    const safeHeaders = headers.map(toAscii);
    const safeRows = (rows || []).map((row) =>
      safeHeaders.map((_, col) => toAscii(row?.[col])),
    );

    const page = choosePage(safeHeaders, safeRows);
    const widths = fitColumns(safeHeaders, safeRows, page.maxChars);
    const alignRight = safeHeaders.map((_, col) =>
      isNumericColumn(safeRows, col),
    );

    const gap = " ".repeat(COL_GAP);
    const line = (values, useAlignment) =>
      values
          .map((v, col) =>
            cell(v, widths[col], useAlignment && alignRight[col]),
          )
          .join(gap)
          .trimEnd();

    const headerLine = line(safeHeaders, false);
    const divider = "=".repeat(Math.min(headerLine.length, page.maxChars));
    const bodyLines = safeRows.map((row) => line(row, true));

    // Title, meta, column header and divider all consume vertical space before
    // the first row, so the row budget is what is left above the bottom margin.
    const firstRowY = page.height - MARGIN - 18 - 16 - LINE_H - LINE_H;
    const rowsPerPage = Math.max(
        1,
        Math.floor((firstRowY - MARGIN) / LINE_H) + 1,
    );

    const chunks = [];
    for (let i = 0; i < Math.max(bodyLines.length, 1); i += rowsPerPage) {
      chunks.push(bodyLines.slice(i, i + rowsPerPage));
    }

    const generated = formatFirestoreDateTime(new Date());

    const streams = chunks.map((chunk, pageIndex) => {
      let s = "BT\n";
      s += `/F1 ${TITLE_SIZE} Tf\n`;
      s += `${MARGIN} ${page.height - MARGIN} Td\n`;
      s += `(${escapePdf(safeTitle)}) Tj\n`;
      s += `/F1 ${BODY_SIZE} Tf\n`;
      s += "0 -18 Td\n";
      s += `(${escapePdf(
          `Generated ${generated}   Page ${pageIndex + 1} of ${chunks.length}` +
        `   ${safeRows.length} row${safeRows.length === 1 ? "" : "s"}`,
      )}) Tj\n`;
      s += "0 -16 Td\n";
      s += `(${escapePdf(headerLine)}) Tj\n`;
      s += `0 -${LINE_H} Td\n`;
      s += `(${escapePdf(divider)}) Tj\n`;

      if (chunk.length === 0) {
        s += `0 -${LINE_H} Td\n(No data for the selected range.) Tj\n`;
      }
      chunk.forEach((row) => {
        s += `0 -${LINE_H} Td\n(${escapePdf(row)}) Tj\n`;
      });

      s += "ET";
      return s;
    });

    // 1 catalog, 2 pages, 3 font, then one page and one stream per chunk.
    const pageCount = streams.length;
    const firstPageObj = 4;
    const firstStreamObj = firstPageObj + pageCount;

    const kids = streams
        .map((_, i) => `${firstPageObj + i} 0 R`)
        .join(" ");

    const bodies = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
      ...streams.map(
          (_, i) =>
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] ` +
          `/Contents ${firstStreamObj + i} 0 R ` +
          "/Resources << /Font << /F1 3 0 R >> >> >>",
      ),
      ...streams.map(
          (stream) => `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      ),
    ];

    const blob = new Blob([assemblePdf(bodies)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported successfully!`);
  } catch (error) {
    toast.error("Failed to export PDF.");
    console.error(error);
  }
}
