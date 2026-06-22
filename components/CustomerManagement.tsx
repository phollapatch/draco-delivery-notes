import React, { useState } from "react";
import { Customer } from "../types";
import { Users, Plus, Pencil, Trash2, Search, X, Check, Save } from "lucide-react";

interface CustomerManagementProps {
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
}

export default function CustomerManagement({ customers, onUpdateCustomers }: CustomerManagementProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Validation state
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});

  // Confirm delete state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Auto CustomerID generation
  const generateNextCustomerId = (existing: Customer[]): string => {
    let num = 1;
    while (true) {
      const candidateId = `CUST-${String(num).padStart(3, "0")}`;
      if (!existing.some(c => c.id === candidateId)) {
        return candidateId;
      }
      num++;
    }
  };

  const handleOpenAdd = () => {
    const nextId = generateNextCustomerId(customers);
    setCustomerId(nextId);
    setCustomerName("");
    setAddress("");
    setPhone("");
    setErrors({});
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setAddress(c.address);
    setPhone(c.phone);
    setErrors({});
    setEditingCustomer(c);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors: { name?: string; address?: string } = {};
    if (!customerName.trim()) {
      newErrors.name = "กรุณากรอกชื่อลูกค้า";
    }
    if (!address.trim()) {
      newErrors.address = "กรุณากรอกที่อยู่";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const savedCustomer: Customer = {
      id: customerId,
      name: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
    };

    let updatedList: Customer[];
    if (editingCustomer) {
      updatedList = customers.map(c => (c.id === editingCustomer.id ? savedCustomer : c));
    } else {
      updatedList = [...customers, savedCustomer];
    }

    onUpdateCustomers(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteClick = (c: Customer) => {
    setCustomerToDelete(c);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    const updatedList = customers.filter(c => c.id !== customerToDelete.id);
    onUpdateCustomers(updatedList);
    setCustomerToDelete(null);
  };

  // Searching logic
  const filteredCustomers = customers.filter(c => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">จัดการข้อมูลลูกค้า (Customer Master List)</h2>
            <p className="text-xs text-stone-400 mt-1">เพิ่ม แก้ไข หรือลบข้อมูลลูกค้าสำหรับการจัดส่งด่วน</p>
          </div>
        </div>

        {/* Large Add Button */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl shadow-xl hover:shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 stroke-[3px]" /> เพิ่มรายชื่อลูกค้าใหม่
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
            placeholder="ค้นหาลูกค้าด้วยชื่อ, เบอร์โทร, หรือ รหัสรหัสลูกค้า..."
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
          ทั้งหมด {filteredCustomers.length} รายการ
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-950/80 border-b border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="px-6 py-4.5">รหัสลูกค้า</th>
                <th className="px-6 py-4.5">ชื่อลูกค้า</th>
                <th className="px-6 py-4.5">ที่อยู่จัดส่ง</th>
                <th className="px-6 py-4.5">เบอร์โทรศัพท์</th>
                <th className="px-6 py-4.5 text-center w-36">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500 text-sm font-medium">
                    {search ? "🔍 ไม่พบประวัติผู้ใช้ที่ตรงกับการค้นหา" : "📂 ไม่มีข้อมูลลูกค้าในสารบบ"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-amber-500">
                      {c.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-300 whitespace-pre-line leading-relaxed max-w-xs">
                      {c.address}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-stone-200">
                      {c.phone || <span className="text-stone-600">-</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="แก้ไขข้อมูลลูกค้า"
                          className="p-2 text-stone-400 hover:text-amber-400 transition hover:bg-stone-800 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(c)}
                          title="ลบรายชื่อลูกค้า"
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

      {/* FORM MODAL (Add / Edit Customer) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-left animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-white text-base">
                {editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มรายชื่อลูกค้าใหม่"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Customer ID (Generated, Read-only) */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5">
                  รหัสลูกค้า (Customer ID) <span className="text-amber-500">*อัตโนมัติ</span>
                </label>
                <input
                  type="text"
                  value={customerId}
                  readOnly
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-400 font-mono text-sm focus:outline-none cursor-not-allowed select-none"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wide mb-1.5">
                  ชื่อลูกค้า (Customer Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="เช่น หจก. วังพยอมเภสัช, คลินิกเวชกรรมบางใหญ่..."
                  className={`w-full bg-stone-950 border ${
                    errors.name ? "border-red-500" : "border-stone-800 focus:border-amber-500"
                  } rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>
                )}
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5">
                  เบอร์โทรศัพท์ (Phone) <span className="text-stone-500">(ไม่บังคับ)</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 080-180-6879, 02-903-1289"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wide mb-1.5">
                  ที่อยู่จัดส่งสินค้า (Address) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, address: undefined }));
                  }}
                  rows={4}
                  placeholder="กรอกชื่อถนน, ตำบล, อำเภอ, และจังหวัดจัดส่งให้ชัดเจน..."
                  className={`w-full bg-stone-950 border ${
                    errors.address ? "border-red-500" : "border-stone-800 focus:border-amber-500"
                  } rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition resize-none`}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.address}</p>
                )}
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
      {customerToDelete && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-left animate-fade-in">
            <h3 className="font-extrabold text-red-400 text-lg flex items-center gap-2">
              🚨 ยืนยันการลบลูกค้ารายนี้หรือไม่?
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed">
              คุณกำลังจะลบข้อมูลลูกค้าชื่อ <strong className="text-white">"{customerToDelete.name}"</strong> ซึ่งมีรหัสประจำตัว <strong className="text-amber-400 font-mono">{customerToDelete.id}</strong> ออกจากสารบบ
            </p>
            <p className="text-xs text-red-400 font-semibold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              * ข้อมูลลูกค้าจะถูกลบออกจากเมนูจัดการเท่านั้น แต่ใบส่งของเก่าที่คุณเคยออกไปแล้วจะยังคงมีอยู่
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
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
