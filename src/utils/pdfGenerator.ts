import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { DeliveryNote } from "../types";
import { bahttext } from "./bahttext";
import { REPRESENTATIVE_NAME, getAssetUrl } from "./assets";

/**
 * 100% Reliable HTML-to-PDF delivery note builder.
 * Solves Thai character positioning, combining marks, vowel stacking, and spacing issues
 * completely by rendering the document natively in the browser's layout engine first, 
 * capturing it with high-precision html2canvas, and packaging it into a crisp PDF.
 */
export async function generateDeliveryNotePdf(note: DeliveryNote): Promise<Uint8Array> {
  const customBahtText = bahttext(note.netAmount);

  // Format Date to DD.MM.YY (e.g. 17.06.69)
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

  // Create an off-screen container for rendering the A4 sheet
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "794px"; // 210mm at 96 DPI
  container.style.minHeight = "1123px"; // 297mm at 96 DPI
  container.style.padding = "48px";
  container.style.boxSizing = "border-box";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0a0a0a";
  container.style.fontFamily = "'Sarabun', 'Inter', sans-serif";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "space-between";

  // Build the items ledger table HTML
  let itemRowsHtml = "";
  for (let i = 0; i < 9; i++) {
    const item = note.items[i];
    itemRowsHtml += `
      <tr style="height: 36px; border-bottom: 1px dotted #a8a29e;">
        <td style="text-align: center; border-right: 1px solid #d6d3d1; font-family: monospace; color: #78716c;">
          ${item ? i + 1 : ""}
        </td>
        <td style="text-align: center; border-right: 1px solid #d6d3d1; font-family: monospace; font-size: 11px; color: #57534e;">
          ${item ? item.productId.replace("PROD-", "") : ""}
        </td>
        <td style="padding: 0 12px; border-right: 1px solid #d6d3d1; color: #1c1917; vertical-align: middle;">
          ${item ? `
            <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.25;">
              <span style="font-weight: bold; color: #171717;">${item.productName.normalize("NFC")}</span>
              ${item.note ? `<span style="font-size: 11px; font-style: italic; color: #78716c; font-weight: 500;">${item.note.normalize("NFC")}</span>` : ""}
            </div>
          ` : ""}
        </td>
        <td style="text-align: center; border-right: 1px solid #d6d3d1; font-family: monospace; font-weight: bold; color: #171717;">
          ${item ? item.qty : ""}
        </td>
        <td style="text-align: center; border-right: 1px solid #d6d3d1; color: #262626;">
          ${item ? item.unit.normalize("NFC") : ""}
        </td>
        <td style="text-align: right; padding-right: 12px; border-right: 1px solid #d6d3d1; font-family: monospace; color: #44403c;">
          ${item ? (item.unitPrice === 0 ? "0.00" : item.unitPrice.toFixed(2)) : ""}
        </td>
        <td style="text-align: right; padding-right: 12px; font-family: monospace; font-weight: 600; color: #171717;">
          ${item ? (item.amount === 0 ? "0.00" : item.amount.toFixed(2)) : ""}
        </td>
      </tr>
    `;
  }

  // Set HTML template matching the print preview visual layout identically
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
      <div>
        <!-- 1. Header Row -->
        <div style="display: flex; align-items: start; gap: 24px; padding-bottom: 24px;">
          <div style="width: 80px; height: 112px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            <img src="${getAssetUrl("logo.png")}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="text-align: left; padding-top: 8px; flex-grow: 1;">
            <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -0.025em; color: #171717; margin: 0 0 4px 0; line-height: 1;">
              บริษัท บันนี่ คอร์ป จำกัด
            </h1>
            <p style="font-size: 14px; font-weight: 500; color: #525252; margin: 0 0 2px 0;">
              1323 / 1 ซอยลาดพร้าว 94 (ปัญจมิตร) แขวงพลับพลา
            </p>
            <p style="font-size: 14px; font-weight: 500; color: #525252; margin: 0; line-height: 1;">
              เขตวังทองหลาง กรุงเทพฯ 10310
            </p>
          </div>
        </div>

        <!-- Title Area -->
        <div style="text-align: center; padding-top: 8px; padding-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 800; letter-spacing: 0.025em; color: #171717; display: inline-block; border-bottom: 2px solid #171717; padding-bottom: 4px; margin: 0;">
            ใบส่งสินค้า
          </h2>
        </div>

        <!-- 2. Customer & Document Blocks -->
        <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; padding-bottom: 32px; font-size: 14px;">
          <!-- Customer Box -->
          <div style="grid-column: span 7; border: 1px solid #78716c; padding: 16px; border-radius: 4px; text-align: left; display: flex; flex-direction: column; justify-content: start; min-height: 110px; box-sizing: border-box;">
            <div style="margin-bottom: 4px;">
              <span style="font-weight: bold; text-decoration: underline;">ลูกค้า :</span>
              <span style="font-weight: 600; color: #171717;">${note.customerName.normalize("NFC")}</span>
            </div>
            <div style="margin-bottom: 8px; flex-grow: 1;">
              <span style="font-weight: bold;">ที่อยู่ :</span>
              <span style="color: #404040; white-space: pre-line; line-height: 1.5;">${note.address.normalize("NFC")}</span>
            </div>
            <div style="padding-top: 4px; border-top: 1px dotted #d6d3d1;">
              <span style="font-weight: bold;">T.</span> ${note.phone}
            </div>
          </div>

          <!-- Document stats -->
          <div style="grid-column: span 5; border: 1px solid #78716c; border-radius: 4px; display: grid; grid-template-rows: repeat(4, minmax(0, 1fr)); text-align: left; min-height: 110px; box-sizing: border-box;">
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); border-bottom: 1px solid #78716c; align-items: center; padding: 0 12px;">
              <span style="grid-column: span 4; font-weight: bold;">เลขที่ :</span>
              <span style="grid-column: span 8; font-weight: 800; color: #171717; font-size: 16px;">${note.documentNo}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); border-bottom: 1px solid #78716c; align-items: center; padding: 0 12px;">
              <span style="grid-column: span 4; font-weight: bold;">วันที่ :</span>
              <span style="grid-column: span 8; font-weight: 600; color: #262626;">${formatDocumentDate(note.date)}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); border-bottom: 1px solid #78716c; align-items: center; padding: 0 12px;">
              <span style="grid-column: span 4; font-weight: bold; font-size: 12px; line-height: 1;">อ้างอิง :</span>
              <span style="grid-column: span 8; font-weight: 500; color: #404040;">${note.reference ? note.reference.normalize("NFC") : "PO/B"}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); align-items: center; padding: 0 12px; color: #a3a3a3; font-size: 12px;">
              <span></span>
            </div>
          </div>
        </div>

        <!-- 3. Items Ledger Grid Table -->
        <div style="border: 1px solid #78716c; border-radius: 4px; overflow: hidden; box-sizing: border-box;">
          <table style="width: 100%; table-layout: fixed; font-size: 14px; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #f5f5f4; border-bottom: 1px solid #78716c; color: #262626; font-weight: bold; height: 40px;">
                <th style="width: 6%; text-align: center; border-right: 1px solid #d6d3d1;">ลำดับ</th>
                <th style="width: 14%; text-align: center; border-right: 1px solid #d6d3d1;">รหัสสินค้า</th>
                <th style="width: 36%; padding: 0 12px; border-right: 1px solid #d6d3d1;">รายการ</th>
                <th style="width: 10%; text-align: center; border-right: 1px solid #d6d3d1;">จำนวน</th>
                <th style="width: 10%; text-align: center; border-right: 1px solid #d6d3d1;">หน่วยนับ</th>
                <th style="width: 11%; text-align: right; padding-right: 12px; border-right: 1px solid #d6d3d1;">หน่วยละ</th>
                <th style="width: 13%; text-align: right; padding-right: 12px;">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- 4. TOTAL CALCULATIONS BLOCK -->
        <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); border: 1px solid #78716c; border-top: 0; border-radius: 0 0 4px 4px; font-size: 14px; overflow: hidden; min-height: 96px; box-sizing: border-box;">
          <!-- Thai Baht text in Gray block on left -->
          <div style="grid-column: span 7; background-color: #f5f5f4; padding: 16px; display: flex; align-items: center; justify-content: center; border-right: 1px solid #78716c; position: relative;">
            <span style="color: #a8a29e; position: absolute; font-size: 12px; left: 8px; top: 8px; font-family: monospace;">บาทตัวอักษร</span>
            <span style="font-weight: 900; color: #171717; font-size: 16px; text-decoration: underline; text-decoration-style: double;">
              ${customBahtText}
            </span>
          </div>

          <!-- Calculations lines on right -->
          <div style="grid-column: span 5; display: grid; grid-template-rows: repeat(4, minmax(0, 1fr)); box-sizing: border-box;">
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); border-bottom: 1px solid #e7e5e4; align-items: center; padding: 0 16px;">
              <span style="grid-column: span 7; font-weight: bold; color: #44403c;">รวมเงิน</span>
              <span style="grid-column: span 5; text-align: right; font-family: monospace; color: #171717;">${note.totalAmount.toFixed(2)}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); border-bottom: 1px solid #e7e5e4; align-items: center; padding: 0 16px;">
              <span style="grid-column: span 7; font-weight: 500; color: #78716c;">ส่วนลด</span>
              <span style="grid-column: span 5; text-align: right; font-family: monospace; color: #78716c;">
                ${note.discount > 0 ? note.discount.toFixed(2) : "-"}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); border-bottom: 1px solid #e7e5e4; align-items: center; padding: 0 16px;">
              <span style="grid-column: span 7; font-size: 12px; font-weight: 500; color: #57534e;">ยอดหลังหักส่วนลด</span>
              <span style="grid-column: span 5; text-align: right; font-family: monospace; color: #525252;">${(note.totalAmount - note.discount).toFixed(2)}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); background-color: #fafaf9; align-items: center; padding: 0 16px; font-size: 16px; font-weight: 900; color: #171717;">
              <span style="grid-column: span 7;">ยอดสุทธิ</span>
              <span style="grid-column: span 5; text-align: right; font-family: monospace; text-decoration: underline; text-decoration-style: double;">${note.netAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Remarks display under calculated box -->
        <div style="text-align: left; margin-top: 16px; font-size: 14px; max-width: 512px; margin-bottom: 32px;">
          <span style="font-weight: bold; color: #292524;">หมายเหตุ: </span>
          <span style="color: #57534e; font-weight: 500; white-space: pre-line; line-height: 1.5;">${(note.remarks || "ส่งของเรียบร้อยแล้ว\nฝากขาย").normalize("NFC")}</span>
        </div>
      </div>

      <!-- 5. FOOTER ASSIGNMENTS & SIGNATURE STAMP OVERLAYS -->
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; font-size: 14px; margin-top: auto; padding-top: 16px; box-sizing: border-box;">
        <!-- Receiver Area -->
        <div style="border: 1px solid #78716c; padding: 16px; border-radius: 4px; text-align: center; position: relative; display: flex; flex-direction: column; justify-content: space-between; height: 160px; background-color: rgba(255, 255, 255, 0.5); box-sizing: border-box;">
          <span style="font-weight: 800; color: #292524; text-decoration: underline;">ผู้รับสินค้า</span>
          <div style="border-top: 1px dotted #78716c; margin: 64px 16px 0 16px;"></div>
          <div style="display: flex; justify-content: space-between; padding: 8px 24px 0 24px; font-size: 12px; color: #78716c; font-family: monospace;">
            <span>(........................................................)</span>
            <span>วันที่ ......./......./.......</span>
          </div>
        </div>

        <!-- Sender Area with Stamp & Signature -->
        <div style="border: 1px solid #78716c; padding: 16px; border-radius: 4px; text-align: center; position: relative; display: flex; flex-direction: column; justify-content: space-between; height: 160px; background-color: rgba(255, 255, 255, 0.5); box-sizing: border-box; overflow: visible;">
          <span style="font-weight: 800; color: #292524; text-decoration: underline; pointer-events: none; z-index: 1;">ผู้ส่งสินค้า</span>
          
          <!-- SIGNATURE OVERLAY (Directly above the printed name) -->
          <div style="position: absolute; left: 0; right: 0; top: 32px; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 10;">
            <div style="width: 192px; height: 64px; opacity: 0.9; transform: rotate(-2deg); display: flex; align-items: center; justify-content: center;">
              <img src="${getAssetUrl("signature.png")}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          </div>

          <!-- Representative Printed Name Label -->
          <div style="z-index: 20; padding-top: 64px; pointer-events: none;">
            <span style="font-size: 12px; color: #171717; font-weight: 800; font-family: sans-serif;">
              (..... ${REPRESENTATIVE_NAME} .....)
            </span>
          </div>

          <!-- COMPANY RUBBER BLUE STAMP OVERLAY (Stamped BELOW the name on the right side) -->
          <div style="position: absolute; right: 8px; bottom: 4px; pointer-events: none; z-index: 30; display: flex; align-items: center; justify-content: center;">
            <div style="width: 144px; height: 48px; opacity: 0.85; transform: rotate(4deg);">
              <img src="${getAssetUrl("company-stamp.png")}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          </div>

          <div style="display: flex; justify-content: center; padding: 0 24px; font-size: 12px; color: #78716c; font-family: monospace; z-index: 20;">
            <span>วันที่ ......./......./.......</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait for all embedded images inside the container to load completely
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    // Wait for Web Fonts to be fully compiled and active in layout
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Capture the generated element nicely using html2canvas 2x high fidelity rendering
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution crisp density
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Create jsPDF document mapping exactly to an A4 portrait canvas (Unit pt, format: a4)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    // Obtain compressed jpeg representation of the canvas
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Place the rasterized page at coordinates 0,0 fitting exactly to A4 boundaries (595.28 x 841.89 points)
    pdf.addImage(imgData, "JPEG", 0, 0, 595.28, 841.89, undefined, "FAST");

    // Retrieve ArrayBuffer payload elements
    const pdfBuffer = pdf.output("arraybuffer");
    return new Uint8Array(pdfBuffer);
  } finally {
    // Always clean up DOM and tear down the off-screen sandbox elements safely
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
