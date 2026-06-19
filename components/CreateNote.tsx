import React, { useState, useEffect } from "react";
import { Customer, Product, DeliveryNote, DeliveryNoteItem } from "../types";
import { generateNextDocNo } from "../utils/db";
import { Search, UserCheck, Plus, Trash2, Calendar, FileText, Percent, ShieldCheck } from "lucide-react";

interface CreateNoteProps {
  customers: Customer[];
  products: Product[];
  onGenerate: (note: DeliveryNote) => void;
}

export default function CreateNote({ customers, products, onGenerate }: CreateNoteProps) {
  // Main Fields
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [docNo, setDocNo] = useState("");
  const [reference, setReference] = useState("PO/B");
  const [remarks, setRemarks] = useState("ส่งของเรียบร้อยแล้ว\nฝากขาย");
  const [discount, setDiscount] = useState<number>(0);

  // Customer State
  const [custSearch, setCustSearch] = useState("");
  const [customerSelected, setCustomerSelected] = useState<Customer | null>(null);
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);

  // Ledger Items Rows State
  // Default to a pre-filled item "Draco MX 4 cap." with quantity 10 of price 290.00
  // matching exactly the first screenshot so they can instantly hit "Generate"!
  const [items, setItems] = useState<DeliveryNoteItem[]>([
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
  ]);

  // Handle re-generating document number if the date changes
  useEffect(() => {
    const nextNo = generateNextDocNo(selectedDate);
    setDocNo(nextNo);
  }, [selectedDate]);

  // Set default customer as first one to simplify to ZERO CLICKS for the general case!
  useEffect(() => {
    if (customers.length > 0 && !customerSelected) {
      setCustomerSelected(customers[0]);
    }
  }, [customers, customerSelected]);

  // Customer Filtering
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(custSearch.toLowerCase())
  );

  const handleSelectCustomer = (c: Customer) => {
    setCustomerSelected(c);
    setCustSearch(c.name);
    setIsCustDropdownOpen(false);
  };

  // Items Modification Helpers
  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const updated = [...items];
    updated[index].productId = prod.id;
    updated[index].productName = prod.name;
    updated[index].unit = prod.unit;
    updated[index].unitPrice = prod.price;
    updated[index].amount = updated[index].qty * prod.price;
    setItems(updated);
  };

  const handleItemQtyChange = (index: number, newQty: number) => {
    if (isNaN(newQty) || newQty < 0) return;
    const updated = [...items];
    updated[index].qty = newQty;
    updated[index].amount = newQty * updated[index].unitPrice;
    setItems(updated);
  };

  const handleItemNoteChange = (index: number, noteText: string) => {
    const updated = [...items];
    updated[index].note = noteText;
    setItems(updated);
  };

  const addItemRow = (productId?: string) => {
    const defaultProd = productId ? products.find(p => p.id === productId) : products[0];
    if (!defaultProd) return;

    const newRow: DeliveryNoteItem = {
      no: items.length + 1,
      productId: defaultProd.id,
      productName: defaultProd.name,
      qty: 1,
      unit: defaultProd.unit,
      unitPrice: defaultProd.price,
      amount: defaultProd.price,
    };
    setItems([...items, newRow]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return; // Retain at least one row
    const filtered = items.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      no: idx + 1
    }));
    setItems(filtered);
  };

  // Math totals calculation
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const netAmount = Math.max(0, totalAmount - discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerSelected) {
      alert("กรุณาเลือกรายชื่อลูกค้า");
      return;
    }

    const compiledNote: DeliveryNote = {
      documentNo: docNo || generateNextDocNo(selectedDate),
      date: selectedDate,
      customerId: customerSelected.id,
      customerName: customerSelected.name,
      address: customerSelected.address,
      phone: customerSelected.phone,
      reference: reference,
      remarks: remarks,
      items: items.filter(item => item.qty > 0),
      totalAmount: totalAmount,
      discount: discount,
      netAmount: netAmount,
      createdAt: new Date().toISOString()
    };

    onGenerate(compiledNote);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="text-left space-y-6">
        
        {/* ROW 1: DOCUMENT SERIALS CARD */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Calendar Select */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> วันที่เอกสาร (Date)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono transition"
            />
          </div>

          {/* Reference Order ID */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500/80" /> อ้างอิงเลขที่ใบสั่งซื้อ (Ref)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO/B"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* Auto increment document number */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> เลขที่ใบส่งของ (Auto Number)
            </label>
            <div className="w-full bg-stone-950/80 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 font-black font-mono tracking-wider text-sm pointer-events-none flex items-center justify-between">
              <span>{docNo || "คำนวณอัตโนมัติ..."}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-sans">
                ห้ามแก้ไขแก้
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2: SEARCH CUSTOMER ACCORDION */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-800">
            <h3 className="font-bold text-white text-base">ขั้นตอนที่ 1: ค้นหาและเลือกลูกค้า</h3>
            {customerSelected && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> เลือกเรียบร้อย
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={custSearch}
              onFocus={() => setIsCustDropdownOpen(true)}
              onChange={(e) => {
                setCustSearch(e.target.value);
                setIsCustDropdownOpen(true);
              }}
              placeholder="พิมพ์ชื่อลูกค้า คลินิก หรือร้านขายยาเพื่อค้นหา..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm focus:border-amber-500 focus:outline-none transition"
            />

            {/* Float Dropdown match list */}
            {isCustDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-stone-950 border border-stone-800 rounded-xl max-h-60 overflow-y-auto z-30 shadow-2xl divide-y divide-stone-900">
                {filteredCustomers.length === 0 ? (
                  <p className="p-4 text-stone-500 text-sm">ไม่พบรายชื่อลูกค้านี้...</p>
                ) : (
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-3.5 hover:bg-stone-900 transition-colors flex flex-col cursor-pointer"
                    >
                      <span className="font-bold text-white text-sm">{c.name}</span>
                      <span className="text-xs text-stone-400 truncate mt-1">{c.address.replace("\n", " ")}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Prefilled Display Customer Panel */}
          {customerSelected && (
            <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 text-sm">
              <div className="md:col-span-8 space-y-1">
                <p className="text-stone-500 text-xs font-bold uppercase tracking-wide">ผู้รับจัดส่ง / ส่งที่</p>
                <h4 className="font-extrabold text-amber-400">{customerSelected.name}</h4>
                <p className="text-stone-300 text-xs whitespace-pre-line leading-relaxed">{customerSelected.address}</p>
              </div>
              <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-stone-800 pt-3 md:pt-0 md:pl-4 flex flex-col justify-center">
                <p className="text-stone-500 text-xs font-bold uppercase tracking-wide">เบอร์ติดต่อสายด่วน</p>
                <p className="text-white font-bold font-mono text-base mt-0.5">{customerSelected.phone || "-"}</p>
              </div>
            </div>
          )}
        </div>

        {/* ROW 3: PRODUCT ITEM ROWS BUILDER */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-stone-800">
            <h3 className="font-bold text-white text-base">ขั้นตอนที่ 2: รายการของที่จะส่ง (Products Ledger)</h3>
            
            {/* Quick insert popular items */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-stone-400 self-center pr-1">สินค้าด่วน:</span>
              {products.slice(0, 3).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addItemRow(p.id)}
                  className="bg-stone-800 hover:bg-stone-700 hover:text-amber-400 text-stone-300 px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  + {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-stone-950 border border-stone-800 rounded-xl p-4 grid grid-cols-12 gap-3 items-end relative hover:border-stone-700 transition"
              >
                {/* Product list Select */}
                <div className="col-span-12 sm:col-span-4 text-left">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                    ชื่อสินค้า/ยารายการที่ {index + 1}
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemProductChange(index, e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price.toFixed(2)} บาท / {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inline Comment/Note */}
                <div className="col-span-12 sm:col-span-3 text-left">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                    หมายเหตุกำกับรายการ (e.g. ** ฝากขาย)
                  </label>
                  <input
                    type="text"
                    value={item.note || ""}
                    onChange={(e) => handleItemNoteChange(index, e.target.value)}
                    placeholder="ใส่หมายเหตุรายการหากจำเป็น"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                  />
                </div>

                {/* Quantity Input */}
                <div className="col-span-4 sm:col-span-2 text-left">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                    จำนวน (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.qty || ""}
                    onChange={(e) => handleItemQtyChange(index, parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none text-center"
                  />
                </div>

                {/* Unit ReadOnly */}
                <div className="col-span-3 sm:col-span-1 text-left">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                    หน่วย
                  </label>
                  <div className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-2 py-2 text-stone-400 text-xs text-center">
                    {item.unit}
                  </div>
                </div>

                {/* Amount Row calculation */}
                <div className="col-span-5 sm:col-span-1.5 text-right font-mono pr-2">
                  <span className="block text-[10px] font-bold text-stone-500 uppercase mb-1 text-right">
                    ยอดเงิน
                  </span>
                  <span className="text-white text-sm font-bold">
                    {item.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Delete Row button */}
                <div className="col-span-12 sm:col-span-0.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length <= 1}
                    className="p-2 text-stone-500 hover:text-red-400 disabled:opacity-20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addItemRow()}
            className="w-full py-2.5 border border-dashed border-stone-800 hover:border-amber-400 text-stone-400 hover:text-amber-400 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all mt-2"
          >
            <Plus className="w-4 h-4" /> เพิ่มสินค้าแถวใหม่
          </button>
        </div>

        {/* SECTION 4: SUMMARIES CARD */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Remarks block */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl md:col-span-6 text-left">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              หมายเหตุท้ายบิล (Remarks)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-300 text-sm focus:border-amber-500 focus:outline-none transition"
              placeholder="ข้อความหมายเหตุ เช่น ส่งของเรียบร้อยแล้ว, ของฝากขาย..."
            />
          </div>

          {/* Total panel */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl md:col-span-6 flex flex-col justify-between text-left space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-stone-400">
                <span>ยอดเงินสินค้าก่อนหักส่วนลด:</span>
                <span className="font-mono text-white font-bold">
                  {totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                </span>
              </div>
              
              {/* Discount Entry */}
              <div className="flex justify-between items-center text-sm py-1 border-t border-b border-stone-800">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-500" /> มอบส่วนลด:
                </span>
                <div className="flex items-center gap-1.5 max-w-[120px]">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discount || ""}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1 text-right text-sm text-yellow-400 font-bold focus:outline-none"
                  />
                  <span className="text-stone-400 text-xs">บาท</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-stone-800 pt-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">ยอดสุทธิรวมทั้งสิ้น</span>
                <p className="text-[10px] text-stone-500 mt-0.5">รวมภาษีมูลค่าเพิ่มและสแตมป์</p>
              </div>
              <span className="text-2xl font-black text-amber-500 font-mono">
                {netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
              </span>
            </div>
          </div>
        </div>

        {/* FAST INVOICE GEN ACTION BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black tracking-wide text-base sm:text-lg rounded-2xl cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition transform active:scale-98"
          >
            <ShieldCheck className="w-5.5 h-5.5" />
            ตกลงสร้างใบส่งของทันที (Generate Delivery Note in &lt; 30s)
          </button>
        </div>
      </form>
    </div>
  );
}
