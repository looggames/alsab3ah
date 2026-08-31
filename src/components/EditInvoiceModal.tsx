import React, { useState } from 'react';
import { CompanyProfile, Invoice, InvoiceEditLog, InvoiceItem, PaymentMethod } from '../types';
import { formatCurrency, generateZatcaTlvQrCode } from '../utils/zatca';
import {
  X,
  Edit3,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  History,
  CheckCircle2,
} from 'lucide-react';

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (updatedInvoice: Invoice) => void;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  invoice,
  companyProfile,
  isOpen,
  onClose,
  onSaveInvoice,
}) => {
  if (!isOpen || !invoice) return null;

  const [customerName, setCustomerName] = useState(invoice.customerName);
  const [customerTaxNumber, setCustomerTaxNumber] = useState(invoice.customerTaxNumber || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(invoice.paymentMethod);
  const [notes, setNotes] = useState(invoice.notes || '');
  const [editReason, setEditReason] = useState('تصحيح بيانات الفاتورة');
  const [items, setItems] = useState<InvoiceItem[]>(invoice.items.map((i) => ({ ...i })));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const targetItem = { ...updated[index] };

    if (field === 'quantity') {
      const qty = Math.max(1, parseInt(value, 10) || 1);
      targetItem.quantity = qty;
    } else if (field === 'unitPrice') {
      const price = Math.max(0, parseFloat(value) || 0);
      targetItem.unitPrice = price;
    } else if (field === 'name') {
      targetItem.name = value;
    }

    const subtotal = targetItem.quantity * targetItem.unitPrice;
    const vatRate = targetItem.vatRate ?? companyProfile.defaultVatRate ?? 0.15;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    targetItem.subtotal = parseFloat(subtotal.toFixed(2));
    targetItem.vatAmount = parseFloat(vatAmount.toFixed(2));
    targetItem.total = parseFloat(total.toFixed(2));

    updated[index] = targetItem;
    setItems(updated);
    setErrorMessage(null);
  };

  const handleAddItem = () => {
    const vatRate = companyProfile.defaultVatRate ?? 0.15;
    const unitPrice = 10;
    const subtotal = 10;
    const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
    const total = subtotal + vatAmount;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: 'صنف جديد',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: 1,
      unitPrice: unitPrice,
      discount: 0,
      vatRate: vatRate,
      vatAmount: vatAmount,
      subtotal: subtotal,
      total: total,
    };
    setItems([...items, newItem]);
    setErrorMessage(null);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage('يجب أن تحتوي الفاتورة على صنف واحد على الأقل.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  // Recalculate totals
  const currentVatRate = companyProfile.defaultVatRate ?? 0.15;
  const vatPercent = Math.round(currentVatRate * 100);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const grandTotal = subtotal + totalVat;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setErrorMessage('يرجى كتابة اسم العميل.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('يرجى إضافة صنف واحد على الأقل.');
      return;
    }

    // Build comprehensive detailed changes summary for audit trail
    const changes: string[] = [];

    // 1. Customer Name
    if (customerName.trim() !== invoice.customerName) {
      changes.push(`تعديل اسم العميل من "${invoice.customerName}" إلى "${customerName.trim()}"`);
    }

    // 2. Customer Tax Number
    if ((customerTaxNumber.trim() || '') !== (invoice.customerTaxNumber || '')) {
      changes.push(`تعديل الرقم الضريبي للمشتري إلى "${customerTaxNumber.trim() || 'بدون'}"`);
    }

    // 3. Payment Method
    if (paymentMethod !== invoice.paymentMethod) {
      const methodLabels: Record<string, string> = {
        card: 'بطاقة / مدى',
        cash: 'نقداً',
        transfer: 'تحويل بنكي',
        split: 'دفع مجزأ',
      };
      changes.push(`تغيير طريقة السداد إلى "${methodLabels[paymentMethod] || paymentMethod}"`);
    }

    // 4. Detailed Line Items changes
    const originalItemsMap = new Map<string, InvoiceItem>(invoice.items.map((i) => [i.id || i.name, i]));
    const currentItemsMap = new Map<string, InvoiceItem>(items.map((i) => [i.id || i.name, i]));

    // Check modified or existing items
    items.forEach((curItem) => {
      const orig = originalItemsMap.get(curItem.id || curItem.name);
      if (orig) {
        const itemDiffs: string[] = [];
        if (orig.name !== curItem.name) {
          itemDiffs.push(`تغيير الاسم إلى "${curItem.name}"`);
        }
        if (orig.quantity !== curItem.quantity) {
          itemDiffs.push(`الكمية من (${orig.quantity}) إلى (${curItem.quantity})`);
        }
        if (Math.abs(orig.unitPrice - curItem.unitPrice) > 0.001) {
          itemDiffs.push(`السعر من (${formatCurrency(orig.unitPrice)} ر.س) إلى (${formatCurrency(curItem.unitPrice)} ر.س)`);
        }
        if (itemDiffs.length > 0) {
          changes.push(`تعديل الصنف "${orig.name}": ${itemDiffs.join('، ')}`);
        }
      } else {
        // Newly added item
        changes.push(`إضافة صنف جديد: "${curItem.name}" (الكمية: ${curItem.quantity}، السعر: ${formatCurrency(curItem.unitPrice)} ر.س)`);
      }
    });

    // Check deleted items
    invoice.items.forEach((origItem) => {
      if (!currentItemsMap.has(origItem.id || origItem.name)) {
        changes.push(`حذف الصنف: "${origItem.name}"`);
      }
    });

    // 5. Grand Total changes
    if (Math.abs(grandTotal - invoice.grandTotal) > 0.01) {
      changes.push(`تحديث إجمالي الفاتورة من ${formatCurrency(invoice.grandTotal)} ر.س إلى ${formatCurrency(grandTotal)} ر.س`);
    }

    // 6. Notes changes
    if ((notes.trim() || '') !== (invoice.notes || '')) {
      changes.push(`تحديث الملاحظات: "${notes.trim() || 'تم المسح'}"`);
    }

    if (changes.length === 0) {
      changes.push('تمت مراجعة وتأكيد بيانات الفاتورة الأصلية');
    }

    const editLog: InvoiceEditLog = {
      id: `edit-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA'),
      editedBy: companyProfile.cashierName || companyProfile.nameAr || 'المسؤول',
      reason: editReason.trim() || 'تعديل الفاتورة المحلية',
      changesSummary: changes,
      oldGrandTotal: invoice.grandTotal,
      newGrandTotal: parseFloat(grandTotal.toFixed(2)),
    };

    const qrCode = generateZatcaTlvQrCode(
      companyProfile.nameAr,
      companyProfile.taxNumber,
      new Date().toISOString(),
      grandTotal,
      totalVat
    );

    const updated: Invoice = {
      ...invoice,
      customerName: customerName.trim(),
      customerTaxNumber: customerTaxNumber.trim() || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalVat: parseFloat(totalVat.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      qrCodeData: qrCode,
      editHistory: [editLog, ...(invoice.editHistory || [])],
      lastEditedAt: new Date().toISOString(),
    };

    onSaveInvoice(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto custom-scrollbar font-['Tajawal'] text-right">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  تعديل الفاتورة وتوثيق التغييرات في السجل
                </h3>
                <span className="text-[11px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full font-currency">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                يتم حفظ التعديلات على نفس الفاتورة الأصلية مع توثيق سجل التعديل للرجوع إليه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Audit Notice */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/70 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
            <History className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">سجل التعديلات المباشر:</span>
              <span className="text-blue-900 text-[11px] leading-relaxed">
                ستتم كتابة التعديل على الفاتورة الأصلية <strong>({invoice.invoiceNumber})</strong> مباشرة وإضافة سجل توضيحي لما تم تغييره للتدقيق.
              </span>
            </div>
          </div>

          {/* Customer info & payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم العميل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 font-medium transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرقم الضريبي للمشتري (اختياري)
              </label>
              <input
                type="text"
                value={customerTaxNumber}
                onChange={(e) => setCustomerTaxNumber(e.target.value)}
                placeholder="300000000000003"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 font-currency transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                طريقة الدفع
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 font-medium transition-all"
              >
                <option value="card">مدى / بطاقة ائتمانية</option>
                <option value="cash">نقداً (كاش)</option>
                <option value="transfer">تحويل بنكي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سبب التعديل (لتوثيق السجل) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="مثال: تصحيح الكمية أو تعديل اسم العميل"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات إضافية على الفاتورة
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية تظهر في أسفل الفاتورة..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 transition-all"
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                أصناف الفاتورة والأسعار
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#005126] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200/70"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف</span>
              </button>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 text-slate-600 font-bold">اسم الصنف</th>
                    <th className="p-2.5 text-slate-600 font-bold text-center w-24">الكمية</th>
                    <th className="p-2.5 text-slate-600 font-bold text-left w-28">السعر (غير شامل)</th>
                    <th className="p-2.5 text-slate-600 font-bold text-left">الإجمالي (+{vatPercent}%)</th>
                    <th className="p-2.5 text-center w-12">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#005126] font-medium text-slate-900"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded-lg font-currency font-bold text-xs outline-none focus:border-[#005126] text-slate-900"
                        />
                      </td>
                      <td className="p-2 text-left">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-24 px-2 py-1 text-left bg-white border border-slate-300 rounded-lg font-currency font-bold text-xs outline-none focus:border-[#005126] text-slate-900"
                        />
                      </td>
                      <td className="p-2 text-left font-currency font-bold text-[#005126]">
                        {formatCurrency(item.total)} ر.س
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>المجموع قبل الضريبة:</span>
              <span className="font-currency font-bold text-slate-900">
                {formatCurrency(subtotal)} ر.س
              </span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>ضريبة القيمة المضافة ({vatPercent}%):</span>
              <span className="font-currency font-bold text-[#005126]">
                {formatCurrency(totalVat)} ر.س
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold">
              <span className="text-slate-900 text-sm">الإجمالي النهائي الجديد:</span>
              <span className="font-currency text-xl font-bold text-[#005126]">
                {formatCurrency(grandTotal)} ر.س
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#005126] hover:bg-[#006c35] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتوثيق التعديل على الفاتورة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
