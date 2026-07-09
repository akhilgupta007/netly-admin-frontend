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
 * Universal helper to export data to PDF format and trigger a direct file download.
 * @param {string} title - PDF document header title
 * @param {Array<string>} headers - Table column headers
 * @param {Array<Array<any>>} rows - Table rows data
 * @param {string} filename - Download filename
 */
export function exportPDF(title, headers, rows, filename = "report.pdf") {
  try {
    // Calculate max length of each column to align in Courier monospaced font
    const colWidths = headers.map((header, colIdx) => {
      let maxLen = header.length;
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const val = String(rows[rowIdx][colIdx] || "");
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      }
      return maxLen + 3; // add 3 spaces padding
    });

    const formatRow = (arr) => {
      return arr.map((val, colIdx) => {
        const str = String(val || "");
        return str.padEnd(colWidths[colIdx], " ");
      }).join("");
    };

    const headerLine = formatRow(headers);
    const dividerLine = "=".repeat(headerLine.length);
    const dataLines = rows.map(row => formatRow(row));

    const allLines = [
      headerLine,
      dividerLine,
      ...dataLines
    ];

    // Build Courier text stream (Landscape layout: 842 width x 595 height)
    let streamText = "BT\n/F1 12 Tf\n40 540 Td\n";
    streamText += `(${title.replace(/[\(\)\\]/g, "")}) Tj\n`;
    streamText += "0 -30 Td\n";
    streamText += "/F1 8 Tf\n";
    
    for (let i = 0; i < allLines.length; i++) {
      const cleanLine = allLines[i].replace(/[\(\)\\]/g, "");
      streamText += `(${cleanLine}) Tj\n0 -13 Td\n`;
    }
    streamText += "ET";

    const header = "%PDF-1.4\n";
    const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >> >>\nendobj\n";
    
    const streamHeader = "4 0 obj\n<< /Length " + streamText.length + " >>\nstream\n";
    const streamFooter = "\nendstream\nendobj\n";
    const obj4 = streamHeader + streamText + streamFooter;
    
    const offset1 = header.length;
    const offset2 = offset1 + obj1.length;
    const offset3 = offset2 + obj2.length;
    const offset4 = offset3 + obj3.length;
    const offsetStartXref = offset4 + obj4.length;
    
    const padOffset = (num) => String(num).padStart(10, "0");
    
    const xref = "xref\n0 5\n" +
      "0000000000 65535 f \n" +
      padOffset(offset1) + " 00000 n \n" +
      padOffset(offset2) + " 00000 n \n" +
      padOffset(offset3) + " 00000 n \n" +
      padOffset(offset4) + " 00000 n \n";
      
    const trailer = "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n" + offsetStartXref + "\n%%EOF";
    
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
