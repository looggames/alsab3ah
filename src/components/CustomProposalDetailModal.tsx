import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Mail,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Building2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  FileCheck,
  RotateCcw,
  Edit3,
  ExternalLink,
  Send,
  MessageSquare
} from 'lucide-react';
import { CustomProposal, CompanyProfile } from '../types';
import {
  exportProposalToPdf,
  formatCustomCurrency,
  generateProposalEmailContent,
  generateProposalWhatsAppContent,
  TEMPLATE_DEFINITIONS,
} from '../utils/proposals';

interface CustomProposalDetailModalProps {
  proposal: CustomProposal;
  companyProfile: CompanyProfile;
  onClose: () => void;
  onEdit?: (proposal: CustomProposal) => void;
  onDelete?: (proposalId: string) => void;
  onUpdateStatus?: (proposal: CustomProposal, newStatus: CustomProposal['status'], decisionLog?: any) => void;
  onConvertToInvoice?: (proposal: CustomProposal) => void;
}

export const CustomProposalDetailModal: React.FC<CustomProposalDetailModalProps> = ({
  proposal,
  companyProfile,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onConvertToInvoice,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState<'accept' | 'decline' | null>(null);
  const [signerName, setSignerName] = useState(proposal.client.attentionPerson || proposal.client.name || '');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [signatureText, setSignatureText] = useState(proposal.client.name || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isProposal = proposal.documentType === 'proposal';
  const typeLabelAr = isProposal ? 'عرض سعر' : 'فاتورة مخصصة';

  const templateDef = TEMPLATE_DEFINITIONS.find((t) => t.id === proposal.templateTheme) || TEMPLATE_DEFINITIONS[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    showToast('جاري إنشاء ملف الـ PDF عالي الدقة...');
    try {
      await exportProposalToPdf('printable-custom-proposal', `${proposal.proposalNumber}_${proposal.client.name || 'document'}`);
      showToast('تم تنزيل ملف PDF بنجاح.');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء تنزيل PDF، سيتم فتح نافذة الطباعة.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const emailInfo = generateProposalEmailContent(proposal);
  const whatsappUrl = generateProposalWhatsAppContent(proposal);

  const handleSendEmailDirect = () => {
    window.open(emailInfo.mailtoUrl, '_blank');
    if (onUpdateStatus && proposal.status === 'draft') {
      onUpdateStatus(proposal, 'sent');
    }
    setShowEmailModal(false);
    showToast('تم فتح تطبيق البريد وتحديث حالة النموذج إلى "مرسل".');
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
    if (onUpdateStatus && proposal.status === 'draft') {
      onUpdateStatus(proposal, 'sent');
    }
    showToast('تم فتح المحادثة عبر واتساب.');
  };

  const handleConfirmDecision = () => {
    if (showDecisionModal === 'accept') {
      const decision = {
        status: 'accepted' as const,
        actorName: signerName || proposal.client.name,
        actorEmail: proposal.client.email,
        decidedAt: new Date().toISOString(),
        notes: decisionNotes,
        signatureImage: signatureText,
      };
      if (onUpdateStatus) {
        onUpdateStatus(proposal, 'accepted', decision);
      }
      showToast('🎉 تم اعتماد وقبول العرض بنجاح وتوثيق التوقيع الإلكتروني.');
    } else if (showDecisionModal === 'decline') {
      const decision = {
        status: 'declined' as const,
        actorName: signerName || proposal.client.name,
        actorEmail: proposal.client.email,
        decidedAt: new Date().toISOString(),
        declineReason: declineReason || 'تم الرفض بواسطة العميل',
        notes: decisionNotes,
      };
      if (onUpdateStatus) {
        onUpdateStatus(proposal, 'declined', decision);
      }
      showToast('تم تسجيل رفض العرض وتوثيق السبب.');
    }
    setShowDecisionModal(null);
  };

  const getStatusBadge = (status: CustomProposal['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            مسودة (Draft)
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            تم الإرسال للعميل
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            بانتظار رد وموافقة العميل
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            معتمد ومقبول من العميل
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-4 h-4 text-red-600" />
            مرفوض من العميل
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <FileCheck className="w-4 h-4 text-purple-600" />
            تم تحويله لفاتورة مبيعات
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-[#f8fafc] w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-[#191c1e] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005126] flex items-center justify-center border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{proposal.title}</h2>
                {getStatusBadge(proposal.status)}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {proposal.proposalNumber} • قالب: {templateDef.nameAr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Quick Actions */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="طباعة ورقية مباشرة"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50"
              title="تنزيل كملف PDF عالي الجودة"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'جاري التصدير...' : 'تنزيل PDF'}</span>
            </button>

            {/* Client Approval Trigger */}
            {proposal.status !== 'accepted' && proposal.status !== 'converted' && (
              <button
                type="button"
                onClick={() => setShowDecisionModal('accept')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="تسجيل موافقة وتوقيع العميل على العرض"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد وموافقة العميل</span>
              </button>
            )}

            {proposal.status === 'accepted' && onConvertToInvoice && (
              <button
                type="button"
                onClick={() => onConvertToInvoice(proposal)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="تحويل العرض المقبول إلى فاتورة مبيعات معتمدة في النظام"
              >
                <FileCheck className="w-4 h-4" />
                <span>تحويل لفاتورة مبيعات</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(proposal);
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تعديل النموذج"
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>تعديل النموذج</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4 text-slate-600" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>

        {/* Client Decision Banner (If already decided) */}
        {proposal.clientDecision && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between print:hidden border-b ${
              proposal.clientDecision.status === 'accepted'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {proposal.clientDecision.status === 'accepted' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>
                {proposal.clientDecision.status === 'accepted'
                  ? `تم توثيق قبول واعتماد العرض بواسطة (${proposal.clientDecision.actorName}) في تاريخ ${new Date(
                      proposal.clientDecision.decidedAt
                    ).toLocaleDateString('ar-SA')}`
                  : `تم رفض العرض من قبل العميل (${proposal.clientDecision.actorName}) - السبب: ${
                      proposal.clientDecision.declineReason || 'غير محدد'
                    }`}
              </span>
            </div>
            {proposal.clientDecision.notes && (
              <span className="text-[11px] opacity-80">ملاحظة: {proposal.clientDecision.notes}</span>
            )}
          </div>
        )}

        {/* Main Document Content Canvas (Printable Area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/50 print:bg-white print:p-0">
          <div
            id="printable-custom-proposal"
            className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-300 p-8 sm:p-12 print:shadow-none print:border-none print:p-6 print:rounded-none print:w-full min-h-[900px] flex flex-col justify-between"
            style={{
              borderColor: `${proposal.primaryColor}30`,
            }}
          >
            {/* Top Header Section */}
            <div>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-8 border-b-2" style={{ borderColor: `${proposal.primaryColor}25` }}>
                
                {/* Brand & Sender Info */}
                <div className="flex items-start gap-4">
                  {proposal.sender.logoUrl ? (
                    <img
                      src={proposal.sender.logoUrl}
                      alt="Brand Logo"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl border border-slate-200 p-1"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs"
                      style={{ backgroundColor: proposal.primaryColor }}
                    >
                      <Building2 className="w-9 h-9" />
                    </div>
                  )}

                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {proposal.sender.companyName || companyProfile.nameAr}
                    </h1>
                    {proposal.sender.legalName && (
                      <p className="text-xs text-slate-500 font-sans">{proposal.sender.legalName}</p>
                    )}
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {proposal.sender.taxNumber && (
                        <p className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">الرقم الضريبي:</span>
                          <span className="font-mono">{proposal.sender.taxNumber}</span>
                        </p>
                      )}
                      {proposal.sender.crNumber && (
                        <p className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">السجل التجاري:</span>
                          <span className="font-mono">{proposal.sender.crNumber}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{proposal.sender.address} {proposal.sender.city}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        {proposal.sender.phone && <span>هاتف: {proposal.sender.phone}</span>}
                        {proposal.sender.email && <span>• {proposal.sender.email}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Type, Number, & Dates */}
                <div className="text-left sm:text-left self-stretch sm:self-auto flex flex-col items-start sm:items-end justify-between">
                  <div
                    className="px-4 py-2 rounded-xl text-white font-bold text-sm sm:text-base mb-3 shadow-2xs"
                    style={{ backgroundColor: proposal.primaryColor }}
                  >
                    {typeLabelAr}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="font-semibold text-slate-700">رقم الوثيقة:</span>
                      <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {proposal.proposalNumber}
                      </span>
                    </p>
                    <p className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="font-semibold text-slate-700">تاريخ الإصدار:</span>
                      <span className="font-mono">{proposal.issueDate}</span>
                    </p>
                    <p className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="font-semibold text-slate-700">صالح حتى:</span>
                      <span className="font-mono text-emerald-800 font-semibold">{proposal.validUntil}</span>
                    </p>
                    {proposal.deliveryDate && (
                      <p className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="font-semibold text-slate-700">تاريخ التسليم المتوقع:</span>
                        <span className="font-mono">{proposal.deliveryDate}</span>
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Subject Title Banner */}
              <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">موضوع الوثيقة:</p>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{proposal.title}</h2>
              </div>

              {/* Client & Billing Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100" style={{ color: proposal.primaryColor }}>
                    <Building2 className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">بيانات العميل المستلم (إلى)</h3>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p className="font-bold text-sm text-slate-900">
                      {proposal.client.name}
                    </p>
                    {proposal.client.companyName && (
                      <p className="text-slate-600 font-medium">{proposal.client.companyName}</p>
                    )}
                    {proposal.client.attentionPerson && (
                      <p className="text-slate-500">عناية: {proposal.client.attentionPerson}</p>
                    )}
                    {proposal.client.taxNumber && (
                      <p>الرقم الضريبي: <span className="font-mono font-semibold">{proposal.client.taxNumber}</span></p>
                    )}
                    {proposal.client.crNumber && (
                      <p>السجل التجاري: <span className="font-mono">{proposal.client.crNumber}</span></p>
                    )}
                    <p>{proposal.client.address} {proposal.client.city}</p>
                    <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-slate-500 font-mono">
                      {proposal.client.phone && <span>{proposal.client.phone}</span>}
                      {proposal.client.email && <span>{proposal.client.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Payment & Banking Details */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100" style={{ color: proposal.primaryColor }}>
                    <CreditCard className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">بيانات الدفع والتحويل البنكي</h3>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p className="flex justify-between">
                      <span className="text-slate-500">طريقة الدفع:</span>
                      <span className="font-semibold">{proposal.paymentMethod || 'تحويل بنكي'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">العملة:</span>
                      <span className="font-bold font-mono text-emerald-800">{proposal.currency.label}</span>
                    </p>
                    {proposal.sender.bankName && (
                      <p className="flex justify-between">
                        <span className="text-slate-500">اسم البنك:</span>
                        <span className="font-medium">{proposal.sender.bankName}</span>
                      </p>
                    )}
                    {proposal.sender.iban && (
                      <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-500">رقم الآيبان (IBAN):</span>
                        <span className="font-mono font-bold text-slate-900 tracking-wider text-[11px] select-all">
                          {proposal.sender.iban}
                        </span>
                      </div>
                    )}
                    {proposal.paymentTerms && (
                      <p className="mt-2 text-[11px] text-slate-600 bg-amber-50/70 p-2 rounded border border-amber-100">
                        <span className="font-bold text-amber-900 block mb-0.5">شروط الدفع:</span>
                        {proposal.paymentTerms}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items & Services Table */}
              <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: proposal.primaryColor }}>
                      <th className="py-3 px-3.5 font-bold w-12 text-center">#</th>
                      <th className="py-3 px-3.5 font-bold">البند / الخدمة والمواصفات</th>
                      <th className="py-3 px-3.5 font-bold text-center w-20">الكمية</th>
                      <th className="py-3 px-3.5 font-bold text-center w-20">الوحدة</th>
                      <th className="py-3 px-3.5 font-bold text-left w-28">سعر الوحدة</th>
                      <th className="py-3 px-3.5 font-bold text-left w-24">الخصم</th>
                      <th className="py-3 px-3.5 font-bold text-left w-20">الضريبة</th>
                      <th className="py-3 px-3.5 font-bold text-left w-32">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {proposal.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-3.5">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-3.5 text-center text-slate-600">
                          {item.unit || 'قطعة'}
                        </td>
                        <td className="py-3.5 px-3.5 text-left font-mono font-semibold text-slate-800" dir="ltr">
                          {formatCustomCurrency(item.unitPrice, proposal.currency)}
                        </td>
                        <td className="py-3.5 px-3.5 text-left font-mono text-slate-600" dir="ltr">
                          {item.discount > 0
                            ? item.discountType === 'percentage'
                              ? `${item.discount}%`
                              : formatCustomCurrency(item.discount, proposal.currency)
                            : '-'}
                        </td>
                        <td className="py-3.5 px-3.5 text-left font-mono text-emerald-800" dir="ltr">
                          {item.taxRate > 0 ? `${(item.taxRate * 100).toFixed(0)}%` : '0%'}
                        </td>
                        <td className="py-3.5 px-3.5 text-left font-mono font-bold text-slate-900" dir="ltr">
                          {formatCustomCurrency(item.total, proposal.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Notes Section */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-8">
                
                {/* Notes & Terms (Left) */}
                <div className="sm:col-span-7 space-y-4">
                  {proposal.notes && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        ملاحظات وإرشادات:
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {proposal.notes}
                      </p>
                    </div>
                  )}

                  {proposal.termsAndConditions && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                        الشروط والأحكام:
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans text-[11px]">
                        {proposal.termsAndConditions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Grand Calculations (Right) */}
                <div className="sm:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>المجموع قبل الخصم والضريبة:</span>
                    <span className="font-mono font-semibold" dir="ltr">
                      {formatCustomCurrency(proposal.subtotal, proposal.currency)}
                    </span>
                  </div>

                  {proposal.totalDiscount > 0 && (
                    <div className="flex justify-between text-xs text-red-600">
                      <span>إجمالي الخصم الممنوح:</span>
                      <span className="font-mono font-semibold" dir="ltr">
                        -{formatCustomCurrency(proposal.totalDiscount, proposal.currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-mono font-semibold text-emerald-800" dir="ltr">
                      {formatCustomCurrency(proposal.totalVat, proposal.currency)}
                    </span>
                  </div>

                  <div
                    className="pt-3 border-t-2 flex justify-between items-center"
                    style={{ borderColor: proposal.primaryColor }}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">المبلغ الإجمالي المستحق:</span>
                      <span className="text-[10px] text-slate-500 font-sans">Grand Total</span>
                    </div>
                    <span
                      className="text-lg sm:text-xl font-bold font-mono"
                      style={{ color: proposal.primaryColor }}
                      dir="ltr"
                    >
                      {formatCustomCurrency(proposal.grandTotal, proposal.currency)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Signatures & Authorizations */}
            <div className="pt-8 border-t-2 border-slate-200 mt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="font-bold text-slate-800 mb-1">الطرف الأول (مقدم الوثيقة)</p>
                <p className="text-slate-500 text-[11px] mb-8">{proposal.sender.companyName}</p>
                <div className="w-44 mx-auto border-b border-dashed border-slate-400 pb-1">
                  <span className="text-[10px] text-slate-400 font-sans">الختم والتوقيع المعتمد</span>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-800 mb-1">الطرف الثاني (العميل / المستلم)</p>
                <p className="text-slate-500 text-[11px] mb-8">{proposal.client.companyName || proposal.client.name}</p>
                <div className="w-44 mx-auto border-b border-dashed border-slate-400 pb-1">
                  {proposal.clientDecision?.status === 'accepted' ? (
                    <div className="text-emerald-700 font-bold text-xs flex flex-col items-center">
                      <span className="font-serif italic text-sm">{proposal.clientDecision.actorName}</span>
                      <span className="text-[9px] text-emerald-600">✓ تم الاعتماد إلكترونياً</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-sans">توقيع وقبول العميل</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Client Decision Modal (Accept / Decline Portal) */}
        {showDecisionModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  {showDecisionModal === 'accept' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <h3 className="text-base font-bold text-slate-900">
                    {showDecisionModal === 'accept' ? 'اعتماد وقبول العرض وتوثيق التوقيع' : 'تسجيل رفض العرض'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {showDecisionModal === 'accept' ? (
                  <>
                    <p className="text-slate-600 leading-relaxed">
                      بتأكيد الاعتماد، يتم توثيق قبول العرض رقم <strong>{proposal.proposalNumber}</strong> بمبلغ إجمالي{' '}
                      <strong>{formatCustomCurrency(proposal.grandTotal, proposal.currency)}</strong>.
                    </p>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">اسم الشخص المعتمد / المفوض:</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="مثال: أ. أحمد الغامدي - المدير التنفيذي"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">نص التوقيع الإلكتروني أو الاعتماد:</label>
                      <input
                        type="text"
                        value={signatureText}
                        onChange={(e) => setSignatureText(e.target.value)}
                        placeholder="اكتب الاسم لاعتماده كتوقيع إلكتروني"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-serif italic text-emerald-900 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ملاحظات الاعتماد (اختياري):</label>
                      <textarea
                        rows={2}
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        placeholder="أي شروط أو متطلبات خاصة بالبدء في التنفيذ..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-600 leading-relaxed">
                      يرجى توضيح سبب رفض العرض رقم <strong>{proposal.proposalNumber}</strong> للمساعدة في تحسين العروض القادمة:
                    </p>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">سبب الرفض:</label>
                      <textarea
                        rows={3}
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="مثال: السعر أعلى من الميزانية المحددة، أو تم تأجيل المشروع..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 outline-hidden"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-xs ${
                    showDecisionModal === 'accept'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {showDecisionModal === 'accept' ? 'تأكيد القبول والاعتماد' : 'تأكيد الرفض'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Send Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">إرسال الوثيقة عبر البريد الإلكتروني</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">البريد الإلكتروني للعميل المستلم:</span>
                  <p className="font-mono bg-slate-100 px-3 py-2 rounded-lg text-slate-900 border border-slate-200">
                    {proposal.client.email || 'لم يتم تحديد بريد إلكتروني للعميل'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-1">عنوان الرسالة (Subject):</span>
                  <p className="bg-slate-100 px-3 py-2 rounded-lg text-slate-900 border border-slate-200">
                    {emailInfo.subject}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-1">نص الرسالة المجهز:</span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto text-slate-700 leading-relaxed whitespace-pre-line font-sans text-[11px]">
                    {emailInfo.body}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSendEmailDirect}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>فتح وإرسال عبر البريد الإلكتروني</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
