import React from "react";
import { DeliveryNote, Customer, Product } from "../types";
import { FileSpreadsheet, Users, Package, Clock, Eye, Download, Share2 } from "lucide-react";

interface DashboardProps {
  notes: DeliveryNote[];
  customers: Customer[];
  products: Product[];
  onViewNote: (note: DeliveryNote) => void;
  onDownloadNote: (note: DeliveryNote) => void;
  onShareNote: (note: DeliveryNote) => void;
  onNavigateToCreate: () => void;
}

export default function Dashboard({
  notes,
  customers,
  products,
  onViewNote,
  onDownloadNote,
  onShareNote,
  onNavigateToCreate,
}: DashboardProps) {
  
  // Format Thai Baht Currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(val);
  };

  const totalSalesSum = notes.reduce((sum, n) => sum + n.netAmount, 0);
  const recentNotes = notes.slice(0, 5); // Take top 5

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-950 border border-amber-500/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="text-left">
          <h2 className="text-xl font-bold text-amber-400 sm:text-2xl">แผงควบคุมระบบใบตรวจสอบส่งของ (Draco Admin Portal)</h2>
          <p className="text-stone-300 text-sm mt-1">
            ระบบจัดตารางใบส่งของอัตโนมัติ รวดเร็ว ทันใจ คีย์ข้อมูลเสร็จภายใน 30 วินาที
          </p>
        </div>
        <button
          onClick={onNavigateToCreate}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-102 transition-transform shrink-0"
        >
          + สร้างใบส่งสินค้าด่วน
        </button>
      </div>

      {/* METRIC CARD CELLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total revenue */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex items-center gap-4 hover:border-amber-500/20 transition-all shadow-md">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">ยอดขายรวมของใบส่ง</p>
            <h3 className="text-xl font-black text-white mt-1 font-mono">{formatCurrency(totalSalesSum)}</h3>
          </div>
        </div>

        {/* Total Delivery Notes */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex items-center gap-4 hover:border-amber-500/20 transition-all shadow-md">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">ใบส่งของทั้งหมด</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1 font-mono">{notes.length} ใบ</h3>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex items-center gap-4 hover:border-amber-500/20 transition-all shadow-md">
          <div className="p-3 bg-stone-800 text-white rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">ลูกค้าจดทะเบียน</p>
            <h3 className="text-2xl font-black text-white mt-1 font-mono">{customers.length} บัญชี</h3>
          </div>
        </div>

        {/* Total Catalog Products */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex items-center gap-4 hover:border-amber-500/20 transition-all shadow-md">
          <div className="p-3 bg-stone-800 text-amber-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">รายการสินค้าใสต๊อก</p>
            <h3 className="text-2xl font-black text-white mt-1 font-mono">{products.length} รายการ</h3>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTION TABLE GRID */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl text-left">
        <div className="flex justify-between items-center pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">เอกสารล่าสุด (Recent Delivery Notes)</h3>
          </div>
          <span className="text-xs bg-stone-800 text-amber-400 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            แสดง {recentNotes.length} ล่าสุด
          </span>
        </div>

        {recentNotes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-stone-400 text-sm">ยังไม่มีการสร้างเอกสารในประวัติ</p>
            <button
              onClick={onNavigateToCreate}
              className="mt-4 px-4 py-2 bg-stone-800 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-sm cursor-pointer hover:bg-stone-700 transition"
            >
              เขียนใบส่งของตอนนี้เลย
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm text-stone-300">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase font-bold h-10">
                  <th className="font-semibold text-left">รหัสเอกสาร</th>
                  <th className="font-semibold text-left">วันที่ออก</th>
                  <th className="font-semibold text-left">ชื่อลูกค้า</th>
                  <th className="font-semibold text-right">ยอดสุทธิ (บาท)</th>
                  <th className="font-semibold text-center">จัดการด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50">
                {recentNotes.map((note) => (
                  <tr key={note.documentNo} className="hover:bg-stone-800/30 h-14 transition-colors">
                    {/* Doc no */}
                    <td className="font-bold text-amber-400 font-mono">
                      {note.documentNo}
                    </td>
                    
                    {/* Event Date */}
                    <td className="text-stone-400 text-xs">
                      {new Date(note.date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    
                    {/* Customer */}
                    <td className="font-semibold text-white max-w-[180px] truncate">
                      {note.customerName}
                    </td>
                    
                    {/* Grand net */}
                    <td className="text-right font-mono font-bold text-stone-100">
                      {note.netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    
                    {/* One-click Action Shortcuts */}
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewNote(note)}
                          title="ดูและตั่งค่าพิมพ์"
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg cursor-pointer transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDownloadNote(note)}
                          title="ดาวน์โหลด PDF ทันที"
                          className="p-1.5 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-400 rounded-lg cursor-pointer transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onShareNote(note)}
                          title="แชร์ด่วนไปยังสื่อสังคมออนไลน์"
                          className="p-1.5 bg-stone-800 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 rounded-lg cursor-pointer transition"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
