export interface Customer {
  id: string; // CustomerID
  name: string; // CustomerName
  address: string; // Address
  phone: string; // Phone
}

export interface Product {
  id: string; // ProductID
  name: string; // ProductName
  unit: string; // Unit (e.g. กล่อง, ซอง, ชิ้น)
  price: number; // UnitPrice
}

export interface DeliveryNoteItem {
  no: number;
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
  note?: string; // Additional notes like ** (ฝากขาย) or ** (ทดลองใช้)
}

export interface DeliveryNote {
  documentNo: string; // BCYYMM/0000
  date: string; // YYYY-MM-DD for storage, formatted in PDF as DD.MM.YY
  customerId: string;
  customerName: string;
  address: string;
  phone: string;
  reference: string; // e.g. PO/B
  remarks: string; // e.g. ส่งของเรียบร้อยแล้ว, ฝากขาย
  items: DeliveryNoteItem[];
  totalAmount: number;
  discount: number;
  netAmount: number;
  pdfUrl?: string; // R2 URL or local base64/blob URL
  createdAt?: string;
}

export interface SystemStats {
  totalNotes: number;
  totalCustomers: number;
  totalProducts: number;
}
