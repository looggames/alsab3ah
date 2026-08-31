import React, { useState } from 'react';
import { CompanyProfile, CustomProposal, Invoice, ZatcaStatus } from '../types';
import { formatCurrency } from '../utils/zatca';
import { InvoiceAuditHistoryModal } from './InvoiceAuditHistoryModal';
import { DeleteInvoiceModal } from './DeleteInvoiceModal';
import { CustomProposalDetailModal } from './CustomProposalDetailModal';
import { CustomProposalBuilderModal } from './CustomProposalBuilderModal';
import {
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  RotateCcw,
  PenLine,
  Trash2,
  History,
  ListFilter,
  Sparkles,
  Send,
  XCircle,
  FileCheck,
} from 'lucide-react';
import {
  formatCustomCurrency,
  TEMPLATE_DEFINITIONS,
} from '../utils/proposals';

interface InvoicesViewProps {
  invoices: Invoice[];
  customProposals?: CustomProposal[];
  companyProfile: CompanyProfile;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onNewSale: () => void;
  onTriggerZatcaSync: () => void;
  onClearAllData?: () => Promise<void>;
  onClearInvoices?: () => Promise<void>;
  onOpenCreditNote?: (invoice: Invoice) => void;
  onOpenEdit?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoice: Invoice) => void;
  onDeleteBatch?: (invoices: Invoice[]) => void;
  onSaveCustomProposal?: (proposal: CustomProposal) => void;
  onDeleteCustomProposal?: (proposalId: string) => void;
  onUpdateProposalStatus?: (
    proposal: CustomProposal,
    newStatus: CustomProposal['status'],
    decisionLog?: any
  ) => void;
  onConvertProposalToInvoice?: (proposal: CustomProposal) => void;
  isSyncing: boolean;
  isOnboarded?: boolean;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  customProposals = [],
  companyProfile,
  onOpenInvoiceModal,
  onNewSale,
  onOpenCreditNote,
  onOpenEdit,
  onDeleteInvoice,
  onSaveCustomProposal,
  onDeleteCustomProposal,
  onUpdateProposalStatus,
  onConvertProposalToInvoice,
}) => {
  // Main Tabs: 'invoices' | 'proposals' | 'edited'
  const [mainTab, setMainTab] = useState<'invoices' | 'proposals' | 'edited'>('invoices');
  
  // Standard Invoices Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | ZatcaStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'simplified' | 'standard' | 'credit_note'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditTargetInvoice, setAuditTargetInvoice] = useState<Invoice | null>(null);
  const [deleteTargetInvoice, setDeleteTargetInvoice] = useState<Invoice | null>(null);

  // Custom Proposals / Templates State
  const [proposalStatusFilter, setProposalStatusFilter] = useState<string>('all');
  const [proposalSearchQuery, setProposalSearchQuery] = useState('');
  const [activeProposalForView, setActiveProposalForView] = useState<CustomProposal | null>(null);
  const [proposalToEdit, setProposalToEdit] = useState<CustomProposal | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const editedInvoicesCount = invoices.filter(
    (inv) => inv.editHistory && inv.editHistory.length > 0
  ).length;

  // Filtered standard invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (mainTab === 'edited' && (!inv.editHistory || inv.editHistory.length === 0)) {
      return false;
    }

    const matchesStatus = statusFilter === 'all' || inv.zatcaStatus === statusFilter;
    const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus && matchesType;

    return (
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.customerName.toLowerCase().includes(query) ||
      (inv.customerTaxNumber && inv.customerTaxNumber.includes(query)) ||
      inv.grandTotal.toString().includes(query)
    );
  });

  // Filtered custom proposals & customizable invoice templates
  const filteredProposals = customProposals.filter((prop) => {
    const matchesStatus = proposalStatusFilter === 'all' || prop.status === proposalStatusFilter;
    const query = proposalSearchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    return (
      prop.proposalNumber.toLowerCase().includes(query) ||
      prop.title.toLowerCase().includes(query) ||
      prop.client.name.toLowerCase().includes(query) ||
      (prop.client.companyName && prop.client.companyName.toLowerCase().includes(query)) ||
      prop.grandTotal.toString().includes(query)
    );
  });

  const handleRequestSingleDelete = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteInvoice) {
      onDeleteInvoice(inv);
    } else {
      setDeleteTargetInvoice(inv);
    }
  };

  const handleConfirmDelete = (inv: Invoice) => {
    if (onDeleteInvoice) {
      onDeleteInvoice(inv);
    }
    setDeleteTargetInvoice(null);
  };

  const handleCreateNewProposal = () => {
    setProposalToEdit(null);
    setIsBuilderOpen(true);
  };

  const handleEditProposal = (prop: CustomProposal) => {
    setProposalToEdit(prop);
    setIsBuilderOpen(true);
  };

  const handleSaveProposalFromBuilder = (prop: CustomProposal) => {
    if (onSaveCustomProposal) {
      onSaveCustomProposal(prop);
    }
    setIsBuilderOpen(false);
    setActiveProposalForView(prop);
  };

  // Status Badge for Proposals
  const getProposalStatusChip = (status: CustomProposal['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            مسودة
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            تم الإرسال
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            بانتظار الرد
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            معتمد ومقبول
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            مرفوض
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <FileCheck className="w-3 h-3 text-purple-600" />
            تم التحويل لفاتورة
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6 font-['Tajawal'] text-right">
        
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg md:text-xl font-bold text-slate-900">
                  إدارة الفواتير وعروض الأسعار
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  متوافق مع ZATCA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                إصدار وتخصيص الفواتير وعروض الأسعار والتحكم باعتماد العملاء وتصدير ملفات الـ PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <button
              type="button"
              onClick={handleCreateNewProposal}
              className="px-4.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>إنشاء عرض سعر / نموذج مخصص</span>
            </button>
          </div>
        </div>

        {/* Tab Selection: POS Invoices vs Custom Proposals vs Edited Logs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          
          <button
            type="button"
            onClick={() => setMainTab('invoices')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              mainTab === 'invoices'
                ? 'bg-[#005126] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>فواتير وإشعارات المبيعات ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('proposals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              mainTab === 'proposals'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>عروض الأسعار والنماذج المخصصة ({customProposals.length})</span>
            {customProposals.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  mainTab === 'proposals' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 font-bold'
                }`}
              >
                {customProposals.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('edited')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              mainTab === 'edited'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل التعديلات والعمليات ({editedInvoicesCount})</span>
            {editedInvoicesCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  mainTab === 'edited' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800 font-bold'
                }`}
              >
                {editedInvoicesCount}
              </span>
            )}
          </button>
        </div>

        {/* SECTION 1: CUSTOM PROPOSALS & TEMPLATES DASHBOARD */}
        {mainTab === 'proposals' && (
          <div className="space-y-4">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-xs font-medium block mb-1">إجمالي العروض والنماذج</span>
                <span className="text-xl font-bold font-mono text-slate-900">{customProposals.length}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-xs font-medium block mb-1">عروض مقبولة ومعتمدة</span>
                <span className="text-xl font-bold font-mono text-emerald-700">
                  {customProposals.filter((p) => p.status === 'accepted' || p.status === 'converted').length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-xs font-medium block mb-1">بانتظار موافقة العميل</span>
                <span className="text-xl font-bold font-mono text-amber-700">
                  {customProposals.filter((p) => p.status === 'sent' || p.status === 'pending').length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-xs font-medium block mb-1">مسودات جاهزة للتخصيص</span>
                <span className="text-xl font-bold font-mono text-indigo-700">
                  {customProposals.filter((p) => p.status === 'draft').length}
                </span>
              </div>
            </div>

            {/* Proposals Filter & Search Toolbar */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث برقم الوثيقة، اسم العميل، موضوع العرض، المبلغ..."
                    value={proposalSearchQuery}
                    onChange={(e) => setProposalSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl text-xs outline-none transition-colors"
                  />
                </div>

                {/* Status Filter Chips */}
                <div className="flex gap-1.5 flex-wrap items-center">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'draft', label: 'مسودة' },
                    { id: 'sent', label: 'مرسل' },
                    { id: 'pending', label: 'بانتظار العميل' },
                    { id: 'accepted', label: 'مقبول' },
                    { id: 'converted', label: 'محول لفاتورة' },
                    { id: 'declined', label: 'مرفوض' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setProposalStatusFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        proposalStatusFilter === filter.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Proposals Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 text-slate-600 font-semibold">رقم الوثيقة والنوع</th>
                      <th className="p-3.5 text-slate-600 font-semibold">موضوع الوثيقة والقالب</th>
                      <th className="p-3.5 text-slate-600 font-semibold">العميل المستلم</th>
                      <th className="p-3.5 text-slate-600 font-semibold">تاريخ الإصدار والصلاحية</th>
                      <th className="p-3.5 text-slate-600 font-semibold text-left">الإجمالي والعملة</th>
                      <th className="p-3.5 text-slate-600 font-semibold text-center">حالة القبول</th>
                      <th className="p-3.5 text-slate-600 font-semibold text-center w-48">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredProposals.map((prop) => {
                      const tplDef = TEMPLATE_DEFINITIONS.find((t) => t.id === prop.templateTheme) || TEMPLATE_DEFINITIONS[0];
                      return (
                        <tr
                          key={prop.id}
                          onClick={() => setActiveProposalForView(prop)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5 font-mono font-bold text-slate-900 group-hover:text-indigo-700">
                            <div>{prop.proposalNumber}</div>
                            <span className="text-[10px] font-sans font-normal text-slate-500">
                              {prop.documentType === 'proposal' ? 'عرض سعر' : 'فاتورة مخصصة'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 line-clamp-1 max-w-xs">{prop.title}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: prop.primaryColor }}
                              />
                              <span className="text-[11px] text-slate-500">{tplDef.nameAr}</span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900">{prop.client.name}</div>
                            {prop.client.companyName && (
                              <div className="text-[11px] text-slate-500">{prop.client.companyName}</div>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-slate-600">
                            <div>{prop.issueDate}</div>
                            <div className="text-[10px] text-slate-400">إلى: {prop.validUntil}</div>
                          </td>

                          <td className="p-3.5 text-left font-mono font-bold text-slate-900" dir="ltr">
                            {formatCustomCurrency(prop.grandTotal, prop.currency)}
                          </td>

                          <td className="p-3.5 text-center">
                            {getProposalStatusChip(prop.status)}
                          </td>

                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              
                              {/* View Button */}
                              <button
                                type="button"
                                onClick={() => setActiveProposalForView(prop)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="عرض الوثيقة كاملة"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleEditProposal(prop)}
                                className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="تعديل النموذج"
                              >
                                <PenLine className="w-4 h-4" />
                              </button>

                              {/* Convert to Sale Invoice (If accepted) */}
                              {prop.status === 'accepted' && onConvertProposalToInvoice && (
                                <button
                                  type="button"
                                  onClick={() => onConvertProposalToInvoice(prop)}
                                  className="p-1.5 rounded-lg text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                                  title="تحويل العرض المقبول إلى فاتورة كاشير معتمدة"
                                >
                                  <FileCheck className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete Button */}
                              {onDeleteCustomProposal && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCustomProposal(prop.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition-colors cursor-pointer"
                                  title="حذف هذا النموذج"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredProposals.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <Sparkles className="w-12 h-12 text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-900">لا توجد عروض أسعار أو نماذج مطابقة</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      يمكنك إنشاء نموذج فاتورة أو عرض سعر مخصص بشعارك وبنودك وشروط الدفع وإرسالها لعملائك بكل سهولة.
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateNewProposal}
                      className="mt-4 px-4 py-2 bg-indigo-700 text-white rounded-xl text-xs font-bold hover:bg-indigo-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إنشاء عرض سعر / نموذج مخصص الآن</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* SECTION 2: POS & ZATCA INVOICES LIST (Standard and Edited Tabs) */}
        {(mainTab === 'invoices' || mainTab === 'edited') && (
          <div className="space-y-4">
            
            {/* Filters and search toolbar */}
            <div className="bg-white border border-[#becabd] p-4 rounded-xl space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#505f76]" />
                  <input
                    type="text"
                    placeholder="بحث برقم الفاتورة، اسم العميل، المبلغ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-9 py-2.5 bg-[#f2f4f6] border border-transparent focus:border-[#005126] rounded-xl text-xs outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-[#f2f4f6] text-xs font-medium text-[#191c1e] rounded-xl border border-transparent focus:border-[#005126] outline-none"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="cleared">معتمدة ومطابقة</option>
                    <option value="pending">صادرة محلياً</option>
                    <option value="failed">مرفوضة / خطأ</option>
                  </select>

                  {/* Type filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-3 py-2 bg-[#f2f4f6] text-xs font-medium text-[#191c1e] rounded-xl border border-transparent focus:border-[#005126] outline-none"
                  >
                    <option value="all">جميع الأنواع</option>
                    <option value="simplified">مبسطة (B2C)</option>
                    <option value="standard">ضريبية (B2B)</option>
                    <option value="credit_note">إشعارات دائنة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#becabd] rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                    <tr>
                      <th className="p-3.5 text-xs text-[#3f4940] font-semibold">رقم الفاتورة / الإشعار</th>
                      <th className="p-3.5 text-xs text-[#3f4940] font-semibold">تاريخ الإصدار</th>
                      <th className="p-3.5 text-xs text-[#3f4940] font-semibold">العميل</th>
                      <th className="p-3.5 text-xs text-[#3f4940] font-semibold text-left">الإجمالي (ر.س)</th>
                      <th className="p-3.5 text-xs text-[#3f4940] font-semibold">حالة الهيئة</th>
                      <th className="p-3.5 text-xs text-[#3f4940] font-semibold text-center w-44">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#becabd]">
                    {filteredInvoices.map((inv) => {
                      const isCreditNote = inv.type === 'credit_note';
                      const hasEdits = inv.editHistory && inv.editHistory.length > 0;

                      return (
                        <tr
                          key={inv.id}
                          onClick={() => onOpenInvoiceModal(inv)}
                          className={`transition-colors group cursor-pointer ${
                            isCreditNote
                              ? 'bg-amber-50/40 hover:bg-amber-50/80'
                              : hasEdits
                              ? 'bg-indigo-50/20 hover:bg-indigo-50/50'
                              : 'hover:bg-[#f7f9fb]'
                          }`}
                        >
                          {/* Invoice Number */}
                          <td className="p-3.5 text-xs font-bold text-[#191c1e] group-hover:text-[#005126] font-currency">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{inv.invoiceNumber}</span>
                              {isCreditNote && (
                                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-sans">
                                  إشعار دائن
                                </span>
                              )}
                              {hasEdits && (
                                <span
                                  className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-sans flex items-center gap-0.5"
                                  title={`تم تعديل هذه الفاتورة ${inv.editHistory!.length} مرات`}
                                >
                                  <History className="w-2.5 h-2.5" />
                                  معدلة ({inv.editHistory!.length})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="p-3.5 text-xs text-[#505f76] font-currency">
                            {inv.date} {inv.time}
                          </td>

                          {/* Customer */}
                          <td className="p-3.5 text-xs font-medium text-[#191c1e]">
                            {inv.customerName || 'عميل نقدي عام'}
                          </td>

                          {/* Grand Total */}
                          <td
                            className={`p-3.5 text-xs font-currency font-bold text-left ${
                              isCreditNote ? 'text-amber-800' : 'text-[#191c1e]'
                            }`}
                            dir="ltr"
                          >
                            {isCreditNote ? `-${formatCurrency(inv.grandTotal)}` : formatCurrency(inv.grandTotal)}
                          </td>

                          {/* ZATCA Status */}
                          <td className="p-3.5">
                            {inv.zatcaStatus === 'cleared' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                معتمدة ومطابقة
                              </span>
                            ) : inv.zatcaStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                صادرة محلياً
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-200">
                                مرفوضة
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View / Print */}
                              <button
                                type="button"
                                onClick={() => onOpenInvoiceModal(inv)}
                                className="p-1.5 rounded-lg text-[#505f76] hover:text-[#005126] hover:bg-[#eceef0] transition-colors cursor-pointer"
                                title="عرض الفاتورة والطباعة"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Credit Note (Return) */}
                              {!isCreditNote && onOpenCreditNote && (
                                <button
                                  type="button"
                                  onClick={() => onOpenCreditNote(inv)}
                                  className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="استرجاع / إصدار إشعار دائن"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              {/* Edit Button */}
                              {onOpenEdit && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEdit(inv)}
                                  className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="تعديل الفاتورة"
                                >
                                  <PenLine className="w-4 h-4" />
                                </button>
                              )}

                              {/* Logs / History Button */}
                              <button
                                type="button"
                                onClick={() => setAuditTargetInvoice(inv)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                                  hasEdits
                                    ? 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                                    : 'text-slate-500 hover:text-indigo-700 hover:bg-slate-100'
                                }`}
                                title={
                                  hasEdits
                                    ? `سجل التعديلات والعمليات (${inv.editHistory!.length} تعديل)`
                                    : 'سجل التعديلات والعمليات'
                                }
                              >
                                <History className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => handleRequestSingleDelete(inv, e)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition-colors cursor-pointer shadow-2xs"
                                title="حذف الفاتورة نهائياً"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredInvoices.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-[#191c1e]">
                      {mainTab === 'edited' ? 'لا توجد فواتير تم تعديلها' : 'لا توجد فواتير مطابقة للبحث'}
                    </h3>
                    <p className="text-xs text-[#505f76] mt-1 max-w-sm">
                      {mainTab === 'edited'
                        ? 'جميع الفواتير الحالية بحالتها الأصلية دون أي تعديلات سابقة.'
                        : 'جرّب تغيير كلمات البحث أو الفلاتر المختارة، أو ابدأ بإصدار فاتورة جديدة.'}
                    </p>
                    {mainTab === 'edited' ? (
                      <button
                        type="button"
                        onClick={() => setMainTab('invoices')}
                        className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ListFilter className="w-4 h-4" />
                        <span>عرض جميع الفواتير</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onNewSale}
                        className="mt-4 px-4 py-2 bg-[#005126] text-white rounded-xl text-xs font-bold hover:bg-[#006c35] flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إصدار فاتورة جديدة الآن</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Modal for Invoice Audit History */}
        <InvoiceAuditHistoryModal
          invoice={auditTargetInvoice}
          isOpen={!!auditTargetInvoice}
          onClose={() => setAuditTargetInvoice(null)}
        />

        {/* Delete Confirmation Modal for Single Invoice */}
        <DeleteInvoiceModal
          invoice={deleteTargetInvoice}
          isOpen={!!deleteTargetInvoice}
          onClose={() => setDeleteTargetInvoice(null)}
          onConfirmDelete={handleConfirmDelete}
        />

        {/* Custom Proposal Detail Modal (Full view, PDF, Email, WhatsApp, Approval) */}
        {activeProposalForView && (
          <CustomProposalDetailModal
            proposal={activeProposalForView}
            companyProfile={companyProfile}
            onClose={() => setActiveProposalForView(null)}
            onEdit={handleEditProposal}
            onDelete={(id) => {
              if (onDeleteCustomProposal) onDeleteCustomProposal(id);
              setActiveProposalForView(null);
            }}
            onUpdateStatus={(prop, status, decision) => {
              if (onUpdateProposalStatus) onUpdateProposalStatus(prop, status, decision);
              setActiveProposalForView((prev) =>
                prev ? { ...prev, status, clientDecision: decision || prev.clientDecision } : null
              );
            }}
            onConvertToInvoice={(prop) => {
              if (onConvertProposalToInvoice) onConvertProposalToInvoice(prop);
              setActiveProposalForView(null);
            }}
          />
        )}

        {/* Custom Proposal Builder Modal */}
        {isBuilderOpen && (
          <CustomProposalBuilderModal
            initialProposal={proposalToEdit}
            companyProfile={companyProfile}
            onClose={() => setIsBuilderOpen(false)}
            onSave={handleSaveProposalFromBuilder}
          />
        )}

      </div>
    </div>
  );
};
