import React, { useState, useEffect } from "react";
import { Customer, Product, DeliveryNote } from "./types";
import { 
  getCustomers, 
  saveCustomers, 
  getProducts, 
  saveProducts, 
  getNotes, 
  saveNote, 
  deleteNote 
} from "./utils/db";
import { generateDeliveryNotePdf } from "./utils/pdfGenerator";
import { uploadPdfToR2, downloadPdfBytes } from "./utils/r2Storage";

// Component imports
import Dashboard from "./components/Dashboard";
import CreateNote from "./components/CreateNote";
import HistoryList from "./components/HistoryList";
import Settings from "./components/Settings";
import PrintPreview from "./components/PrintPreview";

// Icons
import { LayoutDashboard, FileSpreadsheet, History, Settings2, Sparkles, CheckCircle2, Download, Printer, Share2, ArrowLeft } from "lucide-react";

type TabId = "dashboard" | "create" | "history" | "settings";

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<TabId>("create"); // Default to Create to hit the <30s target!
  const [activePrintNote, setActivePrintNote] = useState<DeliveryNote | null>(null);

  // Core Data Lists State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notes, setNotes] = useState<DeliveryNote[]>([]);

  // Workflow post-generation Success state
  const [generatedSuccessNote, setGeneratedSuccessNote] = useState<DeliveryNote | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Initialize data stores
  useEffect(() => {
    // Clean up bloated legacy PDF base64 entries in localStorage to restore 100% storage quota instantly
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("draco_pdf_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Failed to clear legacy PDF keys:", e);
    }

    setCustomers(getCustomers());
    setProducts(getProducts());
    setNotes(getNotes());
  }, []);

  // Update lists and save back to persistence
  const handleUpdateCustomers = (updatedCusts: Customer[]) => {
    setCustomers(updatedCusts);
    saveCustomers(updatedCusts);
  };

  const handleUpdateProducts = (updatedProds: Product[]) => {
    setProducts(updatedProds);
    saveProducts(updatedProds);
  };

  const handleResetDatabase = () => {
    localStorage.clear(); // Wipe everything
    setCustomers(getCustomers()); // Fresh seed
    setProducts(getProducts());
    setNotes(getNotes());
  };

  // Asynchronous core workflow: click "Generate Delivery Note"
  const handleGenerateDeliveryNote = async (newNote: DeliveryNote) => {
    setIsGeneratingPdf(true);
    setGeneratedSuccessNote(null);
    try {
      // 1. Generate Binary PDF bytes using pdf-lib
      const pdfBytes = await generateDeliveryNotePdf(newNote);

      // 2. Upload to Cloudflare R2 or persistent local store
      const finalPdfUrl = await uploadPdfToR2(newNote.documentNo, pdfBytes);

      // 3. Complete model: inject correct storage URL and save
      const compiledNote = {
        ...newNote,
        pdfUrl: finalPdfUrl
      };

      saveNote(compiledNote);
      setNotes(getNotes()); // Refresh lists

      // 4. Reveal immediate action sucess screen
      setGeneratedSuccessNote(compiledNote);
    } catch (err: any) {
      console.error(err);
      alert(`การออกใบส่งสินค้าเกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDeleteNote = (docNo: string) => {
    deleteNote(docNo);
    setNotes(getNotes()); // Refresh lists
  };

  // Immediate Download PDF action
  const handleDownloadNote = async (note: DeliveryNote) => {
    setIsGeneratingPdf(true);
    try {
      const bytes = await generateDeliveryNotePdf(note);
      downloadPdfBytes(note.documentNo, bytes);
    } catch (e: any) {
      alert(`ดาวน์โหลดล้มเหลว: ${e.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Trigger web sharing / modal fallback 
  const handleShareNote = (note: DeliveryNote) => {
    const rawUrl = note.pdfUrl || window.location.href;
    const shareText = `ใบส่งสินค้า Draco เลขที่ ${note.documentNo}\nผู้รับ: ${note.customerName}\nดาวน์โหลด PDF: ${rawUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Draco Delivery Note ${note.documentNo}`,
        text: shareText,
        url: rawUrl,
      }).catch(err => console.warn("Share popup closed", err));
    } else {
      // Prompt modal fallback link copy
      navigator.clipboard.writeText(shareText);
      alert(`คัดลอกข้อความและลิงก์แชร์สำหรับคุณเรียบร้อย:\n\n${shareText}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      
      {/* GLOBAL BANNER NAV BAR */}
      <header className="border-b border-stone-900 bg-stone-950 sticky top-0 z-40 select-none print:hidden">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 font-black flex items-center justify-center text-stone-950 text-base shadow-md shadow-amber-500/20">
              🐰
            </div>
            <div className="text-left leading-none">
              <span className="font-sans text-sm font-black uppercase tracking-widest text-amber-500">
                DRACO INVOICING
              </span>
              <p className="text-[9px] text-stone-500 font-bold tracking-wider mt-0.5">BUNNY CORP LIMITED</p>
            </div>
          </div>

          {/* Quick Stats overview badge */}
          <div className="hidden sm:flex items-center gap-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-full text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-stone-400 font-semibold">กู้ฐานสำเนา Draco:</span>
            <span className="text-amber-400 font-bold font-mono">{notes.length} ออกบิล</span>
          </div>
        </div>
      </header>

      {/* TABS SELECT NAVIGATION BAR */}
      <nav className="bg-stone-950/80 border-b border-stone-900 backdrop-blur sticky top-16 z-35 select-none py-2 px-4 print:hidden">
        <div className="mx-auto max-w-7xl flex items-center justify-start overflow-x-auto gap-2 no-scrollbar">
          <button
            onClick={() => { setActiveTab("create"); setGeneratedSuccessNote(null); }}
            className={`cursor-pointer px-4.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide shrink-0 transition flex items-center gap-2 ${
              activeTab === "create"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> สร้างใบส่งด่วน (&lt;30s)
          </button>
          
          <button
            onClick={() => { setActiveTab("history"); setGeneratedSuccessNote(null); }}
            className={`cursor-pointer px-4.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide shrink-0 transition flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" /> คลังคุมประวัติใบส่ง
          </button>

          <button
            onClick={() => { setActiveTab("dashboard"); setGeneratedSuccessNote(null); }}
            className={`cursor-pointer px-4.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide shrink-0 transition flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> แดชบอร์ดสรุปผล
          </button>

          <button
            onClick={() => { setActiveTab("settings"); setGeneratedSuccessNote(null); }}
            className={`cursor-pointer px-4.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide shrink-0 transition flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <Settings2 className="w-4 h-4" /> นำเข้า Excel / หลังบ้าน
          </button>
        </div>
      </nav>

      {/* SYSTEM LOADER BANNER */}
      {isGeneratingPdf && (
        <div className="bg-amber-500 text-stone-950 text-xs font-bold py-2 px-4 shadow text-center flex items-center justify-center gap-2 animate-pulse print:hidden select-none">
          <Sparkles className="w-4 h-4 animate-spin" /> กำลังประมวลผลและคอมไพล์ฐานใบส่งด่วน PDF ของคุณ กรุณารอสักครู่...
        </div>
      )}

      {/* CORE WORKSPACE APPLICATION WINDOW */}
      <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 print:p-0">
        
        {/* POST-GENERATION FAST-WORKFLOW PANEL DISPLAY */}
        {generatedSuccessNote && (
          <div className="bg-stone-900 border-2 border-amber-500/40 p-6 rounded-3xl shadow-2xl mb-8 border-dashed flex flex-col md:flex-row justify-between items-center gap-6 print:hidden animate-fade-in text-left">
            <div className="space-y-2 flex-grow">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-6.5 h-6.5" />
                <h3 className="font-extrabold text-xl leading-none">สร้างเอกสารเรียบร้อยแล้ว ! (Invoice Ready)</h3>
              </div>
              <h4 className="text-lg font-black text-white font-mono">
                เลขคิวบิลจัดส่งอัตโนมัติ: <span className="text-amber-400">{generatedSuccessNote.documentNo}</span>
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed max-w-lg">
                ใบจัดส่งเข้าหาลูกค้า <strong>{generatedSuccessNote.customerName}</strong> ยอดสุทธิ <strong>{generatedSuccessNote.netAmount.toLocaleString("th-TH")} บาท</strong> ลิงก์เก็บ R2 เมลแอร์ประวัติทำการสำเร็จ
              </p>
            </div>

            {/* Quick Action options right there inside checkout flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => setActivePrintNote(generatedSuccessNote)}
                className="px-5 py-3.5 bg-amber-500 text-stone-950 font-black rounded-2xl cursor-pointer hover:bg-amber-400 flex items-center justify-center gap-2 transition whitespace-nowrap"
              >
                <Printer className="w-4.5 h-4.5" /> สั่งพิมพ์ใบนี้
              </button>
              <button
                onClick={() => handleDownloadNote(generatedSuccessNote)}
                className="px-5 py-3.5 bg-stone-800 text-amber-400 border border-amber-500/30 font-bold rounded-2xl cursor-pointer hover:bg-stone-700 flex items-center justify-center gap-2 transition whitespace-nowrap"
              >
                <Download className="w-4.5 h-4.5" /> โหลดไฟล์ PDF
              </button>
              <button
                onClick={() => handleShareNote(generatedSuccessNote)}
                className="px-5 py-3.5 bg-stone-800 text-stone-100 font-bold rounded-2xl cursor-pointer hover:bg-stone-700 flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4.5 h-4.5" /> ส่งออกLINE/แชร์
              </button>
            </div>
          </div>
        )}

        {/* TAB PORTALS DESCRIPTOR */}
        <section className={`transition-opacity duration-200 ${isGeneratingPdf ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
          {activeTab === "create" && (
            <CreateNote
              customers={customers}
              products={products}
              onGenerate={handleGenerateDeliveryNote}
            />
          )}

          {activeTab === "history" && (
            <HistoryList
              notes={notes}
              onViewNote={(note) => setActivePrintNote(note)}
              onDownloadNote={handleDownloadNote}
              onShareNote={handleShareNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === "dashboard" && (
            <Dashboard
              notes={notes}
              customers={customers}
              products={products}
              onViewNote={(note) => setActivePrintNote(note)}
              onDownloadNote={handleDownloadNote}
              onShareNote={handleShareNote}
              onNavigateToCreate={() => setActiveTab("create")}
            />
          )}

          {activeTab === "settings" && (
            <Settings
              customers={customers}
              products={products}
              notes={notes}
              onUpdateCustomers={handleUpdateCustomers}
              onUpdateProducts={handleUpdateProducts}
              onResetDatabase={handleResetDatabase}
            />
          )}
        </section>
      </main>

      {/* MODAL PRINT-RENDERER POPUP OVERLAY */}
      {activePrintNote && (
        <PrintPreview
          note={activePrintNote}
          onClose={() => setActivePrintNote(null)}
        />
      )}

      {/* FOOTER METRICS INFO */}
      <footer className="border-t border-stone-900 bg-stone-950 py-6 text-center text-xs text-stone-500 select-none print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-2">
          <p className="font-semibold text-stone-400">ระบบใบส่งของกำลังทำงาน (Draco Billing Terminal Suite)</p>
          <div className="flex justify-center items-center gap-2 font-mono text-[10px]">
            <span>ENV: Cloudflare Pages Ready</span>
            <span className="text-stone-700">•</span>
            <span>STORAGE: Cloudflare R2 Mock Bucket</span>
            <span className="text-stone-700">•</span>
            <span>BUILD: Node/Vite 1.0</span>
          </div>
          <p className="pt-2 text-stone-600">
            ลิขสิทธิ์ถูกต้อง © 2026 Draco - บริษัท บันนี่ คอร์ป จำกัด. สงวนลิขสิทธิ์.
          </p>
        </div>
      </footer>
    </div>
  );
}
