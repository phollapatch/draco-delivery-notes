import { Customer, Product, DeliveryNote } from "../types";

const CUSTOMERS_KEY = "draco_customers";
const PRODUCTS_KEY = "draco_products";
const NOTES_KEY = "draco_notes";

// Sample Thai Customer Records from User Screenshots
const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "CUST-001",
    name: "ร้านขายยาศาลายา 2",
    address: "เลขที่ 224/1 ตำบลลำตาเสา\nอำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170",
    phone: "063-465-3542",
  },
  {
    id: "CUST-002",
    name: "วังพยอมเภสัช",
    address: "34 ห้อง 8 ต.บ้านสร้าง\nอ.บางปะอิน จ.พระนครศรีอยุธยา 13170",
    phone: "080-180-6879",
  },
  {
    id: "CUST-003",
    name: "วันชัยโอสถ",
    address: "19 19/1 ถนนอู่ทอง ต.หอรัตนไชย\nอ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา 13000",
    phone: "035-251-596",
  },
  {
    id: "CUST-004",
    name: "คลินิกเวชกรรมบางใหญ่",
    address: "99/4 หมูที่ 6 ถนนกาญจนาภิเษก ตำบลเสาธงหิน\nอำเภอบางใหญ่ จังหวัดนนทบุรี 11140",
    phone: "02-903-1289",
  }
];

// Sample Product Catalog
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "PROD-MX4",
    name: "Draco MX 4 cap.",
    unit: "กล่อง",
    price: 290.00,
  },
  {
    id: "PROD-MX2TS",
    name: "Draco MX 2 cap. (ทดลองใช้)",
    unit: "ซอง",
    price: 0.00,
  },
  {
    id: "PROD-AG10",
    name: "Draco Active Gold 10s",
    unit: "กล่อง",
    price: 490.00,
  },
  {
    id: "PROD-HBR",
    name: "Bunny Herb Balm Red",
    unit: "ขวด",
    price: 85.00,
  },
  {
    id: "PROD-HBG",
    name: "Bunny Herb Balm Green",
    unit: "ขวด",
    price: 85.00,
  }
];

// Seed Historical Delivery Notes Matching Screenshots
const DEFAULT_NOTES: DeliveryNote[] = [
  {
    documentNo: "BC2606/0001",
    date: "2026-06-15",
    customerId: "CUST-001",
    customerName: "ร้านขายยาศาลายา 2",
    address: "เลขที่ 224/1 ตำบลลำตาเสา\nอำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170",
    phone: "063-465-3542",
    reference: "PO/B",
    remarks: "ส่งของเรียบร้อยแล้ว\nฝากขาย",
    items: [
      {
        no: 1,
        productId: "PROD-MX4",
        productName: "Draco MX 4 cap.",
        qty: 15,
        unit: "กล่อง",
        unitPrice: 290.00,
        amount: 4350.00,
        note: ""
      }
    ],
    totalAmount: 4350.00,
    discount: 0,
    netAmount: 4350.00,
    createdAt: "2026-06-15T09:30:00.000Z"
  },
  {
    documentNo: "BC2606/0002",
    date: "2026-06-16",
    customerId: "CUST-002",
    customerName: "วังพยอมเภสัช",
    address: "34 ห้อง 8 ต.บ้านสร้าง\nอ.บางปะอิน จ.พระนครศรีอยุธยา 13170",
    phone: "080-180-6879",
    reference: "PO/B",
    remarks: "ส่งของเรียบร้อยแล้ว\nฝากขาย",
    items: [
      {
        no: 1,
        productId: "PROD-MX4",
        productName: "Draco MX 4 cap.",
        qty: 10,
        unit: "กล่อง",
        unitPrice: 290.00,
        amount: 2900.00,
        note: "** Draco MX 2 cap. (ทดลองใช้)"
      },
      {
        no: 2,
        productId: "PROD-MX2TS",
        productName: "Draco MX 2 cap. (ทดลองใช้)",
        qty: 2,
        unit: "ซอง",
        unitPrice: 0.00,
        amount: 0.00,
      }
    ],
    totalAmount: 2900.00,
    discount: 0,
    netAmount: 2900.00,
    createdAt: "2026-06-16T14:15:00.000Z"
  },
  {
    documentNo: "BC2606/0003",
    date: "2026-06-17",
    customerId: "CUST-003",
    customerName: "วันชัยโอสถ",
    address: "19 19/1 ถนนอู่ทอง ต.หอรัตนไชย\nอ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา 13000",
    phone: "035-251-596",
    reference: "PO/B",
    remarks: "ส่งของเรียบร้อยแล้ว\nฝากขาย",
    items: [
      {
        no: 1,
        productId: "PROD-MX4",
        productName: "Draco MX 4 cap.",
        qty: 10,
        unit: "กล่อง",
        unitPrice: 290.00,
        amount: 2900.00,
        note: ""
      }
    ],
    totalAmount: 2900.00,
    discount: 0,
    netAmount: 2900.00,
    createdAt: "2026-06-17T11:00:00.000Z"
  }
];

export function getCustomers(): Customer[] {
  const store = localStorage.getItem(CUSTOMERS_KEY);
  if (!store) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
    return DEFAULT_CUSTOMERS;
  }
  try {
    return JSON.parse(store);
  } catch (e) {
    return DEFAULT_CUSTOMERS;
  }
}

export function saveCustomers(customers: Customer[]) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function getProducts(): Product[] {
  const store = localStorage.getItem(PRODUCTS_KEY);
  if (!store) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    return JSON.parse(store);
  } catch (e) {
    return DEFAULT_PRODUCTS;
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getNotes(): DeliveryNote[] {
  const store = localStorage.getItem(NOTES_KEY);
  if (!store) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(DEFAULT_NOTES));
    return DEFAULT_NOTES;
  }
  try {
    return JSON.parse(store);
  } catch (e) {
    return DEFAULT_NOTES;
  }
}

export function saveNote(note: DeliveryNote) {
  const notes = getNotes();
  // Check for duplicate document number
  const existingIdx = notes.findIndex(n => n.documentNo === note.documentNo);
  if (existingIdx >= 0) {
    notes[existingIdx] = note;
  } else {
    notes.unshift(note); // Add to the top
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function deleteNote(documentNo: string) {
  const notes = getNotes();
  const filtered = notes.filter(n => n.documentNo !== documentNo);
  localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
}

/**
 * Automap calculation: generate an auto-incremented document number format BCYYMM/0000.
 * e.g. Year 2026, Month 06 -> BC2606/0001, BC2606/0002, etc.
 * Resets each month automatically depending on document series of the given date.
 */
export function generateNextDocNo(selectedDate: string): string {
  const dateObj = selectedDate ? new Date(selectedDate) : new Date();
  const fullYearStr = dateObj.getFullYear().toString();
  const shortYear = fullYearStr.substring(2); // e.g. "26"
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0"); // e.g. "06"
  const prefix = `BC${shortYear}${monthStr}/`;

  const notes = getNotes();
  
  // Filter notes that belong to the same prefix month-year series
  const currentMonthNotes = notes.filter(n => n.documentNo.startsWith(prefix));
  
  let maxSeq = 0;
  for (const note of currentMonthNotes) {
    const parts = note.documentNo.split("/");
    if (parts.length === 2) {
      const seqNum = parseInt(parts[1]);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }
  
  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, "0"); // e.g. "0004"
  return `${prefix}${seqStr}`;
}
