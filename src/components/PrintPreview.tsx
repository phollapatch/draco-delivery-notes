import { DeliveryNote } from "../types";
import { bahttext } from "../utils/bahttext";
import { exportSingleNoteToExcel, triggerFileDownload } from "../utils/excel";
import { 
  REPRESENTATIVE_NAME,
  getAssetUrl
} from "../utils/assets";

interface PrintPreviewProps {
  note: DeliveryNote;
  onClose: () => void;
}

export default function PrintPreview({ note, onClose }: PrintPreviewProps) {
  const customBahtText = bahttext(note.netAmount);
  
  // Format Date to DD.MM.YY (e.g. 17.06.69)
  const formatDocumentDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const yearStr = d.getFullYear().toString();
    const shortYear = yearStr.substring(yearStr.length - 2);
    return `${day}.${month}.${shortYear}`;
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const bytes = exportSingleNoteToExcel(note);
    triggerFileDownload(bytes, `DeliveryNote_${note.documentNo}.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-50 overflow-y-auto px-4 py-8 flex flex-col items-center">
      {/* Action Bar (Not shown in print) */}
      <div className="w-full max-w-4xl bg-stone-900 border border-amber-500/30 rounded-xl p-4 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <div className="text-left">
          <h3 className="text-lg font-bold text-amber-400">ใบตรวจทาน / สั่งพิมพ์ (Draco Invoice Preview)</h3>
          <p className="text-xs text-stone-400">ตัวอย่างจำลองเสมือนกระดาษใบส่งของจริง (พิมพ์ภาษาไทย 100% คมชัด)</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <button
            id="btn-trigger-excel"
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2v5H8z"/><path d="M12 11h2v7h-2z"/><path d="M16 15h2v3h-2z"/></svg>
            โหลดไฟล์ Excel (.xlsx)
          </button>
          <button
            id="btn-trigger-print"
            onClick={handleNativePrint}
            className="px-4 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-lg cursor-pointer hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            พิมพ์เอกสารทันที
          </button>
          <button
            id="btn-close-print"
            onClick={onClose}
            className="px-4 py-2.5 bg-stone-800 text-stone-200 font-semibold rounded-lg cursor-pointer hover:bg-stone-700 hover:text-white transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* PAPER ENVELOPE (Perfect A4 Proportions: 210mm x 297mm) */}
      <div 
        id="print-section"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-stone-950 p-12 relative shadow-2xl border border-stone-200 flex flex-col justify-between font-sans print:m-0 print:p-8 print:shadow-none print:border-none"
      >
        <div>
          {/* 1. Header Row */}
          <div className="flex items-start gap-6 pb-6">
            {/* Logo Badge */}
            <div className="w-20 h-28 shrink-0 flex items-center justify-center">
              <img 
                src={getAssetUrl("logo.png")} 
                alt="Bunny Corp Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Address Columns */}
            <div className="text-left pt-2 flex-grow">
              <h1 className="text-2xl font-black tracking-tight text-neutral-900 leading-none pb-1 font-sans">
                บริษัท บันนี่ คอร์ป จำกัด
              </h1>
              <p className="text-sm font-medium text-neutral-600 font-sans">
                1323 / 1 ซอยลาดพร้าว 94 (ปัญจมิตร) แขวงพลับพลา
              </p>
              <p className="text-sm font-medium text-neutral-600 font-sans leading-none">
                เขตวังทองหลาง กรุงเทพฯ 10310
              </p>
            </div>
          </div>

          {/* Title Area */}
          <div className="text-center pt-2 pb-6">
            <h2 className="text-2xl font-extrabold tracking-wide text-neutral-900 border-b-2 border-neutral-900 inline-block px-8 pb-1">
              ใบส่งสินค้า
            </h2>
          </div>

          {/* 2. Customer & Document Description Blocks */}
          <div className="grid grid-cols-12 gap-4 pb-8 text-sm">
            {/* Customer Box */}
            <div className="col-span-7 border border-stone-400 p-4 rounded text-left flex flex-col justify-start min-h-[110px]">
              <div className="mb-1">
                <span className="font-bold underline">ลูกค้า :</span>{" "}
                <span className="font-semibold text-neutral-900">{note.customerName}</span>
              </div>
              <div className="mb-2 flex-grow">
                <span className="font-bold">ที่อยู่ :</span>{" "}
                <span className="text-neutral-700 whitespace-pre-line leading-relaxed">{note.address}</span>
              </div>
              <div className="pt-1 border-t border-dotted border-stone-300">
                <span className="font-bold">T.</span> {note.phone}
              </div>
            </div>

            {/* Document stats */}
            <div className="col-span-5 border border-stone-400 rounded grid grid-rows-4 text-left min-h-[110px]">
              <div className="grid grid-cols-12 border-b border-stone-400 items-center px-3">
                <span className="col-span-4 font-bold">เลขที่ :</span>
                <span className="col-span-8 font-extrabold text-neutral-900 text-base">{note.documentNo}</span>
              </div>
              <div className="grid grid-cols-12 border-b border-stone-400 items-center px-3">
                <span className="col-span-4 font-bold">วันที่ :</span>
                <span className="col-span-8 font-semibold text-neutral-800">{formatDocumentDate(note.date)}</span>
              </div>
              <div className="grid grid-cols-12 border-b border-stone-400 items-center px-3">
                <span className="col-span-4 font-bold text-xs leading-none">อ้างอิง :</span>
                <span className="col-span-8 font-medium text-neutral-700">{note.reference || "PO/B"}</span>
              </div>
              <div className="grid grid-cols-12 items-center px-3 text-stone-400 text-xs">
                {/* Empty bottom cell for spacing match */}
                <span></span>
              </div>
            </div>
          </div>

          {/* 3. Items Ledger Grid Table */}
          <div className="border border-stone-400 rounded overflow-hidden">
            <table className="w-full table-fixed text-sm border-collapse text-left">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-400 text-neutral-800 font-bold h-10">
                  <th className="w-[6%] text-center border-r border-stone-300">ลำดับ</th>
                  <th className="w-[14%] text-center border-r border-stone-300">รหัสสินค้า</th>
                  <th className="w-[36%] px-3 border-r border-stone-300">รายการ</th>
                  <th className="w-[10%] text-center border-r border-stone-300">จำนวน</th>
                  <th className="w-[10%] text-center border-r border-stone-300">หน่วยนับ</th>
                  <th className="w-[11%] text-right pr-3 border-r border-stone-300">หน่วยละ</th>
                  <th className="w-[13%] text-right pr-3">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {/* Fixed size grid: we render 9 slots mimicking continuous rows */}
                {Array.from({ length: 9 }).map((_, i) => {
                  const item = note.items[i];
                  return (
                    <tr 
                      key={i} 
                      className={`h-9 border-b border-stone-200 border-dotted hover:bg-neutral-50/50 transition-colors`}
                    >
                      {/* Column Index */}
                      <td className="text-center border-r border-stone-300 font-mono text-stone-500">
                        {item ? i + 1 : ""}
                      </td>
                      
                      {/* Product ID suffix */}
                      <td className="text-center border-r border-stone-300 text-stone-600 font-mono text-xs">
                        {item ? item.productId.replace("PROD-", "") : ""}
                      </td>
                      
                      {/* Item description */}
                      <td className="px-3 border-r border-stone-300 text-stone-800 align-middle">
                        {item ? (
                          <div className="flex flex-col justify-center leading-tight">
                            <span className="font-semibold text-neutral-900">{item.productName}</span>
                            {item.note && (
                              <span className="text-xs font-medium text-stone-500 italic">
                                {item.note}
                              </span>
                            )}
                          </div>
                        ) : ""}
                      </td>
                      
                      {/* Quantity */}
                      <td className="text-center border-r border-stone-300 font-mono font-bold text-neutral-800">
                        {item ? item.qty : ""}
                      </td>
                      
                      {/* Unit label */}
                      <td className="text-center border-r border-stone-300 text-neutral-700">
                        {item ? item.unit : ""}
                      </td>
                      
                      {/* Price Per Unit */}
                      <td className="text-right pr-3 border-r border-stone-300 font-mono text-stone-700">
                        {item ? (item.unitPrice === 0 ? "0.00" : item.unitPrice.toFixed(2)) : ""}
                      </td>
                      
                      {/* Row Total Amount */}
                      <td className="text-right pr-3 font-mono font-semibold text-neutral-900">
                        {item ? (item.amount === 0 ? "0.00" : item.amount.toFixed(2)) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 4. TOTAL CALCULATIONS BLOCK */}
          <div className="grid grid-cols-12 border border-t-0 border-stone-400 rounded-b mt-0 text-sm overflow-hidden min-h-[96px]">
            {/* Thai Baht text in Gray block on left */}
            <div className="col-span-7 bg-stone-100 p-4 flex items-center justify-center border-r border-stone-400 relative">
              <span className="text-stone-400 absolute text-xs left-2 top-2 font-mono">บาทตัวอักษร</span>
              <span className="font-black text-neutral-900 text-base underline decoration-double decoration-stone-400">
                {customBahtText}
              </span>
            </div>

            {/* Calculations lines on right */}
            <div className="col-span-5 grid grid-rows-4 select-none">
              <div className="grid grid-cols-12 border-b border-stone-300 items-center px-4">
                <span className="col-span-7 font-bold text-neutral-700">รวมเงิน</span>
                <span className="col-span-5 text-right font-mono text-neutral-900">{note.totalAmount.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-12 border-b border-stone-300 items-center px-4">
                <span className="col-span-7 font-medium text-neutral-500">ส่วนลด</span>
                <span className="col-span-5 text-right font-mono text-stone-500">
                  {note.discount > 0 ? note.discount.toFixed(2) : "-"}
                </span>
              </div>
              <div className="grid grid-cols-12 border-b border-stone-300 items-center px-4">
                <span className="col-span-7 text-xs font-medium text-neutral-600">ยอดหลังหักส่วนลด</span>
                <span className="col-span-5 text-right font-mono text-neutral-700">{(note.totalAmount - note.discount).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-12 bg-neutral-50 items-center px-4 text-base font-extrabold text-neutral-900">
                <span className="col-span-7 font-black">ยอดสุทธิ</span>
                <span className="col-span-5 text-right font-mono underline decoration-double">{note.netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Remarks display under calculated box */}
          <div className="text-left mt-4 text-sm max-w-lg mb-8">
            <span className="font-bold text-stone-800">หมายเหตุ: </span>
            <span className="text-stone-600 font-medium whitespace-pre-line leading-relaxed">
              {note.remarks || "ส่งของเรียบร้อยแล้ว\nฝากขาย"}
            </span>
          </div>
        </div>

        {/* 5. FOOTER ASSIGNMENTS & SIGNATURE STAMP OVERLAYS */}
        <div className="grid grid-cols-2 gap-8 text-sm mt-auto z-10 pt-4">
          {/* Receiver Area */}
          <div className="border border-stone-400 p-4 rounded text-center relative flex flex-col justify-between h-40 bg-white/50">
            <span className="font-extrabold text-stone-800 underline">ผู้รับสินค้า</span>
            <div className="border-t border-dotted border-stone-400 mx-4 mt-16"></div>
            <div className="flex justify-between px-6 text-xs text-stone-500 pt-2 font-mono">
              <span>(........................................................)</span>
              <span>วันที่ ......./......./.......</span>
            </div>
          </div>

          {/* Sender Area with Stamp & Signature */}
          <div className="border border-stone-400 p-4 rounded text-center relative flex flex-col justify-between h-40 bg-white/50">
            <span className="font-extrabold text-stone-800 underline">ผู้ส่งสินค้า</span>
            
            {/* SIGNATURE OVERLAY (Directly above the printed name) */}
            <div className="absolute inset-x-0 top-8 flex items-center justify-center pointer-events-none z-10">
              <div className="w-48 h-16 opacity-90 rotate-[-2deg] flex items-center justify-center">
                <img 
                  src={getAssetUrl("signature.png")} 
                  alt="Signature" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Representative Printed Name Label */}
            <div className="z-20 pt-16">
              <span className="text-xs text-neutral-800 font-extrabold font-sans">
                (..... {REPRESENTATIVE_NAME} .....)
              </span>
            </div>

            {/* COMPANY RUBBER BLUE STAMP OVERLAY (Stamped BELOW the name on the right side) */}
            <div className="absolute right-2 bottom-1 pointer-events-none z-20 flex items-center justify-center">
              <div className="w-36 h-12 opacity-85 rotate-[4deg]">
                <img 
                  src={getAssetUrl("company-stamp.png")} 
                  alt="Company Stamp" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="flex justify-center px-6 text-xs text-stone-500 font-mono z-20">
              <span>วันที่ ......./......./.......</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
