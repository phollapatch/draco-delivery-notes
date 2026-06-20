import { DeliveryNote } from "../types";
import { bahttext } from "../utils/bahttext";
import { REPRESENTATIVE_NAME, getAssetUrl } from "../utils/assets";

/**
 * Renders the absolute pixel-perfect markup for an A4 portrait delivery note.
 * Using precise CSS Millimeter (mm) measurements to guarantee layout fidelity in html2canvas.
 */
export function renderDeliveryNoteHtml(note: DeliveryNote): string {
  const customBahtText = bahttext(note.netAmount);

  // Format Date to DD.MM.YY (e.g. 19.06.26)
  const formatDocumentDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const yearStr = d.getFullYear().toString();
      const shortYear = yearStr.substring(yearStr.length - 2);
      return `${day}.${month}.${shortYear}`;
    } catch {
      return dateStr;
    }
  };

  const logoUrl = getAssetUrl("logo.png");
  const signatureUrl = getAssetUrl("signature.png");
  const stampUrl = getAssetUrl("company-stamp.png");

  // Create list of 9 slots representing items
  const tableRowsHtml: string[] = [];
  for (let i = 0; i < 9; i++) {
    const item = note.items?.[i];
    if (item) {
      tableRowsHtml.push(`
        <tr style="height: 8.5mm; border-bottom: 0.5pt solid #bbb; vertical-align: middle;">
          <td style="width: 6%; border-right: 0.5pt solid #78716c; text-align: center; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #44403c;">${i + 1}</td>
          <td style="width: 14%; border-right: 0.5pt solid #78716c; text-align: center; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #44403c;">${item.productId.replace("PROD-", "")}</td>
          <td style="width: 36%; border-right: 0.5pt solid #78716c; padding: 1mm 3mm; text-align: left;">
            <div style="display: flex; flex-direction: column; line-height: 1.25; justify-content: center; height: 100%;">
              <span class="bold" style="color: #0c0a09; font-size: 12px; font-family: 'Sarabun', sans-serif;">${item.productName}</span>
              ${item.note ? `<span style="font-size: 10px; color: #57534e; font-style: italic; margin-top: 0.2mm; font-family: 'Sarabun', sans-serif;">${item.note}</span>` : ""}
            </div>
          </td>
          <td class="bold font-thai" style="width: 10%; border-right: 0.5pt solid #78716c; text-align: center; color: #0c0a09; font-size: 12.5px;">${item.qty}</td>
          <td style="width: 10%; border-right: 0.5pt solid #78716c; text-align: center; color: #1c1917; font-size: 11.5px; font-family: 'Sarabun', sans-serif;">${item.unit}</td>
          <td style="width: 11%; border-right: 0.5pt solid #78716c; text-align: right; font-size: 11px; color: #44403c; padding-right: 3mm; font-family: 'JetBrains Mono', monospace;">${item.unitPrice === 0 ? "0.00" : item.unitPrice.toFixed(2)}</td>
          <td style="width: 13%; text-align: right; font-size: 11.5px; color: #0c0a09; padding-right: 3mm; font-family: 'JetBrains Mono', monospace;" class="bold">${item.amount === 0 ? "0.00" : item.amount.toFixed(2)}</td>
        </tr>
      `);
    } else {
      // Empty row
      tableRowsHtml.push(`
        <tr style="height: 8.5mm; border-bottom: 0.5pt solid #bbb; vertical-align: middle;">
          <td style="width: 6%; border-right: 0.5pt solid #78716c;"></td>
          <td style="width: 14%; border-right: 0.5pt solid #78716c;"></td>
          <td style="width: 36%; border-right: 0.5pt solid #78716c;"></td>
          <td style="width: 10%; border-right: 0.5pt solid #78716c;"></td>
          <td style="width: 10%; border-right: 0.5pt solid #78716c;"></td>
          <td style="width: 11%; border-right: 0.5pt solid #78716c;"></td>
          <td style="width: 13%;"></td>
        </tr>
      `);
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box !important;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: #ffffff;
          margin: 0;
          padding: 0;
        }

        .pdf-a4-page {
          width: 210mm;
          height: 297mm;
          padding: 12mm;
          box-sizing: border-box;
          background-color: #ffffff;
          color: #1c1917;
          font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: stretch;
          overflow: hidden;
        }

        /* Helpers */
        .bold {
          font-weight: 700;
        }

        .extrabold {
          font-weight: 800;
        }

        .black-weight {
          font-weight: 900;
        }

        .mono {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .font-thai {
          font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
        }

        /* Table */
        .ledg-table {
          width: 100%;
          border-collapse: collapse;
          border: 0.5pt solid #78716c;
          border-radius: 4px;
          overflow: hidden;
        }

        .ledg-table th {
          background-color: #f5f5f4;
          border-bottom: 0.5pt solid #78716c;
          border-right: 0.5pt solid #78716c;
          font-weight: 700;
          height: 9mm;
          color: #44403c;
          font-size: 11.5px;
          vertical-align: middle;
          text-align: center;
          font-family: 'Sarabun', sans-serif;
        }

        .ledg-table th:last-child {
          border-right: none;
        }

        /* Customer / Doc blocks */
        .info-container {
          height: 34mm;
          display: flex;
          border: 0.5pt solid #78716c;
          border-radius: 4px;
          overflow: hidden;
          font-size: 12px;
          margin-bottom: 4mm;
        }

        .customer-col {
          width: 58%;
          padding: 3mm 4mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          text-align: left;
          border-right: 0.5pt solid #78716c;
          height: 100%;
        }

        .doc-col {
          width: 42%;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .doc-row {
          display: flex;
          align-items: center;
          padding: 0 4mm;
          height: 8.5mm;
          border-bottom: 0.5pt solid #78716c;
          text-align: left;
        }

        .doc-row:last-child {
          border-bottom: none;
          background-color: #f5f5f4;
          flex-grow: 1;
        }

        /* Calculations total box */
        .calc-container {
          height: 28mm;
          display: flex;
          border: 0.5pt solid #78716c;
          border-top: none;
          border-radius: 0 0 4px 4px;
          overflow: hidden;
          font-size: 12px;
          margin-bottom: 3mm;
          width: 100%;
        }

        .calc-baht-text {
          width: 58%;
          background-color: #f5f5f4;
          padding: 3mm;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 0.5pt solid #78716c;
          position: relative;
          text-align: center;
          height: 100%;
        }

        .calc-values {
          width: 42%;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .calc-row {
          display: flex;
          align-items: center;
          height: 7mm;
          border-bottom: 0.5pt solid #e5e5e0;
          padding: 0 4mm;
          text-align: left;
        }

        .calc-row-last {
          display: flex;
          align-items: center;
          height: 7mm;
          background-color: #fafaf9;
          padding: 0 4mm;
          text-align: left;
          border-bottom: none;
        }
      </style>
    </head>
    <body>
      <div class="pdf-a4-page">
        
        <!-- 1. Header (30mm) -->
        <div style="height: 30mm; display: flex; align-items: flex-start; gap: 6mm; margin-bottom: 3mm;">
          <div style="width: 21mm; height: 30mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            <img src="${logoUrl}" alt="Bunny Corp Logo" style="width: 100%; height: 100%; object-fit: contain;" referrerPolicy="no-referrer" />
          </div>
          <div style="text-align: left; padding-top: 1.5mm; flex-grow: 1;">
            <h1 class="black-weight" style="font-size: 22px; margin: 0; padding-bottom: 2px; color: #111827; line-height: 1.25; font-family: 'Sarabun', sans-serif;">บริษัท บันนี่ คอร์ป จำกัด</h1>
            <p style="font-size: 13.5px; margin: 0; color: #4b5563; line-height: 1.5; font-family: 'Sarabun', sans-serif; font-weight: 500;">1323 / 1 ซอยลาดพร้าว 94 (ปัญจมิตร) แขวงพลับพลา เขตวังทองหลาง กรุงเทพฯ 10310</p>
          </div>
        </div>

        <!-- 2. Title (10mm + Gap) -->
        <div style="height: 10mm; display: flex; align-items: center; justify-content: center; margin-bottom: 3mm;">
          <h2 class="extrabold" style="font-size: 24px; margin: 0; color: #111827; display: inline-block; border-bottom: 2px solid #111827; padding: 0 32px 3px; line-height: 1; font-family: 'Sarabun', sans-serif;">ใบส่งสินค้า</h2>
        </div>

        <!-- 3. Customer + Doc Info Box (34mm + Gap) -->
        <div class="info-container">
          <!-- Left Customer details -->
          <div class="customer-col">
            <div style="margin-bottom: 1.5mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <span class="bold" style="text-decoration: underline; color: #374151;">ลูกค้า :</span>
              <span class="bold" style="color: #111827; padding-left: 1.5mm; font-size: 13.5px;">${note.customerName}</span>
            </div>
            <div style="color: #4b5563; line-height: 1.45; min-height: 11mm; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              <span class="bold" style="color: #374151;">ที่อยู่ :</span> ${note.address}
            </div>
            <div style="border-top: 1px dotted #d1d5db; padding-top: 1.5mm; margin-top: auto; font-size: 11.5px; color: #4b5563;">
              <span class="bold" style="color: #374151;">เบอร์ติดต่อ :</span> <span class="mono bold" style="color: #1f2937;">${note.phone || "-"}</span>
            </div>
          </div>

          <!-- Right Document specs details -->
          <div class="doc-col">
            <div class="doc-row">
              <span class="bold" style="width: 35%; color: #374151;">เลขที่ :</span>
              <span class="extrabold mono" style="width: 65%; color: #111827; font-size: 14.5px; text-align: right;">${note.documentNo}</span>
            </div>
            <div class="doc-row">
              <span class="bold" style="width: 35%; color: #374151;">วันที่ :</span>
              <span class="bold" style="width: 65%; color: #111827; text-align: right; font-size: 12.5px;">${formatDocumentDate(note.date)}</span>
            </div>
            <div class="doc-row">
              <span class="bold" style="width: 35%; color: #374151;">อ้างอิง :</span>
              <span style="width: 65%; color: #4b5563; text-align: right; font-size: 12px;" class="bold">${note.reference || "PO/B"}</span>
            </div>
            <div class="doc-row"></div>
          </div>
        </div>

        <!-- 4. Product Table (88mm) -->
        <div style="height: 88mm; width: 100%; overflow: hidden;">
          <table class="ledg-table">
            <thead>
              <tr>
                <th style="width: 6%;">ลำดับ</th>
                <th style="width: 14%;">รหัสสินค้า</th>
                <th style="width: 36%; text-align: left; padding-left: 3mm;">รายการ</th>
                <th style="width: 10%;">จำนวน</th>
                <th style="width: 10%;">หน่วยนับ</th>
                <th style="width: 11%; text-align: right; padding-right: 3mm;">หน่วยละ</th>
                <th style="width: 13%; text-align: right; padding-right: 3mm;">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml.join("")}
            </tbody>
          </table>
        </div>

        <!-- 5. Calculations Total Box (28mm) -->
        <div class="calc-container">
          <!-- Thai Baht Word Translation Block -->
          <div class="calc-baht-text">
            <span style="position: absolute; left: 3mm; top: 2mm; font-size: 9.5px; color: #8c8580; font-family: 'JetBrains Mono', monospace;" class="mono">บาทตัวอักษร</span>
            <span class="bold" style="font-size: 13.5px; color: #111827; text-decoration: underline; text-decoration-style: double; display: inline-block;">
              ${customBahtText}
            </span>
          </div>

          <!-- Summary list block -->
          <div class="calc-values">
            <div class="calc-row">
              <span class="bold" style="width: 55%; color: #4b5563;">รวมเงิน</span>
              <span style="width: 45%; color: #111827; text-align: right; padding-right: 1mm;" class="mono bold">${note.totalAmount.toFixed(2)}</span>
            </div>
            <div class="calc-row">
              <span style="width: 55%; color: #6b7280; font-weight: 500;">ส่วนลด</span>
              <span style="width: 45%; color: #6b7280; text-align: right; padding-right: 1mm;" class="mono">${note.discount > 0 ? note.discount.toFixed(2) : "-"}</span>
            </div>
            <div class="calc-row">
              <span style="width: 55%; color: #4b5563; font-size: 11px; font-weight: 500;">ยอดหลังหักส่วนลด</span>
              <span style="width: 45%; color: #4b5563; text-align: right; padding-right: 1mm;" class="mono">${(note.totalAmount - note.discount).toFixed(2)}</span>
            </div>
            <div class="calc-row-last">
              <span class="extrabold" style="width: 55%; color: #111827; font-size: 12.5px;">ยอดสุทธิ</span>
              <span class="mono extrabold" style="width: 45%; color: #111827; font-size: 13.5px; text-align: right; padding-right: 1mm; border-bottom: 3.5px double #111827; display: inline-block; padding-bottom: 0px; line-height: 1;">
                ${note.netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <!-- 6. Remarks / Notes (16mm) -->
        <div style="height: 16mm; text-align: left; font-size: 12px; width: 100%; overflow: hidden; line-height: 1.45; padding-top: 1mm; margin-bottom: 3mm; border-top: none;">
          <div class="bold" style="color: #374151; margin-bottom: 1mm;">หมายเหตุ :</div>
          <div style="color: #4b5563; font-weight: 500; white-space: pre-line; padding-left: 4mm;">${note.remarks || "ส่งของเรียบร้อยแล้ว\\nฝากขาย"}</div>
        </div>

        <!-- 7. Signature Sections (38mm) -->
        <div style="height: 38mm; display: flex; gap: 10mm; width: 100%;">
          <!-- Recipient box -->
          <div style="width: calc(50% - 5mm); height: 36mm; border: 0.5pt solid #78716c; padding: 3mm; display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #ffffff; text-align: center; border-radius: 4px;">
            <span class="bold" style="color: #374151; text-decoration: underline; display: block; font-size: 12.5px; line-height: 1;">ผู้รับสินค้า</span>
            <div style="border-top: 1px dotted #9ca3af; margin: 0 4mm 1mm;"></div>
            <div style="display: flex; justify-content: space-between; padding: 0 2mm; font-size: 11px; color: #6b7280; line-height: 1;" class="mono font-thai">
              <span>(........................................................)</span>
              <span>วันที่ ......./......./.......</span>
            </div>
          </div>

          <!-- Sender box with distinct Stamp and Signature layering -->
          <div style="width: calc(50% - 5mm); height: 36mm; border: 0.5pt solid #78716c; padding: 3mm; display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #ffffff; text-align: center; border-radius: 4px; overflow: hidden;">
            <span class="bold" style="color: #374151; text-decoration: underline; display: block; font-size: 12.5px; line-height: 1;">ผู้ส่งสินค้า</span>
            
            <!-- Handwritten Signature layer - ABOVE stamp -->
            <div style="position: absolute; left: 50%; top: 4.5mm; transform: translateX(-50%) rotate(-1.5deg); z-index: 10; pointer-events: none; width: 100%; display: flex; justify-content: center; align-items: center;">
              <img src="${signatureUrl}" alt="Signature" style="max-width: 120px; height: 11mm; object-fit: contain;" referrerPolicy="no-referrer" />
            </div>

            <!-- Printed name layer in between -->
            <div style="text-align: center; z-index: 8; padding-top: 11mm; margin-bottom: 0.5mm;">
              <span class="extrabold" style="font-size: 11.5px; color: #111827;">(..... ${REPRESENTATIVE_NAME} .....)</span>
            </div>

            <!-- Rubber Blue Stamp overlay - positioned nicely on bottom-right, below signature layer (z-index: 5) to avoid obscuring name -->
            <img src="${stampUrl}" alt="Company Stamp" style="position: absolute; right: -6mm; bottom: 3mm; z-index: 5; pointer-events: none; max-width: 32mm; max-height: 12mm; object-fit: contain; transform: rotate(-20deg); opacity: 0.85;" referrerPolicy="no-referrer" />

            <div style="text-align: center; font-size: 11px; color: #6b7280; z-index: 8; line-height: 1;" class="mono font-thai">
              <span>วันที่ ......./......./.......</span>
            </div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}
