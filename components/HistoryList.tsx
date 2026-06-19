import React, { useState } from "react";
import { DeliveryNote } from "../types";
import { Search, Eye, Download, Share2, Trash2, Globe, Send, MessageCircle, Mail } from "lucide-react";

interface HistoryListProps {
  notes: DeliveryNote[];
  onViewNote: (note: DeliveryNote) => void;
  onDownloadNote: (note: DeliveryNote) => void;
  onShareNote: (note: DeliveryNote) => void;
  onDeleteNote: (docNo: string) => void;
}

export default function HistoryList({
  notes,
  onViewNote,
  onDownloadNote,
  onShareNote,
  onDeleteNote,
}: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShareNote, setSelectedShareNote] = useState<DeliveryNote | null>(null);

  // Filter notes by search query
  const filteredNotes = notes.filter(
    (n) =>
      n.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateStr = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleMobileShare = async (note: DeliveryNote) => {
    // Construct default message
    const docUrl = note.pdfUrl || window.location.href;
    const shareText = `ใบส่งสินค้าเลขที่ ${note.documentNo}\nลูกค้า: ${note.customerName}\nยอดสุทธิ: ${note.netAmount.toLocaleString("th-TH")} บาท`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Draco Delivery Note ${note.documentNo}`,
          text: shareText,
          url: docUrl,
        });
      } catch (err) {
        console.warn("Native Web Share aborted or failed:", err);
        setSelectedShareNote(note); // Fallback to social modal popup
      }
    } else {
      setSelectedShareNote(note); // Open custom social sharing links popup
    }
  };

  // Build social sharing URLs
  const getShareUrl = (medium: string, note: DeliveryNote) => {
    const rawUrl = note.pdfUrl || "https://draco-delivery.pages.dev";
    // Embed the pdf viewer link
    const pdfUrl = rawUrl.startsWith("data:") 
      ? `(PDF Document Embedded - รหัส ${note.documentNo})` 
      : rawUrl;
    
    const textMsg = `บริษัท บันนี่ คอร์ป จำกัด ขอส่งแผนใบพาส่งของ เลขที่: ${note.documentNo}\nผู้รับ: ${note.customerName}\nยอดสุทธิ: ${note.netAmount.toLocaleString("th-TH")} บาท\nดาวน์โหลดเอกสาร PDF ได้ที่: ${pdfUrl}`;

    switch (medium) {
      case "line":
        return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(rawUrl.startsWith("data:") ? window.location.origin : rawUrl)}&text=${encodeURIComponent(textMsg)}`;
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg + " " + (rawUrl.startsWith("data:") ? "" : rawUrl))}`;
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(rawUrl.startsWith("data:") ? window.location.origin : rawUrl)}&text=${encodeURIComponent(textMsg)}`;
      case "gmail":
        return `mailto:?subject=${encodeURIComponent(`ใบส่งสินค้า Draco - เลขที่ ${note.documentNo}`)}&body=${encodeURIComponent(textMsg)}`;
      default:
        return "#";
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* SEARCH AND FILTER HEADLINE */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">ค้นหาประวัติใบส่งของ (Search Archives)</h3>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาด้วย เลขเครื่องที่ หรือ ค้นชื่อลูกค้า เช่น ร้านขายยา, BC26/..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm focus:border-amber-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* DOCUMENT LIST CARDS (GRID VIEW FOR MOBILE, STICKY ROWS FOR DESKTOP) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-stone-950/60 border-b border-stone-800 flex justify-between items-center">
          <span className="font-bold text-white text-sm">เอกสารทั้งหมดที่พบล่าสุด</span>
          <span className="text-xs bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full font-mono">
            {filteredNotes.length} เอกสาร
          </span>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm bg-stone-900">
            ไม่พบเอกสารใบส่งสินค้าที่จับคู่กับการค้นหาของคุณ
          </div>
        ) : (
          <div className="divide-y divide-stone-800">
            {filteredNotes.map((note) => (
              <div
                key={note.documentNo}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-800/10 transition-colors"
              >
                {/* Visual Identity Left block */}
                <div className="space-y-1.5 flex-grow text-left">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-amber-400 text-base">
                      {note.documentNo}
                    </span>
                    <span className="text-[10px] bg-stone-800 text-stone-400 font-bold px-2 py-0.5 rounded font-mono">
                      {formatDateStr(note.date)}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                    {note.customerName}
                  </h4>
                  <p className="text-xs text-stone-400 truncate max-w-lg">
                    {note.address.replace("\n", " ")}
                  </p>
                </div>

                {/* Net totals and actions right block */}
                <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 border-stone-800/50 pt-3 md:pt-0 gap-1 min-w-[140px]">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wide">ยอดชำระสุทธิ</p>
                    <span className="font-mono text-lime-400 font-extrabold text-base">
                      {note.netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
                    </span>
                  </div>

                  {/* Actions Bar Shortcut */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      onClick={() => onViewNote(note)}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> ตรวจ
                    </button>
                    <button
                      onClick={() => onDownloadNote(note)}
                      className="px-3 py-2 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-400 text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> โหลด
                    </button>
                    <button
                      onClick={() => handleMobileShare(note)}
                      className="p-2 bg-stone-800 hover:bg-stone-700 hover:text-amber-400 text-stone-300 rounded-lg cursor-pointer transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`ยันยันลบเอกสารใบส่งเลขที่ ${note.documentNo} หรือไม่?`)) {
                          onDeleteNote(note.documentNo);
                        }
                      }}
                      className="p-2 bg-stone-800/30 hover:bg-red-950/40 text-stone-600 hover:text-red-400 rounded-lg cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POPUP SOCIAL SHARING MODAL FALLBACK */}
      {selectedShareNote && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl w-full max-w-md shadow-2xl text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <h4 className="text-amber-400 font-extrabold text-base">แชร์ประวัติบิลด่วน (Share Invoice)</h4>
              <button 
                onClick={() => setSelectedShareNote(null)}
                className="text-stone-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs text-stone-300">
              <p className="font-mono text-[11px] text-amber-500 font-bold mb-1">ลิงก์ตัวบิล PDF:</p>
              <div className="font-mono truncate bg-stone-900 p-2 rounded text-[10px] select-all mb-1 text-stone-400">
                {selectedShareNote.pdfUrl || "ในหน้าต่างเบราว์เซอร์เปรวิว"}
              </div>
              <p className="leading-relaxed">
                คลิกเลือกช่องทางด้านล่าง เพื่อเปิดแอปแชร์ลิงก์ส่งคีย์เข้าหาลูกค้าทันที
              </p>
            </div>

            {/* Social Share grid list */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <a
                href={getShareUrl("line", selectedShareNote)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#06C755] border border-[#06C755]/20 font-bold rounded-xl text-xs transition"
              >
                <Send className="w-4 h-4 shrink-0" /> LINE Chat
              </a>
              <a
                href={getShareUrl("whatsapp", selectedShareNote)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 font-bold rounded-xl text-xs transition"
              >
                <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
              </a>
              <a
                href={getShareUrl("telegram", selectedShareNote)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/20 font-bold rounded-xl text-xs transition"
              >
                <Send className="w-4 h-4 shrink-0" /> Telegram
              </a>
              <a
                href={getShareUrl("gmail", selectedShareNote)}
                className="flex items-center gap-2 p-3 bg-[#ea4335]/10 hover:bg-[#ea4335]/20 text-[#ea4335] border border-[#ea4335]/20 font-bold rounded-xl text-xs transition"
              >
                <Mail className="w-4 h-4 shrink-0" /> ส่งผ่าน Gmail
              </a>
            </div>

            <div className="pt-2 border-t border-stone-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedShareNote.pdfUrl || window.location.href);
                  alert("คัดลอกลิงก์เรียบร้อยแล้ว!");
                }}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold text-xs rounded-xl cursor-pointer transition text-center flex items-center justify-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" /> คัดลอกลิงก์บิลตรง (Copy URL)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
