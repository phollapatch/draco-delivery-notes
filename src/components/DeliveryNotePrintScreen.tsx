import React, { useState, useEffect, useRef } from "react";
import { DeliveryNote } from "../types";
import { bahttext } from "../utils/bahttext";
import { REPRESENTATIVE_NAME, getConfiguredAsset } from "../utils/assets";
import { ArrowLeft, Printer, Share2, ExternalLink } from "lucide-react";

interface DeliveryNotePrintScreenProps {
  note: DeliveryNote;
  onBack: () => void;
  onShare: () => void;
}

const waitForImages = (container: HTMLElement): Promise<void> => {
  const images = Array.from(container.querySelectorAll("img"));
  const promises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });
  return Promise.all(promises).then(() => {});
};

export default function DeliveryNotePrintScreen({ note, onBack, onShare }: DeliveryNotePrintScreenProps) {
  const customBahtText = bahttext(note.netAmount);
  const [isInIframe, setIsInIframe] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

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

  const logoUrl = getConfiguredAsset("logo");
  const signatureUrl = getConfiguredAsset("signature");
  const stampUrl = getConfiguredAsset("stamp");

  // Create exactly 9 rows for the table
  const maxRows = 9;
  const tableRows = Array.from({ length: maxRows }).map((_, idx) => {
    const item = note.items?.[idx];
    return {
      index: idx + 1,
      item,
    };
  });

  const handlePrint = async () => {
    if (printContainerRef.current) {
      await waitForImages(printContainerRef.current);
    }
    window.print();
  };

  const handleOpenNewWindow = () => {
    let fullUrl = window.location.origin + window.location.pathname + window.location.hash;
    try {
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(note))));
      const baseHash = window.location.hash.split("?")[0];
      fullUrl = window.location.origin + window.location.pathname + baseHash + "?import=" + encodeURIComponent(serialized);
    } catch (e) {
      console.warn("Failed to serialize note for new window link:", e);
    }
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col print:bg-white print:text-stone-950 font-sans select-none print:p-0">
      
      {/* 1. Print Screen Navigation/Action Bar */}
      <div className="w-full bg-stone-950 border-b border-stone-850 py-4 px-6 gap-4 flex flex-col md:flex-row justify-between items-center no-print sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-stone-850 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition cursor-pointer flex items-center justify-center"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-extrabold text-amber-500">ใบตรวจทาน / สั่งพิมพ์ (Draco Invoice Print Screen)</h3>
            <p className="text-[11px] text-stone-400">สั่งพิมพ์โดยตรงผ่านบราวเซอร์ (พิมพ์ภาษาไทย 100% คมชัด Layout ไม่เพี้ยน)</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onShare}
            className="px-4 py-2.5 bg-stone-850 hover:bg-stone-800 text-stone-200 font-semibold rounded-xl cursor-pointer hover:text-white transition flex items-center justify-center gap-2 text-xs"
          >
            <Share2 className="w-4 h-4" /> แชร์ลิงก์
          </button>
          {isInIframe ? (
            <button
              onClick={handleOpenNewWindow}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl cursor-pointer shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 transition flex items-center justify-center gap-2 text-xs animate-shimmer"
            >
              <ExternalLink className="w-4 h-4 animate-bounce" /> เปิดหน้าสั่งพิมพ์ในแท็บใหม่เพื่อกดเซฟ
            </button>
          ) : (
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition flex items-center justify-center gap-2 text-xs"
            >
              <Printer className="w-4.5 h-4.5" /> พิมพ์หรือเซฟเป็น PDF (Save to PDF)
            </button>
          )}
        </div>
      </div>

      {/* 2. Page Content Sheet */}
      <div className="flex-grow flex items-col items-center justify-center p-8 bg-stone-900 print:bg-white print:p-0 overflow-auto">
        <div className="max-w-4xl w-full flex flex-col items-center">
          
          {/* Iframe Notice Warning */}
          {isInIframe && (
            <div className="no-print bg-amber-500/10 border border-amber-500/30 text-amber-200 px-5 py-3 rounded-xl mb-6 text-xs font-semibold leading-relaxed flex flex-col sm:flex-row items-center justify-between gap-3 w-[190mm]">
              <div className="flex items-start gap-2">
                <span className="text-base">⚠️</span>
                <span>ระบบเบราว์เซอร์จะบล็อกคำสั่งสั่งพิมพ์ (Print) เมื่อรันภายใน iFrame Sandbox ของเครื่องมือพรีวิวนี้ กรุณาคลิกปุ่มสีส้มเพื่อเปิดหน้าต่างหลัก หรือแท็บเบราว์เซอร์ใหม่ในการบันทึกเป็น PDF</span>
              </div>
              <button
                onClick={handleOpenNewWindow}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg cursor-pointer transition text-[11px] whitespace-nowrap shrink-0 shadow"
              >
                เปิดในแท็บใหม่ 🔗
              </button>
            </div>
          )}
        
        {/* Style Tag to handle perfect standard print overrides */}
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              color: #111827 !important;
            }
            .no-print {
              display: none !important;
            }
            .delivery-note-page-content {
              width: 190mm !important;
              height: 277mm !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }
          }
          
          .logo {
            width: 22mm !important;
            height: auto !important;
            object-fit: contain !important;
          }

          .signature-img {
            max-width: 45mm !important;
            max-height: 14mm !important;
            object-fit: contain !important;
          }

          .stamp-img {
            max-width: 45mm !important;
            max-height: 16mm !important;
            object-fit: contain !important;
          }
        ` }} />

        {/* Floating Paper Area */}
        <div ref={printContainerRef} className="delivery-note-page-content w-[190mm] h-[277mm] bg-white text-stone-950 p-[3mm] flex flex-col justify-between shadow-2xl border border-stone-200 box-sizing: border-box select-text">
          
          <div>
            {/* A. Header Row */}
            <div className="flex items-start gap-[5mm] h-[26mm] border-b-0 border-stone-300 pb-0">
              {/* Logo */}
              <div className="w-[22mm] h-[26mm] flex-shrink-0 flex items-center justify-start">
                <img 
                  src={logoUrl} 
                  alt="Bunny Corp Logo" 
                  className="logo"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Company Info */}
              <div className="text-left pt-[1.5mm] flex-grow">
                <h1 className="text-[21px] font-black text-stone-950 leading-tight pb-[1mm]" style={{ fontFamily: "Sarabun, sans-serif" }}>
                  บริษัท บันนี่ คอร์ป จำกัด
                </h1>
                <p className="text-[12px] font-medium text-stone-600 leading-normal" style={{ fontFamily: "Sarabun, sans-serif" }}>
                  1323 / 1 ซอยลาดพร้าว 94 (ปัญจมิตร) แขวงพลับพลา เขตวังทองหลาง กรุงเทพฯ 10310
                </p>
              </div>
            </div>

            {/* B. Centered Document Title */}
            <div className="text-center h-[12mm] flex items-center justify-center mt-[1.5mm] mb-[2mm]">
              <span 
                className="text-[21px] font-bold text-stone-950 inline-block border-b-2 border-stone-900 uppercase tracking-wide px-[24px] pb-[3px]" 
                style={{ fontFamily: "Sarabun, sans-serif", borderBottomWidth: "2px" }}
              >
                ใบส่งสินค้า
              </span>
            </div>

            {/* C. Customer & Document Box */}
            <div className="flex h-[36mm] border border-stone-400 rounded-md overflow-hidden text-[12.5px] mb-[3mm]">
              {/* Customer Box (Left) */}
              <div className="w-[58%] p-[3.5mm] flex flex-col justify-between border-r border-stone-400 text-left h-full">
                <div>
                  <div className="mb-[1.5mm] truncate">
                    <span className="font-bold underline text-stone-700">ลูกค้า :</span>{" "}
                    <span className="font-extrabold text-stone-950 text-[13px] pl-[1mm]" style={{ fontFamily: "Sarabun, sans-serif" }}>
                      {note.customerName}
                    </span>
                  </div>
                  <div className="text-stone-700 leading-relaxed max-h-[14mm] overflow-hidden" style={{ fontFamily: "Sarabun, sans-serif" }}>
                    <span className="font-bold text-stone-700">ที่อยู่ :</span> {note.address}
                  </div>
                </div>
                <div className="pt-[1.5mm] border-t border-dotted border-stone-300">
                  <span className="font-bold text-stone-700">เบอร์ติดต่อ :</span>{" "}
                  <span className="font-bold text-stone-950 font-mono pl-[1mm]">{note.phone || "-"}</span>
                </div>
              </div>

              {/* Document Info Box (Right) */}
              <div className="w-[42%] flex flex-col h-full select-none">
                <div className="flex items-center text-left px-[4mm] h-[8.5mm] border-b border-stone-400">
                  <span className="font-bold text-stone-700 w-[35%]">เลขที่ :</span>
                  <span className="font-black text-stone-950 text-[14px] w-[65%] text-right font-mono">
                    {note.documentNo}
                  </span>
                </div>
                <div className="flex items-center text-left px-[4mm] h-[8.5mm] border-b border-stone-400">
                  <span className="font-bold text-stone-700 w-[35%]">วันที่ :</span>
                  <span className="font-extrabold text-stone-900 w-[65%] text-right" style={{ fontFamily: "Sarabun, sans-serif" }}>
                    {formatDocumentDate(note.date)}
                  </span>
                </div>
                <div className="flex items-center text-left px-[4mm] h-[8.5mm] border-b border-stone-400">
                  <span className="font-bold text-stone-700 w-[35%]">อ้างอิง :</span>
                  <span className="font-extrabold text-stone-600 w-[65%] text-right" style={{ fontFamily: "Sarabun, sans-serif" }}>
                    {note.reference || "PO/B"}
                  </span>
                </div>
                <div className="bg-stone-50 flex-grow border-b-0"></div>
              </div>
            </div>

            {/* D. Product Table Grid */}
            <div className="border border-stone-400 rounded-md overflow-hidden mb-0">
              <table className="w-full table-fixed text-[12px] border-collapse text-left">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-400 text-stone-700 font-bold h-[9mm]">
                    <th className="w-[6%] text-center border-r border-stone-400">ลำดับ</th>
                    <th className="w-[14%] text-center border-r border-stone-400">รหัสสินค้า</th>
                    <th className="w-[36%] px-[3mm] border-r border-stone-400">รายการรายละเอียด</th>
                    <th className="w-[10%] text-center border-r border-stone-400">จำนวน</th>
                    <th className="w-[10%] text-center border-r border-stone-400">หน่วยนับ</th>
                    <th className="w-[11%] text-right pr-[3mm] border-r border-stone-400">หน่วยละ</th>
                    <th className="w-[13%] text-right pr-[3mm]">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr 
                      key={row.index} 
                      className="h-[9.5mm] border-b border-stone-200 border-dotted hover:bg-stone-50/50"
                    >
                      {/* Lat-No Column */}
                      <td className="text-center border-r border-stone-400 font-mono text-stone-500 font-semibold select-none">
                        {row.item ? row.index : ""}
                      </td>
                      
                      {/* Product ID Suffix */}
                      <td className="text-center border-r border-stone-400 font-mono text-stone-600 font-semibold select-none">
                        {row.item ? row.item.productId.replace("PROD-", "") : ""}
                      </td>
                      
                      {/* Item details */}
                      <td className="px-[3mm] border-r border-stone-400 text-stone-900 align-middle">
                        {row.item ? (
                          <div className="flex flex-col justify-center leading-normal">
                            <span className="font-extrabold text-stone-950" style={{ fontFamily: "Sarabun, sans-serif" }}>
                              {row.item.productName}
                            </span>
                            {row.item.note && (
                              <span className="text-[10px] font-medium text-stone-500 italic mt-[0.2mm]" style={{ fontFamily: "Sarabun, sans-serif" }}>
                                {row.item.note}
                              </span>
                            )}
                          </div>
                        ) : ""}
                      </td>
                      
                      {/* Quantity */}
                      <td className="text-center border-r border-stone-400 font-bold text-stone-950 text-[13px]" style={{ fontFamily: "Sarabun, sans-serif" }}>
                        {row.item ? row.item.qty : ""}
                      </td>
                      
                      {/* Unit name */}
                      <td className="text-center border-r border-stone-400 text-stone-800 font-semibold" style={{ fontFamily: "Sarabun, sans-serif" }}>
                        {row.item ? row.item.unit : ""}
                      </td>
                      
                      {/* Unit Price */}
                      <td className="text-right pr-[3mm] border-r border-stone-400 font-mono text-stone-600 font-semibold">
                        {row.item ? (row.item.unitPrice === 0 ? "0.00" : row.item.unitPrice.toFixed(2)) : ""}
                      </td>
                      
                      {/* Sub-Total Row Amount */}
                      <td className="text-right pr-[3mm] font-mono font-bold text-stone-950 text-[12.5px]">
                        {row.item ? (row.item.amount === 0 ? "0.00" : row.item.amount.toFixed(2)) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* E. Calculations total block */}
            <div className="flex h-[28mm] border border-t-0 border-stone-400 rounded-b-md text-[12.5px] overflow-hidden">
              {/* Baht wording translation block (left) */}
              <div className="w-[58%] bg-stone-100 p-[3mm] flex items-center justify-center border-r border-stone-400 relative select-none">
                <span className="text-stone-400 absolute text-[9px] left-[3mm] top-[2mm] font-mono">บาทตัวอักษร</span>
                <span className="font-black text-stone-900 text-[13.5px] underline decoration-double decoration-stone-400" style={{ fontFamily: "Sarabun, sans-serif" }}>
                  {customBahtText}
                </span>
              </div>

              {/* Math lines block (right) */}
              <div className="w-[42%] flex flex-col h-full select-none">
                <div className="flex items-center px-[4mm] h-[7mm] border-b border-stone-300">
                  <span className="font-bold text-stone-700 w-[55%]">รวมเงิน</span>
                  <span className="font-bold text-stone-950 w-[45%] text-right font-mono pr-[1mm]">{note.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center px-[4mm] h-[7mm] border-b border-stone-300">
                  <span className="font-medium text-stone-500 w-[55%]">ส่วนลด</span>
                  <span className="font-bold text-stone-500 w-[45%] text-right font-mono pr-[1mm]">
                    {note.discount > 0 ? note.discount.toFixed(2) : "-"}
                  </span>
                </div>
                <div className="flex items-center px-[4mm] h-[7mm] border-b border-stone-300">
                  <span className="text-[11px] font-medium text-stone-600 w-[55%]">ยอดหลังหักส่วนลด</span>
                  <span className="font-bold text-stone-700 w-[45%] text-right font-mono pr-[1mm]">{(note.totalAmount - note.discount).toFixed(2)}</span>
                </div>
                <div className="flex items-center bg-stone-50/50 px-[4mm] h-[7mm] border-b-0">
                  <span className="font-extrabold text-stone-950 w-[55%] font-sans">ยอดสุทธิ</span>
                  {/* Underline below only, not crossed by border or through the text */}
                  <span 
                    className="font-black text-stone-950 w-[45%] text-right font-mono pb-[1px] pr-[1mm] inline-block border-b-2 border-double border-stone-950"
                    style={{ borderBottomStyle: "double", borderBottomWidth: "3px" }}
                  >
                    {note.netAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* F. Memo / Remarks notes */}
            <div className="text-left mt-[3.5mm] text-[12.5px] max-w-2xl mb-4">
              <div className="font-bold text-stone-700">หมายเหตุ :</div>
              <div className="text-stone-600 font-semibold whitespace-pre-line leading-relaxed pl-[4mm]" style={{ fontFamily: "Sarabun, sans-serif" }}>
                {note.remarks || "ส่งของเรียบร้อยแล้ว\nฝากขาย"}
              </div>
            </div>
          </div>

          {/* G. Signatures & Stamp block */}
          <div className="grid grid-cols-2 gap-[10mm] text-[12.5px] z-10 pt-[1.5mm]">
            {/* Recipient box */}
            <div className="border border-stone-400 p-[3mm] rounded-md text-center relative flex flex-col justify-between h-[38mm] bg-white">
              <span className="font-extrabold text-stone-800 underline" style={{ fontFamily: "Sarabun, sans-serif" }}>ผู้รับสินค้า</span>
              <div className="border-t border-dotted border-stone-400 mx-[4mm] mt-[14mm]"></div>
              <div className="flex justify-between px-[5mm] text-[11px] text-stone-500 pt-[1.5mm] font-mono">
                <span>(........................................................)</span>
                <span>วันที่ ......./......./.......</span>
              </div>
            </div>

            {/* Deliverer / Stamp box */}
            <div className="border border-stone-400 p-[2mm] rounded-md text-center relative flex flex-col justify-between h-[38mm] bg-white overflow-visible">
              <span className="font-extrabold text-stone-800 underline text-[12px] h-[5mm]" style={{ fontFamily: "Sarabun, sans-serif" }}>ผู้ส่งสินค้า</span>
              
              {/* Handwritten Signature Layer - ABOVE stamp */}
              <div className="flex items-center justify-center h-[11mm] relative z-10">
                <img 
                  src={signatureUrl} 
                  alt="Signature" 
                  className="signature-img"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Representative Printed Name Label */}
              <div className="z-20 h-[4mm] leading-none">
                <span className="text-[11px] text-stone-900 font-extrabold" style={{ fontFamily: "Sarabun, sans-serif" }}>
                  (..... {REPRESENTATIVE_NAME} .....)
                </span>
              </div>

              {/* COMPANY RUBBER BLUE STAMP OVERLAY - layered below name, fits inside the box */}
              <div className="flex items-center justify-center h-[12mm] relative z-5">
                <img 
                  src={stampUrl} 
                  alt="Company Stamp" 
                  className="stamp-img rotate-[-20deg] transform translate-x-[10mm] translate-y-[-1px]"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex justify-center text-[10px] text-stone-500 font-mono h-[3mm] leading-none">
                <span>วันที่ ......./......./.......</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}
