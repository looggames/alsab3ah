import React, { useState } from 'react';
import { CompanyProfile, Invoice, InvoiceItem } from '../types';
import { formatCurrency, generateZatcaTlvQrCode } from '../utils/zatca';
import {
  X,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

interface CreditNoteModalProps {
  invoice: Invoice | null;
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onIssueCreditNote: (creditNote: Invoice, returnedStock: { productId?: string; sku: string; qty: number }[]) => void;
}

export const CreditNoteModal: React.FC<CreditNoteModalProps> = ({
  invoice,
  companyProfile,
  isOpen,
  onClose,
  onIssueCreditNote,
}) => {
  if (!isOpen || !invoice) return null;

  const [returnReason, setReturnReason] = useState<string>('إرجاع بضاعة / استرداد المبلغ');
  const [customReason, setCustomReason] = useState<string>('');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    invoice.items.forEach((item) => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });
  const [returnPrices, setReturnPrices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    invoice.items.forEach((item) => {
      initial[item.id] = item.unitPrice;
    });
    return initial;
  });
  const [restockItems, setRestockItems] = useState<boolean>(true);

  const handleQtyChange = (itemId: string, maxQty: number, value: string) => {
    const parsed = parseInt(value, 10);
    const newQty = isNaN(parsed) ? 0 : Math.min(Math.max(0, parsed), maxQty);
    setReturnQuantities((prev) => ({
      ...prev,
      [itemId]: newQty,
    }));
  };

  const handlePriceChange = (itemId: string, value: string) => {
    const parsed = parseFloat(value);
    const newPrice = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setReturnPrices((prev) => ({
      ...prev,
      [itemId]: newPrice,
    }));
  };

  const handleSetFullReturn = () => {
    const fullQty: Record<string, number> = {};
    const fullPrice: Record<string, number> = {};
    invoice.items.forEach((item) => {
      fullQty[item.id] = item.quantity;
      fullPrice[item.id] = item.unitPrice;
    });
    setReturnQuantities(fullQty);
    setReturnPrices(fullPrice);
  };

  // Calculate return items and totals
  const returnedItems: InvoiceItem[] = invoice.items
    .map((item) => {
      const returnQty = returnQuantities[item.id] || 0;
      if (returnQty <= 0) return null;

      const unitPrice = returnPrices[item.id] !== undefined ? returnPrices[item.id] : item.unitPrice;
      const vatRate = item.vatRate ?? companyProfile.defaultVatRate ?? 0.15;
      const subtotal = returnQty * unitPrice;
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;

      return {
        ...item,
        unitPrice: unitPrice,
        quantity: returnQty,
        subtotal: parseFloat(subtotal.toFixed(2)),
        vatAmount: parseFloat(vatAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      };
    })
    .filter(Boolean) as InvoiceItem[];

  const returnSubtotal = returnedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const returnVat = returnedItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const returnGrandTotal = returnedItems.reduce((sum, item) => sum + item.total, 0);

  const finalReason = returnReason === 'أخرى' ? (customReason.trim() || 'تصحيح واسترجاع') : returnReason;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (returnedItems.length === 0) {
      alert('يرجى تحديد كمية صنف واحد على الأقل للاسترجاع أو إصدار الإشعار الدائن.');
      return;
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.split('T')[0];
    const time = now.toLocaleTimeString('ar-SA');
    const creditNoteNumber = `CN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `urn:uuid:${Math.random().toString(36).substring(2, 15)}`;

    const qrCode = generateZatcaTlvQrCode(
      companyProfile.nameAr,
      companyProfile.taxNumber,
      timestamp,
      returnGrandTotal,
      returnVat
    );

    const creditNote: Invoice = {
      id: `cn-${Date.now()}`,
      invoiceNumber: creditNoteNumber,
      uuid: uuid,
      date: date,
      time: time,
      customerName: invoice.customerName,
      customerTaxNumber: invoice.customerTaxNumber,
      customerType: invoice.customerType,
      customerAddress: invoice.customerAddress,
      type: 'credit_note',
      originalInvoiceNumber: invoice.invoiceNumber,
      originalInvoiceUuid: invoice.uuid,
      returnReason: finalReason,
      items: returnedItems,
      subtotal: parseFloat(returnSubtotal.toFixed(2)),
      totalDiscount: 0,
      totalVat: parseFloat(returnVat.toFixed(2)),
      grandTotal: parseFloat(returnGrandTotal.toFixed(2)),
      paymentMethod: invoice.paymentMethod,
      zatcaStatus: invoice.zatcaStatus === 'cleared' ? 'cleared' : 'pending',
      zatcaSubmissionDate: invoice.zatcaStatus === 'cleared' ? timestamp : undefined,
      cryptographicStamp: invoice.zatcaStatus === 'cleared' ? `MEUCIQD${Math.random().toString(36).substring(2, 12)}...ZATCA-CN-STAMP` : undefined,
      qrCodeData: qrCode,
      branch: invoice.branch,
      cashierName: invoice.cashierName,
      notes: `إشعار دائن مرتبط بالفاتورة رقم ${invoice.invoiceNumber} - السبب: ${finalReason}`,
    };

    const returnedStock = restockItems
      ? returnedItems.map((item) => ({
          sku: item.sku,
          qty: item.quantity,
        }))
      : [];

    onIssueCreditNote(creditNote, returnedStock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto custom-scrollbar">
      <div className="bg-white border border-[#becabd] rounded-2xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#becabd] bg-[#f7f9fb] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#191c1e]">
                  إصدار إشعار دائن / استرجاع
                </h3>
                <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  معتمد من هيئة الزكاة
                </span>
              </div>
              <p className="text-xs text-[#505f76] mt-0.5">
                المرجع للفاتورة الأصلية: <span className="font-bold font-currency text-[#005126]">{invoice.invoiceNumber}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* ZATCA Compliance Information Notice */}
          <div className="bg-[#f2f4f6] border border-[#becabd] p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-[#3f4940]">
            <ShieldCheck className="w-5 h-5 text-[#005126] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-[#191c1e] block">نظام الفوترة الإلكترونية (المرحلة الثانية):</span>
              يتم إصدار الإشعار الدائن بصيغة UBL 2.1 الرسمية وربطه بالرقم المرجعي والمشفر للفاتورة الأصلية لخصم ضريبة المخرجات وإعادة ضبط القيود المالية والمخزون نظامياً.
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#191c1e]">
              سبب إصدار الإشعار الدائن / الاسترجاع <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'إرجاع بضاعة / استرداد المبلغ',
                'تصحيح خطأ حسابي أو بيانات غير صحيحة',
                'إلغاء الطلب بالكامل',
                'خصم تجاري ممنوح بعد البيع',
                'تلف في الأصناف أو عدم مطابقة المواصفات',
                'أخرى',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer text-xs transition-all ${
                    returnReason === reason
                      ? 'border-[#005126] bg-[#006c35]/10 text-[#005126] font-bold'
                      : 'border-[#becabd] hover:bg-[#f7f9fb] text-[#3f4940]'
                  }`}
                >
                  <input
                    type="radio"
                    name="returnReason"
                    value={reason}
                    checked={returnReason === reason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="accent-[#005126]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {returnReason === 'أخرى' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="اكتب سبب الاسترجاع أو التصحيح..."
                className="w-full mt-2 p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl text-xs outline-none focus:border-[#005126] text-[#191c1e]"
                required
              />
            )}
          </div>

          {/* Item Quantities Return Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-[#191c1e]">
                الأصناف والكميات المراد استرجاعها / خصمها
              </label>
              <button
                type="button"
                onClick={handleSetFullReturn}
                className="text-xs text-[#005126] font-bold hover:underline cursor-pointer"
              >
                استرجاع كامل الفاتورة (100%)
              </button>
            </div>

            <div className="border border-[#becabd] rounded-xl overflow-hidden">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                  <tr>
                    <th className="p-2.5 text-[#3f4940] font-semibold">الصنف</th>
                    <th className="p-2.5 text-[#3f4940] font-semibold text-center">الكمية الأصلية</th>
                    <th className="p-2.5 text-[#3f4940] font-semibold text-center w-24">كمية المرتجع</th>
                    <th className="p-2.5 text-[#3f4940] font-semibold text-center w-28">سعر الوحدة المسترد</th>
                    <th className="p-2.5 text-[#3f4940] font-semibold text-left">مبلغ الاسترجاع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {invoice.items.map((item) => {
                    const currentQty = returnQuantities[item.id] || 0;
                    const currentPrice = returnPrices[item.id] !== undefined ? returnPrices[item.id] : item.unitPrice;
                    const itemReturnTotal = currentQty * currentPrice * (1 + (item.vatRate || 0.15));
                    return (
                      <tr key={item.id} className={currentQty > 0 ? 'bg-emerald-50/40' : 'bg-white'}>
                        <td className="p-2.5 font-medium text-[#191c1e]">
                          <div>{item.name}</div>
                          <span className="text-[10px] text-[#505f76] font-currency">{item.sku}</span>
                        </td>
                        <td className="p-2.5 text-center font-currency font-semibold text-[#505f76]">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={currentQty}
                            onChange={(e) => handleQtyChange(item.id, item.quantity, e.target.value)}
                            className="w-18 px-2 py-1 text-center bg-white border border-[#becabd] rounded-lg font-currency font-bold text-xs outline-none focus:border-[#005126]"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentPrice}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                              className="w-22 px-2 py-1 text-center bg-white border border-[#becabd] rounded-lg font-currency font-bold text-xs outline-none focus:border-[#005126] text-[#005126]"
                            />
                            <span className="text-[10px] text-[#505f76]">ر.س</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-left font-currency font-bold text-[#ba1a1a]">
                          {currentQty > 0 ? `-${formatCurrency(itemReturnTotal)} ر.س` : '0.00 ر.س'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Restock checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="restockCheckbox"
              checked={restockItems}
              onChange={(e) => setRestockItems(e.target.checked)}
              className="w-4 h-4 accent-[#005126] rounded cursor-pointer"
            />
            <label htmlFor="restockCheckbox" className="text-xs text-[#191c1e] font-semibold cursor-pointer">
              إعادة الأصناف المرتجعة إلى المخزون تلقائياً (+ الكميات)
            </label>
          </div>

          {/* Financial Totals Summary */}
          <div className="bg-[#fff8f6] border border-[#ffdad6] p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-[#505f76]">
              <span>المبلغ المسترد (قبل الضريبة):</span>
              <span className="font-currency font-bold text-[#ba1a1a]">
                -{formatCurrency(returnSubtotal)} ر.س
              </span>
            </div>
            <div className="flex justify-between text-[#505f76]">
              <span>مبلغ ضريبة القيمة المضافة المستردة ({Math.round((companyProfile.defaultVatRate ?? 0.15) * 100)}%):</span>
              <span className="font-currency font-bold text-[#ba1a1a]">
                -{formatCurrency(returnVat)} ر.س
              </span>
            </div>
            <div className="pt-2 border-t border-[#ffdad6] flex justify-between items-baseline font-bold">
              <span className="text-[#191c1e] text-sm">إجمالي الإشعار الدائن المسترد:</span>
              <span className="font-currency text-xl font-bold text-[#ba1a1a]">
                -{formatCurrency(returnGrandTotal)} ر.س
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={returnedItems.length === 0}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>إصدار وتوثيق الإشعار الدائن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
