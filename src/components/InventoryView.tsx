import React, { useState, useEffect } from 'react';
import { Product, ProductCategory } from '../types';
import { formatCurrency } from '../utils/zatca';
import {
  Search,
  Plus,
  AlertTriangle,
  Package,
  CheckCircle2,
  Edit2,
  X,
  RefreshCw,
  FolderTree,
  Trash2,
  DollarSign,
  Barcode,
  Layers,
  ArrowUpDown,
  Tag,
  Check,
  ShoppingBag,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  categories?: ProductCategory[];
  initialCategoryFilter?: string;
  onAddProduct: (product: Product) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onUpdateProduct?: (product: Product) => Promise<void> | void;
  onDeleteProduct?: (productId: string) => Promise<void> | void;
  onNavigateToCategories?: () => void;
  onClearAllData?: () => Promise<void>;
  onSellProduct?: (product: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories = [],
  initialCategoryFilter = 'الكل',
  onAddProduct,
  onUpdateStock,
  onUpdateProduct,
  onDeleteProduct,
  onNavigateToCategories,
  onClearAllData,
  onSellProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryFilter);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Full Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editCategory, setEditCategory] = useState('عام');
  const [editCost, setEditCost] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMinAlert, setEditMinAlert] = useState('5');
  const [editUnit, setEditUnit] = useState('حبة');
  const [editVatRate, setEditVatRate] = useState(0.15);
  
  // Delete confirm state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCategoryFilter) {
      setSelectedCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Derived category list
  const categoryNames = [
    'الكل',
    ...Array.from(
      new Set([
        ...categories.map((c) => c.name),
        ...products.map((p) => p.category),
      ])
    ).filter(Boolean),
  ];

  // New product form states
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newCategory, setNewCategory] = useState(
    categories.length > 0 ? categories[0].name : 'مستلزمات مكتبية'
  );
  const [newCost, setNewCost] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newMinAlert, setNewMinAlert] = useState('5');
  const [newUnit, setNewUnit] = useState('حبة');
  const [newVatRate, setNewVatRate] = useState(0.15);

  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === 'الكل' || prod.category === selectedCategory;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.barcode.includes(searchQuery);
    const matchesLowStock = !filterLowStock || prod.stock <= prod.minStockAlert;
    return matchesCat && matchesSearch && matchesLowStock;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const totalStockValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    const prod: Product = {
      id: `prod-${Date.now()}`,
      name: newName.trim(),
      sku: newSku.trim() || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      barcode: newBarcode.trim() || `628100${Math.floor(1000000 + Math.random() * 9000000)}`,
      category: newCategory,
      costPrice: parseFloat(newCost) || 0,
      sellingPrice: parseFloat(newPrice),
      vatRate: newVatRate,
      stock: parseInt(newStock) || 0,
      minStockAlert: parseInt(newMinAlert) || 5,
      unit: newUnit.trim() || 'حبة',
    };

    onAddProduct(prod);
    setIsAddModalOpen(false);
    // Reset form
    setNewName('');
    setNewSku('');
    setNewBarcode('');
    setNewCost('');
    setNewPrice('');
    setNewStock('');
  };

  // Open Full Edit Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditSku(p.sku);
    setEditBarcode(p.barcode);
    setEditCategory(p.category);
    setEditCost(p.costPrice.toString());
    setEditPrice(p.sellingPrice.toString());
    setEditStock(p.stock.toString());
    setEditMinAlert(p.minStockAlert.toString());
    setEditUnit(p.unit || 'حبة');
    setEditVatRate(p.vatRate ?? 0.15);
  };

  // Save Full Product Edits
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim() || !editPrice) return;

    setIsSubmitting(true);
    try {
      const updated: Product = {
        ...editingProduct,
        name: editName.trim(),
        sku: editSku.trim() || editingProduct.sku,
        barcode: editBarcode.trim() || editingProduct.barcode,
        category: editCategory,
        costPrice: parseFloat(editCost) || 0,
        sellingPrice: parseFloat(editPrice) || 0,
        vatRate: editVatRate,
        stock: parseInt(editStock) || 0,
        minStockAlert: parseInt(editMinAlert) || 5,
        unit: editUnit.trim() || 'حبة',
      };

      if (onUpdateProduct) {
        await onUpdateProduct(updated);
      } else {
        onUpdateStock(updated.id, updated.stock);
      }

      setEditingProduct(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stock Quick Adjust in Edit Modal
  const adjustStockBy = (delta: number) => {
    const current = parseInt(editStock) || 0;
    const next = Math.max(0, current + delta);
    setEditStock(next.toString());
  };

  // Handle Delete Product Confirm
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      if (onDeleteProduct) {
        await onDeleteProduct(productToDelete.id);
      }
      setProductToDelete(null);
      setEditingProduct(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#becabd] shadow-xs">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#191c1e]">إدارة المخزون والمنتجات</h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              متابعة الكميات، وتعديل كافة بيانات الصنف، والأسعار، وحدود الطلب والتنبيهات.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateToCategories && (
              <button
                onClick={onNavigateToCategories}
                className="px-4 py-2.5 bg-[#f2f4f6] text-[#005126] border border-[#becabd] rounded-xl text-xs font-bold hover:bg-[#e8f5e9] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FolderTree className="w-4 h-4" />
                <span>إدارة التصنيفات</span>
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-[#005126] text-white rounded-xl text-xs font-bold hover:bg-[#006c35] flex items-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs">
            <span className="text-xs text-[#505f76] block mb-1">إجمالي الأصناف المسجلة</span>
            <span className="font-currency text-xl font-bold text-[#191c1e]">
              {products.length} صنف
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs">
            <span className="text-xs text-[#505f76] block mb-1">القيمة الإجمالية للمخزون (بسعر التكلفة)</span>
            <span className="font-currency text-xl font-bold text-[#005126]">
              {formatCurrency(totalStockValue)} ر.س
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs flex justify-between items-center">
            <div>
              <span className="text-xs text-[#ba1a1a] font-semibold block mb-1">تنبيهات انخفاض المخزون</span>
              <span className="font-currency text-xl font-bold text-[#ba1a1a]">
                {lowStockCount} أصناف حرجة
              </span>
            </div>
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterLowStock ? 'bg-[#ba1a1a] text-white' : 'bg-[#ffdad6] text-[#93000a] hover:bg-[#ffcdc7]'
              }`}
            >
              {filterLowStock ? 'عرض كل الأصناف' : 'فلترة المنخفض فقط'}
            </button>
          </div>
        </div>

        {/* Dynamic Category Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الكود، الباركود..."
              className="w-full pl-4 pr-9 py-2 bg-[#f7f9fb] border border-[#becabd] rounded-lg text-xs outline-none focus:border-[#005126] text-[#191c1e]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto custom-scrollbar pb-1 md:pb-0">
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#005126] text-white'
                    : 'bg-[#f7f9fb] text-[#3f4940] hover:bg-[#eceef0]'
                }`}
              >
                {cat}
              </button>
            ))}

            {onNavigateToCategories && (
              <button
                onClick={onNavigateToCategories}
                title="إضافة وتعديل التصنيفات"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#005126] bg-[#e8f5e9] hover:bg-[#d0e1fb] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تصنيف مخصص</span>
              </button>
            )}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-[#becabd] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse">
              <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                <tr>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold">كود الصنف (SKU)</th>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold">اسم الصنف</th>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold">التصنيف</th>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold text-left">سعر التكلفة</th>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold text-left">سعر البيع (مع الضريبة)</th>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold text-center">الكمية المتوفرة</th>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold">حالة المخزون</th>
                  <th className="p-3 text-xs text-[#3f4940] font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#becabd]">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="p-3 text-xs font-currency text-[#505f76]">{p.sku}</td>
                      <td className="p-3 text-xs font-bold text-[#191c1e]">{p.name}</td>
                      <td className="p-3 text-xs text-[#3f4940]">
                        <span className="px-2 py-0.5 bg-[#f0f4f8] rounded-md text-[11px] font-semibold">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-currency text-left" dir="ltr">
                        {formatCurrency(p.costPrice)} ر.س
                      </td>
                      <td className="p-3 text-xs font-currency font-bold text-[#005126] text-left" dir="ltr">
                        {formatCurrency(p.sellingPrice)} ر.س
                      </td>
                      <td className="p-3 text-xs font-currency font-bold text-center">
                        <span className={`px-2.5 py-1 rounded-full ${isLow ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-gray-100 text-[#191c1e]'}`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="p-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#ba1a1a] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            مخزون منخفض
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#005126] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            متوفر
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {onSellProduct && (
                            <button
                              onClick={() => onSellProduct(p)}
                              className="px-2.5 py-1.5 bg-[#005126] hover:bg-[#006c35] text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="إصدار فاتورة بيع لهذا الصنف في نقطة البيع"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>بيع الصنف</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="px-2.5 py-1.5 bg-[#f2f4f6] hover:bg-[#d0e1fb] text-[#005126] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <Package className="w-12 h-12 text-[#505f76]/40 mb-3" />
                <h3 className="text-base font-bold text-[#191c1e]">لا توجد أصناف في المخزون حتى الآن</h3>
                <p className="text-xs text-[#505f76] mt-1 max-w-sm">
                  قم بإضافة أول صنف لمخزونك مع تحديد سعر التكلفة وسعر البيع وحد التنبيه لبدء العمليات.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-[#005126] text-white rounded-lg text-xs font-bold hover:bg-[#006c35] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة صنف جديد للمخزون</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#e8f5e9] text-[#005126] rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-[#191c1e]">إضافة صنف جديد للمخزون</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">اسم الصنف *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: لوحة مفاتيح لاسلكية"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">كود الصنف (SKU)</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="SKU-XXX-001"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">التصنيف *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                  >
                    {categoryNames.filter((c) => c !== 'الكل').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">الباركود (Barcode)</label>
                <input
                  type="text"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="6281001234567"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">سعر التكلفة (ر.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">سعر البيع شامل الضريبة 15% *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency font-bold text-[#005126]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">الكمية الافتتاحية</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="10"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">حد التنبيه الأدنى</label>
                  <input
                    type="number"
                    value={newMinAlert}
                    onChange={(e) => setNewMinAlert(e.target.value)}
                    placeholder="5"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="حبة / كرتون"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors cursor-pointer"
                >
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PRODUCT & STOCK EDIT MODAL (All fields editable) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#d0e1fb] text-[#005126] rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#191c1e]">تعديل بيانات الصنف والمخزون الكاملة</h3>
                  <span className="text-[11px] text-[#505f76]">كود: {editingProduct.sku}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">اسم الصنف *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg font-bold text-[#191c1e] outline-none focus:border-[#005126]"
                />
              </div>

              {/* SKU & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">كود الصنف (SKU)</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">التصنيف *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-semibold text-[#191c1e]"
                  >
                    {categoryNames.filter((c) => c !== 'الكل').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">الباركود (Barcode)</label>
                <input
                  type="text"
                  value={editBarcode}
                  onChange={(e) => setEditBarcode(e.target.value)}
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-mono"
                />
              </div>

              {/* Pricing & VAT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#f7f9fb] rounded-xl border border-[#becabd]">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">سعر التكلفة (ر.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    className="w-full p-2 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">سعر البيع (مع الضريبة) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-2 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency font-bold text-[#005126] text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">نسبة الضريبة</label>
                  <select
                    value={editVatRate}
                    onChange={(e) => setEditVatRate(parseFloat(e.target.value))}
                    className="w-full p-2 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                  >
                    <option value={0.15}>15% (الأساسية)</option>
                    <option value={0.0}>0% (الصفرية)</option>
                  </select>
                </div>
              </div>

              {/* Stock Management Section */}
              <div className="p-3 bg-[#f0f9f3] border border-[#c8e6c9] rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[#005126] font-bold">الرصيد الفعلي الحالي بالمخزون:</label>
                  <span className="text-[11px] text-[#505f76]">تعديل سريع بالجرد</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-[#006c35] rounded-lg text-lg font-bold font-currency text-[#005126] text-center outline-none focus:ring-2 focus:ring-[#006c35]/20"
                  />

                  {/* Quick Delta Adjust Buttons */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => adjustStockBy(-1)}
                      className="px-2.5 py-2 bg-white hover:bg-gray-100 border border-[#becabd] rounded-lg text-xs font-bold text-gray-700 cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStockBy(+1)}
                      className="px-2.5 py-2 bg-white hover:bg-[#e8f5e9] border border-[#becabd] rounded-lg text-xs font-bold text-[#005126] cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStockBy(+5)}
                      className="px-2.5 py-2 bg-white hover:bg-[#e8f5e9] border border-[#becabd] rounded-lg text-xs font-bold text-[#005126] cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStockBy(+10)}
                      className="px-2.5 py-2 bg-white hover:bg-[#e8f5e9] border border-[#becabd] rounded-lg text-xs font-bold text-[#005126] cursor-pointer"
                    >
                      +10
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[#3f4940] font-semibold mb-1">حد التنبيه الأدنى</label>
                    <input
                      type="number"
                      value={editMinAlert}
                      onChange={(e) => setEditMinAlert(e.target.value)}
                      className="w-full p-2 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                    />
                  </div>

                  <div>
                    <label className="block text-[#3f4940] font-semibold mb-1">الوحدة</label>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      placeholder="حبة / كرتون / كجم"
                      className="w-full p-2 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-between gap-2 border-t border-[#eceef0]">
                {onDeleteProduct && (
                  <button
                    type="button"
                    onClick={() => setProductToDelete(editingProduct)}
                    className="px-3 py-2.5 bg-[#fff8f6] hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6] font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الصنف</span>
                  </button>
                )}

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ كافة التعديلات'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#ffdad6] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <span className="p-2 bg-[#ffdad6] rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <h3 className="text-base font-bold text-[#191c1e]">تأكيد حذف الصنف</h3>
            </div>

            <p className="text-xs text-[#505f76]">
              هل تريد بالتأكيد حذف صنف <strong className="text-[#191c1e]">"{productToDelete.name}"</strong> (كود: {productToDelete.sku}) نهائياً من قاعدة البيانات والمخزون؟
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDeleteProduct}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#ba1a1a] text-white text-xs font-bold rounded-xl hover:bg-[#93000a] transition-colors cursor-pointer"
              >
                {isSubmitting ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}
              </button>
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
