import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Building2,
  User,
  CreditCard,
  FileText,
  DollarSign,
  HelpCircle,
  Check,
  Layout,
  Calculator,
  Save,
  Eye,
  Percent,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  CompanyProfile,
  CurrencyConfig,
  CustomProposal,
  ProposalItem,
  TemplateTheme,
} from '../types';
import {
  AVAILABLE_CURRENCIES,
  calculateProposalGrandTotals,
  calculateProposalItemTotals,
  formatCustomCurrency,
  TEMPLATE_DEFINITIONS,
} from '../utils/proposals';

interface CustomProposalBuilderModalProps {
  initialProposal?: CustomProposal | null;
  companyProfile: CompanyProfile;
  onClose: () => void;
  onSave: (proposal: CustomProposal) => void;
  onPreviewImmediately?: (proposal: CustomProposal) => void;
}

export const CustomProposalBuilderModal: React.FC<CustomProposalBuilderModalProps> = ({
  initialProposal,
  companyProfile,
  onClose,
  onSave,
  onPreviewImmediately,
}) => {
  // Tabs: 'branding' | 'parties' | 'items' | 'terms' | 'preview'
  const [activeTab, setActiveTab] = useState<'branding' | 'parties' | 'items' | 'terms'>('branding');

  // Form State
  const [documentType, setDocumentType] = useState<'proposal' | 'custom_invoice'>(
    initialProposal?.documentType || 'proposal'
  );
  const [proposalNumber, setProposalNumber] = useState(
    initialProposal?.proposalNumber ||
      `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [title, setTitle] = useState(
    initialProposal?.title || 'عرض سعر لتقديم خدمات وحلول مخصصة'
  );
  const [status, setStatus] = useState<CustomProposal['status']>(
    initialProposal?.status || 'draft'
  );
  const [templateTheme, setTemplateTheme] = useState<TemplateTheme>(
    initialProposal?.templateTheme || 'corporate'
  );
  const [primaryColor, setPrimaryColor] = useState(
    initialProposal?.primaryColor || '#005126'
  );
  const [currency, setCurrency] = useState<CurrencyConfig>(
    initialProposal?.currency || AVAILABLE_CURRENCIES[0]
  );
  const [logoUrl, setLogoUrl] = useState<string>(
    initialProposal?.sender.logoUrl || ''
  );

  // Dates
  const [issueDate, setIssueDate] = useState(
    initialProposal?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    initialProposal?.validUntil ||
      new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialProposal?.deliveryDate || ''
  );

  // Sender Details
  const [sender, setSender] = useState({
    companyName: initialProposal?.sender.companyName || companyProfile.nameAr || '',
    legalName: initialProposal?.sender.legalName || companyProfile.nameEn || '',
    taxNumber: initialProposal?.sender.taxNumber || companyProfile.taxNumber || '',
    crNumber: initialProposal?.sender.crNumber || companyProfile.crNumber || '',
    phone: initialProposal?.sender.phone || companyProfile.phone || '',
    email: initialProposal?.sender.email || companyProfile.email || '',
    address: initialProposal?.sender.address || `${companyProfile.streetName} ${companyProfile.district}`.trim() || '',
    city: initialProposal?.sender.city || companyProfile.city || 'الرياض',
    country: initialProposal?.sender.country || 'المملكة العربية السعودية',
    bankName: initialProposal?.sender.bankName || 'مصرف الراجحي',
    bankAccount: initialProposal?.sender.bankAccount || '',
    iban: initialProposal?.sender.iban || 'SA0000000000000000000000',
  });

  // Client Details
  const [client, setClient] = useState({
    name: initialProposal?.client.name || '',
    companyName: initialProposal?.client.companyName || '',
    attentionPerson: initialProposal?.client.attentionPerson || '',
    taxNumber: initialProposal?.client.taxNumber || '',
    crNumber: initialProposal?.client.crNumber || '',
    phone: initialProposal?.client.phone || '',
    email: initialProposal?.client.email || '',
    address: initialProposal?.client.address || '',
    city: initialProposal?.client.city || '',
    country: initialProposal?.client.country || 'المملكة العربية السعودية',
  });

  // Items List
  const [items, setItems] = useState<ProposalItem[]>(
    initialProposal?.items && initialProposal.items.length > 0
      ? initialProposal.items
      : [
          {
            id: 'item-1',
            name: 'خدمة تطوير واستشارات مخصصة',
            description: 'وصف تفصيلي للبند والمهام المشمولة ضمن نطاق العمل.',
            quantity: 1,
            unit: 'خدمة',
            unitPrice: 1500,
            discount: 0,
            discountType: 'fixed',
            taxRate: 0.15,
            vatAmount: 225,
            subtotal: 1500,
            total: 1725,
          },
        ]
  );

  // Global Discounts & Taxes
  const [discountGlobal, setDiscountGlobal] = useState<number>(
    initialProposal?.discountGlobal || 0
  );
  const [discountGlobalType, setDiscountGlobalType] = useState<'percentage' | 'fixed'>(
    initialProposal?.discountGlobalType || 'fixed'
  );
  const [taxRateGlobal, setTaxRateGlobal] = useState<number>(
    initialProposal?.taxRateGlobal ?? 0.15
  );

  // Terms & Payment
  const [paymentMethod, setPaymentMethod] = useState(
    initialProposal?.paymentMethod || 'تحويل بنكي'
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialProposal?.paymentTerms || 'الدفع خلال 15 يوماً من تاريخ استلام الوثيقة.'
  );
  const [notes, setNotes] = useState(
    initialProposal?.notes || 'نتطلع لتقديم أفضل الخدمات والتعاون المثمر معكم.'
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    initialProposal?.termsAndConditions ||
      '1. يعتبر هذا العرض سارياً حتى التاريخ المحدد أعلاه.\n2. يتم اعتماد جدول التسليم فور تأكيد وتوقيع العرض واستلام الدفعة الأولى.'
  );

  // Recalculate totals whenever items or globals change
  const totals = calculateProposalGrandTotals(
    items,
    discountGlobal,
    discountGlobalType,
    taxRateGlobal
  );

  // Handle template selection change
  const handleSelectTheme = (theme: TemplateTheme) => {
    setTemplateTheme(theme);
    const def = TEMPLATE_DEFINITIONS.find((t) => t.id === theme);
    if (def) {
      setPrimaryColor(def.defaultColor);
    }
  };

  // Add Item
  const handleAddItem = () => {
    const newItem: ProposalItem = {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unit: 'قطعة',
      unitPrice: 0,
      discount: 0,
      discountType: 'fixed',
      taxRate: taxRateGlobal,
      vatAmount: 0,
      subtotal: 0,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item Field
  const handleUpdateItem = (index: number, field: keyof ProposalItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Recalculate item totals
      const calc = calculateProposalItemTotals(
        target.quantity || 0,
        target.unitPrice || 0,
        target.discount || 0,
        target.discountType || 'fixed',
        target.taxRate ?? taxRateGlobal
      );

      target.subtotal = calc.subtotal;
      target.vatAmount = calc.vatAmount;
      target.total = calc.total;

      updated[index] = target;
      return updated;
    });
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setLogoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save proposal handler
  const handleSave = () => {
    const compiledProposal: CustomProposal = {
      id: initialProposal?.id || `prop-${Date.now()}`,
      proposalNumber,
      title: title || (documentType === 'proposal' ? 'عرض سعر' : 'فاتورة مخصصة'),
      documentType,
      status,
      templateTheme,
      primaryColor,
      currency,
      sender: {
        ...sender,
        logoUrl: logoUrl || undefined,
      },
      client,
      issueDate,
      validUntil,
      deliveryDate: deliveryDate || undefined,
      items,
      discountGlobal,
      discountGlobalType,
      taxRateGlobal,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalVat: totals.totalVat,
      grandTotal: totals.grandTotal,
      paymentMethod,
      paymentTerms,
      notes: notes || undefined,
      termsAndConditions: termsAndConditions || undefined,
      clientDecision: initialProposal?.clientDecision,
      createdAt: initialProposal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(compiledProposal);
  };

  const tabOrder: ('branding' | 'parties' | 'items' | 'terms')[] = ['branding', 'parties', 'items', 'terms'];
  const currentTabIndex = tabOrder.indexOf(activeTab);

  const goToNextTab = () => {
    if (currentTabIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentTabIndex + 1]);
    }
  };

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabOrder[currentTabIndex - 1]);
    }
  };

  const getNextTabLabel = () => {
    if (activeTab === 'branding') return 'الخطوة التالية: بيانات المرسل والعميل';
    if (activeTab === 'parties') return 'الخطوة التالية: المنتجات والخدمات';
    if (activeTab === 'items') return 'الخطوة التالية: الشروط والدفع والملاحظات';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Header */}
        <div className="bg-[#f8fafc] border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#005126] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialProposal ? 'تعديل نموذج الفاتورة / عرض السعر' : 'إنشاء نموذج فاتورة وعرض سعر مخصص'}
              </h2>
              <p className="text-xs text-slate-500">
                خصص القالب والشعار والبنود والعملة وشروط الدفع حسب احتياج نشاطك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#005126] hover:bg-[#003d1c] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ النموذج</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'branding'
                ? 'border-[#005126] text-[#005126] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>1. الهوية والشعار والمظهر</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parties')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'parties'
                ? 'border-[#005126] text-[#005126] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. بيانات المرسل والعميل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'items'
                ? 'border-[#005126] text-[#005126] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>3. المنتجات والخدمات ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'terms'
                ? 'border-[#005126] text-[#005126] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>4. الشروط والدفع والملاحظات</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]/50 text-xs">
          
          {/* TAB 1: BRANDING & IDENTITY */}
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Document Identity */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  نوع الوثيقة والبيانات الأساسية
                </h3>

                <div className="space-y-4">
                  {/* Row 1: Document Type */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">نوع الوثيقة:</label>
                    <div className="grid grid-cols-2 gap-3 max-w-lg">
                      <button
                        type="button"
                        onClick={() => setDocumentType('proposal')}
                        className={`py-2.5 px-4 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          documentType === 'proposal'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {documentType === 'proposal' && <Check className="w-4 h-4 text-emerald-600" />}
                        <span>عرض سعر</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocumentType('custom_invoice')}
                        className={`py-2.5 px-4 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          documentType === 'custom_invoice'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {documentType === 'custom_invoice' && <Check className="w-4 h-4 text-emerald-600" />}
                        <span>فاتورة مخصصة</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Document Number */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">رقم الوثيقة / الفاتورة:</label>
                    <input
                      type="text"
                      value={proposalNumber}
                      onChange={(e) => setProposalNumber(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                      dir="ltr"
                    />
                  </div>

                  {/* Row 3: Currency */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">العملة المعتمدة:</label>
                    <select
                      value={currency.code}
                      onChange={(e) => {
                        const selected = AVAILABLE_CURRENCIES.find((c) => c.code === e.target.value);
                        if (selected) setCurrency(selected);
                      }}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                    >
                      {AVAILABLE_CURRENCIES.map((cur) => (
                        <option key={cur.code} value={cur.code}>
                          {cur.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4: Document Title */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">عنوان أو موضوع الوثيقة:</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: عرض سعر تطوير تطبيق المتجر الإلكتروني والهوية الرقمية"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Logo Upload */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  شعار علامتك التجارية (Logo)
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="text-center text-slate-400 p-2">
                        <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">لا يوجد شعار</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                        <Upload className="w-4 h-4" />
                        <span>رفع شعار من الجهاز</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          إزالة الشعار
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      يدعم صيغ PNG, JPG, SVG الشفافة بدقة عالية لتظهر بشكل احترافي في الفاتورة والـ PDF.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PARTIES & DATES */}
          {activeTab === 'parties' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Dates Row */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  تواريخ الإصدار والصلاحية
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">تاريخ الإصدار:</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">صالح حتى تاريخ:</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">تاريخ التسليم المتوقع (اختياري):</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Sender Details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  بيانات الطرف الأول (مقدم الوثيقة / شركتك)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اسم المؤسسة / الشركة:</label>
                    <input
                      type="text"
                      value={sender.companyName}
                      onChange={(e) => setSender({ ...sender, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">الاسم بالإنجليزية (اختياري):</label>
                    <input
                      type="text"
                      value={sender.legalName}
                      onChange={(e) => setSender({ ...sender, legalName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي:</label>
                    <input
                      type="text"
                      value={sender.taxNumber}
                      onChange={(e) => setSender({ ...sender, taxNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">السجل التجاري:</label>
                    <input
                      type="text"
                      value={sender.crNumber}
                      onChange={(e) => setSender({ ...sender, crNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف / الجوال:</label>
                    <input
                      type="text"
                      value={sender.phone}
                      onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني:</label>
                    <input
                      type="email"
                      value={sender.email}
                      onChange={(e) => setSender({ ...sender, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">العنوان والمدينة:</label>
                    <input
                      type="text"
                      value={sender.address}
                      onChange={(e) => setSender({ ...sender, address: e.target.value })}
                      placeholder="الشارع، الحي، المدينة"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Client Receiver Details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  بيانات العميل المستلم (إلى)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اسم العميل / الشركة المستلمة:</label>
                    <input
                      type="text"
                      value={client.name}
                      onChange={(e) => setClient({ ...client, name: e.target.value })}
                      placeholder="مثال: شركة الأفق للمقاولات أو الأستاذ محمد"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">عناية الشخص المسؤول (Attention):</label>
                    <input
                      type="text"
                      value={client.attentionPerson}
                      onChange={(e) => setClient({ ...client, attentionPerson: e.target.value })}
                      placeholder="مثال: أ. أحمد الغامدي - مدير المشتريات"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي للعميل (إن وجد):</label>
                    <input
                      type="text"
                      value={client.taxNumber}
                      onChange={(e) => setClient({ ...client, taxNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">رقم هاتف / جوال العميل:</label>
                    <input
                      type="text"
                      value={client.phone}
                      onChange={(e) => setClient({ ...client, phone: e.target.value })}
                      placeholder="+966 50 000 0000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني للعميل (للإرسال):</label>
                    <input
                      type="email"
                      value={client.email}
                      onChange={(e) => setClient({ ...client, email: e.target.value })}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">العنوان والمدينة:</label>
                    <input
                      type="text"
                      value={client.address}
                      onChange={(e) => setClient({ ...client, address: e.target.value })}
                      placeholder="الرياض، طريق الملك فهد"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: UNLIMITED ITEMS & SERVICES */}
          {activeTab === 'items' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      إضافة المنتجات والخدمات (عدد لا نهائي)
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      أضف البنود والكميات والوحدات والأسعار ونسب الخصم والضرائب بكل مرونة:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة بند جديد</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          بيانات البند / الخدمة
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            الإجمالي: {formatCustomCurrency(item.total, currency)}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                              title="حذف هذا البند"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">اسم المنتج أو الخدمة:</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            placeholder="مثال: تصميم وبرمجة لوحة التحكم"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">الكمية:</label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-center focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">الوحدة:</label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                          >
                            <option value="خدمة">خدمة</option>
                            <option value="قطعة">قطعة</option>
                            <option value="ساعة">ساعة</option>
                            <option value="شهر">شهر</option>
                            <option value="مشروع">مشروع</option>
                            <option value="متر">متر</option>
                            <option value="كجم">كجم</option>
                            <option value="يوم">يوم</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">سعر الوحدة:</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">المواصفات والوصف التفصيلي (اختياري):</label>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                            placeholder="وصف تفصيلي للبند..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">خصم البند:</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={item.discount || 0}
                              onChange={(e) => handleUpdateItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-center bg-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(
                                  idx,
                                  'discountType',
                                  item.discountType === 'percentage' ? 'fixed' : 'percentage'
                                )
                              }
                              className="px-2 py-1.5 bg-slate-200 rounded text-[10px] font-bold text-slate-700 shrink-0"
                            >
                              {item.discountType === 'percentage' ? '%' : currency.symbol}
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">نسبة الضريبة:</label>
                          <select
                            value={item.taxRate}
                            onChange={(e) => handleUpdateItem(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                          >
                            <option value={0.15}>15% (الأساسية)</option>
                            <option value={0.05}>5%</option>
                            <option value={0}>0% (معفاة / صفرية)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Summary Card */}
                <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-300 max-w-md mr-auto space-y-2">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono font-semibold" dir="ltr">
                      {formatCustomCurrency(totals.subtotal, currency)}
                    </span>
                  </div>

                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-xs text-red-600">
                      <span>إجمالي الخصومات:</span>
                      <span className="font-mono font-semibold" dir="ltr">
                        -{formatCustomCurrency(totals.totalDiscount, currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-slate-700">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-mono font-semibold text-emerald-800" dir="ltr">
                      {formatCustomCurrency(totals.totalVat, currency)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>المبلغ الإجمالي المستحق:</span>
                    <span className="text-base font-mono text-[#005126]" dir="ltr">
                      {formatCustomCurrency(totals.grandTotal, currency)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TERMS, PAYMENT & NOTES */}
          {activeTab === 'terms' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Payment & Banking Info */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  طريقة وشروط الدفع والبيانات البنكية
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">طريقة الدفع المقترحة:</label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="مثال: تحويل بنكي سريع، مدى، شيك مصدق..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اسم البنك المعتمد للتحويل:</label>
                    <input
                      type="text"
                      value={sender.bankName || ''}
                      onChange={(e) => setSender({ ...sender, bankName: e.target.value })}
                      placeholder="مثال: مصرف الراجحي أو البنك الأهلي"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">رقم الآيبان (IBAN):</label>
                    <input
                      type="text"
                      value={sender.iban || ''}
                      onChange={(e) => setSender({ ...sender, iban: e.target.value })}
                      placeholder="SA00 0000 0000 0000 0000 0000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">شروط وجدول الدفعات:</label>
                    <textarea
                      rows={2}
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="مثال: 50% دفعة مقدمة عند توقيع العقد، و 50% عند تسليم المشروع النهائي."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  الملاحظات والشروط والأحكام
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ملاحظات إضافية للعميل:</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي توضيحات أو تعليمات خاصة بالطلب أو التنفيذ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الشروط والأحكام العامة:</label>
                  <textarea
                    rows={4}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="1. مدة صلاحية العرض...\n2. سياسة التعديل والإلغاء..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-sans"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-[#f8fafc] border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">إجمالي الوثيقة:</span>
            <span className="font-bold font-mono text-sm text-[#005126]">
              {formatCustomCurrency(totals.grandTotal, currency)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {currentTabIndex > 0 && (
              <button
                type="button"
                onClick={goToPrevTab}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}

            {currentTabIndex < tabOrder.length - 1 && (
              <button
                type="button"
                onClick={goToNextTab}
                className="px-5 py-2 text-xs font-bold text-white bg-[#005126] hover:bg-[#003d1c] rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>{getNextTabLabel()}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
