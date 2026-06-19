import * as XLSX from "xlsx";
import { Customer, Product, DeliveryNote } from "../types";

/**
 * Parses customer data from an Excel file array buffer
 */
export function parseExcelCustomers(arrayBuffer: ArrayBuffer): Customer[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<any>(worksheet);

  return json.map((row, index) => {
    return {
      id: String(row.CustomerID || row.CustomerID || row.id || `CUST-${Date.now()}-${index}`),
      name: String(row.CustomerName || row.name || "").trim(),
      address: String(row.Address || row.address || "").trim(),
      phone: String(row.Phone || row.phone || "").trim(),
    };
  }).filter(c => c.name !== "");
}

/**
 * Parses product data from an Excel file array buffer
 */
export function parseExcelProducts(arrayBuffer: ArrayBuffer): Product[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<any>(worksheet);

  return json.map((row, index) => {
    const rawPrice = row.UnitPrice !== undefined ? row.UnitPrice : row.price;
    const price = typeof rawPrice === "number" ? rawPrice : parseFloat(rawPrice) || 0;
    
    return {
      id: String(row.ProductID || row.id || `PROD-${Date.now()}-${index}`),
      name: String(row.ProductName || row.name || "").trim(),
      unit: String(row.Unit || row.unit || "กล่อง").trim(),
      price: price,
    };
  }).filter(p => p.name !== "");
}

/**
 * Exports customers list to .xlsx file bytes
 */
export function exportCustomersToExcel(customers: Customer[]): Uint8Array {
  const wb = XLSX.utils.book_new();
  const data = customers.map(c => ({
    CustomerID: c.id,
    CustomerName: c.name,
    Address: c.address,
    Phone: c.phone,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

/**
 * Exports products list to .xlsx file bytes
 */
export function exportProductsToExcel(products: Product[]): Uint8Array {
  const wb = XLSX.utils.book_new();
  const data = products.map(p => ({
    ProductID: p.id,
    ProductName: p.name,
    Unit: p.unit,
    UnitPrice: p.price,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

/**
 * Exports delivery notes history list to .xlsx file bytes
 */
export function exportNotesToExcel(notes: DeliveryNote[]): Uint8Array {
  const wb = XLSX.utils.book_new();
  const flatData = notes.flatMap(note => {
    return note.items.map(item => ({
      DocumentNumber: note.documentNo,
      Date: note.date,
      CustomerID: note.customerId,
      CustomerName: note.customerName,
      Address: note.address,
      Phone: note.phone,
      Reference: note.reference,
      Remarks: note.remarks,
      ItemNo: item.no,
      ProductID: item.productId,
      ProductName: item.productName,
      Quantity: item.qty,
      Unit: item.unit,
      UnitPrice: item.unitPrice,
      Amount: item.amount,
      ItemNote: item.note || "",
      TotalAmount: note.totalAmount,
      Discount: note.discount,
      NetAmount: note.netAmount,
    }));
  });

  const ws = XLSX.utils.json_to_sheet(flatData);
  XLSX.utils.book_append_sheet(wb, ws, "DeliveryNotes");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

/**
 * Exports a single delivery note as a formatted Excel sheet
 */
export function exportSingleNoteToExcel(note: DeliveryNote): Uint8Array {
  const wb = XLSX.utils.book_new();
  
  const formattedDate = (() => {
    try {
      const d = new Date(note.date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return note.date;
    }
  })();

  const wsData: any[][] = [
    ["บริษัท บันนี่ คอร์ป จำกัด"],
    ["1323 / 1 ซอยลาดพร้าว 94 ( ปัญจมิตร ) แขวงพลับพลา เขตวังทองหลาง กรุงเทพฯ 10310"],
    [""],
    ["ใบส่งสินค้า"],
    [""],
    ["ลูกค้า :", note.customerName, "", "", "เลขที่บิล :", note.documentNo],
    ["ที่อยู่ :", note.address, "", "", "วันที่บิล :", formattedDate],
    ["เบอร์โทร :", note.phone, "", "", "อ้างอิง :", note.reference || "PO/B"],
    [""],
    ["ลำดับ", "รหัสสินค้า", "รายการสินค้า", "จำนวน", "หน่วยนับ", "หน่วยละ", "จำนวนเงิน"],
  ];

  note.items.forEach((item, index) => {
    wsData.push([
      index + 1,
      item.productId.replace("PROD-", ""),
      item.productName + (item.note ? ` (${item.note})` : ""),
      item.qty,
      item.unit,
      item.unitPrice,
      item.amount
    ]);
  });

  // pad to a clean minimum of 9 lines to mimic standard form look
  const padLength = Math.max(0, 9 - note.items.length);
  for (let i = 0; i < padLength; i++) {
    wsData.push(["", "", "", "", "", "", ""]);
  }

  wsData.push([""]);
  wsData.push(["", "", "", "", "", "รวมเงิน (Total)", note.totalAmount]);
  wsData.push(["", "", "", "", "", "ส่วนลด (Discount)", note.discount]);
  wsData.push(["", "", "", "", "", "หลังหักส่วนลด", note.totalAmount - note.discount]);
  wsData.push(["", "", "", "", "", "ยอดสุทธิ (Net Amount)", note.netAmount]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Custom Column Widths
  ws["!cols"] = [
    { wch: 8 },   // ลำดับ
    { wch: 15 },  // รหัสสินค้า
    { wch: 45 },  // รายการสินค้า
    { wch: 10 },  // จำนวน
    { wch: 10 },  // หน่วยนับ
    { wch: 12 },  // หน่วยละ
    { wch: 15 },  // จำนวนเงิน
  ];

  // Excel sheet names cannot contain forbidden characters ( \ / ? * : [ ] ) and must be <= 31 chars
  const cleanDocNo = note.documentNo.replace(/[\/\\?*:[\]]/g, "_");
  const sheetName = `Bill_${cleanDocNo}`.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

/**
 * Helper to download array buffer as a file in the browser
 */
export function triggerFileDownload(bytes: any, fileName: string) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
