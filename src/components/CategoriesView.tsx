import React, { useState } from 'react';
import { ProductCategory, Product } from '../types';
import {
  FolderTree,
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  Layers,
  Check,
  X,
  Tag,
  Coffee,
  Laptop,
  ShoppingBag,
  Wrench,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CategoriesViewProps {
  categories: ProductCategory[];
  products: Product[];
  onAddCategory: (category: ProductCategory) => Promise<void> | void;
  onUpdateCategory: (category: ProductCategory, oldName?: string) => Promise<void> | void;
  onDeleteCategory: (categoryId: string, categoryName: string) => Promise<void> | void;
  onNavigateToInventory?: (categoryName: string) => void;
}

const AVAILABLE_COLORS = [
  { name: 'أخضر السابعة', hex: '#006c35' },
  { name: 'أزرق كلاسيكي', hex: '#0062a1' },
  { name: 'بني ضيافة', hex: '#854f00' },
  { name: 'بنفسجي فاخر', hex: '#6750a4' },
  { name: 'نيلي حديث', hex: '#485d92' },
  { name: 'أحمر قرمزي', hex: '#ba1a1a' },
  { name: 'كهرماني دافئ', hex: '#944b00' },
  { name: 'رمادي حجري', hex: '#44474e' },
  { name: 'فيروزي هادئ', hex: '#006874' },
  { name: 'وردي أنيق', hex: '#984061' },
];

const AVAILABLE_ICONS = [
  { id: 'Folder', label: 'مجلد', icon: FolderTree },
  { id: 'Tag', label: 'وسم', icon: Tag },
  { id: 'Package', label: 'صندوق', icon: Package },
  { id: 'Coffee', label: 'ضيافة', icon: Coffee },
  { id: 'Laptop', label: 'أجهزة', icon: Laptop },
  { id: 'ShoppingBag', label: 'مشتريات', icon: ShoppingBag },
  { id: 'Wrench', label: 'خدمات', icon: Wrench },
  { id: 'Sparkles', label: 'مميز', icon: Sparkles },
  { id: 'BookOpen', label: 'قرطاسية', icon: BookOpen },
  { id: 'Layers', label: 'طبقات', icon: Layers },
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onNavigateToInventory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#006c35');
  const [formIcon, setFormIcon] = useState('Folder');
  const [cascadeRename, setCascadeRename] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getIconComponent = (iconName?: string) => {
    const found = AVAILABLE_ICONS.find((item) => item.id === iconName);
    return found ? found.icon : FolderTree;
  };

  const getProductCount = (categoryName: string) => {
    return products.filter((p) => p.category === categoryName).length;
  };

  const filteredCategories = categories.filter((cat) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      cat.name.toLowerCase().includes(query) ||
      (cat.nameEn && cat.nameEn.toLowerCase().includes(query)) ||
      (cat.description && cat.description.toLowerCase().includes(query))
    );
  });

  const handleOpenAddModal = () => {
    setFormName('');
    setFormNameEn('');
    setFormDescription('');
    setFormColor('#006c35');
    setFormIcon('Folder');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormNameEn(cat.nameEn || '');
    setFormDescription(cat.description || '');
    setFormColor(cat.color || '#006c35');
    setFormIcon(cat.icon || 'Folder');
    setCascadeRename(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const newCategory: ProductCategory = {
        id: `cat-${Date.now()}`,
        name: formName.trim(),
        nameEn: formNameEn.trim() || undefined,
        description: formDescription.trim() || undefined,
        color: formColor,
        icon: formIcon,
      };

      await onAddCategory(newCategory);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formName.trim()) return;

    setIsSubmitting(true);
    try {
      const updatedCategory: ProductCategory = {
        ...editingCategory,
        name: formName.trim(),
        nameEn: formNameEn.trim() || undefined,
        description: formDescription.trim() || undefined,
        color: formColor,
        icon: formIcon,
      };

      await onUpdateCategory(
        updatedCategory,
        cascadeRename ? editingCategory.name : undefined
      );
      setEditingCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await onDeleteCategory(deleteTarget.id, deleteTarget.name);
      setDeleteTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCategorizedProducts = products.filter((p) =>
    categories.some((c) => c.name === p.category)
  ).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#becabd] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#d0e1fb] text-[#005126] rounded-lg">
                <FolderTree className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-[#191c1e]">إدارة تصنيفات المنتجات والخدمات</h1>
            </div>
            <p className="text-xs text-[#505f76] mt-1">
              قم بإنشاء وتعديل تصنيفاتك الخاصة لتنظيم المنتجات ونقاط البيع والفواتير بدقة.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#005126] text-white rounded-lg text-xs font-bold hover:bg-[#006c35] flex items-center gap-2 cursor-pointer shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تصنيف جديد</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f5e9] text-[#006c35] flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#505f76]">إجمالي التصنيفات المخصصة</p>
              <p className="text-lg font-bold text-[#191c1e] font-currency">{categories.length}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e3f2fd] text-[#0062a1] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#505f76]">المنتجات المصنفة</p>
              <p className="text-lg font-bold text-[#191c1e] font-currency">{totalCategorizedProducts} صنف</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#fff3e0] text-[#854f00] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#505f76]">متوسط الأصناف بكل تصنيف</p>
              <p className="text-lg font-bold text-[#191c1e] font-currency">
                {categories.length > 0
                  ? (products.length / categories.length).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في التصنيفات..."
              className="w-full pl-3 pr-9 py-2 bg-[#f7f9fb] border border-[#becabd] rounded-lg text-xs outline-none focus:border-[#005126]"
            />
          </div>
          <span className="text-xs text-[#505f76]">
            عرض {filteredCategories.length} من أصل {categories.length}
          </span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const IconComponent = getIconComponent(cat.icon);
            const count = getProductCount(cat.name);
            const categoryColor = cat.color || '#006c35';

            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-[#becabd] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: categoryColor }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                          {cat.name}
                        </h3>
                        {cat.nameEn && (
                          <p className="text-xs text-[#505f76] font-mono">{cat.nameEn}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        title="تعديل التصنيف"
                        className="p-1.5 text-gray-500 hover:text-[#005126] hover:bg-[#e8f5e9] rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        title="حذف التصنيف"
                        className="p-1.5 text-gray-500 hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#505f76] line-clamp-2 min-h-[32px] mb-4">
                    {cat.description || 'لا يوجد وصف محدد لهذا التصنيف.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#eceef0] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#3f4940] font-bold">
                    <Package className="w-3.5 h-3.5 text-[#505f76]" />
                    <span className="font-currency">{count}</span>
                    <span>منتجات مرتبطة</span>
                  </div>

                  {onNavigateToInventory && (
                    <button
                      onClick={() => onNavigateToInventory(cat.name)}
                      className="text-xs text-[#005126] hover:text-[#006c35] font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <span>عرض الأصناف</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-[#becabd] text-center flex flex-col items-center justify-center">
            <FolderTree className="w-12 h-12 text-[#505f76]/40 mb-3" />
            <h3 className="text-base font-bold text-[#191c1e]">لم يتم العثور على تصنيفات</h3>
            <p className="text-xs text-[#505f76] mt-1 max-w-sm">
              {searchQuery
                ? 'لا توجد تصنيفات تطابق معايير البحث الحالية.'
                : 'قم بإضافة تصنيفاتك الخاصة لتسهيل تنظيم المنتجات والبيع السريع.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 bg-[#005126] text-white rounded-lg text-xs font-bold hover:bg-[#006c35] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول تصنيف مخصص</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#e8f5e9] text-[#006c35] rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-[#191c1e]">إضافة تصنيف منتجات جديد</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">
                    اسم التصنيف (بالعربية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: مشروبات ساخنة"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Hot Drinks"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">الوصف أو الملاحظات</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف مختصر لمحتويات وأصناف هذا التصنيف..."
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] resize-none"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1.5">لون التصنيف المميز</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setFormColor(col.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        formColor === col.hex ? 'scale-110 ring-2 ring-offset-2 ring-[#005126]' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {formColor === col.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1.5">أيقونة التصنيف</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = formIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 border text-[11px] transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#005126] bg-[#e8f5e9] text-[#005126] font-bold'
                            : 'border-[#becabd] bg-[#f7f9fb] text-[#505f76] hover:bg-gray-100'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-2 border-t border-[#eceef0]">
                <button
                  type="submit"
                  disabled={isSubmitting || !formName.trim()}
                  className="flex-1 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التصنيف'}
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

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#e8f5e9] text-[#006c35] rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-[#191c1e]">تعديل التصنيف: {editingCategory.name}</h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">
                    اسم التصنيف (بالعربية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">الوصف أو الملاحظات</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] resize-none"
                />
              </div>

              {/* Cascade update checkbox */}
              {getProductCount(editingCategory.name) > 0 && formName.trim() !== editingCategory.name && (
                <div className="p-3 bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl flex items-start gap-2 text-[#005126]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={cascadeRename}
                        onChange={(e) => setCascadeRename(e.target.checked)}
                        className="rounded accent-[#005126]"
                      />
                      <span>تحديث تصنيف {getProductCount(editingCategory.name)} منتجات مرتبطة بهذا التصنيف بالاسم الجديد تلقائياً</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Color Selection */}
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1.5">لون التصنيف المميز</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setFormColor(col.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        formColor === col.hex ? 'scale-110 ring-2 ring-offset-2 ring-[#005126]' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {formColor === col.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1.5">أيقونة التصنيف</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = formIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 border text-[11px] transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#005126] bg-[#e8f5e9] text-[#005126] font-bold'
                            : 'border-[#becabd] bg-[#f7f9fb] text-[#505f76] hover:bg-gray-100'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-2 border-t border-[#eceef0]">
                <button
                  type="submit"
                  disabled={isSubmitting || !formName.trim()}
                  className="flex-1 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#ffdad6] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <span className="p-2 bg-[#ffdad6] rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </span>
              <h3 className="text-base font-bold text-[#191c1e]">تأكيد حذف التصنيف</h3>
            </div>

            <div className="text-xs text-[#505f76] space-y-2">
              <p>
                هل أنت متأكد من حذف تصنيف <strong className="text-[#191c1e]">"{deleteTarget.name}"</strong>؟
              </p>
              {getProductCount(deleteTarget.name) > 0 && (
                <div className="p-2.5 bg-[#fff8f6] border border-[#ffdad6] rounded-lg text-[#ba1a1a]">
                  يحتوي هذا التصنيف حالياً على <strong>{getProductCount(deleteTarget.name)}</strong> منتجات. لن يتم حذف المنتجات، ولكن سيتم نقلها إلى تصنيف "عام".
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#ba1a1a] text-white text-xs font-bold rounded-xl hover:bg-[#93000a] transition-colors cursor-pointer"
              >
                {isSubmitting ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
