import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; 
import { Edit3, Trash2, Check, X, Package, Search, Download, FileUp, FileDown } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ name: "", sku: "", price: "", unit: "", stock: "" });
  
  // State phục vụ việc chỉnh sửa
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách sản phẩm:", err);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  // --- XỬ LÝ CHỈNH SỬA ---
  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      // Tách ID ra, chỉ gửi các trường thông tin còn lại
      const { id: _, ...dataToSend } = editForm; 
      
      await axios.put(`/api/products/${id}`, {
        ...dataToSend,
        price: Number(editForm.price),
        stock: Number(editForm.stock)
      });
      
      setEditingId(null);
      loadProducts();
    } catch (err) {
      console.error("Lỗi chi tiết:", err.response?.data || err.message);
      alert("Lỗi khi cập nhật sản phẩm! Kiểm tra lại kết nối Server.");
    }
  };

  // --- CÁC HÀM XỬ LÝ EXCEL (GIỮ NGUYÊN) ---
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KhoHang");
    XLSX.writeFile(workbook, "Danh_Sach_Hang_Hoa.xlsx");
  };

  const downloadTemplate = () => {
    const template = [{ name: "Kính gọng nhựa B", sku: "GK002", price: 350000, unit: "Cây", stock: 20 }];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MauNhap");
    XLSX.writeFile(workbook, "Mau_Excel_Nhap_Hang.xlsx");
  };

  const importExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      json.forEach(async (item) => {
        try {
          await axios.post("/api/products", {
            name: item.name, sku: item.sku, price: Number(item.price), unit: item.unit, stock: Number(item.stock)
          });
        } catch (err) { console.error("Lỗi dòng:", item); }
      });
      alert("Đang xử lý nhập hàng loạt...");
      setTimeout(loadProducts, 2000);
    };
    reader.readAsArrayBuffer(file);
  };

  const addProduct = async () => {
    if (!form.name) return alert("Nhập tên sản phẩm");
    await axios.post("/api/products", {
      ...form, price: Number(form.price), stock: Number(form.stock)
    });
    setForm({ name: "", sku: "", price: "", unit: "", stock: "" });
    loadProducts();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    await axios.delete(`/api/products/${id}`);
    loadProducts();
  };

  // --- LOGIC TÌM KIẾM ---
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const nameMatch = p.name ? p.name.toLowerCase().includes(search) : false;
    const skuMatch = p.sku ? p.sku.toLowerCase().includes(search) : false;

    return nameMatch || skuMatch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic flex items-center gap-3">
            <Package className="text-blue-600" size={32} /> Kho Hàng Hóa
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-wider">Quản lý tồn kho & Sản phẩm</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadTemplate} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm">
            <Download size={18}/> Mẫu Excel
          </button>
          <label className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-5 py-2.5 rounded-2xl text-sm font-bold cursor-pointer transition-all border border-emerald-100">
            <FileUp size={18}/> Nhập Kho
            <input type="file" className="hidden" onChange={importExcel} accept=".xlsx, .xls" />
          </label>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-100">
            <FileDown size={18}/> Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          className="w-full bg-white border-none shadow-xl shadow-slate-200/50 p-5 pl-14 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          placeholder="Tìm tên sản phẩm hoặc mã SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FORM THÊM MỚI */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 mb-10 border border-white">
        <h2 className="text-sm font-black text-slate-400 uppercase mb-6 tracking-[0.2em]">Thêm sản phẩm mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {['name', 'sku', 'price', 'unit', 'stock'].map((field) => (
            <div key={field}>
              <input
                className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-400 transition-all outline-none font-bold text-slate-700"
                placeholder={field === 'name' ? "Tên sản phẩm" : field.toUpperCase()}
                type={field === 'price' || field === 'stock' ? "number" : "text"}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button onClick={addProduct} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-[0.98]">
          + XÁC NHẬN THÊM VÀO KHO
        </button>
      </div>

      {/* DANH SÁCH BẢNG */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-white overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b">
              <th className="p-6 text-left">Sản phẩm</th>
              <th className="p-6 text-left">Mã SKU</th>
              <th className="p-6 text-left">Đơn giá</th>
              <th className="p-6 text-left">Đơn vị</th>
              <th className="p-6 text-left">Số lượng tồn</th>
              <th className="p-6 text-right px-10">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <tr key={p.id} className={`hover:bg-blue-50/20 transition-all ${editingId === p.id ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-6">
                    {editingId === p.id ? (
                      <input className="w-full p-2 border rounded-lg font-bold" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    ) : (
                      <span className="font-bold text-slate-700">{p.name}</span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === p.id ? (
                      <input className="w-full p-2 border rounded-lg font-mono text-xs" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value})} />
                    ) : (
                      <span className="text-slate-400 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md">{p.sku}</span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === p.id ? (
                      <input type="number" className="w-full p-2 border rounded-lg font-black text-blue-600" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                    ) : (
                      <span className="font-black text-blue-600 text-lg">{Number(p.price).toLocaleString()}đ</span>
                    )}
                  </td>
                  <td className="p-6 text-slate-500 font-bold">
                    {editingId === p.id ? (
                      <input className="w-full p-2 border rounded-lg" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                    ) : (
                      p.unit
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === p.id ? (
                      <input type="number" className="w-full p-2 border rounded-lg" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} />
                    ) : (
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-black ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {p.stock} {p.unit}
                      </span>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end gap-2 px-4">
                      {editingId === p.id ? (
                        <>
                          <button onClick={() => saveEdit(p.id)} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100">
                            <Check size={18} />
                          </button>
                          <button onClick={cancelEdit} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-10 text-center text-slate-400 font-medium italic">
                  Không tìm thấy sản phẩm nào phù hợp...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}