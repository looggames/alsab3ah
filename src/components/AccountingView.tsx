import React, { useState } from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/zatca';
import {
  Landmark,
  FileCheck,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface AccountingViewProps {
  invoices: Invoice[];
}

export const AccountingView: React.FC<AccountingViewProps> = ({ invoices }) => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q3-2026');

  // Compute live VAT metrics from invoices
  const totalSalesExVat = invoices.reduce((acc, inv) => acc + inv.subtotal, 0);
  const totalOutputVat = invoices.reduce((acc, inv) => acc + inv.totalVat, 0);

  // Purchases & Input VAT
  const estimatedPurchasesExVat = 0.0;
  const estimatedInputVat = 0.0;
  const netVatPayable = totalOutputVat;

  const grossSales = totalSalesExVat;
  const totalVatCalculated = totalOutputVat;
  const totalPurchases = estimatedPurchasesExVat;
  const totalInputVat = estimatedInputVat;
  const finalTaxPayable = netVatPayable;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#becabd] shadow-xs">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#191c1e]">
              المحاسبة والإقرار الضريبي (VAT Return)
            </h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              نموذج إقرار ضريبة القيمة المضافة ومطابقة القيود المحاسبية مع هيئة الزكاة والضريبة والجمارك
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f7f9fb] border border-[#becabd] px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Calendar className="w-4 h-4 text-[#505f76]" />
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer"
              >
                <option value="Q3-2026">الربع الثالث 2026 (يوليو - سبتمبر)</option>
                <option value="Q2-2026">الربع الثاني 2026 (أبريل - يونيو)</option>
                <option value="Q1-2026">الربع الأول 2026 (يناير - مارس)</option>
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#005126] text-white rounded-lg text-xs font-bold hover:bg-[#006c35] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>تصدير نموذج الإقرار</span>
            </button>
          </div>
        </div>

        {/* VAT Settlement Bento Card */}
        <div className="bg-[#f2f4f6] rounded-xl border border-[#becabd] p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#005126] font-bold text-base mb-1">
                <FileCheck className="w-5 h-5" />
                <span>ملخص الإقرار الضريبي للربع الحالي ({selectedQuarter})</span>
              </div>
              <p className="text-xs text-[#3f4940]">
                حساب آلي فوري لضريبة المخرجات وضريبة المدخلات وصافي المبلغ المستحق للهيئة
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#becabd] text-center min-w-[240px] shadow-sm">
              <span className="text-xs text-[#505f76] block mb-1">صافي الضريبة المستحقة للسداد</span>
              <span className="font-currency text-3xl font-bold text-[#005126]">
                {formatCurrency(finalTaxPayable)}
              </span>
              <span className="text-xs font-bold text-[#3f4940] mr-1.5">ر.س</span>
            </div>
          </div>
        </div>

        {/* Official VAT Return Table (ZATCA Format) */}
        <div className="bg-white border border-[#becabd] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#f7f9fb] border-b border-[#becabd] flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#191c1e]">
              تفاصيل بنود إقرار ضريبة القيمة المضافة (نموذج هيئة الزكاة)
            </h3>
            <span className="text-xs text-[#005126] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              مطابق لبيانات الفواتير الإلكترونية
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                <tr>
                  <th className="p-3 text-[#3f4940] font-semibold">بند الإقرار</th>
                  <th className="p-3 text-[#3f4940] font-semibold text-left">المبلغ الأساسي (ر.س)</th>
                  <th className="p-3 text-[#3f4940] font-semibold text-left">نسبة الضريبة</th>
                  <th className="p-3 text-[#3f4940] font-semibold text-left">مبلغ الضريبة (ر.س)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {/* 1. Standard Rated Sales */}
                <tr className="hover:bg-[#f7f9fb]">
                  <td className="p-3 font-semibold text-[#191c1e]">
                    1. المبيعات الخاضعة للنسبة الأساسية (15%)
                  </td>
                  <td className="p-3 font-currency text-left" dir="ltr">
                    {formatCurrency(grossSales)}
                  </td>
                  <td className="p-3 font-currency text-left text-[#005126]">15%</td>
                  <td className="p-3 font-currency font-bold text-left text-[#005126]" dir="ltr">
                    {formatCurrency(totalVatCalculated)}
                  </td>
                </tr>

                {/* 2. Zero Rated Sales */}
                <tr className="hover:bg-[#f7f9fb]">
                  <td className="p-3 text-[#505f76]">2. الصادرات والمبيعات الخاضعة لنسبة الصفر (0%)</td>
                  <td className="p-3 font-currency text-left" dir="ltr">0.00</td>
                  <td className="p-3 font-currency text-left">0%</td>
                  <td className="p-3 font-currency text-left" dir="ltr">0.00</td>
                </tr>

                {/* 3. Exempt Sales */}
                <tr className="hover:bg-[#f7f9fb]">
                  <td className="p-3 text-[#505f76]">3. المبيعات المعفاة من الضريبة</td>
                  <td className="p-3 font-currency text-left" dir="ltr">0.00</td>
                  <td className="p-3 font-currency text-left">-</td>
                  <td className="p-3 font-currency text-left" dir="ltr">0.00</td>
                </tr>

                {/* Total Sales Summary */}
                <tr className="bg-[#f2f4f6] font-bold">
                  <td className="p-3 text-[#005126]">إجمالي المبيعات وضريبة المخرجات</td>
                  <td className="p-3 font-currency text-left" dir="ltr">{formatCurrency(grossSales)}</td>
                  <td className="p-3 font-currency text-left">-</td>
                  <td className="p-3 font-currency text-left text-[#005126]" dir="ltr">
                    {formatCurrency(totalVatCalculated)}
                  </td>
                </tr>

                {/* 4. Standard Rated Purchases */}
                <tr className="hover:bg-[#f7f9fb]">
                  <td className="p-3 font-semibold text-[#191c1e]">
                    4. المشتريات الخاضعة للنسبة الأساسية (15%) - قابلة للخصم
                  </td>
                  <td className="p-3 font-currency text-left" dir="ltr">
                    {formatCurrency(totalPurchases)}
                  </td>
                  <td className="p-3 font-currency text-left text-[#505f76]">15%</td>
                  <td className="p-3 font-currency font-bold text-left text-[#505f76]" dir="ltr">
                    {formatCurrency(totalInputVat)}
                  </td>
                </tr>

                {/* Net Due */}
                <tr className="bg-[#006c35]/10 font-bold text-sm">
                  <td className="p-4 text-[#005126]">صافي الضريبة المستحقة للسداد لهيئة الزكاة والدخل</td>
                  <td className="p-4 font-currency text-left" dir="ltr">-</td>
                  <td className="p-4 font-currency text-left">-</td>
                  <td className="p-4 font-currency text-lg text-left text-[#005126]" dir="ltr">
                    {formatCurrency(finalTaxPayable)} ر.س
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#becabd] shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#005126]">
              <ArrowUpRight className="w-5 h-5" />
              <h4 className="font-bold text-sm">إجمالي الإيرادات (قبل الضريبة)</h4>
            </div>
            <span className="font-currency text-2xl font-bold text-[#191c1e]">
              {formatCurrency(grossSales)} ر.س
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#becabd] shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#ba1a1a]">
              <ArrowDownLeft className="w-5 h-5" />
              <h4 className="font-bold text-sm">تكلفة المبيعات والمصروفات</h4>
            </div>
            <span className="font-currency text-2xl font-bold text-[#ba1a1a]">
              {formatCurrency(totalPurchases)} ر.س
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#becabd] shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#005126]">
              <TrendingUp className="w-5 h-5" />
              <h4 className="font-bold text-sm">صافي الأرباح التشغيلية</h4>
            </div>
            <span className="font-currency text-2xl font-bold text-[#005126]">
              {formatCurrency(grossSales - totalPurchases)} ر.س
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
