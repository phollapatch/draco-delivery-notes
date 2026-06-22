import React, { useState } from "react";
import { Product } from "../types";
import { Package, Plus, Pencil, Trash2, Search, X, Check, Save } from "lucide-react";

interface ProductManagementProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export default function ProductManagement({ products, onUpdateProducts }: ProductManagementProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("กล่อง");
  const [unitPrice, setUnitPrice] = useState<number | "">("");

  // Validation state
  const [errors, setErrors] = useState<{ name?: string; unit?: string; price?: string }>({});

  // Confirm delete state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Converts zero-indexed count to Base26 Excel column alphabet representation
  // e.g., 0 -> A, 25 -> Z, 26 -> AA...
  const getAlphabetCode = (index: number): string => {
    let code = "";
    let temp = index;
    while (temp >= 0) {
      code = String.fromCharCode((temp % 26) + 65) + code;
      temp = Math.floor(temp / 26) - 1;
    }
    return code;
  };

  // Generate non-colliding automatic Product ID
  const generateNextProductId = (existing: Product[]): string => {
    let idx = 0;
    while (true) {
      const suite = getAlphabetCode(idx);
      const candidateId = `PROD-${suite}`;
      if (!existing.some(p => p.id === candidateId)) {
        return candidateId;
      }
      idx++;
    }
  };

  const handleOpenAdd = () => {
    const nextId = generateNextProductId(products);
    setProductId(nextId);
    setProductName("");
    setUnit("กล่อง");
    setUnitPrice("");
    setErrors({});
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setProductId(p.id);
    setProductName(p.name);
    setUnit(p.unit);
    setUnitPrice(p.price);
    setErrors({});
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors: { name?: string; unit?: string; price?: string } = {};
    if (!productName.trim()) {
      newErrors.name = "กรุณากรอกชื่อสินค้า";
    }
    if (!unit.trim()) {
      newErrors.unit = "กรุณากรอกหน่วยนับ";
    }
    if (unitPrice === "" || isNaN(Number(unitPrice))) {
      newErrors.price = "กรุณากรอกราคาต่อหน่วย";
    } else if (Number(unitPrice) < 0) {
      newErrors.price = "ราคาต้องไม่ต่ำกว่า 0 บาท";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const savedProduct: Product = {
      id: productId,
      name: productName.trim(),
      unit: unit.trim(),
      price: Number(unitPrice),
    };

    let updatedList: Product[];
    if (editingProduct) {
      updatedList = products.map(p => (p.id === editingProduct.id ? savedProduct : p));
    } else {
      updatedList = [...products, savedProduct];
    }

    onUpdateProducts(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteClick = (p: Product) => {
    setProductToDelete(p);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    const updatedList = products.filter(p => p.id !== productToDelete.id);
    onUpdateProducts(updatedList);
    setProductToDelete(null);
  };

  // Search filter
  const filteredProducts = products.filter(p => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">จัดการข้อมูลสินค้า (Product Catalog)</h2>
            <p className="text-xs text-stone-400 mt-1">ตั้งค่าชื่อหน่วยนับ และราคามาตรฐานเพื่อใช้คำนวณเงินในบิลอัตโนมัติ</p>
          </div>
        </div>

        {/* Large Add Button */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl shadow-xl hover:shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 stroke-[3px]" /> เพิ่มรายการสินค้าใหม่
        </button>
      </div>

      {/* List Search and Filter Area */}
      <div className="bg-stone-900/40 border border-stone-800 p-4 rounded-2xl flex items-center gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อสินค้า หรือ รหัสสินค้า..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-amber-500 focus:outline-none transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-xs text-stone-400 font-bold px-3 font-mono">
          ทั้งหมด {filteredProducts.length} รายการ
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-950/80 border-b border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="px-6 py-4.5">รหัสสินค้า</th>
                <th className="px-6 py-4.5">ชื่อสินค้า</th>
                <th className="px-6 py-4.5">หน่วยนับ</th>
                <th className="px-6 py-4.5 text-right">ราคาต่อหน่วย</th>
                <th className="px-6 py-4.5 text-center w-36">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500 text-sm font-medium">
                    {search ? "🔍 ไม่พบสินค้าที่ตรงกับการค้นหา" : "📦 ไม่มีแค็ตตาล็อกสินค้าในสารบบ"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-amber-500">
                      {p.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-300 font-semibold">
                      {p.unit}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-black text-white">
                      {p.price.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-stone-400 font-normal font-sans ml-1">บาท</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title="แก้ไขข้อมูลสินค้า"
                          className="p-2 text-stone-400 hover:text-amber-400 transition hover:bg-stone-800 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(p)}
                          title="ลบรายการสินค้า"
                          className="p-2 text-stone-400 hover:text-red-400 transition hover:bg-stone-800 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (Add / Edit Product) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-left animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-white text-base">
                {editingProduct ? "แก้ไขข้อมูลสินค้า" : "เพิ่มรายการสินค้าใหม่"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Product ID (Generated, Read-only) */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5">
                  รหัสสินค้า (Product ID) <span className="text-amber-500">*อัตโนมัติ</span>
                </label>
                <input
                  type="text"
                  value={productId}
                  readOnly
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-400 font-mono text-sm focus:outline-none cursor-not-allowed select-none"
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wide mb-1.5">
                  ชื่อสินค้า (Product Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="เช่น Draco MX 4 cap., Bunny Herb Balm..."
                  className={`w-full bg-stone-950 border ${
                    errors.name ? "border-red-500" : "border-stone-800 focus:border-amber-500"
                  } rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>
                )}
              </div>

              {/* Unit & UnitPrice Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wide mb-1.5">
                    หน่วยนับ (Unit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      if (e.target.value.trim()) setErrors(prev => ({ ...prev, unit: undefined }));
                    }}
                    placeholder="เช่น กล่อง, ซอง, ขวด, ชิ้น"
                    className={`w-full bg-stone-950 border ${
                      errors.unit ? "border-red-500" : "border-stone-800 focus:border-amber-500"
                    } rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition`}
                  />
                  {errors.unit && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.unit}</p>
                  )}
                </div>

                {/* UnitPrice */}
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wide mb-1.5">
                    ราคาต่อหน่วย (UnitPrice) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setUnitPrice(val);
                      if (val !== "" && !isNaN(Number(val)) && Number(val) >= 0) {
                        setErrors(prev => ({ ...prev, price: undefined }));
                      }
                    }}
                    placeholder="เช่น 290.00, 85.00, 0"
                    className={`w-full bg-stone-950 border ${
                      errors.price ? "border-red-500" : "border-stone-800 focus:border-amber-500"
                    } rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none transition`}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.price}</p>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold rounded-xl transition text-xs cursor-pointer"
                >
                  ยกเลิก (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl hover:shadow-lg hover:shadow-amber-500/10 active:scale-98 transition flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" /> บันทึกข้อมูล (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-left animate-fade-in">
            <h3 className="font-extrabold text-red-400 text-lg flex items-center gap-2">
              🚨 ยืนยันการลบสินค้าชนิดนี้หรือไม่?
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed">
              คุณกำลังจะลบข้อมูลสินค้าชื่อ <strong className="text-white">"{productToDelete.name}"</strong> ซึ่งมีรหัส <strong className="text-amber-400 font-mono">{productToDelete.id}</strong> ออกจากแค็ตตาล็อกถาวร
            </p>
            <p className="text-xs text-red-400 font-semibold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              * ข้อมูลราคาและชื่อผลิตภัณฑ์จะถูกลบออกจากการเลือกด่วนในบิล แต่จะไม่กระทบกับใบส่งของเก่าที่คุณเคยกรอกไปแล้ว
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 bg-stone-800 text-stone-300 font-bold rounded-xl hover:bg-stone-750 transition text-xs cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 transition text-xs cursor-pointer"
              >
                ลบข้อมูลสินค้า (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
