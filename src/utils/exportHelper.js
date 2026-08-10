"use client";

import { toast } from "react-toastify";

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
 * declared one and the file is malformed. And the font here is Courier with a
 * single-byte encoding, so multi-byte characters render as mojibake anyway:
 * "Émile Côté" comes out "Ãmile CÃ´tÃ©".
 *
 * Accents are therefore folded to their base letter and the common typographic
 * punctuation is replaced with ASCII, leaving a string whose character count
 * equals its byte count.
 *
 * @param {*} value - Any value destined for the PDF.
 * @return {string} ASCII-only text.
 */
function toPdfText(value) {
  return String(value ?? "")
      // é → e, ô → o. Decompose, then drop the combining marks.
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, "\"")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2022/g, "*")
      .replace(/\u2026/g, "...")
      .replace(/\u00a0/g, " ")
      // Parentheses and backslashes delimit strings in a PDF, so escape them.
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      // Anything still outside ASCII would break the length count.
      .replace(/[^\x20-\x7e]/g, "?");
}

/**
 * Universal helper to export data to PDF format and trigger a direct file download.
 * @param {string} title - PDF document header title
 * @param {Array<string>} headers - Table column headers
 * @param {Array<Array<any>>} rows - Table rows data
 * @param {string} filename - Download filename
 */
export function exportPDF(title, headers, rows, filename = "report.pdf") {
  try {
    // Calculate max length of each column to align in Courier monospaced font
    const safeHeaders = headers.map(toPdfText);
    const safeRows = rows.map((row) => row.map(toPdfText));

    const colWidths = safeHeaders.map((header, colIdx) => {
      let maxLen = header.length;
      for (let rowIdx = 0; rowIdx < safeRows.length; rowIdx++) {
        const val = safeRows[rowIdx][colIdx] || "";
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      }
      return maxLen + 3; // add 3 spaces padding
    });

    const formatRow = (arr) => {
      return arr
        .map((val, colIdx) => (val || "").padEnd(colWidths[colIdx], " "))
        .join("");
    };

    const headerLine = formatRow(safeHeaders);
    const dividerLine = "=".repeat(headerLine.length);
    const dataLines = safeRows.map((row) => formatRow(row));

    const allLines = [headerLine, dividerLine, ...dataLines];

    // Build Courier text stream (Landscape layout: 842 width x 595 height)
    let streamText = "BT\n/F1 12 Tf\n40 540 Td\n";
    streamText += `(${toPdfText(title)}) Tj\n`;
    streamText += "0 -30 Td\n";
    streamText += "/F1 8 Tf\n";

    for (let i = 0; i < allLines.length; i++) {
      streamText += `(${allLines[i]}) Tj\n0 -13 Td\n`;
    }
    streamText += "ET";

    const header = "%PDF-1.4\n";
    const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    const obj3 =
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >> >>\nendobj\n";

    const streamHeader =
      "4 0 obj\n<< /Length " + streamText.length + " >>\nstream\n";
    const streamFooter = "\nendstream\nendobj\n";
    const obj4 = streamHeader + streamText + streamFooter;

    const offset1 = header.length;
    const offset2 = offset1 + obj1.length;
    const offset3 = offset2 + obj2.length;
    const offset4 = offset3 + obj3.length;
    const offsetStartXref = offset4 + obj4.length;

    const padOffset = (num) => String(num).padStart(10, "0");

    const xref =
      "xref\n0 5\n" +
      "0000000000 65535 f \n" +
      padOffset(offset1) +
      " 00000 n \n" +
      padOffset(offset2) +
      " 00000 n \n" +
      padOffset(offset3) +
      " 00000 n \n" +
      padOffset(offset4) +
      " 00000 n \n";

    const trailer =
      "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n" +
      offsetStartXref +
      "\n%%EOF";

    const pdfData = header + obj1 + obj2 + obj3 + obj4 + xref + trailer;

    const blob = new Blob([pdfData], { type: "application/pdf" });
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
