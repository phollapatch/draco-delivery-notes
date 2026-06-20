import React, { useRef, useState } from "react";
import { Customer, Product, DeliveryNote } from "../types";
import { 
  parseExcelCustomers, 
  parseExcelProducts, 
  exportCustomersToExcel, 
  exportProductsToExcel, 
  exportNotesToExcel, 
  triggerFileDownload 
} from "../utils/excel";
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, RefreshCw, ShieldCheck, Image, Trash2, Check } from "lucide-react";

interface SettingsProps {
  customers: Customer[];
  products: Product[];
  notes: DeliveryNote[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onResetDatabase: () => void;
}

export default function Settings({
  customers,
  products,
  notes,
  onUpdateCustomers,
  onUpdateProducts,
  onResetDatabase,
}: SettingsProps) {
  const custInputRef = useRef<HTMLInputElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const [logoStatus, setLogoStatus] = useState<"stored" | "workspace" | "missing">("missing");
  const [stampStatus, setStampStatus] = useState<"stored" | "workspace" | "missing">("missing");
  const [sigStatus, setSigStatus] = useState<"stored" | "workspace" | "missing">("missing");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);

  // Check file presence on mount
  React.useEffect(() => {
    checkAssetStatus("logo.png", setLogoStatus, setLogoPreview);
    checkAssetStatus("company-stamp.png", setStampStatus, setStampPreview);
    checkAssetStatus("signature.png", setSigStatus, setSigPreview);
  }, []);

  const checkAssetStatus = async (
    filename: string,
    setStatus: (s: "stored" | "workspace" | "missing") => void,
    setPreview: (p: string | null) => void
  ) => {
    const localKey = "real_" + filename.replace(".", "_");
    const stored = localStorage.getItem(localKey);
    if (stored) {
      setStatus("stored");
      setPreview(stored);
      return;
    }

    try {
      const response = await fetch(`/assets/${filename}`, { method: "HEAD" });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.toLowerCase().includes("image")) {
        setStatus("workspace");
        setPreview(`/assets/${filename}`);
      } else {
        setStatus("missing");
        setPreview(null);
      }
    } catch {
      setStatus("missing");
      setPreview(null);
    }
  };

  const compressPngImage = (base64Str: string, maxDim: number = 240): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // Set PNG to use standard compression via Canvas engine
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    filename: string,
    setStatus: (s: "stored" | "workspace" | "missing") => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("image/png") && !file.name.endsWith(".png")) {
      alert("กรุณาอัปโหลดไฟล์ภาพสกุล .png เท่านั้น");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawBase64 = reader.result as string;
        // Limit max width/height dimension to 240px representing pristine visual clarity at extremely low storage
        const compressedBase64 = await compressPngImage(rawBase64, 240);
        const localKey = "real_" + filename.replace(".", "_");
        localStorage.setItem(localKey, compressedBase64);
        setStatus("stored");
        setPreview(compressedBase64);
      } catch (err: any) {
        console.error("Failed to save image in local storage:", err);
        alert(`ไม่สามารถบันทึกรูปภาพได้: พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม (Exceeded Storage Quota) กรุณากดปุ่มล้างข้อมูลแคชและคิวบิลเก่าเพื่อเคลียร์พื้นที่ระดับสูงสุด`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageDelete = (
    filename: string,
    setStatus: (s: "stored" | "workspace" | "missing") => void,
    setPreview: (p: string | null) => void
  ) => {
    const localKey = "real_" + filename.replace(".", "_");
    localStorage.removeItem(localKey);
    checkAssetStatus(filename, setStatus, setPreview);
  };

  const [custLoading, setCustLoading] = useState(false);
  const [prodLoading, setProdLoading] = useState(false);
  const [custSuccess, setCustSuccess] = useState<string | null>(null);
  const [prodSuccess, setProdSuccess] = useState<string | null>(null);

  // File Upload Drag Event Mocks
  const [isDragCust, setIsDragCust] = useState(false);
  const [isDragProd, setIsDragProd] = useState(false);

  // Excel Upload Handlers
  const handleCustomerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCustLoading(true);
    setCustSuccess(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelCustomers(buffer);
      if (parsed.length === 0) {
        throw new Error("ไม่พบรายการลูกค้าที่ถูกต้องในไฟล์ Excel นี้ (กรุณาใช้ตารางแมนนวล)");
      }
      onUpdateCustomers(parsed);
      setCustSuccess(`นำเข้าข้อมูลลูกค้า ${parsed.length} รายการ เรียบร้อยแล้ว!`);
    } catch (err: any) {
      alert(`นำเข้าลูกค้าล้มเหลว: ${err.message}`);
    } finally {
      setCustLoading(false);
      if (custInputRef.current) custInputRef.current.value = "";
    }
  };

  const handleProductUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProdLoading(true);
    setProdSuccess(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelProducts(buffer);
      if (parsed.length === 0) {
        throw new Error("ไม่พบรายการสินค้าที่ถูกต้องในไฟล์ Excel นี้");
      }
      onUpdateProducts(parsed);
      setProdSuccess(`นำเข้าข้อมูลสินค้า ${parsed.length} รายการ เรียบร้อยแล้ว!`);
    } catch (err: any) {
      alert(`นำเข้าสินค้าล้มเหลว: ${err.message}`);
    } finally {
      setProdLoading(false);
      if (prodInputRef.current) prodInputRef.current.value = "";
    }
  };

  // Drag and Drop Handles
  const handleDragOver = (e: React.DragEvent, type: "cust" | "prod") => {
    e.preventDefault();
    if (type === "cust") setIsDragCust(true);
    else setIsDragProd(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: "cust" | "prod") => {
    e.preventDefault();
    if (type === "cust") setIsDragCust(false);
    else setIsDragProd(false);
  };

  const handleDrop = async (e: React.DragEvent, type: "cust" | "prod") => {
    e.preventDefault();
    if (type === "cust") {
      setIsDragCust(false);
      const file = e.dataTransfer.files?.[0];
      if (file && custInputRef.current) {
        custInputRef.current.files = e.dataTransfer.files;
        const event = { target: { files: e.dataTransfer.files } } as any;
        handleCustomerUpload(event);
      }
    } else {
      setIsDragProd(false);
      const file = e.dataTransfer.files?.[0];
      if (file && prodInputRef.current) {
        prodInputRef.current.files = e.dataTransfer.files;
        const event = { target: { files: e.dataTransfer.files } } as any;
        handleProductUpload(event);
      }
    }
  };

  // Download Sample Templates for Admin (to align Excel columns)
  const downloadSampleTemplate = (type: "cust" | "prod") => {
    if (type === "cust") {
      const sampleCust: Customer[] = [
        { id: "CUST-001", name: "ร้านยาศรีราชาเวชภัณฑ์", address: "เลขที่ 12 ถนนเจิมจอมพล ต.ศรีราชา ชลบุรี 20110", phone: "038-311-234" },
        { id: "CUST-002", name: "คลินิกหมอวรกานต์", address: "44/5 หมู่ 2 ถ.พหลโยธิน แขวงสามเสนใน เขตพญาไท กทม 10400", phone: "02-271-9876" }
      ];
      const bytes = exportCustomersToExcel(sampleCust);
      triggerFileDownload(bytes, "customers.xlsx");
    } else {
      const sampleProd: Product[] = [
        { id: "PROD-A", name: "Draco MX 4 cap.", unit: "กล่อง", price: 290.00 },
        { id: "PROD-B", name: "Draco MX 2 cap. (ทดลองใช้)", unit: "ซอง", price: 0.00 }
      ];
      const bytes = exportProductsToExcel(sampleProd);
      triggerFileDownload(bytes, "products.xlsx");
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. COMPONENT PORTALS: EXCEL SPREADSHEETS IMPORT (DRAG & DROP SUPPORTED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Import Customers Board */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5.5 h-5.5 text-amber-400" />
              <h3 className="text-base font-bold text-white">อัพโหลดไฟล์สมุดรายชื่อลูกค้า (.xlsx)</h3>
            </div>
            <p className="text-stone-400 text-xs mt-1">
              แทนที่ฐานข้อมูลและสมุดรายชื่อ ลูกค้า ทั้งหมดในระบบด้วยไฟล์ Excel ของคุณทันที
            </p>
          </div>

          <div
            onDragOver={(e) => handleDragOver(e, "cust")}
            onDragLeave={(e) => handleDragLeave(e, "cust")}
            onDrop={(e) => handleDrop(e, "cust")}
            onClick={() => custInputRef.current?.click()}
            className={`cursor-pointer group border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center ${
              isDragCust 
                ? "border-amber-400 bg-amber-500/5" 
                : "border-stone-800 hover:border-stone-700 bg-stone-950/40"
            }`}
          >
            <input
              type="file"
              ref={custInputRef}
              onChange={handleCustomerUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            {custLoading ? (
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-stone-500 group-hover:text-amber-400 transition" />
            )}
            <p className="text-stone-300 font-bold text-xs mt-3">ลากและวาง หรือ คลิก เพื่อนำเข้า</p>
            <p className="text-stone-500 text-[10px] mt-1 font-mono">ชื่อไฟล์ที่แนะนำ: customers.xlsx</p>
          </div>

          {custSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2 leading-none">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{custSuccess}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-stone-500 font-mono">ฐานข้อมูลปัจจุบัน: {customers.length} บัญชี</span>
            <button
              onClick={() => downloadSampleTemplate("cust")}
              className="text-xs text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> โหลดฟอร์มตัวอย่าง (.xlsx)
            </button>
          </div>
        </div>

        {/* Import Product Catalog Board */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5.5 h-5.5 text-amber-400" />
              <h3 className="text-base font-bold text-white">อัพโหลดไฟล์รายการตารางสินค้า (.xlsx)</h3>
            </div>
            <p className="text-stone-400 text-xs mt-1">
              แทนที่ฐานราคา รายชื่อราคายา และหน่วยนับ สินค้าทั้งหมดด้วยเทมเพลต Excel ของคุณ
            </p>
          </div>

          <div
            onDragOver={(e) => handleDragOver(e, "prod")}
            onDragLeave={(e) => handleDragLeave(e, "prod")}
            onDrop={(e) => handleDrop(e, "prod")}
            onClick={() => prodInputRef.current?.click()}
            className={`cursor-pointer group border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center ${
              isDragProd 
                ? "border-amber-400 bg-amber-500/5" 
                : "border-stone-800 hover:border-stone-700 bg-stone-950/40"
            }`}
          >
            <input
              type="file"
              ref={prodInputRef}
              onChange={handleProductUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            {prodLoading ? (
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-stone-500 group-hover:text-amber-400 transition" />
            )}
            <p className="text-stone-300 font-bold text-xs mt-3">ลากและวาง หรือ คลิก เพื่อนำเข้า</p>
            <p className="text-stone-500 text-[10px] mt-1 font-mono">ชื่อไฟล์ที่แนะนำ: products.xlsx</p>
          </div>

          {prodSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2 leading-none">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{prodSuccess}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-stone-500 font-mono">สินค้าในแคตตาล็อก: {products.length} ชิ้น</span>
            <button
              onClick={() => downloadSampleTemplate("prod")}
              className="text-xs text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> โหลดฟอร์มตัวอย่าง (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXPORT SPREADSHEET LEDGER COMMANDS */}
      <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-400" /> ดาวน์โหลดข้อมูลสำรอง (Backup Datastores to Excel)
        </h3>
        <p className="text-stone-400 text-xs leading-relaxed">
          ความสามารถการเป็น Solution Architect: ความพยายามสำรองข้อมูลด้วยตารางกระดาษทำการ Excel คุณสามารถดึงรายงานดิบทั้งหมด
          ออกไปแก้ไขตรวจสอบภายนอกเครื่อง หรือย้ายสังกัดไปบิลที่อื่นๆ ได้ทันที
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => {
              const bytes = exportCustomersToExcel(customers);
              triggerFileDownload(bytes, "customers.xlsx");
            }}
            className="p-4 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/30 font-bold text-xs text-amber-400 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4.5 h-4.5" /> ส่งออกลูกค้า (customers.xlsx)
          </button>
          <button
            onClick={() => {
              const bytes = exportProductsToExcel(products);
              triggerFileDownload(bytes, "products.xlsx");
            }}
            className="p-4 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/30 font-bold text-xs text-amber-400 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4.5 h-4.5" /> ส่งออกสินค้า (products.xlsx)
          </button>
          <button
            onClick={() => {
              const bytes = exportNotesToExcel(notes);
              triggerFileDownload(bytes, "delivery-notes.xlsx");
            }}
            className="p-4 bg-stone-950 hover:bg-[#1D6F42]/10 hover:text-white border border-stone-800 hover:border-[#1D6F42]/30 font-bold text-xs text-green-400 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4.5 h-4.5 text-[#1D6F42]" /> ส่งออกประวัติบิล (delivery-notes.xlsx)
          </button>
        </div>
      </div>

      {/* REAL PNG IMAGE ASSETS MANAGER */}
      <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl space-y-6 text-left">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Image className="w-5.5 h-5.5 text-amber-400" /> อัปโหลดไฟล์รูปภาพจริง (PNG Real Assets Manager)
          </h3>
          <p className="text-stone-400 text-xs mt-1 leading-relaxed">
            ระบบรองรับการใช้ภาพจริงเต็มรูปแบบ 100% คุณสามารถอัปโหลดไฟล์ โลโก้, ตรายาง และลายเซ็นผู้มอบอำนาจได้ที่นี่ 
            ระบบจะบันทึกเข้าสู่ Browser storage ทันที หากไม่มีการอัปโหลด ระบบจะดึงผ่านโฟลเดอร์ <code>public/assets/</code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo Card */}
          <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-black text-amber-400 block mb-1">1. โลโก้บริษัท (logo.png)</span>
              <p className="text-stone-500 text-[11px]">แนะนำรูปแนวตั้ง (เช่น 240 x 384px)</p>
            </div>

            <div className="h-44 bg-stone-900/60 rounded-lg flex flex-col items-center justify-center p-3 text-center border border-stone-800 relative group overflow-hidden">
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo Preview" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold rounded cursor-pointer transition select-none"
                    >
                      เปลี่ยนไฟล์
                    </button>
                    <button 
                      onClick={() => handleImageDelete("logo.png", setLogoStatus, setLogoPreview)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="w-6 h-6 text-stone-600 group-hover:text-amber-400 transition" />
                  <p className="text-stone-400 text-xs mt-2 font-bold">กดเพื่อเลือกไฟล์</p>
                  <p className="text-stone-600 text-[10px] mt-1">.png เท่านั้น</p>
                </div>
              )}
              <input 
                type="file" 
                ref={logoInputRef} 
                accept="image/png" 
                className="hidden" 
                onChange={(e) => handleImageUpload(e, "logo.png", setLogoStatus, setLogoPreview)} 
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-stone-500 font-mono">สถานะไฟล์:</span>
              {logoStatus === "stored" && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> ในเบราว์เซอร์ (Storage)
                </span>
              )}
              {logoStatus === "workspace" && (
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> โฟลเดอร์ระบบ /assets/
                </span>
              )}
              {logoStatus === "missing" && (
                <span className="text-rose-400 font-bold">✗ ยังไม่อัปโหลด</span>
              )}
            </div>
          </div>

          {/* Signature Card */}
          <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-black text-amber-400 block mb-1">2. ลายเซ็นผู้ประสานงาน (signature.png)</span>
              <p className="text-stone-500 text-[11px]">แนะนำขอบโปร่งใส (เช่น 250 x 100px)</p>
            </div>

            <div className="h-44 bg-stone-900/60 rounded-lg flex flex-col items-center justify-center p-3 text-center border border-stone-800 relative group overflow-hidden">
              {sigPreview ? (
                <>
                  <img src={sigPreview} alt="Signature Preview" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button 
                      onClick={() => sigInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold rounded cursor-pointer transition select-none"
                    >
                      เปลี่ยนไฟล์
                    </button>
                    <button 
                      onClick={() => handleImageDelete("signature.png", setSigStatus, setSigPreview)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => sigInputRef.current?.click()}>
                  <Upload className="w-6 h-6 text-stone-600 group-hover:text-amber-400 transition" />
                  <p className="text-stone-400 text-xs mt-2 font-bold">กดเพื่อเลือกไฟล์</p>
                  <p className="text-stone-600 text-[10px] mt-1">.png เท่านั้น</p>
                </div>
              )}
              <input 
                type="file" 
                ref={sigInputRef} 
                accept="image/png" 
                className="hidden" 
                onChange={(e) => handleImageUpload(e, "signature.png", setSigStatus, setSigPreview)} 
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-stone-500 font-mono">สถานะไฟล์:</span>
              {sigStatus === "stored" && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> ในเบราว์เซอร์ (Storage)
                </span>
              )}
              {sigStatus === "workspace" && (
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> โฟลเดอร์ระบบ /assets/
                </span>
              )}
              {sigStatus === "missing" && (
                <span className="text-rose-400 font-bold">✗ ยังไม่อัปโหลด</span>
              )}
            </div>
          </div>

          {/* Stamp Card */}
          <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-black text-amber-400 block mb-1">3. ตรายางบริษัท (company-stamp.png)</span>
              <p className="text-stone-500 text-[11px]">แนะนำวงรี/แนวนอน (เช่น 320 x 110px)</p>
            </div>

            <div className="h-44 bg-stone-900/60 rounded-lg flex flex-col items-center justify-center p-3 text-center border border-stone-800 relative group overflow-hidden">
              {stampPreview ? (
                <>
                  <img src={stampPreview} alt="Stamp Preview" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button 
                      onClick={() => stampInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold rounded cursor-pointer transition select-none"
                    >
                      เปลี่ยนไฟล์
                    </button>
                    <button 
                      onClick={() => handleImageDelete("company-stamp.png", setStampStatus, setStampPreview)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => stampInputRef.current?.click()}>
                  <Upload className="w-6 h-6 text-stone-600 group-hover:text-amber-400 transition" />
                  <p className="text-stone-400 text-xs mt-2 font-bold">กดเพื่อเลือกไฟล์</p>
                  <p className="text-stone-600 text-[10px] mt-1">.png เท่านั้น</p>
                </div>
              )}
              <input 
                type="file" 
                ref={stampInputRef} 
                accept="image/png" 
                className="hidden" 
                onChange={(e) => handleImageUpload(e, "company-stamp.png", setStampStatus, setStampPreview)} 
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-stone-500 font-mono">สถานะไฟล์:</span>
              {stampStatus === "stored" && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> ในเบราว์เซอร์ (Storage)
                </span>
              )}
              {stampStatus === "workspace" && (
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> โฟลเดอร์ระบบ /assets/
                </span>
              )}
              {stampStatus === "missing" && (
                <span className="text-rose-400 font-bold">✗ ยังไม่อัปโหลด</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. HARD RESET / DATA RECOVERY PANEL */}
      <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /> ล้างและกู้คืนสารสนเทศเริ่มต้น (Hard Reset Seeds)
          </h3>
          <p className="text-stone-400 text-xs mt-1 max-w-xl leading-relaxed">
            ในกรณีที่ระบบฐานข้อมูลทดลองพังหรือข้อมูลพังและต้องการกู้คืนข้อมูลของ Draco (รวมถึงประวัติบิล BC26/001 ถึง BC26/003)
            และตารางราคา Draco MX 4 คืนสู่สภาพเดิม
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("คุณแน่ใจหรือไม่ที่จะล้างฐานข้อมูลปัจจุบัน และตั้งค่าตามประวัติ Draco เริ่มต้นใหม่? ข้อมูลใบส่งของที่สร้างขึ้นจะถูกลบทั้งหมด!")) {
              onResetDatabase();
              alert("กู้คืนข้อมูล Seeds มาตรฐาน Draco สำเร็จ!");
            }
          }}
          className="px-5 py-3 border border-red-500/30 hover:bg-rose-500 hover:text-white text-rose-400 font-bold rounded-xl text-xs cursor-pointer transition shrink-0"
        >
          รีเซ็ตข้อมูลและคืนค่าโรงงาน
        </button>
      </div>

      {/* 4. PRODUCTION DEPLOYMENT CHEAT SHEET CARD FOR SOLUTIONS ARCHITECT */}
      <div className="bg-stone-900/60 border border-stone-800 p-6 rounded-2xl shadow-md space-y-4">
        <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" /> เอกสารกำกับการติดตั้งระบบ (Cloudflare Pages Architecture)
        </h3>
        <div className="text-xs text-stone-400 space-y-2 leading-relaxed">
          <p>
            ระบบนี้รองรับการรันแบบ Client-Side เต็มรูปแบบ เหมาะสำหรับการโฮสต์ผ่าน <strong>Cloudflare Pages Free Plan</strong> โดยไม่ต้องเชื่องโยงฐานข้อมูลภายนอกหรือ R2 Bucket!
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-stone-500">
            <li>โมเดลการประมวลผลและการจัดทำ PDF: ประมวลผลบนเบราเซอร์ต้นทาง (100% Client-Side PDF Generation)</li>
            <li>รันคำสั่งคอมไพล์: <code>npm run build</code></li>
            <li>วิธีการติดตั้ง: ลากโฟลเดอร์ <code>dist</code> วางในหน้าบริการ Cloudflare Pages ได้ทันที</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
