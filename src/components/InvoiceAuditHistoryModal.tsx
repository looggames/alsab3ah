import React from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/zatca';
import { History, X, User, Clock, ArrowLeftRight, CheckCircle } from 'lucide-react';

interface InvoiceAuditHistoryModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceAuditHistoryModal: React.FC<InvoiceAuditHistoryModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const history = invoice.editHistory || [];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Tajawal'] text-right">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">سجل تعديلات الفاتورة وتتبع التدقيق</h3>
              <p className="text-xs text-blue-200 font-mono">
                رقم الفاتورة: {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {history.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">لا توجد تعديلات سابقة</h4>
              <p className="text-slate-500 text-xs">الفاتورة بحالتها الأصلية كما تم إصدارها أول مرة.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-slate-500 font-medium text-[11px]">
                تم توثيق {history.length} عملية تعديل على هذه الفاتورة:
              </div>

              {history.map((log, index) => (
                <div
                  key={log.id || index}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2.5 relative hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                        {history.length - index}
                      </span>
                      <span>{log.reason || 'تعديل بيانات الفاتورة'}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>المعدّل: <strong className="text-slate-800">{log.editedBy || 'المسؤول'}</strong></span>
                  </div>

                  <div className="space-y-1 bg-white rounded-lg p-2.5 border border-slate-200/70">
                    <div className="text-[11px] font-bold text-slate-700 mb-1">تفاصيل التغييرات:</div>
                    <ul className="space-y-1">
                      {log.changesSummary.map((change, cIdx) => (
                        <li key={cIdx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                          <span className="text-blue-600 font-bold mt-0.5">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {log.oldGrandTotal !== undefined &&
                    log.newGrandTotal !== undefined &&
                    log.oldGrandTotal !== log.newGrandTotal && (
                      <div className="flex items-center justify-between text-[11px] font-mono bg-blue-50/80 text-blue-950 p-2 rounded-lg border border-blue-100">
                        <span>الإجمالي السابق: {formatCurrency(log.oldGrandTotal)} ر.س</span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-[#005126]">الإجمالي الجديد: {formatCurrency(log.newGrandTotal)} ر.س</span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
