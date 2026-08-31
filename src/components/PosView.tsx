import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CompanyProfile, Customer, Invoice, InvoiceItem, PaymentMethod, Product, ProductCategory } from '../types';
import { formatCurrency, generateZatcaTlvQrCode } from '../utils/zatca';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Building,
  CheckCircle2,
  Printer,
  X,
  User,
  ShoppingBag,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  Check,
  Layers,
  Edit3,
  Tag,
  UserPlus,
  Percent,
  FileText,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  categories?: ProductCategory[];
  onCompleteSale: (newInvoice: Invoice) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  companyProfile?: CompanyProfile;
  companyVatNumber: string;
  companyName: string;
  branchName?: string;
  cashierName?: string;
  defaultVatRate?: number;
  isOnboarded?: boolean;
  onOpenZatcaWizard?: () => void;
  onAddCustomer?: (customer: Customer) => void;
  selectedCustomerFromApp?: Customer | null;
  onClearSelectedCustomerFromApp?: () => void;
  initialProductToCart?: Product | null;
  onClearInitialProductToCart?: () => void;
}

const defaultCashCustomer: Customer = {
  id: 'cash-default',
  name: 'عميل نقدي عام',
  phone: '-',
  email: '-',
  city: '',
  address: 'نقدي',
  totalPurchases: 0,
  balance: 0,
  invoicesCount: 0,
};

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  categories = [],
  onCompleteSale,
  onUpdateInvoice,
  onOpenInvoiceModal,
  companyProfile,
  companyVatNumber,
  companyName,
  branchName,
  cashierName,
  defaultVatRate = 0.15,
  isOnboarded = false,
  onOpenZatcaWizard,
  onAddCustomer,
  selectedCustomerFromApp,
  onClearSelectedCustomerFromApp,
  initialProductToCart,
  onClearInitialProductToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(defaultCashCustomer);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Customer Management Modals inside POS
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  
  // Quick Customer Form State
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustTax, setQuickCustTax] = useState('');
  const [quickCustCr, setQuickCustCr] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustEmail, setQuickCustEmail] = useState('');
  const [quickCustAddress, setQuickCustAddress] = useState('');

  // Item Price Edit Modal State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editUnitPriceExVat, setEditUnitPriceExVat] = useState<string>('');
  const [editUnitPriceIncVat, setEditUnitPriceIncVat] = useState<string>('');
  const [editItemDiscount, setEditItemDiscount] = useState<string>('0');

  // Custom Item Modal State
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [customItemIsPriceIncVat, setCustomItemIsPriceIncVat] = useState(true);
  const [customCustomerSearchQuery, setCustomCustomerSearchQuery] = useState('');
  const [isCustomCustomerDropdownOpen, setIsCustomCustomerDropdownOpen] = useState(false);
  const customCustomerDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom customer dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customCustomerDropdownRef.current &&
        !customCustomerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomCustomerDropdownOpen(false);
      }
    }
    if (isCustomCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCustomCustomerDropdownOpen]);

  // Sync customer passed from App / Customers view
  useEffect(() => {
    if (selectedCustomerFromApp) {
      setSelectedCustomer(selectedCustomerFromApp);
      if (onClearSelectedCustomerFromApp) {
        onClearSelectedCustomerFromApp();
      }
    }
  }, [selectedCustomerFromApp, onClearSelectedCustomerFromApp]);

  // Sync initial product passed from App / Inventory view
  useEffect(() => {
    if (initialProductToCart) {
      addToCart(initialProductToCart);
      if (onClearInitialProductToCart) {
        onClearInitialProductToCart();
      }
    }
  }, [initialProductToCart, onClearInitialProductToCart]);

  // Compute dynamic category list
  const categoryNames = [
    'الكل',
    ...Array.from(
      new Set([
        ...categories.map((c) => c.name),
        ...products.map((p) => p.category),
      ])
    ).filter(Boolean),
  ];

  // Visible quick categories in the bar (first 3 + selected if outside)
  const MAX_VISIBLE_TAGS = 3;
  const initialVisible = categoryNames.slice(0, MAX_VISIBLE_TAGS);
  const visibleCategories =
    categoryNames.includes(selectedCategory) && !initialVisible.includes(selectedCategory)
      ? [...initialVisible, selectedCategory]
      : initialVisible;

  const filteredCategoriesForModal = categoryNames.filter((cat) =>
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Scalable high-performance customer filter for Custom Item Modal (handles 10,000+ customers)
  const matchingCustomCustomers = useMemo(() => {
    const q = customCustomerSearchQuery.trim().toLowerCase();
    if (!q) {
      const list = customers.slice(0, 10);
      if (
        selectedCustomer.id !== defaultCashCustomer.id &&
        !list.some((c) => c.id === selectedCustomer.id)
      ) {
        const found = customers.find((c) => c.id === selectedCustomer.id);
        if (found) return [found, ...list];
      }
      return list;
    }

    const matches: Customer[] = [];
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      if (
        c.name.toLowerCase().includes(q) ||
        (c.taxNumber && c.taxNumber.toLowerCase().includes(q)) ||
        (c.crNumber && c.crNumber.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      ) {
        matches.push(c);
        if (matches.length >= 25) {
          break; // Stop after 25 items for instantaneous response with huge datasets
        }
      }
    }
    return matches;
  }, [customers, customCustomerSearchQuery, selectedCustomer.id]);

  // Scalable high-performance customer filter for Main Customer Selection Modal
  const matchingModalCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) {
      const list = customers.slice(0, 20);
      if (
        selectedCustomer.id !== defaultCashCustomer.id &&
        !list.some((c) => c.id === selectedCustomer.id)
      ) {
        const found = customers.find((c) => c.id === selectedCustomer.id);
        if (found) return [found, ...list];
      }
      return list;
    }

    const matches: Customer[] = [];
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      if (
        c.name.toLowerCase().includes(q) ||
        (c.taxNumber && c.taxNumber.toLowerCase().includes(q)) ||
        (c.crNumber && c.crNumber.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      ) {
        matches.push(c);
        if (matches.length >= 35) {
          break;
        }
      }
    }
    return matches;
  }, [customers, customerSearchQuery, selectedCustomer.id]);

  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === 'الكل' || prod.category === selectedCategory;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.barcode.includes(searchQuery) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.sku === product.sku);
    if (existingIndex > -1) {
      const updated = [...cart];
      const current = updated[existingIndex];
      const newQty = current.quantity + 1;
      const subtotal = newQty * current.unitPrice - current.discount;
      const vatAmount = subtotal * current.vatRate;
      const total = subtotal + vatAmount;

      updated[existingIndex] = {
        ...current,
        quantity: newQty,
        subtotal: parseFloat(subtotal.toFixed(2)),
        vatAmount: parseFloat(vatAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      };
      setCart(updated);
    } else {
      const unitExVat = product.sellingPrice / (1 + product.vatRate);
      const subtotal = unitExVat;
      const vatAmount = subtotal * product.vatRate;
      const total = product.sellingPrice;

      const newItem: InvoiceItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: parseFloat(unitExVat.toFixed(2)),
        discount: 0,
        vatRate: product.vatRate,
        vatAmount: parseFloat(vatAmount.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const current = updated[index];
    const newQty = current.quantity + delta;

    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    const subtotal = newQty * current.unitPrice - current.discount;
    const vatAmount = subtotal * current.vatRate;
    const total = subtotal + vatAmount;

    updated[index] = {
      ...current,
      quantity: newQty,
      subtotal: parseFloat(subtotal.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Open Edit Item Price Modal
  const handleOpenEditItemPrice = (index: number) => {
    const item = cart[index];
    if (!item) return;
    setEditingItemIndex(index);
    setEditUnitPriceExVat(item.unitPrice.toString());
    const incVat = (item.unitPrice * (1 + item.vatRate)).toFixed(2);
    setEditUnitPriceIncVat(incVat);
    setEditItemDiscount(item.discount.toString());
  };

  // Save Custom Price for Cart Item
  const handleSaveItemPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItemIndex === null) return;
    const current = cart[editingItemIndex];
    if (!current) return;

    const unitExVat = parseFloat(editUnitPriceExVat) || 0;
    const discount = Math.max(0, parseFloat(editItemDiscount) || 0);

    const updated = [...cart];
    const subtotal = Math.max(0, current.quantity * unitExVat - discount);
    const vatAmount = subtotal * current.vatRate;
    const total = subtotal + vatAmount;

    updated[editingItemIndex] = {
      ...current,
      unitPrice: parseFloat(unitExVat.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };

    setCart(updated);
    setEditingItemIndex(null);
  };

  // Add Custom Item/Service
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice) return;

    const rawPrice = parseFloat(customItemPrice) || 0;
    const qty = Math.max(1, parseInt(customItemQty) || 1);
    const vatRate = defaultVatRate ?? 0.15;

    let unitExVat = rawPrice;
    if (customItemIsPriceIncVat) {
      unitExVat = rawPrice / (1 + vatRate);
    }

    const subtotal = qty * unitExVat;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    const newItem: InvoiceItem = {
      id: `item-custom-${Date.now()}`,
      name: customItemName.trim(),
      sku: `CUSTOM-${Date.now().toString().slice(-4)}`,
      quantity: qty,
      unitPrice: parseFloat(unitExVat.toFixed(2)),
      discount: 0,
      vatRate: vatRate,
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };

    setCart([...cart, newItem]);
    setIsCustomItemModalOpen(false);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty('1');
    setCustomCustomerSearchQuery('');
  };

  // Quick Customer Creation
  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: quickCustName.trim(),
      taxNumber: quickCustTax.trim() || undefined,
      crNumber: quickCustCr.trim() || undefined,
      phone: quickCustPhone.trim() || '-',
      email: quickCustEmail.trim() || '-',
      city: '',
      address: quickCustAddress.trim() || '',
      totalPurchases: 0,
      balance: 0,
      invoicesCount: 0,
    };

    if (onAddCustomer) {
      onAddCustomer(newCust);
    }
    setSelectedCustomer(newCust);
    setIsQuickAddCustomerOpen(false);

    // Reset
    setQuickCustName('');
    setQuickCustTax('');
    setQuickCustCr('');
    setQuickCustPhone('');
    setQuickCustEmail('');
    setQuickCustAddress('');
  };

  // Calculations
  const vatRate = defaultVatRate ?? 0.15;
  const vatPercent = Math.round(vatRate * 100);
  const grossSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const netSubtotal = Math.max(0, grossSubtotal - discountAmount);
  const totalVat = netSubtotal * vatRate;
  const grandTotal = netSubtotal + totalVat;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
    setCashReceived(grandTotal.toFixed(2));
  };

  const finalizeSale = () => {
    const timestamp = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const invoiceNum = `INV-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isBusiness = selectedCustomer?.taxNumber && selectedCustomer.taxNumber.length > 5;

    const qrCode = generateZatcaTlvQrCode(
      companyName,
      companyVatNumber,
      timestamp,
      grandTotal,
      totalVat
    );

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      uuid: crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-SA'),
      customerName: selectedCustomer.name,
      customerTaxNumber: selectedCustomer.taxNumber,
      customerType: isBusiness ? 'business' : 'individual',
      customerAddress: selectedCustomer.address,
      type: isBusiness ? 'standard' : 'simplified',
      items: [...cart],
      subtotal: parseFloat(netSubtotal.toFixed(2)),
      totalDiscount: discountAmount,
      totalVat: parseFloat(totalVat.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      paymentMethod: paymentMethod,
      zatcaStatus: 'pending',
      qrCodeData: qrCode,
      branch: branchName || companyName || 'الفرع الرئيسي',
      cashierName: cashierName || companyName || 'الكاشير',
    };

    onCompleteSale(newInvoice);
    setCompletedInvoice(newInvoice);
    setIsPaymentModalOpen(false);
    setSelectedCustomer(defaultCashCustomer);
    clearCart();
  };

  const cashChange =
    paymentMethod === 'cash' && parseFloat(cashReceived || '0') > grandTotal
      ? parseFloat(cashReceived || '0') - grandTotal
      : 0;

  const isCustomerCorporate = Boolean(selectedCustomer?.taxNumber);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-auto md:h-[calc(100vh-64px)] overflow-y-auto md:overflow-hidden bg-[#f7f9fb]">
      {/* ================= Products Grid (Right/Center Area in RTL) ================= */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 overflow-visible md:overflow-hidden min-w-0">
        {/* Top Search & Filter Section */}
        <div className="space-y-2.5 mb-3 shrink-0">
          {/* Row 1: Full-width Search Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#505f76] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="امسح الباركود أو ابحث عن اسم المنتج، الكود، أو الصنف..."
              className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#becabd] rounded-xl text-xs sm:text-sm outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] shadow-2xs text-[#191c1e] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Row 2: Action Buttons (Category Selector & Custom Item side-by-side) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Category Selector Button */}
            <button
              type="button"
              onClick={() => {
                setCategorySearchQuery('');
                setIsCategoriesModalOpen(true);
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 border shadow-2xs min-w-0 max-w-full ${
                selectedCategory !== 'الكل'
                  ? 'bg-[#005126] text-white border-[#005126]'
                  : 'bg-white text-[#005126] border-[#becabd] hover:bg-[#eceef0]'
              }`}
              title="عرض وتغيير التصنيف الحالي"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {selectedCategory === 'الكل'
                  ? `جميع التصنيفات (${categoryNames.length - 1 || 0})`
                  : `التصنيف: ${selectedCategory}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
            </button>

            {/* Dedicated Action Button: Add Custom Item / Service */}
            <button
              type="button"
              onClick={() => setIsCustomItemModalOpen(true)}
              className="px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 bg-[#005126] text-white hover:bg-[#003d1c] shrink-0 shadow-2xs"
              title="إضافة بند مخصص أو خدمة بسعر محدد"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>بند مخصص / خدمة</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 md:overflow-y-auto custom-scrollbar">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 pb-4">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.minStockAlert;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border border-[#becabd] hover:border-[#005126] rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between text-right hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group relative overflow-hidden min-h-[115px] sm:min-h-[130px]"
                  >
                    {isLowStock && (
                      <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[9px] sm:text-[10px] bg-[#ffdad6] text-[#ba1a1a] font-bold px-1.5 py-0.5 rounded">
                        متبقي: {product.stock}
                      </span>
                    )}

                    <div className="w-full">
                      <span className="text-[10px] sm:text-[11px] text-[#505f76] block mb-0.5 sm:mb-1 truncate">{product.category}</span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#191c1e] group-hover:text-[#005126] line-clamp-2 leading-snug break-words">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-2 pt-1.5 sm:mt-2.5 sm:pt-2 border-t border-[#eceef0] w-full text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="font-currency text-sm sm:text-base font-bold text-[#005126]">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-[#005126]">ر.س</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-[#505f76] font-medium block w-full mt-0.5 leading-tight">
                        شامل الضريبة ({Math.round(product.vatRate * 100)}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-[#becabd]">
              <ShoppingBag className="w-12 h-12 text-[#505f76]/40 mb-3" />
              <h4 className="text-sm font-bold text-[#191c1e]">لا توجد أصناف مسجلة في هذا التصنيف</h4>
              <p className="text-xs text-[#505f76] mt-1">
                يمكنك اختيار تصنيف آخر أو إضافة بند مخصص لتبدأ في البيع فوراً.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= Cart & Checkout Panel (Left in RTL) ================= */}
      <div className="w-full md:w-[360px] lg:w-[380px] bg-white border-t md:border-t-0 md:border-r border-[#becabd] flex flex-col md:h-full shrink-0 shadow-lg z-20">
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#becabd] bg-[#f7f9fb] space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#005126]" />
              <h3 className="font-bold text-base text-[#191c1e]">سلة المشتريات</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-[#ba1a1a] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إفراغ السلة</span>
              </button>
            )}
          </div>

          {/* Customer Selection Section (Shows only when a specific customer is active) */}
          {selectedCustomer.id !== defaultCashCustomer.id && (
            <div className="bg-[#e8f5e9]/70 border border-[#005126]/40 rounded-xl p-3 shadow-2xs space-y-1.5">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isCustomerCorporate ? 'bg-[#005126] text-white' : 'bg-[#005126]/20 text-[#005126]'
                    }`}
                  >
                    {isCustomerCorporate ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-bold text-[#191c1e] truncate">{selectedCustomer.name}</h5>
                      {isCustomerCorporate ? (
                        <span className="text-[9px] bg-[#005126] text-white font-bold px-1.5 py-0.2 rounded shrink-0">
                          ضريبي B2B
                        </span>
                      ) : (
                        <span className="text-[9px] bg-[#d0e1fb] text-[#005126] font-bold px-1.5 py-0.2 rounded shrink-0">
                          B2C
                        </span>
                      )}
                    </div>
                    {selectedCustomer.taxNumber ? (
                      <p className="text-[10px] text-[#005126] font-currency truncate">
                        الرقم الضريبي: {selectedCustomer.taxNumber}
                      </p>
                    ) : (
                      selectedCustomer.phone && selectedCustomer.phone !== '-' && (
                        <p className="text-[10px] text-[#505f76] truncate font-currency">
                          الهاتف: {selectedCustomer.phone}
                        </p>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCustomerSelectModalOpen(true)}
                    className="px-2 py-1 bg-white border border-[#becabd] text-[#005126] hover:bg-[#f2f4f6] rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    title="تغيير العميل"
                  >
                    تغيير
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(defaultCashCustomer)}
                    className="p-1 text-gray-400 hover:text-[#ba1a1a] hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="إلغاء التحديد والعودة إلى عميل عام"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#eceef0] custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#505f76] py-12">
              <ShoppingBag className="w-12 h-12 text-[#becabd] mb-2" />
              <p className="font-semibold text-sm">السلة فارغة</p>
              <p className="text-xs text-[#505f76] mt-1">انقر على أي منتج لإضافته، أو أضف بنداً مخصصاً بسعر خاص</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.id} className="py-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-[#191c1e] truncate">{item.name}</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-[#505f76] font-currency">
                        {formatCurrency(item.unitPrice)} ر.س / الوحدة
                      </span>
                      {item.discount > 0 && (
                        <span className="text-[10px] bg-[#ffdad6] text-[#ba1a1a] font-bold px-1 rounded">
                          خصم: {item.discount} ر.س
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-gray-400 hover:text-[#ba1a1a] p-1 transition-colors"
                    title="حذف البند"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#becabd] rounded-lg bg-[#f7f9fb]">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="p-1 hover:bg-[#e0e3e5] rounded-r text-[#191c1e] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-bold font-currency text-[#191c1e]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="p-1 hover:bg-[#e0e3e5] rounded-l text-[#191c1e] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Custom Price Button / Trigger */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditItemPrice(index)}
                    className="px-2 py-1 bg-[#f7f9fb] hover:bg-[#e8f5e9] border border-[#becabd] hover:border-[#005126] text-[#005126] rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="تعديل السعر المخصص أو إضافة خصم"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل السعر</span>
                  </button>

                  {/* Total Line Price */}
                  <span className="font-currency text-xs font-bold text-[#005126] text-left">
                    {formatCurrency(item.total)} ر.س
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className="p-4 border-t border-[#becabd] bg-[#f7f9fb] space-y-3">
          {/* Invoice Discount Block */}
          <div className="bg-white border border-[#becabd] rounded-xl p-2.5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#191c1e]">
                <Tag className="w-3.5 h-3.5 text-[#005126]" />
                <span>خصم إجمالي الفاتورة:</span>
              </div>
              {discountAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setDiscountAmount(0)}
                  className="text-[10px] text-[#ba1a1a] hover:underline cursor-pointer flex items-center gap-0.5"
                  title="إلغاء الخصم"
                >
                  <X className="w-3 h-3" />
                  <span>إلغاء</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                disabled={cart.length === 0}
                value={discountAmount === 0 ? '' : discountAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDiscountAmount(0);
                  } else {
                    const parsed = parseFloat(val);
                    setDiscountAmount(isNaN(parsed) ? 0 : Math.max(0, parsed));
                  }
                }}
                placeholder={cart.length === 0 ? "أضف منتجات أولاً للخصم" : "0.00"}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f7f9fb] border border-[#becabd] rounded-lg text-left font-currency font-bold outline-none focus:border-[#005126] focus:bg-white text-[#191c1e] transition-colors disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#505f76] pointer-events-none">
                ر.س
              </span>
            </div>
          </div>

          {/* Subtotals breakdown */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-[#505f76]">
              <span>المجموع قبل الضريبة:</span>
              <span className="font-currency font-semibold text-[#191c1e]">
                {formatCurrency(netSubtotal)} ر.س
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-[#ba1a1a]">
                <span>خصم مطبق:</span>
                <span className="font-currency font-bold">
                  -{formatCurrency(discountAmount)} ر.س
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs text-[#505f76]">
              <span>ضريبة القيمة المضافة ({vatPercent}%):</span>
              <span className="font-currency font-semibold text-[#191c1e]">
                {formatCurrency(totalVat)} ر.س
              </span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2.5 border-t border-[#becabd] flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-[#191c1e] block">المبلغ الإجمالي المستحق</span>
              <span className="text-[10px] text-[#505f76]">شامل ضريبة القيمة المضافة</span>
            </div>
            <div className="text-left">
              <span className="font-currency text-2xl font-bold text-[#005126]">
                {formatCurrency(grandTotal)}
              </span>
              <span className="text-xs font-semibold text-[#3f4940] mr-1">ر.س</span>
            </div>
          </div>

          <button
            id="btn-pos-pay-now"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full mt-2 py-3 bg-[#005126] text-white font-bold text-base rounded-xl hover:bg-[#006c35] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>دفع وإصدار الفاتورة</span>
          </button>
        </div>
      </div>

      {/* ================= Categories Select Modal ================= */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#e8f5e9] text-[#005126] rounded-lg">
                  <LayoutGrid className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-[#191c1e]">جميع التصنيفات والأقسام</h3>
              </div>
              <button
                onClick={() => setIsCategoriesModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="ابحث عن تصنيف أو قسم..."
                className="w-full pl-4 pr-9 py-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg text-xs outline-none focus:border-[#005126]"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-[#eceef0] border border-[#becabd] rounded-xl custom-scrollbar">
              {filteredCategoriesForModal.map((cat) => {
                const count =
                  cat === 'الكل'
                    ? products.length
                    : products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsCategoriesModalOpen(false);
                    }}
                    className={`w-full p-3 text-right flex items-center justify-between hover:bg-[#f7f9fb] transition-colors cursor-pointer ${
                      selectedCategory === cat ? 'bg-[#e8f5e9] text-[#005126] font-bold' : 'text-[#191c1e]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#505f76]" />
                      <span className="text-xs">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#505f76] bg-gray-100 px-2 py-0.5 rounded-full font-currency">
                        {count} صنف
                      </span>
                      {selectedCategory === cat && <Check className="w-4 h-4 text-[#005126]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoriesModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Customer Select Modal ================= */}
      {isCustomerSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <h3 className="text-lg font-bold text-[#191c1e]">تحديد عميل الفاتورة</h3>
              <button
                onClick={() => setIsCustomerSelectModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الرقم الضريبي، السجل، أو رقم الهاتف..."
                className="w-full pl-8 pr-9 py-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg text-xs outline-none focus:border-[#005126]"
              />
              {customerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCustomerSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List Info / Count Badge */}
            <div className="text-[11px] text-[#505f76] px-1 flex items-center justify-between">
              {customerSearchQuery.trim() ? (
                <span>
                  نتائج المطابقة:{' '}
                  <strong className="text-[#005126]">
                    {matchingModalCustomers.length >= 35
                      ? '35+ عميل (يُعرض أول 35)'
                      : `${matchingModalCustomers.length} عميل`}
                  </strong>
                </span>
              ) : (
                <span>
                  {customers.length > 20
                    ? `يُعرض أحدث العملاء (${matchingModalCustomers.length} من إجمالي ${customers.length.toLocaleString('ar-SA')} عميل)`
                    : `إجمالي العملاء المسجلين: ${customers.length}`}
                </span>
              )}
              <span className="text-[10px] text-gray-400">بحث فوري عالي السرعة</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#eceef0] border border-[#becabd] rounded-xl custom-scrollbar">
              {/* Default Cash Customer */}
              {(!customerSearchQuery ||
                'عميل نقدي عام مبسط b2c'.includes(customerSearchQuery.toLowerCase())) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(defaultCashCustomer);
                    setIsCustomerSelectModalOpen(false);
                  }}
                  className={`w-full p-3 text-right flex items-center justify-between hover:bg-[#f7f9fb] transition-colors cursor-pointer ${
                    selectedCustomer.id === defaultCashCustomer.id ? 'bg-[#e8f5e9]' : ''
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold text-[#191c1e]">{defaultCashCustomer.name}</h5>
                    <span className="text-[10px] text-[#505f76]">فاتورة مبسطة للأفراد (B2C)</span>
                  </div>
                  {selectedCustomer.id === defaultCashCustomer.id && (
                    <Check className="w-4 h-4 text-[#005126]" />
                  )}
                </button>
              )}

              {/* Registered Customers (Memoized top results) */}
              {matchingModalCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsCustomerSelectModalOpen(false);
                  }}
                  className={`w-full p-3 text-right flex items-center justify-between hover:bg-[#f7f9fb] transition-colors cursor-pointer ${
                    selectedCustomer.id === c.id ? 'bg-[#e8f5e9]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="text-xs font-bold text-[#191c1e]">{c.name}</h5>
                      {c.taxNumber ? (
                        <span className="text-[9px] bg-[#005126] text-white font-bold px-1.5 py-0.2 rounded">
                          ضريبي B2B
                        </span>
                      ) : (
                        <span className="text-[9px] bg-[#d0e1fb] text-[#005126] font-bold px-1.5 py-0.2 rounded">
                          B2C
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#505f76] flex gap-3 mt-0.5 font-currency flex-wrap">
                      {c.taxNumber && <span>الرقم الضريبي: {c.taxNumber}</span>}
                      {c.phone && c.phone !== '-' && <span>الهاتف: {c.phone}</span>}
                      {c.crNumber && <span>السجل: {c.crNumber}</span>}
                    </div>
                  </div>
                  {selectedCustomer.id === c.id && <Check className="w-4 h-4 text-[#005126] shrink-0 mr-1" />}
                </button>
              ))}

              {/* Empty Search Result */}
              {customerSearchQuery &&
                matchingModalCustomers.length === 0 &&
                !'عميل نقدي عام مبسط b2c'.includes(customerSearchQuery.toLowerCase()) && (
                  <div className="p-4 text-center text-xs text-[#505f76]">
                    لا يوجد عميل يطابق &quot;{customerSearchQuery}&quot;
                  </div>
                )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setIsCustomerSelectModalOpen(false);
                  setIsQuickAddCustomerOpen(true);
                }}
                className="px-4 py-2 bg-[#005126] text-white rounded-xl text-xs font-bold hover:bg-[#006c35] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>تسجيل عميل جديد</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCustomerSelectModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Quick Add Customer Modal ================= */}
      {isQuickAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#e8f5e9] text-[#005126] rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-[#191c1e]">تسجيل عميل جديد لنقطة البيع</h3>
              </div>
              <button
                onClick={() => setIsQuickAddCustomerOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">اسم العميل / الشركة *</label>
                <input
                  type="text"
                  required
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  placeholder="مثال: شركة التطوير الحديث"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">الرقم الضريبي (15 خانة)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={quickCustTax}
                    onChange={(e) => setQuickCustTax(e.target.value)}
                    placeholder="300000000000003"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">رقم السجل التجاري (CR)</label>
                  <input
                    type="text"
                    value={quickCustCr}
                    onChange={(e) => setQuickCustCr(e.target.value)}
                    placeholder="1010000000"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">رقم الهاتف / الجوال</label>
                  <input
                    type="tel"
                    value={quickCustPhone}
                    onChange={(e) => setQuickCustPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={quickCustEmail}
                    onChange={(e) => setQuickCustEmail(e.target.value)}
                    placeholder="info@client.sa"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">العنوان / المدينة</label>
                <input
                  type="text"
                  value={quickCustAddress}
                  onChange={(e) => setQuickCustAddress(e.target.value)}
                  placeholder="الرياض، طريق الملك فهد"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors cursor-pointer"
                >
                  حفظ وتعيين للفاتورة الحالية
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomerOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Edit Item Price Modal (Custom Pricing) ================= */}
      {editingItemIndex !== null && cart[editingItemIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#e8f5e9] text-[#005126] rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-[#191c1e]">تعديل سعر البند المخصص</h3>
              </div>
              <button
                onClick={() => setEditingItemIndex(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#f7f9fb] p-3 rounded-xl border border-[#becabd] text-xs">
              <span className="text-[#505f76] block mb-0.5">البند المحدد:</span>
              <h4 className="font-bold text-sm text-[#191c1e]">{cart[editingItemIndex].name}</h4>
              <span className="text-[11px] text-[#505f76]">الكمية الحالية: {cart[editingItemIndex].quantity}</span>
            </div>

            <form onSubmit={handleSaveItemPrice} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">
                  السعر الإفرادي (غير شامل الضريبة {Math.round((cart[editingItemIndex]?.vatRate ?? vatRate) * 100)}%):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editUnitPriceExVat}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditUnitPriceExVat(val);
                    const parsed = parseFloat(val) || 0;
                    const rate = cart[editingItemIndex]?.vatRate ?? vatRate;
                    setEditUnitPriceIncVat((parsed * (1 + rate)).toFixed(2));
                  }}
                  className="w-full p-2.5 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">
                  أو السعر الإفرادي (شامل الضريبة {Math.round((cart[editingItemIndex]?.vatRate ?? vatRate) * 100)}%):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editUnitPriceIncVat}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditUnitPriceIncVat(val);
                    const parsed = parseFloat(val) || 0;
                    const rate = cart[editingItemIndex]?.vatRate ?? vatRate;
                    setEditUnitPriceExVat(rate > 0 ? (parsed / (1 + rate)).toFixed(2) : parsed.toFixed(2));
                  }}
                  className="w-full p-2.5 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">خصم على البند (ر.س):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editItemDiscount}
                  onChange={(e) => setEditItemDiscount(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency text-sm"
                />
              </div>

              <div className="p-3 bg-[#e8f5e9] rounded-xl text-xs flex justify-between items-center text-[#005126] font-bold">
                <span>الإجمالي المتوقع للبند:</span>
                <span className="font-currency text-sm">
                  {formatCurrency(
                    Math.max(
                      0,
                      (cart[editingItemIndex].quantity * (parseFloat(editUnitPriceExVat) || 0) -
                        (parseFloat(editItemDiscount) || 0)) *
                        1.15
                    )
                  )}{' '}
                  ر.س شامل الضريبة
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors cursor-pointer"
                >
                  حفظ وتطبيق السعر
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItemIndex(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Add Custom Item Modal ================= */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#e8f5e9] text-[#005126] rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-[#191c1e]">إضافة بند مخصص / خدمة خاصة</h3>
              </div>
              <button
                onClick={() => setIsCustomItemModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">اسم البند أو وصف الخدمة *</label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="مثال: خدمة استشارية خاصة / تركيب وضبط"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">السعر الإفرادي *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    placeholder="100.00"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(e.target.value)}
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-custom-inc-vat"
                  checked={customItemIsPriceIncVat}
                  onChange={(e) => setCustomItemIsPriceIncVat(e.target.checked)}
                  className="w-4 h-4 text-[#005126] rounded border-[#becabd]"
                />
                <label htmlFor="chk-custom-inc-vat" className="text-xs text-[#3f4940] cursor-pointer">
                  السعر المدخل شامل ضريبة القيمة المضافة ({vatPercent}%)
                </label>
              </div>

              {/* Customer assignment inside Custom Item modal - Searchable Select Dropdown (Combobox) */}
              <div className="space-y-1.5 pt-1" ref={customCustomerDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#3f4940]">
                    العميل المسند للفاتورة
                  </label>
                  {selectedCustomer.id !== defaultCashCustomer.id && (
                    <span className="text-[10px] font-bold text-[#005126] bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-[#005126]/20">
                      {selectedCustomer.taxNumber ? 'عميل أعمال ضريبي (B2B)' : 'عميل أفراد (B2C)'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  {/* Searchable Select Input */}
                  <div
                    onClick={() => setIsCustomCustomerDropdownOpen(true)}
                    className="relative flex items-center bg-[#f7f9fb] border border-[#becabd] rounded-xl focus-within:border-[#005126] focus-within:ring-1 focus-within:ring-[#005126] transition-all cursor-pointer"
                  >
                    <div className="pr-3 text-[#505f76] pointer-events-none">
                      <User className="w-4 h-4 text-[#005126]" />
                    </div>

                    <input
                      type="text"
                      value={
                        isCustomCustomerDropdownOpen
                          ? customCustomerSearchQuery
                          : selectedCustomer.id === defaultCashCustomer.id
                          ? 'عميل نقدي عام (فاتورة مبسطة B2C)'
                          : `${selectedCustomer.name} ${
                              selectedCustomer.taxNumber
                                ? `(ضريبي B2B - ${selectedCustomer.taxNumber})`
                                : '(B2C)'
                            }`
                      }
                      onChange={(e) => {
                        setCustomCustomerSearchQuery(e.target.value);
                        if (!isCustomCustomerDropdownOpen) setIsCustomCustomerDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsCustomCustomerDropdownOpen(true);
                      }}
                      placeholder="ابحث باسم العميل، الرقم الضريبي، الجوال، أو السجل..."
                      className="w-full py-2.5 px-2 bg-transparent text-xs font-bold text-[#191c1e] outline-none placeholder:font-normal placeholder:text-gray-400 cursor-text"
                    />

                    <div className="flex items-center pl-3 gap-1">
                      {(customCustomerSearchQuery || selectedCustomer.id !== defaultCashCustomer.id) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomCustomerSearchQuery('');
                            setSelectedCustomer(defaultCashCustomer);
                          }}
                          className="text-gray-400 hover:text-[#ba1a1a] p-1 cursor-pointer"
                          title="إعادة تعيين لعميل نقدي عام"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCustomCustomerDropdownOpen(!isCustomCustomerDropdownOpen);
                        }}
                        className="text-[#505f76] hover:text-[#005126] p-1 cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isCustomCustomerDropdownOpen ? 'rotate-180 text-[#005126]' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Floating Dropdown Menu */}
                  {isCustomCustomerDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-1.5 bg-white border border-[#becabd] rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2 bg-[#f7f9fb] border-b border-[#eceef0] flex items-center justify-between text-[11px] text-[#505f76]">
                        {customCustomerSearchQuery.trim() ? (
                          <span>
                            نتائج البحث:{' '}
                            <strong className="text-[#005126]">
                              {matchingCustomCustomers.length >= 25
                                ? '25+ عميل (يُعرض أول 25)'
                                : `${matchingCustomCustomers.length} عميل`}
                            </strong>
                          </span>
                        ) : (
                          <span>
                            {customers.length > 10
                              ? `اختر عميل أو اكتب للبحث (${matchingCustomCustomers.length} من ${customers.length.toLocaleString('ar-SA')})`
                              : 'اختر عميلاً من القائمة أو اكتب للبحث'}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">بحث فوري</span>
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-[#eceef0] custom-scrollbar">
                        {/* Default Cash Customer */}
                        {(!customCustomerSearchQuery ||
                          'عميل نقدي عام مبسط b2c'.includes(customCustomerSearchQuery.toLowerCase())) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(defaultCashCustomer);
                              setCustomCustomerSearchQuery('');
                              setIsCustomCustomerDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 text-right flex items-center justify-between hover:bg-[#f7f9fb] transition-colors cursor-pointer ${
                              selectedCustomer.id === defaultCashCustomer.id ? 'bg-[#e8f5e9]' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#191c1e]">
                                  {defaultCashCustomer.name}
                                </span>
                                <span className="text-[9px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.2 rounded">
                                  B2C
                                </span>
                              </div>
                              <span className="text-[10px] text-[#505f76] block mt-0.5">
                                فاتورة ضريبية مبسطة للأفراد
                              </span>
                            </div>
                            {selectedCustomer.id === defaultCashCustomer.id && (
                              <Check className="w-4 h-4 text-[#005126] shrink-0" />
                            )}
                          </button>
                        )}

                        {/* Registered Customers */}
                        {matchingCustomCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomCustomerSearchQuery('');
                              setIsCustomCustomerDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 text-right flex items-center justify-between hover:bg-[#f7f9fb] transition-colors cursor-pointer ${
                              selectedCustomer.id === c.id ? 'bg-[#e8f5e9]' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[#191c1e] truncate">{c.name}</span>
                                {c.taxNumber ? (
                                  <span className="text-[9px] bg-[#005126] text-white font-bold px-1.5 py-0.2 rounded">
                                    ضريبي B2B
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-[#d0e1fb] text-[#005126] font-bold px-1.5 py-0.2 rounded">
                                    B2C
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#505f76] flex gap-2.5 mt-0.5 flex-wrap font-currency">
                                {c.taxNumber && <span>الضريبي: {c.taxNumber}</span>}
                                {c.phone && c.phone !== '-' && <span>الهاتف: {c.phone}</span>}
                                {c.crNumber && <span>السجل: {c.crNumber}</span>}
                              </div>
                            </div>
                            {selectedCustomer.id === c.id && (
                              <Check className="w-4 h-4 text-[#005126] shrink-0 mr-1" />
                            )}
                          </button>
                        ))}

                        {/* Empty Search Result */}
                        {customCustomerSearchQuery &&
                          matchingCustomCustomers.length === 0 &&
                          !'عميل نقدي عام مبسط b2c'.includes(customCustomerSearchQuery.toLowerCase()) && (
                            <div className="p-4 text-center text-xs text-[#505f76]">
                              لا يوجد عميل يطابق &quot;{customCustomerSearchQuery}&quot;
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors cursor-pointer"
                >
                  إضافة البند للفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Fast Payment Modal ================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#005126]" />
              <h3 className="text-xl font-bold text-[#191c1e]">إتمام الدفع والفاتورة الضريبية</h3>
            </div>

            {/* Customer Summary */}
            <div className="bg-[#f7f9fb] rounded-xl p-3 border border-[#becabd] mb-3 text-xs flex justify-between items-center">
              <div>
                <span className="text-[#505f76] block text-[10px]">العميل:</span>
                <span className="font-bold text-[#191c1e]">{selectedCustomer.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCustomerCorporate ? 'bg-[#d0e1fb] text-[#005126]' : 'bg-[#e0e3e5] text-[#191c1e]'}`}>
                {isCustomerCorporate ? 'فاتورة ضريبية قياسية (B2B)' : 'فاتورة ضريبية مبسطة (B2C)'}
              </span>
            </div>

            {/* Total Display */}
            <div className="bg-[#f2f4f6] rounded-xl p-4 text-center border border-[#becabd] mb-4">
              <span className="text-xs text-[#505f76] block mb-1">المبلغ المطلوب سداده</span>
              <span className="font-currency text-3xl font-bold text-[#005126]">
                {formatCurrency(grandTotal)}
              </span>
              <span className="text-sm font-semibold text-[#3f4940] mr-1">ر.س شامل {vatPercent}% ض.ق.م</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-[#3f4940] block">اختر طريقة السداد:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#005126] bg-[#006c35]/10 text-[#005126] font-bold shadow-xs'
                      : 'border-[#becabd] text-[#3f4940] hover:bg-[#f7f9fb]'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">بطاقة / مدى</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-[#005126] bg-[#006c35]/10 text-[#005126] font-bold shadow-xs'
                      : 'border-[#becabd] text-[#3f4940] hover:bg-[#f7f9fb]'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">نقداً</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'transfer'
                      ? 'border-[#005126] bg-[#006c35]/10 text-[#005126] font-bold shadow-xs'
                      : 'border-[#becabd] text-[#3f4940] hover:bg-[#f7f9fb]'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span className="text-xs">تحويل بنكي</span>
                </button>
              </div>
            </div>

            {/* Cash details if selected */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 p-3 bg-[#f7f9fb] rounded-xl border border-[#becabd] mb-4">
                <div>
                  <label className="text-xs font-semibold text-[#3f4940] block mb-1">
                    المبلغ المستلم من العميل:
                  </label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full p-2 bg-white border border-[#becabd] rounded-lg text-base font-bold font-currency text-[#191c1e] text-left outline-none focus:border-[#005126]"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#3f4940] font-semibold">المتبقي (الباقي للعميل):</span>
                  <span className="font-currency font-bold text-base text-[#005126]">
                    {formatCurrency(cashChange)} ر.س
                  </span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={finalizeSale}
              className="w-full py-3 bg-[#005126] text-white font-bold text-base rounded-xl hover:bg-[#006c35] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>تأكيد وطباعة الفاتورة</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= Success / Invoice Quick Print Modal ================= */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#006c35]/20 text-[#005126] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#191c1e]">تمت عملية البيع بنجاح!</h3>
              <p className="text-xs text-[#505f76] mt-0.5 font-currency">
                رقم الفاتورة: {completedInvoice.invoiceNumber}
              </p>
            </div>

            {/* Mini Summary */}
            <div className="bg-[#f7f9fb] p-3 rounded-xl border border-[#becabd] text-xs space-y-1.5 text-right">
              <div className="flex justify-between">
                <span className="text-[#505f76]">العميل:</span>
                <span className="font-bold text-[#191c1e]">{completedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#505f76]">الإجمالي شامل الضريبة:</span>
                <span className="font-currency font-bold text-[#005126]">
                  {formatCurrency(completedInvoice.grandTotal)} ر.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#505f76]">طريقة السداد:</span>
                <span className="font-semibold text-[#191c1e]">
                  {completedInvoice.paymentMethod === 'card'
                    ? 'بطاقة / مدى'
                    : completedInvoice.paymentMethod === 'cash'
                    ? 'نقداً'
                    : 'تحويل بنكي'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#eceef0]">
                <span className="text-[#505f76]">حالة الربط بهيئة الزكاة:</span>
                {completedInvoice.zatcaStatus === 'cleared' && isOnboarded ? (
                  <span className="font-bold text-[#005126] flex items-center gap-1 bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-[#005126]/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>معتمدة ومسجلة (ZATCA)</span>
                  </span>
                ) : completedInvoice.zatcaStatus === 'failed' ? (
                  <span className="font-bold text-red-800 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>مرفوضة من الهيئة</span>
                  </span>
                ) : (
                  <span className="font-bold text-amber-800 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>فاتورة محلية (غير مربوطة)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  onOpenInvoiceModal(completedInvoice);
                  setCompletedInvoice(null);
                }}
                className="w-full py-2.5 bg-[#005126] text-white font-bold rounded-xl text-xs hover:bg-[#006c35] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>عرض وطباعة الفاتورة الضريبية الكاملة (A4 / حراري)</span>
              </button>

              <button
                onClick={() => setCompletedInvoice(null)}
                className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
              >
                بدء عملية بيع جديدة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
