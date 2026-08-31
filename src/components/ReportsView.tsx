import React, { useState } from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/zatca';
import {
  BarChart3,
  Calendar,
  Printer,
  CreditCard,
  Banknote,
  Building,
  FileText,
} from 'lucide-react';

interface ReportsViewProps {
  invoices: Invoice[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ invoices }) => {
  const [reportType, setReportType] = useState<'daily' | 'payment' | 'products'>('daily');

  const cardInvoices = invoices.filter((i) => i.paymentMethod === 'card');
  const cashInvoices = invoices.filter((i) => i.paymentMethod === 'cash');
  const transferInvoices = invoices.filter((i) => i.paymentMethod === 'transfer');

  const cardSales = cardInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const cashSales = cashInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const transferSales = transferInvoices.reduce((acc, i) => acc + i.grandTotal, 0);

  const totalSales = cardSales + cashSales + transferSales;
  const totalVat = invoices.reduce((acc, i) => acc + i.totalVat, 0);
  const totalSubtotal = invoices.reduce((acc, i) => acc + i.subtotal, 0);

  const cardPct = totalSales > 0 ? ((cardSales / totalSales) * 100).toFixed(1) : '0.0';
  const cashPct = totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : '0.0';
  const transferPct = totalSales > 0 ? ((transferSales / totalSales) * 100).toFixed(1) : '0.0';

  // Compute product sales summary dynamically from invoices items
  const productSalesMap = new Map<string, { name: string; quantity: number; total: number }>();
  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      const existing = productSalesMap.get(item.sku || item.name) || {
        name: item.name,
        quantity: 0,
        total: 0,
      };
      existing.quantity += item.quantity;
      existing.total += item.total;
      productSalesMap.set(item.sku || item.name, existing);
    });
  });

  const topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#becabd] shadow-xs">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#191c1e]">التقارير المالية والضريبية</h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              تحليل شامل لحركة المبيعات، إغلاق الصندوق اليومي (Z-Report)، وتقارير الامتثال الضريبي
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#005126] text-white rounded-lg text-xs font-bold hover:bg-[#006c35] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="flex gap-2 bg-white p-2 rounded-xl border border-[#becabd] shadow-xs overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              reportType === 'daily'
                ? 'bg-[#005126] text-white'
                : 'bg-[#f7f9fb] text-[#3f4940] hover:bg-[#eceef0]'
            }`}
          >
            تقرير الإغلاق اليومي (Z-Report)
          </button>
          <button
            onClick={() => setReportType('payment')}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              reportType === 'payment'
                ? 'bg-[#005126] text-white'
                : 'bg-[#f7f9fb] text-[#3f4940] hover:bg-[#eceef0]'
            }`}
          >
            تحليل طرق الدفع والوسائل
          </button>
          <button
            onClick={() => setReportType('products')}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              reportType === 'products'
                ? 'bg-[#005126] text-white'
                : 'bg-[#f7f9fb] text-[#3f4940] hover:bg-[#eceef0]'
            }`}
          >
            الأصناف الأكثر مبيعاً
          </button>
        </div>

        {/* Report Content */}
        {reportType === 'daily' && (
          <div className="bg-white rounded-xl border border-[#becabd] p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">
                  تقرير الإغلاق المالي لليوم (Z-Report)
                </h3>
                <span className="text-xs text-[#505f76] font-currency">
                  التاريخ: {new Date().toISOString().split('T')[0]} | الحالة: تقرير فوري مباشر
                </span>
              </div>
              <span className="px-3 py-1 bg-[#006c35]/15 text-[#005126] font-bold text-xs rounded-full">
                {invoices.length > 0 ? 'محدث ونشط' : 'بانتظار العمليات'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#f7f9fb] rounded-xl border border-[#becabd]">
                <span className="text-xs text-[#505f76] block mb-1">إجمالي المبيعات الشاملة</span>
                <span className="font-currency text-xl font-bold text-[#005126]">
                  {formatCurrency(totalSales)} ر.س
                </span>
              </div>

              <div className="p-4 bg-[#f7f9fb] rounded-xl border border-[#becabd]">
                <span className="text-xs text-[#505f76] block mb-1">ضريبة القيمة المضافة 15%</span>
                <span className="font-currency text-xl font-bold text-[#3e455b]">
                  {formatCurrency(totalVat)} ر.س
                </span>
              </div>

              <div className="p-4 bg-[#f7f9fb] rounded-xl border border-[#becabd]">
                <span className="text-xs text-[#505f76] block mb-1">المبيعات قبل الضريبة</span>
                <span className="font-currency text-xl font-bold text-[#191c1e]">
                  {formatCurrency(totalSubtotal)} ر.س
                </span>
              </div>

              <div className="p-4 bg-[#f7f9fb] rounded-xl border border-[#becabd]">
                <span className="text-xs text-[#505f76] block mb-1">عدد الفواتير الصادرة</span>
                <span className="font-currency text-xl font-bold text-[#191c1e]">
                  {invoices.length} عملية
                </span>
              </div>
            </div>

            {/* Payment breakdowns */}
            <div className="border border-[#becabd] rounded-xl overflow-hidden">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                  <tr>
                    <th className="p-3 text-[#3f4940] font-semibold">وسيلة الدفع</th>
                    <th className="p-3 text-[#3f4940] font-semibold text-center">عدد العمليات</th>
                    <th className="p-3 text-[#3f4940] font-semibold text-left">المبلغ المحصل (ر.س)</th>
                    <th className="p-3 text-[#3f4940] font-semibold text-left">النسبة من الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  <tr>
                    <td className="p-3 font-semibold text-[#191c1e] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#005126]" />
                      <span>بطاقات مدى وفيزا / ماستركارد</span>
                    </td>
                    <td className="p-3 font-currency text-center">{cardInvoices.length}</td>
                    <td className="p-3 font-currency font-bold text-left text-[#005126]">
                      {formatCurrency(cardSales)} ر.س
                    </td>
                    <td className="p-3 font-currency font-bold text-left">{cardPct}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#191c1e] flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#505f76]" />
                      <span>النقد (الكاش في الصندوق)</span>
                    </td>
                    <td className="p-3 font-currency text-center">{cashInvoices.length}</td>
                    <td className="p-3 font-currency font-bold text-left text-[#505f76]">
                      {formatCurrency(cashSales)} ر.س
                    </td>
                    <td className="p-3 font-currency font-bold text-left">{cashPct}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#191c1e] flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span>تحويل بنكي مباشر (IBAN)</span>
                    </td>
                    <td className="p-3 font-currency text-center">{transferInvoices.length}</td>
                    <td className="p-3 font-currency font-bold text-left text-blue-600">
                      {formatCurrency(transferSales)} ر.س
                    </td>
                    <td className="p-3 font-currency font-bold text-left">{transferPct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'payment' && (
          <div className="bg-white rounded-xl border border-[#becabd] p-6 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-[#191c1e]">تحليل قنوات الدفع والتحصيل</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-[#006c35]/10 rounded-xl border border-[#005126]/30 text-center">
                <CreditCard className="w-8 h-8 text-[#005126] mx-auto mb-2" />
                <span className="text-xs text-[#505f76] block">بطاقة مدى / ائتمان</span>
                <span className="font-currency text-2xl font-bold text-[#005126]">{cardPct}%</span>
                <span className="text-xs text-[#005126] block mt-1">
                  {formatCurrency(cardSales)} ر.س ({cardInvoices.length} عمليات)
                </span>
              </div>

              <div className="p-5 bg-gray-50 rounded-xl border border-[#becabd] text-center">
                <Banknote className="w-8 h-8 text-[#505f76] mx-auto mb-2" />
                <span className="text-xs text-[#505f76] block">نقداً (Cash)</span>
                <span className="font-currency text-2xl font-bold text-[#505f76]">{cashPct}%</span>
                <span className="text-xs text-gray-500 block mt-1">
                  {formatCurrency(cashSales)} ر.س ({cashInvoices.length} عمليات)
                </span>
              </div>

              <div className="p-5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <Building className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <span className="text-xs text-[#505f76] block">حوالة بنكية</span>
                <span className="font-currency text-2xl font-bold text-blue-600">{transferPct}%</span>
                <span className="text-xs text-blue-600 block mt-1">
                  {formatCurrency(transferSales)} ر.س ({transferInvoices.length} عمليات)
                </span>
              </div>
            </div>
          </div>
        )}

        {reportType === 'products' && (
          <div className="bg-white rounded-xl border border-[#becabd] p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-[#191c1e]">الأصناف الأكثر مبيعاً وتحقيقاً للإيراد</h3>
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                    <tr>
                      <th className="p-3 text-[#3f4940] font-semibold">الصنف</th>
                      <th className="p-3 text-[#3f4940] font-semibold text-center">الكمية المباعة</th>
                      <th className="p-3 text-[#3f4940] font-semibold text-left">إجمالي المبيعات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eceef0]">
                    {topProducts.map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-[#191c1e]">{p.name}</td>
                        <td className="p-3 font-currency text-center font-bold">{p.quantity}</td>
                        <td className="p-3 font-currency font-bold text-left text-[#005126]">
                          {formatCurrency(p.total)} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <FileText className="w-10 h-10 text-[#505f76]/40 mb-2" />
                <p className="text-sm font-semibold text-[#191c1e]">لا توجد مبيعات أصناف حتى الآن</p>
                <p className="text-xs text-[#505f76] mt-1">ستظهر الأصناف الأكثر مبيعاً هنا تلقائياً بعد تسجيل عمليات البيع</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
