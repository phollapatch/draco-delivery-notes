import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { DeliveryNote } from "../types";
import { bahttext } from "./bahttext";
import { REPRESENTATIVE_NAME, getAssetUrl } from "./assets";

// Global cache for TrueType font files to avoid reloading over network
let cachedSarabunRegular: ArrayBuffer | null = null;
let cachedSarabunBold: ArrayBuffer | null = null;

/**
 * Loads and caches the Thai Sarabun fonts from CDN.
 */
async function loadSarabunFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (cachedSarabunRegular && cachedSarabunBold) {
    return { regular: cachedSarabunRegular, bold: cachedSarabunBold };
  }
  const [regRes, boldRes] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/gh/google/fonts@master/ofl/sarabun/Sarabun-Regular.ttf"),
    fetch("https://cdn.jsdelivr.net/gh/google/fonts@master/ofl/sarabun/Sarabun-Bold.ttf")
  ]);

  if (!regRes.ok || !boldRes.ok) {
    throw new Error("Failed to load Sarabun font files from CDN.");
  }

  cachedSarabunRegular = await regRes.arrayBuffer();
  cachedSarabunBold = await boldRes.arrayBuffer();

  return { regular: cachedSarabunRegular, bold: cachedSarabunBold };
}

/**
 * Robust helper to fetch and decode image bytes from data URLs or standard HTTP URLs.
 */
async function fetchImageBytes(url: string): Promise<Uint8Array> {
  if (url.startsWith("data:")) {
    const arr = url.split(",");
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return u8arr;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Draw Thai Text precisely with alignment and normalization support without letter-spacing or squeeze.
 */
function drawThaiText(
  page: any,
  text: string,
  options: {
    x: number;
    y: number; // PDF standard Y (from bottom)
    size: number;
    font: any;
    color?: any;
    maxWidth?: number;
    align?: "left" | "right" | "center";
  }
) {
  const normalized = (text || "").normalize("NFC");
  const size = options.size || 10;
  const font = options.font;
  const color = options.color || rgb(0.09, 0.09, 0.09);
  const align = options.align || "left";

  let drawX = options.x;
  const textWidth = font.widthOfTextAtSize(normalized, size);

  if (align === "right") {
    drawX = options.x - textWidth;
  } else if (align === "center") {
    drawX = options.x - (textWidth / 2);
  }

  page.drawText(normalized, {
    x: drawX,
    y: options.y,
    size,
    font,
    color,
    maxWidth: options.maxWidth,
  });
}

/**
 * 100% Vector Native PDF builder using pdf-lib.
 * Ensures incredible crispness, correct aspect ratios, and precise alignments.
 */
export async function generateDeliveryNotePdf(note: DeliveryNote): Promise<Uint8Array> {
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

  // 1. Create a pristine A4 landscape/portrait PDF Document
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 2. Embed custom fonts or fallback to standard TrueType fonts
  let regularFont: any;
  let boldFont: any;
  try {
    const fonts = await loadSarabunFonts();
    regularFont = await pdfDoc.embedFont(fonts.regular);
    boldFont = await pdfDoc.embedFont(fonts.bold);
  } catch (err) {
    console.warn("Could not load Sarabun. Falling back to Helvetica...", err);
    regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 Dimensions

  // Helper coordinate converter for Y axis (moving origin from Bottom-Left to Top-Left)
  const convertY = (yFromTop: number) => 841.89 - yFromTop;

  // Helper to obtain perfect vertical center baseline for text inside cells
  const getVerticalCenterY = (rowTop: number, rowHeight: number, fontSize: number) => {
    return convertY(rowTop + rowHeight / 2) - (fontSize / 2) + 2;
  };

  const stoneMainBorderColor = rgb(0.47, 0.44, 0.42); // #78716c
  const stoneLightDividerColor = rgb(0.66, 0.64, 0.62); // #a8a29e

  // --- HEADER SECTION ---
  // Logo placeholder & contain fit drawing
  try {
    const logoUrl = getAssetUrl("logo.png");
    const logoBytes = await fetchImageBytes(logoUrl);
    const logoImg = await pdfDoc.embedPng(logoBytes);
    const { width: origW, height: origH } = logoImg.scale(1);
    const maxW = 60;
    const maxH = 75;
    const scale = Math.min(maxW / origW, maxH / origH);
    const w = origW * scale;
    const h = origH * scale;

    const centerY = 40 + (75 - h) / 2;
    page.drawImage(logoImg, {
      x: 40,
      y: convertY(centerY + h),
      width: w,
      height: h,
    });
  } catch (err) {
    console.warn("Skipped logo draw:", err);
  }

  // Company texts adjacent to Logo
  drawThaiText(page, "บริษัท บันนี่ คอร์ป จำกัด", {
    x: 115,
    y: convertY(54),
    size: 17,
    font: boldFont,
    color: rgb(0.09, 0.09, 0.09),
  });
  drawThaiText(page, "1323 / 1 ซอยลาดพร้าว 94 (ปัญจมิตร) แขวงพลับพลา", {
    x: 115,
    y: convertY(72),
    size: 10,
    font: regularFont,
    color: rgb(0.32, 0.32, 0.32),
  });
  drawThaiText(page, "เขตวังทองหลาง กรุงเทพฯ 10310", {
    x: 115,
    y: convertY(86),
    size: 10,
    font: regularFont,
    color: rgb(0.32, 0.32, 0.32),
  });

  // --- DOCUMENT HEADER ("ใบส่งสินค้า") ---
  drawThaiText(page, "ใบส่งสินค้า", {
    x: 297.64,
    y: convertY(122),
    size: 18,
    font: boldFont,
    color: rgb(0.09, 0.09, 0.09),
    align: "center",
  });
  // Double bottom aesthetic thick border
  page.drawLine({
    start: { x: 247.64, y: convertY(131) },
    end: { x: 347.64, y: convertY(131) },
    thickness: 1.5,
    color: rgb(0.09, 0.09, 0.09),
  });

  // --- CUSTOMER BOX (Left) ---
  page.drawRectangle({
    x: 40,
    y: convertY(246),
    width: 280,
    height: 96,
    borderColor: stoneMainBorderColor,
    borderWidth: 0.75,
  });

  drawThaiText(page, "ลูกค้า :", {
    x: 50,
    y: convertY(166),
    size: 10,
    font: boldFont,
  });
  // Draw underline for Customer word
  page.drawLine({
    start: { x: 50, y: convertY(168) },
    end: { x: 74, y: convertY(168) },
    thickness: 0.5,
    color: rgb(0.09, 0.09, 0.09),
  });

  drawThaiText(page, note.customerName, {
    x: 82,
    y: convertY(166),
    size: 11,
    font: boldFont,
    color: rgb(0.09, 0.09, 0.09),
  });

  drawThaiText(page, "ที่อยู่ :", {
    x: 50,
    y: convertY(186),
    size: 10,
    font: boldFont,
  });

  // Multi-line address wrapping
  const addressLines = (note.address || "").split("\n");
  addressLines.forEach((line, idx) => {
    drawThaiText(page, line, {
      x: 82,
      y: convertY(186 + idx * 14),
      size: 10,
      font: regularFont,
      color: rgb(0.24, 0.24, 0.24),
    });
  });

  // Small dotted separator inside left box
  page.drawLine({
    start: { x: 50, y: convertY(225) },
    end: { x: 310, y: convertY(225) },
    thickness: 0.5,
    color: stoneLightDividerColor,
    dashArray: [2, 2],
  });

  drawThaiText(page, "T.", {
    x: 50,
    y: convertY(237),
    size: 10,
    font: boldFont,
  });
  drawThaiText(page, note.phone, {
    x: 64,
    y: convertY(237),
    size: 10,
    font: regularFont,
    color: rgb(0.15, 0.15, 0.15),
  });

  // --- DOCUMENT STATS BOX (Right) ---
  page.drawRectangle({
    x: 335,
    y: convertY(246),
    width: 220.28,
    height: 96,
    borderColor: stoneMainBorderColor,
    borderWidth: 0.75,
  });

  // 4 rows horizontal divisions
  for (let r = 1; r < 4; r++) {
    const lineY = 150 + r * 24;
    page.drawLine({
      start: { x: 335, y: convertY(lineY) },
      end: { x: 555.28, y: convertY(lineY) },
      thickness: 0.75,
      color: stoneMainBorderColor,
    });
  }

  // Row 1: Document ID
  drawThaiText(page, "เลขที่ :", {
    x: 345,
    y: getVerticalCenterY(150, 24, 10),
    size: 10,
    font: boldFont,
  });
  drawThaiText(page, note.documentNo, {
    x: 545.28,
    y: getVerticalCenterY(150, 24, 12),
    size: 12,
    font: boldFont,
    color: rgb(0.09, 0.09, 0.09),
    align: "right",
  });

  // Row 2: Date
  drawThaiText(page, "วันที่ :", {
    x: 345,
    y: getVerticalCenterY(174, 24, 10),
    size: 10,
    font: boldFont,
  });
  drawThaiText(page, formatDocumentDate(note.date), {
    x: 545.28,
    y: getVerticalCenterY(174, 24, 11),
    size: 11,
    font: boldFont,
    align: "right",
  });

  // Row 3: Reference
  drawThaiText(page, "อ้างอิง :", {
    x: 345,
    y: getVerticalCenterY(198, 24, 10),
    size: 10,
    font: boldFont,
  });
  drawThaiText(page, note.reference || "PO/B", {
    x: 545.28,
    y: getVerticalCenterY(198, 24, 10),
    size: 10,
    font: regularFont,
    color: rgb(0.24, 0.24, 0.24),
    align: "right",
  });

  // --- PRODUCTS LEDGER TABLE ---
  page.drawRectangle({
    x: 40,
    y: convertY(500),
    width: 515.28,
    height: 240,
    borderColor: stoneMainBorderColor,
    borderWidth: 0.75,
  });

  // Table header background fill
  page.drawRectangle({
    x: 40,
    y: convertY(284),
    width: 515.28,
    height: 24,
    color: rgb(0.96, 0.96, 0.95),
  });

  // Draw header divider
  page.drawLine({
    start: { x: 40, y: convertY(284) },
    end: { x: 555.28, y: convertY(284) },
    thickness: 0.75,
    color: stoneMainBorderColor,
  });

  // Relative column width setups
  const colLefts = [40, 70, 140, 335, 380, 430, 490];
  const colCenters = [55, 105, 150, 357.5, 405, 482, 547.28]; // centers / aligned anchor values

  // Header texts
  const headers = [
    { text: "ลำดับ", x: 55, align: "center" as const },
    { text: "รหัสสินค้า", x: 105, align: "center" as const },
    { text: "รายการ", x: 147, align: "left" as const },
    { text: "จำนวน", x: 357.5, align: "center" as const },
    { text: "หน่วยนับ", x: 405, align: "center" as const },
    { text: "หน่วยละ", x: 482, align: "right" as const },
    { text: "จำนวนเงิน", x: 547.28, align: "right" as const }
  ];

  const headerValY = getVerticalCenterY(260, 24, 10);
  headers.forEach((hInfo) => {
    drawThaiText(page, hInfo.text, {
      x: hInfo.x,
      y: headerValY,
      size: 10,
      font: boldFont,
      align: hInfo.align,
    });
  });

  // Vertical grid dividers
  const vertDividers = [70, 140, 335, 380, 430, 490];
  vertDividers.forEach((divX) => {
    page.drawLine({
      start: { x: divX, y: convertY(260) },
      end: { x: divX, y: convertY(500) },
      thickness: 0.5,
      color: stoneLightDividerColor,
    });
  });

  // 9 record rows rendering
  for (let i = 0; i < 9; i++) {
    const rowTop = 284 + i * 24;
    const rowBottom = rowTop + 24;

    // Row border divider
    page.drawLine({
      start: { x: 40, y: convertY(rowBottom) },
      end: { x: 555.28, y: convertY(rowBottom) },
      thickness: 0.5,
      color: stoneLightDividerColor,
    });

    const item = note.items[i];
    const itemValY = getVerticalCenterY(rowTop, 24, 10);

    if (item) {
      // 0. No
      drawThaiText(page, (i + 1).toString(), {
        x: 55,
        y: itemValY,
        size: 10,
        font: regularFont,
        align: "center",
      });

      // 1. Code (clean product code format)
      const formattedCode = item.productId.replace("PROD-", "");
      drawThaiText(page, formattedCode, {
        x: 105,
        y: itemValY,
        size: 9,
        font: regularFont,
        align: "center",
      });

      // 2. Name & notes handling elegantly centered
      if (item.note) {
        const nameY = getVerticalCenterY(rowTop, 24, 9) + 4.5;
        const noteY = getVerticalCenterY(rowTop, 24, 8) - 5;
        drawThaiText(page, item.productName, {
          x: 147,
          y: nameY,
          size: 9,
          font: boldFont,
        });
        drawThaiText(page, item.note, {
          x: 147,
          y: noteY,
          size: 8,
          font: regularFont,
          color: rgb(0.47, 0.44, 0.42),
        });
      } else {
        drawThaiText(page, item.productName, {
          x: 147,
          y: itemValY,
          size: 10,
          font: boldFont,
        });
      }

      // 3. Qty
      drawThaiText(page, item.qty.toString(), {
        x: 357.5,
        y: itemValY,
        size: 10,
        font: boldFont,
        align: "center",
      });

      // 4. Unit
      drawThaiText(page, item.unit, {
        x: 405,
        y: itemValY,
        size: 10,
        font: regularFont,
        align: "center",
      });

      // 5. Unit Price
      const priceStr = item.unitPrice === 0 ? "0.00" : item.unitPrice.toFixed(2);
      drawThaiText(page, priceStr, {
        x: 482,
        y: itemValY,
        size: 10,
        font: regularFont,
        align: "right",
      });

      // 6. Total Amount
      const amtStr = item.amount === 0 ? "0.00" : item.amount.toFixed(2);
      drawThaiText(page, amtStr, {
        x: 547.28,
        y: itemValY,
        size: 10,
        font: boldFont,
        align: "right",
      });
    }
  }

  // --- TOTAL ESTIMATIONS AREA ---
  // Left Thai Baht block background
  page.drawRectangle({
    x: 40,
    y: convertY(596),
    width: 295,
    height: 96,
    color: rgb(0.96, 0.96, 0.95),
    borderColor: stoneMainBorderColor,
    borderWidth: 0.75,
  });

  drawThaiText(page, "บาทตัวอักษร", {
    x: 48,
    y: convertY(514),
    size: 8,
    font: regularFont,
    color: rgb(0.47, 0.44, 0.42),
  });

  // Dynamic Baht text display
  drawThaiText(page, customBahtText, {
    x: 187.5,
    y: convertY(554),
    size: 13,
    font: boldFont,
    align: "center",
  });

  // Precise underlying double lines for Bahttext
  const bTextNorm = customBahtText.normalize("NFC");
  const bTextW = boldFont.widthOfTextAtSize(bTextNorm, 13);
  const btStart = 187.5 - bTextW / 2;
  const btEnd = 187.5 + bTextW / 2;

  page.drawLine({ start: { x: btStart, y: convertY(560) }, end: { x: btEnd, y: convertY(560) }, thickness: 0.75, color: rgb(0.1, 0.1, 0.1) });
  page.drawLine({ start: { x: btStart, y: convertY(562) }, end: { x: btEnd, y: convertY(562) }, thickness: 0.75, color: rgb(0.1, 0.1, 0.1) });

  // Right Calculations Box boundaries
  // Divider bounds line separating right and left box
  page.drawLine({
    start: { x: 335, y: convertY(500) },
    end: { x: 335, y: convertY(596) },
    thickness: 0.75,
    color: stoneMainBorderColor,
  });

  // Row boundaries lines
  for (let r = 1; r < 4; r++) {
    const dividerY = 500 + r * 24;
    page.drawLine({
      start: { x: 335, y: convertY(dividerY) },
      end: { x: 555.28, y: convertY(dividerY) },
      thickness: 0.5,
      color: stoneLightDividerColor,
    });
  }

  // Row 1: Subtotal
  drawThaiText(page, "รวมเงิน", {
    x: 345,
    y: getVerticalCenterY(500, 24, 10),
    size: 10,
    font: boldFont,
    color: rgb(0.24, 0.24, 0.24),
  });
  drawThaiText(page, note.totalAmount.toFixed(2), {
    x: 545.28,
    y: getVerticalCenterY(500, 24, 10),
    size: 10,
    font: regularFont,
    align: "right",
  });

  // Row 2: Discount
  drawThaiText(page, "ส่วนลด", {
    x: 345,
    y: getVerticalCenterY(524, 24, 9),
    size: 9,
    font: regularFont,
    color: rgb(0.44, 0.44, 0.42),
  });
  drawThaiText(page, note.discount > 0 ? note.discount.toFixed(2) : "-", {
    x: 545.28,
    y: getVerticalCenterY(524, 24, 10),
    size: 10,
    font: regularFont,
    align: "right",
  });

  // Row 3: Post-discount subtotal
  drawThaiText(page, "ยอดหลังหักส่วนลด", {
    x: 345,
    y: getVerticalCenterY(548, 24, 9),
    size: 9,
    font: regularFont,
    color: rgb(0.44, 0.44, 0.42),
  });
  drawThaiText(page, (note.totalAmount - note.discount).toFixed(2), {
    x: 545.28,
    y: getVerticalCenterY(548, 24, 10),
    size: 10,
    font: regularFont,
    align: "right",
  });

  // Row 4: Net Total Value with Soft Beige background
  page.drawRectangle({
    x: 335.5,
    y: convertY(595.5),
    width: 219.28,
    height: 23,
    color: rgb(0.98, 0.98, 0.97),
  });
  page.drawLine({
    start: { x: 335, y: convertY(596) },
    end: { x: 555.28, y: convertY(596) },
    thickness: 0.75,
    color: stoneMainBorderColor,
  });

  drawThaiText(page, "ยอดสุทธิ", {
    x: 345,
    y: getVerticalCenterY(572, 24, 11),
    size: 11,
    font: boldFont,
  });

  const netText = note.netAmount.toFixed(2);
  const netTextY = getVerticalCenterY(572, 24, 12);
  drawThaiText(page, netText, {
    x: 545.28,
    y: netTextY,
    size: 12,
    font: boldFont,
    align: "right",
  });

  // Final underlining structure
  const valWidth = boldFont.widthOfTextAtSize(netText, 12);
  page.drawLine({ start: { x: 545.28 - valWidth, y: netTextY - 2 }, end: { x: 545.28, y: netTextY - 2 }, thickness: 0.75, color: rgb(0.09, 0.09, 0.09) });
  page.drawLine({ start: { x: 545.28 - valWidth, y: netTextY - 4 }, end: { x: 545.28, y: netTextY - 4 }, thickness: 0.75, color: rgb(0.09, 0.09, 0.09) });

  // --- REMARKS UNDER TABLE ---
  let remarksY = 614;
  drawThaiText(page, "หมายเหตุ: ", {
    x: 40,
    y: convertY(remarksY),
    size: 10,
    font: boldFont,
    color: rgb(0.16, 0.15, 0.14),
  });

  const remarksLines = (note.remarks || "ส่งของเรียบร้อยแล้ว\nฝากขาย").split("\n");
  remarksLines.forEach((line) => {
    drawThaiText(page, line, {
      x: 92,
      y: convertY(remarksY),
      size: 10,
      font: regularFont,
      color: rgb(0.34, 0.33, 0.31),
    });
    remarksY += 15;
  });

  // --- FOOTER BOXES AND SIGNATURE STAMP OVERLAYS ---
  const footerTopY = 672;
  const footerHeight = 120;
  const footerBottomY = footerTopY + footerHeight;

  // 1. Recipient Box (Left)
  page.drawRectangle({
    x: 40,
    y: convertY(footerBottomY),
    width: 240,
    height: footerHeight,
    borderColor: stoneMainBorderColor,
    borderWidth: 0.75,
  });

  drawThaiText(page, "ผู้รับสินค้า", {
    x: 140,
    y: convertY(footerTopY + 16),
    size: 11,
    font: boldFont,
    align: "center",
  });

  page.drawLine({
    start: { x: 60, y: convertY(footerTopY + 70) },
    end: { x: 220, y: convertY(footerTopY + 70) },
    thickness: 0.5,
    color: stoneLightDividerColor,
    dashArray: [3, 3],
  });

  drawThaiText(page, "(........................................................)", {
    x: 140,
    y: convertY(footerTopY + 86),
    size: 10,
    font: regularFont,
    color: rgb(0.47, 0.44, 0.42),
    align: "center",
  });

  drawThaiText(page, "วันที่ ......./......./.......", {
    x: 140,
    y: convertY(footerTopY + 104),
    size: 10,
    font: regularFont,
    color: rgb(0.47, 0.44, 0.42),
    align: "center",
  });

  // 2. Sender Box (Right) with Overlapping Stamp and Handwritten Signature
  page.drawRectangle({
    x: 295.28,
    y: convertY(footerBottomY),
    width: 260,
    height: footerHeight,
    borderColor: stoneMainBorderColor,
    borderWidth: 0.75,
  });

  drawThaiText(page, "ผู้ส่งสินค้า", {
    x: 425.28,
    y: convertY(footerTopY + 16),
    size: 11,
    font: boldFont,
    align: "center",
  });

  // SIGNATURE OVERLAY (Centered in the upper center of Sender Box context)
  try {
    const signatureUrl = getAssetUrl("signature.png");
    const sigBytes = await fetchImageBytes(signatureUrl);
    const sigImg = await pdfDoc.embedPng(sigBytes);
    const { width: sOrigW, height: sOrigH } = sigImg.scale(1);
    
    const maxSigW = 160;
    const maxSigH = 42;
    const sigScale = Math.min(maxSigW / sOrigW, maxSigH / sOrigH);
    const sW = sOrigW * sigScale;
    const sH = sOrigH * sigScale;

    // Centered at X = 425.28, Y around footerTopY + 48
    page.drawImage(sigImg, {
      x: 425.28 - sW / 2,
      y: convertY(footerTopY + 48 + sH / 2),
      width: sW,
      height: sH,
    });
  } catch (err) {
    console.warn("Skipped signature overlay on PDF:", err);
  }

  // Printed Rep Name
  drawThaiText(page, `(..... ${REPRESENTATIVE_NAME} .....)`, {
    x: 425.28,
    y: convertY(footerTopY + 86),
    size: 10,
    font: boldFont,
    align: "center",
  });

  // Date Label
  drawThaiText(page, "วันที่ ......./......./.......", {
    x: 425.28,
    y: convertY(footerTopY + 104),
    size: 10,
    font: regularFont,
    color: rgb(0.47, 0.44, 0.42),
    align: "center",
  });

  // COMPANY STAMP ROTATE & SCALE OVERLAY (Slightly overlapping on right/bottom)
  try {
    const stampUrl = getAssetUrl("company-stamp.png");
    const stampBytes = await fetchImageBytes(stampUrl);
    const stampImg = await pdfDoc.embedPng(stampBytes);
    const { width: stOrigW, height: stOrigH } = stampImg.scale(1);

    const maxStampW = 90;
    const maxStampH = 90;
    const stampScale = Math.min(maxStampW / stOrigW, maxStampH / stOrigH);
    const stW = stOrigW * stampScale;
    const stH = stOrigH * stampScale;

    // Right aligned with borders
    const stampX = 555.28 - stW - 12;
    const stampY = convertY(footerBottomY - 10);

    page.drawImage(stampImg, {
      x: stampX,
      y: stampY,
      width: stW,
      height: stH,
      opacity: 0.85,
    });
  } catch (err) {
    console.warn("Skipped stamp overlay on PDF:", err);
  }

  // 3. Output raw generated PDF binaries
  return await pdfDoc.save();
}
