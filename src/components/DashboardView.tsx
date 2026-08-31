import React, { useState } from 'react';
import { Invoice, NavTab, StockAlert } from '../types';
import { formatCurrency, formatNumber } from '../utils/zatca';
import {
  CreditCard,
  Building2,
  PiggyBank,
  Receipt,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Check,
  PackageCheck,
  FileText,
  Activity,
  CheckCheck,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  invoices: Invoice[];
  stockAlerts: StockAlert[];
  onNavigateTab: (tab: NavTab) => void;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onTriggerZatcaSync: () => void;
  onClearAllData?: () => Promise<void>;
  isSyncing: boolean;
  zatcaStats: {
    cleared: number;
    pending: number;
    failed: number;
  };
  onOpenZatcaWizard?: () => void;
  isOnboarded?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  stockAlerts,
  onNavigateTab,
  onOpenInvoiceModal,
  onTriggerZatcaSync,
  onClearAllData,
  isSyncing,
  zatcaStats,
  onOpenZatcaWizard,
  isOnboarded = false,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Check if legacy demo invoices are present
  const hasDemoInvoices = invoices.some((inv) => inv.invoiceNumber.startsWith('INV-2023-'));

  const handleQuickReset = async () => {
    if (!onClearAllData) return;
    if (window.confirm('هل تريد تصفير وحذف جميع البيانات السابقة والبدء بحساب نظيف وفارغ تماماً؟')) {
      setIsResetting(true);
      try {
        await onClearAllData();
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Dynamic calculations based on state
  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalVat = invoices.reduce((sum, inv) => sum + inv.totalVat, 0);
  const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  // Net sales before tax (Total Sales - VAT)
  const netSalesExVat = totalSubtotal || (totalSales - totalVat);
  const totalTransactions = invoices.length;
  const avgInvoice = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const cardSales = invoices.filter((i) => i.paymentMethod === 'card').reduce((sum, i) => sum + i.grandTotal, 0);
  const cashSales = invoices.filter((i) => i.paymentMethod === 'cash').reduce((sum, i) => sum + i.grandTotal, 0);
  const transferSales = invoices.filter((i) => i.paymentMethod === 'transfer').reduce((sum, i) => sum + i.grandTotal, 0);

  const cardPercent = totalSales > 0 ? Math.round((cardSales / totalSales) * 100) : 0;
  const cashPercent = totalSales > 0 ? Math.round((cashSales / totalSales) * 100) : 0;
  const transferPercent = totalSales > 0 ? Math.max(0, 100 - cardPercent - cashPercent) : 0;

  // Build weekly trend dynamically based on real data
  const daysOfWeek = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const weeklySales = daysOfWeek.map((day, idx) => {
    // Check if any invoice date matches or divide evenly for today
    const dayInvoices = invoices.filter((inv) => {
      try {
        const invDate = new Date(inv.date);
        const jsDay = invDate.getDay(); // 0 is Sun, 6 is Sat
        const dayIdxMap = [1, 2, 3, 4, 5, 6, 0]; // Map Sun(0)->1, Sat(6)->0
        return dayIdxMap[jsDay] === idx;
      } catch {
        return false;
      }
    });

    const dayTotal = dayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    return {
      day,
      sales: dayTotal,
      transactions: dayInvoices.length,
    };
  });

  const maxWeeklySale = Math.max(...weeklySales.map((d) => d.sales), 1);
  const weeklySalesData = weeklySales.map((d) => ({
    ...d,
    heightPercent: d.sales > 0 ? Math.max(15, Math.round((d.sales / maxWeeklySale) * 100)) : 4,
  }));

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Legacy Demo Data Notification Banner */}
        {hasDemoInvoices && onClearAllData && (
          <div className="bg-[#fff8f6] border border-[#ffdad6] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-[#ba1a1a]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold block">تم رصد بيانات تجريبية سابقة في هذا الحساب.</span>
                <span className="text-[#505f76]">هل تود حذف هذه الفواتير والمخزون للبدء بحساب نظيف وجديد تماماً؟</span>
              </div>
            </div>
            <button
              onClick={handleQuickReset}
              disabled={isResetting}
              className="px-4 py-2 bg-[#ba1a1a] text-white rounded-lg text-xs font-bold hover:bg-[#93000a] flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'جاري التصفير...' : 'تصفير وحذف جميع البيانات الآن'}</span>
            </button>
          </div>
        )}

        {/* ================= 1. KPI Row ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI Card 1: إجمالي المبيعات */}
          <div
            id="kpi-today-sales"
            className="bg-white border border-[#becabd] rounded-xl p-4 flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(15,23,42,0.06)] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-base text-[#3f4940] font-medium">إجمالي المبيعات</span>
              <div className="w-8 h-8 rounded-full bg-[#006c35]/20 flex items-center justify-center text-[#005126]">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-currency text-2xl md:text-[28px] font-bold text-[#191c1e] tracking-tight">
                  {formatCurrency(totalSales)}
                </span>
                <span className="text-xs font-semibold text-[#3f4940]">ر.س</span>
              </div>
              <div className="flex items-center gap-1 text-[#005126] mt-1 font-medium text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{totalTransactions > 0 ? 'محدث بشكل فوري' : 'لا توجد مبيعات بعد'}</span>
              </div>
            </div>
          </div>

          {/* KPI Card 2: ضريبة القيمة المضافة */}
          <div
            id="kpi-vat-amount"
            className="bg-white border border-[#becabd] rounded-xl p-4 flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(15,23,42,0.06)] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-base text-[#3f4940] font-medium">ضريبة القيمة المضافة</span>
              <div className="w-8 h-8 rounded-full bg-[#555d73]/20 flex items-center justify-center text-[#3e455b]">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-currency text-2xl md:text-[28px] font-bold text-[#191c1e] tracking-tight">
                  {formatCurrency(totalVat)}
                </span>
                <span className="text-xs font-semibold text-[#3f4940]">ر.س</span>
              </div>
              <span className="text-xs text-[#505f76] mt-1 block">مستحقة الإقرار (15%)</span>
            </div>
          </div>

          {/* KPI Card 3: صافي المبيعات */}
          <div
            id="kpi-net-sales"
            className="bg-white border border-[#becabd] rounded-xl p-4 flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(15,23,42,0.06)] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-base text-[#3f4940] font-medium">صافي المبيعات</span>
              <div className="w-8 h-8 rounded-full bg-[#d0e1fb]/40 flex items-center justify-center text-[#505f76]">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-currency text-2xl md:text-[28px] font-bold text-[#191c1e] tracking-tight">
                  {formatCurrency(netSalesExVat)}
                </span>
                <span className="text-xs font-semibold text-[#3f4940]">ر.س</span>
              </div>
              <span className="text-xs text-[#005126] mt-1 block font-medium">
                {totalSales > 0 ? 'إجمالي المبيعات بعد خصم الضريبة' : 'بانتظار العمليات'}
              </span>
            </div>
          </div>

          {/* KPI Card 4: عدد الفواتير */}
          <div
            id="kpi-tx-count"
            className="bg-white border border-[#becabd] rounded-xl p-4 flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(15,23,42,0.06)] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-base text-[#3f4940] font-medium">عدد الفواتير الصادرة</span>
              <div className="w-8 h-8 rounded-full bg-[#e0e3e5] flex items-center justify-center text-[#191c1e]">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-currency text-2xl md:text-[28px] font-bold text-[#191c1e] tracking-tight">
                  {formatNumber(totalTransactions)}
                </span>
                <span className="text-xs font-semibold text-[#3f4940]">عملية</span>
              </div>
              <span className="text-xs text-[#505f76] mt-1 block">
                متوسط الفاتورة: {formatCurrency(avgInvoice)} ر.س
              </span>
            </div>
          </div>
        </section>

        {/* ================= 2. ZATCA Compliance Section (Redesigned) ================= */}
        <section
          id="zatca-compliance-banner"
          className="bg-white rounded-2xl border border-[#becabd] shadow-xs overflow-hidden"
        >
          {/* Subtle Top Compliance Status Bar */}
          <div
            className={`px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-white ${
              isOnboarded
                ? 'bg-gradient-to-r from-[#006c35] via-[#005126] to-[#003919]'
                : 'bg-gradient-to-r from-amber-700 via-amber-800 to-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnboarded ? 'bg-emerald-300' : 'bg-amber-300'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isOnboarded ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
              </span>
              <span className="text-xs font-bold tracking-wide">
                {isOnboarded
                  ? 'الربط الإلكتروني نشط ومفعل • ZATCA Fatoora API Phase 2'
                  : 'وحدة الفوترة بانتظار التهيئة والربط • ZATCA Onboarding Required'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100 font-medium">
              <span className="hidden sm:inline">
                {isOnboarded ? 'بروتوكول التشفير والتوقيع الرقمي (ECDSA secp256k1)' : 'يتطلب رمز OTP من منصة فاتورة'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/15 text-white text-[11px] font-bold">بوابة فاتورة</span>
            </div>
          </div>

          <div className="p-6 flex flex-col xl:flex-row gap-6 items-stretch justify-between">
            {/* Right details & Title */}
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isOnboarded
                        ? 'bg-[#006c35]/10 border-[#006c35]/20 text-[#006c35]'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2">
                      <span>حالة الاعتماد والربط الضريبي</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isOnboarded
                            ? 'bg-[#006c35]/10 text-[#005126] border-[#006c35]/20'
                            : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                      >
                        {isOnboarded ? 'ممتثل 100% (معتمد)' : 'بانتظار الربط والتهيئة'}
                      </span>
                    </h3>
                    <p className="text-xs text-[#505f76] mt-0.5">
                      {isOnboarded
                        ? 'مراقبة حية وتشفير واعتماد الفواتير الضريبية القياسية والمبسطة وإصدار أختام التشفير QR Code المعتمدة.'
                        : 'لم يتم ربط هذا الجهاز بمنصة فاتورة بعد. يمكنك إصدار الفواتير محلياً أو إتمام خطوات معالج الربط لتفعيل الاعتماد الرسمي.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Compliance Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#505f76]">نسبة الاعتماد الفوري من الهيئة:</span>
                  <span className="text-[#005126] font-bold font-currency">
                    {zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed > 0
                      ? Math.round((zatcaStats.cleared / (zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed)) * 100)
                      : isOnboarded
                      ? 100
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#006c35] h-full transition-all duration-500"
                    style={{
                      width: `${
                        zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed > 0
                          ? (zatcaStats.cleared / (zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed)) * 100
                          : isOnboarded
                          ? 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="bg-[#3e455b] h-full transition-all duration-500"
                    style={{
                      width: `${
                        zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed > 0
                          ? (zatcaStats.pending / (zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed)) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="bg-[#ba1a1a] h-full transition-all duration-500"
                    style={{
                      width: `${
                        zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed > 0
                          ? (zatcaStats.failed / (zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed)) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Middle: 3 Modern Metric Badges */}
            <div className="grid grid-cols-3 gap-3 w-full xl:w-auto min-w-[340px] md:min-w-[420px]">
              {/* Cleared */}
              <div className="bg-[#f2f9f4] border border-[#006c35]/20 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#006c35]">
                  <span className="text-[11px] font-bold">معتمدة</span>
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <span className="font-currency text-2xl font-black text-[#005126] block leading-none">
                    {zatcaStats.cleared}
                  </span>
                  <span className="text-[10px] text-[#006c35] font-semibold mt-1 block">موثقة بالهيئة</span>
                </div>
              </div>

              {/* Pending */}
              <div className="bg-[#f4f7fb] border border-[#3e455b]/20 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#3e455b]">
                  <span className="text-[11px] font-bold">قيد الرفع</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <span className="font-currency text-2xl font-black text-[#222a3d] block leading-none">
                    {zatcaStats.pending}
                  </span>
                  <span className="text-[10px] text-[#505f76] font-semibold mt-1 block">بانتظار المزامنة</span>
                </div>
              </div>

              {/* Failed */}
              <div className="bg-[#fff8f6] border border-[#ba1a1a]/20 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#ba1a1a]">
                  <span className="text-[11px] font-bold">فشل الإرسال</span>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <span className="font-currency text-2xl font-black text-[#93000a] block leading-none">
                    {zatcaStats.failed}
                  </span>
                  <span className="text-[10px] text-[#ba1a1a] font-semibold mt-1 block">تتطلب مراجعة</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. Charts & Analytics ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart (Sales Trend) */}
          <div className="lg:col-span-2 bg-white border border-[#becabd] rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#191c1e]">اتجاه المبيعات الأسبوعي</h3>
                <p className="text-xs text-[#505f76] mt-0.5">مقارنة أداء المبيعات والضريبة خلال أيام الأسبوع</p>
              </div>
              {hoveredDay !== null && weeklySalesData[hoveredDay] && (
                <div className="text-left bg-[#f2f4f6] px-3 py-1.5 rounded-lg border border-[#becabd]/60 text-xs">
                  <span className="text-[#3f4940] ml-2 font-medium">{weeklySalesData[hoveredDay].day}:</span>
                  <span className="font-bold text-[#005126] font-currency">
                    {formatCurrency(weeklySalesData[hoveredDay].sales)} ر.س
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full min-h-[220px] relative rounded-lg border border-[#e0e3e5] overflow-hidden flex items-end px-4 pb-4 gap-3 bg-[#f7f9fb]/50">
              {weeklySalesData.map((d, index) => {
                const isHovered = hoveredDay === index;
                const hasSales = d.sales > 0;

                return (
                  <div
                    key={d.day}
                    onMouseEnter={() => setHoveredDay(index)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div
                      className={`mb-2 bg-[#2d3133] text-white text-[11px] px-2.5 py-1 rounded shadow-md whitespace-nowrap transition-all duration-150 pointer-events-none ${
                        isHovered ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-1'
                      }`}
                    >
                      <span className="font-bold">{d.day}</span>: {formatCurrency(d.sales)} ر.س
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${d.heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        hasSales
                          ? isHovered
                            ? 'bg-[#005126]'
                            : 'bg-[#005126]/80 group-hover:bg-[#005126]'
                          : 'bg-[#e0e3e5]'
                      }`}
                    />

                    {/* Day label */}
                    <span
                      className={`text-xs mt-2 transition-colors ${
                        isHovered ? 'font-bold text-[#005126]' : 'text-[#505f76]'
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut Chart (Payment Methods) */}
          <div className="bg-white border border-[#becabd] rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <h3 className="text-xl font-bold text-[#191c1e] mb-4">توزيع المبيعات حسب طريقة الدفع</h3>

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {totalSales > 0 ? (
                <div
                  className="w-44 h-44 rounded-full relative shadow-sm flex items-center justify-center"
                  style={{
                    background: `conic-gradient(from 0deg, #005126 0% ${cardPercent}%, #505f76 ${cardPercent}% ${
                      cardPercent + cashPercent
                    }%, #93c5fd ${cardPercent + cashPercent}% 100%)`,
                  }}
                >
                  <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="font-currency text-3xl font-bold text-[#191c1e]">{cardPercent}%</span>
                    <span className="text-xs font-semibold text-[#3f4940]">بطاقات مدى/فيزا</span>
                  </div>
                </div>
              ) : (
                <div className="w-44 h-44 rounded-full relative border-4 border-dashed border-[#e0e3e5] flex items-center justify-center text-center p-4">
                  <span className="text-xs text-[#505f76] font-medium">بانتظار أول عملية بيع</span>
                </div>
              )}

              {/* Legend */}
              <div className="w-full space-y-2.5 pt-2 border-t border-[#eceef0]">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#005126]" />
                    <span className="text-[#191c1e] font-medium">بطاقة ائتمان / مدى</span>
                  </div>
                  <span className="font-bold text-[#191c1e] font-currency">{cardPercent}%</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#505f76]" />
                    <span className="text-[#191c1e] font-medium">نقد (كاش)</span>
                  </div>
                  <span className="font-bold text-[#191c1e] font-currency">{cashPercent}%</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#93c5fd] border border-[#505f76]/30" />
                    <span className="text-[#191c1e] font-medium">تحويل بنكي</span>
                  </div>
                  <span className="font-bold text-[#191c1e] font-currency">{transferPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. Tables Section ================= */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Invoices (Takes up 2 cols) */}
          <div className="xl:col-span-2 bg-white border border-[#becabd] rounded-xl overflow-hidden flex flex-col shadow-xs">
            <div className="p-4 border-b border-[#becabd] flex justify-between items-center bg-[#f7f9fb]">
              <h3 className="text-xl font-bold text-[#191c1e]">أحدث الفواتير</h3>
              <button
                id="btn-view-all-invoices"
                onClick={() => onNavigateTab('invoices')}
                className="text-[#005126] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar flex-1">
              {recentInvoices.length > 0 ? (
                <table className="w-full text-right border-collapse">
                  <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                    <tr>
                      <th className="p-3 text-xs text-[#3f4940] font-semibold">رقم الفاتورة</th>
                      <th className="p-3 text-xs text-[#3f4940] font-semibold">العميل</th>
                      <th className="p-3 text-xs text-[#3f4940] font-semibold text-left">المبلغ (ر.س)</th>
                      <th className="p-3 text-xs text-[#3f4940] font-semibold">حالة هيئة الزكاة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#becabd]">
                    {recentInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => onOpenInvoiceModal(inv)}
                        className="hover:bg-[#f2f4f6] transition-colors cursor-pointer group"
                      >
                        <td className="p-3 text-sm text-[#191c1e] font-medium group-hover:text-[#005126]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-3 text-sm text-[#3f4940]">{inv.customerName}</td>
                        <td className="p-3 font-currency text-base font-bold text-[#191c1e] text-left" dir="ltr">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="p-3">
                          {inv.zatcaStatus === 'cleared' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#006c35]/20 text-[#005126] text-xs font-semibold">
                              <Check className="w-3.5 h-3.5" />
                              معتمدة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#555d73]/20 text-[#3e455b] text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              قيد المعالجة
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <FileText className="w-10 h-10 text-[#505f76]/40 mb-2" />
                  <p className="text-sm font-semibold text-[#191c1e]">لا توجد فواتير بعد</p>
                  <p className="text-xs text-[#505f76] mt-1">ابدأ بإصدار أول فاتورة من شاشة نقاط البيع (POS)</p>
                  <button
                    onClick={() => onNavigateTab('pos')}
                    className="mt-3 px-4 py-2 bg-[#005126] text-white text-xs font-bold rounded-lg hover:bg-[#006c35]"
                  >
                    فتح نقطة البيع
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white border border-[#becabd] rounded-xl overflow-hidden flex flex-col shadow-xs">
            <div className="p-4 border-b border-[#becabd] flex justify-between items-center bg-[#f7f9fb]">
              <h3 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                <span>تنبيهات المخزون</span>
              </h3>
              <span className="text-xs bg-[#ffdad6] text-[#ba1a1a] font-bold px-2 py-0.5 rounded-full">
                {stockAlerts.length} أصناف
              </span>
            </div>

            <div className="flex-1">
              {stockAlerts.length > 0 ? (
                <ul className="divide-y divide-[#becabd] p-2">
                  {stockAlerts.slice(0, 3).map((alert) => (
                    <li
                      key={alert.id}
                      className="p-2.5 flex justify-between items-center hover:bg-[#f2f4f6] rounded transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#191c1e]">{alert.productName}</span>
                        <span className="text-xs text-[#3f4940]">{alert.category}</span>
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                          alert.remaining <= 2
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : 'bg-[#555d73]/30 text-[#3e455b]'
                        }`}
                      >
                        المتبقي: {alert.remaining}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <PackageCheck className="w-10 h-10 text-[#005126]/50 mb-2" />
                  <p className="text-sm font-semibold text-[#191c1e]">المخزون متوازن</p>
                  <p className="text-xs text-[#505f76] mt-1">لا توجد تنبيهات لنقص المنتجات في الوقت الحالي</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#becabd] text-center bg-[#f7f9fb] mt-auto">
              <button
                id="btn-manage-inventory"
                onClick={() => onNavigateTab('inventory')}
                className="text-[#005126] text-xs font-bold hover:underline w-full cursor-pointer"
              >
                إدارة المخزون والطلبيات
              </button>
            </div>
          </div>
        </section>

        {/* Spacer for bottom breathing room */}
        <div className="h-8" />
      </div>
    </div>
  );
};
