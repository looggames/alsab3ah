import React from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/zatca';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteInvoiceModalProps {
  invoice?: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (invoice: Invoice) => void;
}

export const DeleteInvoiceModal: React.FC<DeleteInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !invoice) return null;

  const isCreditNote = invoice.type === 'credit_note';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Tajawal'] text-right">
      <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Prominent Red Header */}
        <div className="p-4 sm:p-5 bg-red-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isCreditNote ? 'تأكيد حذف الإشعار الدائن' : 'تأكيد حذف الفاتورة'}
              </h3>
              <p className="text-xs text-red-100 font-currency font-medium mt-0.5">
                رقم السجل: {invoice.invoiceNumber}
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

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>النوع:</span>
              <span className="font-bold text-slate-900">
                {invoice.type === 'credit_note'
                  ? 'إشعار دائن (مرتجع)'
                  : invoice.type === 'standard'
                  ? 'فاتورة ضريبية (B2B)'
                  : 'فاتورة مبسطة (B2C)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>العميل:</span>
              <span className="font-bold text-slate-900">{invoice.customerName || 'عميل نقدي عام'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>تاريخ الإصدار:</span>
              <span className="font-mono text-slate-800">{invoice.date} {invoice.time}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>عدد الأصناف:</span>
              <span className="font-bold text-slate-800">{invoice.items.length} صنف</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 font-bold text-sm">
              <span className="text-slate-900">إجمالي المبلغ:</span>
              <span className="font-mono text-base text-red-600 font-bold">
                {isCreditNote ? `-${formatCurrency(invoice.grandTotal)}` : formatCurrency(invoice.grandTotal)} ر.س
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              سيتم حذف هذا السجل نهائياً من قاعدة البيانات وقائمة الفواتير. هذا الإجراء لا يمكن التراجع عنه.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(invoice);
              onClose();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، حذف نهائياً</span>
          </button>
        </div>
      </div>
    </div>
  );
};
