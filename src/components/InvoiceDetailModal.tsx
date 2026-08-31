import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CompanyProfile, Invoice } from '../types';
import { formatCurrency, generateZatcaTlvQrCode } from '../utils/zatca';
import { QRCodeDisplay } from './QRCodeDisplay';
import { InvoiceAuditHistoryModal } from './InvoiceAuditHistoryModal';
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  RotateCcw,
  Edit3,
  Trash2,
  Lock,
  RefreshCw,
  Receipt,
  FileText,
  Building,
  UserCheck,
  ChevronDown,
  Check,
  ShieldCheck,
  History,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  companyProfile: CompanyProfile;
  onClose: () => void;
  onOpenCreditNote?: (invoice: Invoice) => void;
  onOpenEdit?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoice: Invoice) => void;
  onLinkToZatca?: (invoice: Invoice) => Promise<boolean> | void;
  onOpenZatcaWizard?: () => void;
  isOnboarded?: boolean;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  companyProfile,
  onClose,
  onOpenCreditNote,
  onOpenEdit,
  onDeleteInvoice,
  onLinkToZatca,
  onOpenZatcaWizard,
  isOnboarded: isOnboardedProp,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [viewMode, setViewMode] = useState<'a4' | 'pos'>('a4');
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const printMenuRef = useRef<HTMLDivElement>(null);

  const isOnboarded = Boolean(
    isOnboardedProp !== undefined
      ? isOnboardedProp
      : companyProfile.csidStatus === 'active' ||
        companyProfile.zatcaConfig?.isOnboarded === true ||
        (companyProfile.zatcaConfig?.productionCsid && companyProfile.zatcaConfig.productionCsid.trim().length > 10)
  );

  // Close print menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setShowPrintMenu(false);
      }
    };
    if (showPrintMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrintMenu]);

  // Compute standard ZATCA TLV QR code payload
  const validQrCode = useMemo(() => {
    if (!invoice) return '';
    const rawTime = invoice.date ? `${invoice.date} ${invoice.time || '12:00:00'}` : new Date().toISOString();
    return generateZatcaTlvQrCode(
      companyProfile.nameAr || 'المنشأة التجارية',
      companyProfile.taxNumber || '300000000000003',
      rawTime,
      invoice.grandTotal || 0,
      invoice.totalVat || 0,
      invoice.invoiceHash || 'SHA256:INV-HASH-ZATCA-LIVE',
      invoice.cryptographicStamp
    );
  }, [invoice, companyProfile]);

  if (!invoice) return null;

  const handlePrintWithFormat = (format: 'a4' | 'pos') => {
    setViewMode(format);
    setShowPrintMenu(false);

    // Give React and the browser a short frame to render the target layout, then invoke native print
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.error('Failed to trigger window.print:', e);
      }
    }, 80);
  };

  const handleLinkClick = async () => {
    if (!onLinkToZatca) return;
    setIsLinking(true);
    try {
      await onLinkToZatca(invoice);
    } finally {
      setIsLinking(false);
    }
  };

  const handleDownloadXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invoice.invoiceNumber}</cbc:ID>
  <cbc:UUID>${invoice.uuid}</cbc:UUID>
  <cbc:IssueDate>${invoice.date}</cbc:IssueDate>
  <cbc:IssueTime>${invoice.time}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0111010">${invoice.type === 'simplified' ? '388' : '388'}</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${companyProfile.taxNumber || '300000000000003'}</cbc:CompanyID>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${companyProfile.nameAr || 'المنشأة التجارية'}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${invoice.totalVat.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${invoice.grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${invoice.grandTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}-ZATCA.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCreditNote = invoice.type === 'credit_note';
  const isSimplified = invoice.type === 'simplified';
  const isTrulyCleared = invoice.zatcaStatus === 'cleared' && isOnboarded;
  const isPending = !isTrulyCleared;

  const invoiceTitleAr = isCreditNote
    ? 'إشعار دائن إلكتروني'
    : isSimplified
    ? 'فاتورة ضريبية مبسطة'
    : 'فاتورة ضريبية';

  const invoiceTitleEn = isCreditNote
    ? 'Electronic Credit Note'
    : isSimplified
    ? 'Simplified Tax Invoice'
    : 'Tax Invoice';

  const handleOpenConfirmLinkModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmLink = async () => {
    if (!onLinkToZatca) return;
    if (!isOnboarded) {
      setShowConfirmModal(false);
      if (onOpenZatcaWizard) {
        onOpenZatcaWizard();
      }
      return;
    }
    setIsLinking(true);
    try {
      const res = await onLinkToZatca(invoice);
      if (res !== false) {
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error('Error linking invoice to ZATCA:', err);
    } finally {
      setIsLinking(false);
    }
  };

  const displayBranch =
    invoice.branch ||
    companyProfile.branchName ||
    companyProfile.nameAr ||
    'الفرع الرئيسي';

  const displayCashier =
    invoice.cashierName ||
    companyProfile.cashierName ||
    companyProfile.nameAr ||
    'الكاشير';

  const fullAddress = [
    companyProfile.buildingNumber ? `مبنى ${companyProfile.buildingNumber}` : '',
    companyProfile.streetName,
    companyProfile.district,
    companyProfile.city,
  ]
    .filter(Boolean)
    .join('، ');

  const paymentLabel =
    invoice.paymentMethod === 'card'
      ? 'بطاقة دفع / مدى'
      : invoice.paymentMethod === 'cash'
      ? 'نقداً'
      : 'تحويل بنكي';

  const vatPercent = invoice.items?.[0]?.vatRate !== undefined
    ? Math.round(invoice.items[0].vatRate * 100)
    : invoice.subtotal > 0
    ? Math.round((invoice.totalVat / invoice.subtotal) * 100)
    : Math.round((companyProfile.defaultVatRate ?? 0.15) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto font-['Tajawal']"
      dir="rtl"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[98vh]">
        
        {/* Light Modern Navbar */}
        <header className="no-print px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('a4')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'a4'
                  ? 'bg-[#005126] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>فاتورة ضريبية A4</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('pos')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'pos'
                  ? 'bg-[#005126] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>إيصال كاشير 80mm</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Audit History button if edited */}
            {invoice.editHistory && invoice.editHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="hidden sm:flex px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-bold rounded-lg border border-blue-300 items-center gap-1 transition-colors cursor-pointer"
                title="عرض سجل تعديلات هذه الفاتورة"
              >
                <History className="w-3.5 h-3.5 text-blue-700" />
                <span>سجل التعديلات ({invoice.editHistory.length})</span>
              </button>
            )}

            {!isCreditNote && onOpenCreditNote && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreditNote(invoice);
                }}
                className="hidden sm:flex px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-lg border border-amber-200 items-center gap-1 transition-colors cursor-pointer"
                title="إصدار إشعار دائن"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إشعار دائن</span>
              </button>
            )}

            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(invoice);
                }}
                className="flex px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium rounded-lg border border-blue-200 items-center gap-1 transition-colors cursor-pointer"
                title="تعديل الفاتورة"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">تعديل</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="flex px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-medium rounded-lg border border-indigo-200 items-center gap-1 transition-colors cursor-pointer"
              title="سجل التعديلات والعمليات"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">سجل التعديلات</span>
            </button>

            {onDeleteInvoice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteInvoice(invoice);
                }}
                className="flex px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-medium rounded-lg border border-red-200 items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="حذف الفاتورة"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">حذف</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="تحميل ZATCA XML"
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>XML</span>
            </button>

            {/* Print button with format choice dropdown */}
            <div className="relative flex items-center bg-[#005126] hover:bg-[#00602d] rounded-lg shadow-xs" ref={printMenuRef}>
              <button
                type="button"
                onClick={() => handlePrintWithFormat(viewMode)}
                className="px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-r-lg hover:bg-black/10 transition-colors"
                title="طباعة مباشرة"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowPrintMenu((prev) => !prev)}
                className="px-1.5 py-1.5 text-white/90 hover:text-white hover:bg-black/20 border-r border-white/20 rounded-l-lg cursor-pointer transition-colors"
                title="اختر مقاس ونوع الطباعة"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showPrintMenu && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 text-right font-['Tajawal']">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100 mb-1">
                    اختر مقاس ونوع الطباعة:
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePrintWithFormat('a4')}
                    className="w-full px-3 py-2 text-xs flex items-center justify-between text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-[#005126]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div className="font-bold">فاتورة ضريبية A4</div>
                        <div className="text-[10px] text-slate-500">طباعة رسمية بالحجم القياسي الكامل</div>
                      </div>
                    </div>
                    {viewMode === 'a4' && <Check className="w-4 h-4 text-[#005126]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintWithFormat('pos')}
                    className="w-full px-3 py-2 text-xs flex items-center justify-between text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-[#005126]">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div className="font-bold">إيصال كاشير 80mm</div>
                        <div className="text-[10px] text-slate-500">طابعة حرارية نقطة بيع POS</div>
                      </div>
                    </div>
                    {viewMode === 'pos' && <Check className="w-4 h-4 text-[#005126]" />}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mr-1"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Clean, Subtle Alert Bar */}
        <div className="no-print shrink-0">
          {isTrulyCleared ? (
            <div className="p-4 sm:p-5 bg-emerald-50 border-b border-emerald-200/70 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold">الفاتورة معتمدة وموثقة إلكترونياً بمنصة هيئة الزكاة والضريبة والجمارك (فاتورة - المرحلة الثانية)</span>
              </div>
              <span className="font-mono text-[11px] bg-emerald-100/90 text-emerald-800 px-2.5 py-0.5 rounded font-bold">ZATCA LIVE CLEARED</span>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-amber-50/90 border-b border-amber-200/70 flex items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-semibold">
                  {!isOnboarded
                    ? 'فاتورة صادرة محلياً - غير معتمدة لدى هيئة الزكاة (يلزم إتمام الربط وتوثيق شهادة الإنتاج CSID أولاً).'
                    : 'فاتورة صادرة محلياً - جاهزة للإرسال والاعتماد الفعلي لدى منصة هيئة الزكاة (Production Live).'}
                </span>
              </div>
              {onLinkToZatca && (
                <button
                  type="button"
                  onClick={handleOpenConfirmLinkModal}
                  disabled={isLinking}
                  className="p-[10px] bg-[#005126] hover:bg-[#00602d] text-white text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLinking ? 'animate-spin' : ''}`} />
                  <span>{isLinking ? 'جاري الربط...' : 'ربط وإرسال الفاتورة'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Document Preview Container (100% Full Width) */}
        <div className={`overflow-y-auto flex-1 bg-white ${viewMode === 'pos' ? 'flex justify-center p-4 bg-slate-50' : 'p-0'}`}>
          
          {/* ========================================================= */}
          {/* VIEW 1: OFFICIAL A4 TAX INVOICE */}
          {/* ========================================================= */}
          {viewMode === 'a4' && (
            <div
              id="printable-invoice-document"
              className="bg-white w-full p-5 sm:p-7 space-y-4 text-slate-800 text-xs a4-mode"
            >
              {/* Credit Note Notice */}
              {isCreditNote && invoice.originalInvoiceNumber && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between text-amber-950">
                  <span>إشعار دائن مرتبط بالفاتورة الأصلية: <strong className="font-mono text-slate-900">{invoice.originalInvoiceNumber}</strong></span>
                  {invoice.returnReason && <span className="text-amber-800 text-[11px] font-medium">سبب الإشعار: {invoice.returnReason}</span>}
                </div>
              )}

              {/* QR Code Scan on Center Top */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-xs">
                  <QRCodeDisplay data={validQrCode} size={116} showBorder={false} showLabel={false} />
                </div>
                <span className="text-[11px] text-slate-500 font-medium pt-1">
                  رمز الاستجابة السريعة المعتمد (ZATCA QR)
                </span>
              </div>

              {/* Centered Main Title Banner */}
              <div className="text-center pb-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {invoiceTitleAr}
                </h2>
                <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                  {invoiceTitleEn}
                </p>
              </div>

              {/* 100% Width Full Header Table */}
              <div className="w-full border border-slate-300 rounded-lg overflow-hidden text-xs shadow-2xs">
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-700 w-1/4 border-l border-slate-200">
                        اسم المنشأة / المورّد:
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900 w-1/4 border-l border-slate-200">
                        {companyProfile.nameAr || 'المنشأة التجارية'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 w-1/4 border-l border-slate-200">
                        رقم الفاتورة:
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 w-1/4">
                        {invoice.invoiceNumber}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-700 border-l border-slate-200">
                        الرقم الضريبي:
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-l border-slate-200">
                        {companyProfile.taxNumber || 'غير محدد'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 border-l border-slate-200">
                        تاريخ الإصدار:
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        {invoice.date}
                      </td>
                    </tr>

                    <tr className="bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-700 border-l border-slate-200">
                        السجل التجاري:
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 border-l border-slate-200">
                        {companyProfile.crNumber || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 border-l border-slate-200">
                        وقت الإصدار:
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        {invoice.time}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-700 border-l border-slate-200">
                        العنوان:
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 border-l border-slate-200">
                        {fullAddress || 'المملكة العربية السعودية'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 border-l border-slate-200">
                        حالة الفاتورة:
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#005126]">
                        {isTrulyCleared ? 'معتمدة وموثقة (ZATCA Cleared)' : 'صادرة محلياً (Pending Sync)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2-Column Operational Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Column 1: Branch & Operation */}
                <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60 space-y-1.5">
                  <div className="font-bold text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#005126]" />
                    <span>بيانات العملية والفرع</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">الفرع:</span>
                      <span className="font-medium text-slate-800">{displayBranch}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">الكاشير:</span>
                      <span className="font-medium text-slate-800">{displayCashier}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">طريقة السداد:</span>
                      <span className="font-medium text-slate-800">{paymentLabel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">حالة الدفع:</span>
                      <span className="font-bold text-[#005126]">مدفوعة بالكامل</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Customer Data */}
                <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60 space-y-1.5">
                  <div className="font-bold text-slate-900 pb-1 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#005126]" />
                      <span>بيانات العميل (المشتري)</span>
                    </div>
                    {invoice.customerTaxNumber ? (
                      <span className="text-[10px] font-mono text-[#005126] font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        عميل ضريبي
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">أفراد / تجزئة</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">اسم العميل:</span>
                      <span className="font-semibold text-slate-900">{invoice.customerName || 'عميل نقدي عام'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">الرقم الضريبي:</span>
                      <span className="font-mono text-slate-800">{invoice.customerTaxNumber || 'غير متوفر'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">العنوان:</span>
                      <span className="text-slate-700 truncate block">{invoice.customerAddress || 'المملكة العربية السعودية'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-lg border border-slate-300 overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">الصنف</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                      <th className="py-2.5 px-3 text-center">الضريبة</th>
                      <th className="py-2.5 px-3 text-left">مبلغ الضريبة</th>
                      <th className="py-2.5 px-3 text-left font-bold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-left font-mono">{formatCurrency(item.unitPrice)} ر.س</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-800">
                          {item.vatRate !== undefined ? `${Math.round(item.vatRate * 100)}%` : `${vatPercent}%`}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono text-slate-600">{formatCurrency(item.vatAmount)} ر.س</td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900">
                          {formatCurrency(item.total)} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary Box - 100% Width */}
              <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-300 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">المجموع (غير شامل ضريبة القيمة المضافة):</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.subtotal)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">ضريبة القيمة المضافة ({vatPercent}%):</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.totalVat)} ر.س</span>
                </div>
                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono">-{formatCurrency(invoice.totalDiscount)} ر.س</span>
                  </div>
                )}
                <div className="pt-2.5 border-t-2 border-slate-300 flex justify-between items-baseline font-bold">
                  <span className="text-slate-900 text-sm font-extrabold">الإجمالي المستحق (شامل الضريبة):</span>
                  <span className="font-mono font-black text-xl text-[#005126]">
                    {formatCurrency(invoice.grandTotal)} ر.س
                  </span>
                </div>
              </div>

              {/* Security info - 100% Width */}
              <div className="w-full text-[11px] text-slate-500 space-y-1 pt-1">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#005126]" />
                    <span>الختم الرقمي والتشفير ZATCA Phase 2</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ECDSA SHA256
                  </span>
                </div>
                <div className="font-mono text-[9px] text-slate-500 break-all bg-slate-50 p-2 rounded-lg border border-slate-200">
                  UUID: {invoice.uuid}
                </div>
              </div>

              {/* Edit History / Audit Trail on Original Invoice */}
              {invoice.editHistory && invoice.editHistory.length > 0 && (
                <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2.5 text-xs text-blue-950 no-print">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <History className="w-4 h-4 text-blue-700" />
                      <span>سجل التعديلات على الفاتورة الأصلية ({invoice.editHistory.length} تعديل)</span>
                    </div>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/90 px-2 py-0.5 rounded-md">
                      سجل التتبع والتدقيق
                    </span>
                  </div>
                  <div className="space-y-2">
                    {invoice.editHistory.map((log, lIdx) => (
                      <div key={log.id || lIdx} className="bg-white rounded-lg p-3 border border-blue-100/90 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">
                            {log.reason ? `السبب: ${log.reason}` : 'تعديل بيانات الفاتورة'}
                          </span>
                          <span className="font-mono text-slate-500 text-[10px]">{log.timestamp}</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                          {log.changesSummary.map((change, cIdx) => (
                            <li key={cIdx}>{change}</li>
                          ))}
                        </ul>
                        {log.oldGrandTotal !== undefined && log.newGrandTotal !== undefined && log.oldGrandTotal !== log.newGrandTotal && (
                          <div className="text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-100 flex items-center gap-2">
                            <span>الإجمالي السابق: {formatCurrency(log.oldGrandTotal)} ر.س</span>
                            <span>←</span>
                            <span className="font-bold text-[#005126]">الإجمالي الجديد: {formatCurrency(log.newGrandTotal)} ر.س</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: POS 80mm THERMAL RECEIPT */}
          {/* ========================================================= */}
          {viewMode === 'pos' && (
            <div
              id="printable-invoice-document"
              className="bg-white rounded-xl shadow-md border border-slate-200 w-full max-w-[340px] p-5 space-y-3.5 text-slate-800 text-xs text-center font-['Tajawal'] pos-mode"
            >
              {/* Header */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                <h1 className="text-base font-bold text-slate-900">{companyProfile.nameAr || 'المنشأة التجارية'}</h1>
                {companyProfile.nameEn && <p className="text-[10px] text-slate-500 font-medium">{companyProfile.nameEn}</p>}
                <p className="text-[11px] text-slate-600">الرقم الضريبي: <span className="font-mono font-bold">{companyProfile.taxNumber || 'غير محدد'}</span></p>
                {companyProfile.crNumber && <p className="text-[10px] text-slate-500">س.ت: <span className="font-mono">{companyProfile.crNumber}</span></p>}
                {fullAddress && <p className="text-[10px] text-slate-500">{fullAddress}</p>}
              </div>

              {/* Metadata */}
              <div className="space-y-1.5 text-right text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="text-center font-extrabold text-[#005126] text-xs pb-0.5">{invoiceTitleAr}</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ والوقت:</span>
                  <span className="font-mono text-slate-800">{invoice.date} {invoice.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الفرع / الكاشير:</span>
                  <span className="text-slate-800">{displayBranch} / {displayCashier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">العميل:</span>
                  <span className="text-slate-800">{invoice.customerName || 'عميل نقدي'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 text-right border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between font-bold text-[11px] text-slate-900 pb-1 border-b border-slate-200">
                  <span>الصنف</span>
                  <span>الكمية × السعر</span>
                  <span>الإجمالي</span>
                </div>
                {invoice.items.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-0.5 text-[11px]">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>{item.quantity} × {formatCurrency(item.unitPrice)} ر.س</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(item.total)} ر.س</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-right text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع (غير شامل الضريبة):</span>
                  <span className="font-mono">{formatCurrency(invoice.subtotal)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة ({vatPercent}%):</span>
                  <span className="font-mono">{formatCurrency(invoice.totalVat)} ر.س</span>
                </div>
                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono">-{formatCurrency(invoice.totalDiscount)} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>الإجمالي النهائي:</span>
                  <span className="font-mono text-base text-[#005126] font-black">{formatCurrency(invoice.grandTotal)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>طريقة السداد:</span>
                  <span className="font-bold">{paymentLabel}</span>
                </div>
              </div>

              {/* QR */}
              <div className="flex flex-col items-center justify-center pt-2 space-y-1.5">
                <QRCodeDisplay data={validQrCode} size={100} showBorder={false} showLabel={false} />
                <p className="text-[10px] text-slate-400 font-medium">شكراً لتعاملكم معنا</p>
              </div>

              {/* Edit History in POS view (on-screen only) */}
              {invoice.editHistory && invoice.editHistory.length > 0 && (
                <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 text-right space-y-2 text-xs text-blue-950 no-print mt-3">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                      <History className="w-3.5 h-3.5 text-blue-700" />
                      <span>سجل التعديلات ({invoice.editHistory.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuditModal(true)}
                      className="text-[10px] text-blue-700 font-bold bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-1">
                    <div>آخر تعديل: <span className="font-mono text-slate-800">{invoice.editHistory[0].timestamp}</span></div>
                    <div className="text-slate-700 font-medium">{invoice.editHistory[0].reason}</div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Invoice Audit History Modal */}
      <InvoiceAuditHistoryModal
        invoice={invoice}
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />

      {/* Confirmation Modal for Linking and Sending Invoice to ZATCA */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-right font-['Tajawal'] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-l from-[#005126] to-[#006c35] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">تأكيد إرسال واعتماد الفاتورة لدى هيئة الزكاة</h3>
                  <p className="text-[11px] text-emerald-100">Production Live (الربط الفعلي المعتمد)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Invoice Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">العميل:</span>
                  <span className="font-semibold text-slate-800">{invoice.customerName || 'عميل نقدي'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">المبلغ الإجمالي (شامل الضريبة):</span>
                  <span className="font-mono font-bold text-[#005126] text-sm">{formatCurrency(invoice.grandTotal)} ر.س</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">قيمة الضريبة:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(invoice.totalVat)} ر.س</span>
                </div>
              </div>

              {/* Status Notice */}
              {!isOnboarded ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>حسابك غير مربوط رسمياً بعد (شهادة الإنتاج CSID غير مفعلة)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    لا يمكن إرسال الفاتورة والاعتماد مع هيئة الزكاة قبل إتمام عملية الربط مع منصة فاتورة وإدخال رمز التحقق (OTP).
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-[#f0fdf4] border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold text-[#005126]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>الربط الفعلي المعتمد (Production Live) مفعل وجاهز</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    سيتم إرسال الفاتورة وتوثيقها بختم تشفير رقمي معتمد لدى هيئة الزكاة والضريبة والجمارك.
                  </p>
                </div>
              )}

              {/* Legal Warning */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 space-y-1 leading-relaxed border border-slate-200">
                <span className="font-bold text-slate-800 block">تنبيه نظامي وفق لائحة الفوترة:</span>
                <p>
                  بمجرد تأكيد الاعتماد لدى هيئة الزكاة، تصبح الفاتورة وثيقة مالية رسمية نهائية لا يمكن تعديلها أو حذفها مباشرة، وإنما تُعالج بإصدار إشعار دائن/مدين معتمد.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLinking}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
              >
                إلغاء وتراجع
              </button>

              {!isOnboarded ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    if (onOpenZatcaWizard) {
                      onOpenZatcaWizard();
                    }
                  }}
                  className="px-5 py-2.5 bg-[#005126] hover:bg-[#00602d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>فتح معالج الربط الآن (ZATCA Wizard)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmLink}
                  disabled={isLinking}
                  className="px-5 py-2.5 bg-[#005126] hover:bg-[#00602d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLinking ? 'animate-spin' : ''}`} />
                  <span>{isLinking ? 'جاري الإرسال والاعتماد...' : 'تأكيد الإرسال والاعتماد الفعلي'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
