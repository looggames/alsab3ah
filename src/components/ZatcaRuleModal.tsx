import React from 'react';
import { Invoice } from '../types';
import {
  X,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface ZatcaRuleModalProps {
  invoice: Invoice | null;
  actionType: 'edit' | 'delete';
  isOpen: boolean;
  onClose: () => void;
  onOpenCreditNote: (invoice: Invoice) => void;
  onForceDelete?: (invoice: Invoice) => void;
}

export const ZatcaRuleModal: React.FC<ZatcaRuleModalProps> = ({
  invoice,
  actionType,
  isOpen,
  onClose,
  onOpenCreditNote,
  onForceDelete,
}) => {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in text-right font-['Tajawal']">
      <div className="bg-white border border-[#becabd] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Top Warning Icon */}
        <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191c1e]">
                {actionType === 'edit' ? 'تعذر التعديل المباشر على الفاتورة' : 'إجراءات حذف الفاتورة المعتمدة'}
              </h3>
              <p className="text-xs text-[#505f76] font-currency">
                رقم الفاتورة: {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ZATCA Legal Explanation Body */}
        <div className="space-y-3 text-xs text-[#3f4940] leading-relaxed">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 font-medium">
            بموجب <strong>اللائحة التنفيذية لضريبة القيمة المضافة ومتطلبات منظومة الفوترة الإلكترونية (فاتورة - المرحلة الثانية)</strong> بهيئة الزكاة والضريبة والجمارك:
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>يُحظر في بيئة الإنتاج الحية تعديل أو حذف أي فاتورة بعد اعتمادها تشفيرياً وإرسالها للهيئة.</li>
              <li>لضمان عدم التلاعب بالسجلات وحفظ الحقوق الضريبية، يتم تصحيح العمليات نظامياً عبر <strong>إصدار إشعار دائن</strong> أو <strong>إشعار مدين</strong>.</li>
            </ul>
          </div>

          <div className="p-3 bg-[#f7f9fb] rounded-xl border border-[#becabd] flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#005126] shrink-0" />
            <span className="text-[11px] text-[#191c1e]">
              إصدار الإشعار الدائن يقوم تلقائياً بخصم المبالغ وضريبة القيمة المضافة وإرجاع الأصناف للمخزون نظامياً.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#eceef0]">
          {invoice.type !== 'credit_note' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreditNote(invoice);
              }}
              className="flex-1 py-2.5 px-4 bg-[#005126] hover:bg-[#006c35] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إصدار إشعار دائن / استرجاع نظامي</span>
            </button>
          )}

          {actionType === 'delete' && onForceDelete && (
            <button
              type="button"
              onClick={() => {
                onForceDelete(invoice);
                onClose();
              }}
              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title="حذف السجل نهائياً"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>حذف نهائي</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
