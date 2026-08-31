import React, { useState } from 'react';
import { CompanyProfile, ZatcaConfig, ZatcaLog } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Key,
  Server,
  RefreshCw,
  Cpu,
  Lock,
  Sparkles,
  ExternalLink,
  Download,
  Copy,
  Check,
  Zap,
  Terminal,
  Activity,
  FileCode,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { testZatcaConnection } from '../utils/zatca';

interface ZatcaLogsViewProps {
  logs: ZatcaLog[];
  companyProfile: CompanyProfile;
  onTriggerZatcaSync: () => void;
  isSyncing: boolean;
  zatcaStats: {
    cleared: number;
    pending: number;
    failed: number;
  };
  onOpenSetupWizard?: () => void;
  onClearLogs?: () => void;
}

export const ZatcaLogsView: React.FC<ZatcaLogsViewProps> = ({
  logs,
  companyProfile,
  onTriggerZatcaSync,
  isSyncing,
  zatcaStats,
  onOpenSetupWizard,
  onClearLogs,
}) => {
  const [selectedLog, setSelectedLog] = useState<ZatcaLog | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<{
    latencyMs: number;
    isHealthy: boolean;
    timestamp: string;
  } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    try {
      const res = await testZatcaConnection(companyProfile.environment || 'production');
      setPingResult({
        latencyMs: res.latencyMs,
        isHealthy: res.isHealthy,
        timestamp: new Date().toLocaleTimeString('ar-SA'),
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setIsPinging(false);
    }
  };

  const zatcaConfig = companyProfile.zatcaConfig || {
    environment: companyProfile.environment || 'production',
    egsUuid: '',
    egsSerialNumber: companyProfile.crNumber ? `EGS-ALSAB3AH-${companyProfile.crNumber}-01` : '',
    solutionName: 'نظام السابعة للفوترة الإلكترونية (AlSab3ah ZATCA Phase 2)',
    model: 'ALSAB3AH-POS-01',
    otp: '',
    csidStatus: companyProfile.csidStatus || 'pending',
    isOnboarded: false,
  };

  const isOnboarded = Boolean(
    companyProfile.csidStatus === 'active' ||
    companyProfile.zatcaConfig?.isOnboarded ||
    companyProfile.zatcaConfig?.productionCsid
  );

  const totalInvoices = zatcaStats.cleared + zatcaStats.pending + zatcaStats.failed;
  const acceptanceRate = totalInvoices > 0 ? Math.round((zatcaStats.cleared / totalInvoices) * 100) : 100;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Main Header */}
        <div className="flex flex-col gap-5 bg-white p-6 rounded-2xl border border-[#becabd] shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#006c35]/15 text-[#005126] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-[#191c1e]">
                  مركز الربط والتكامل مع هيئة الزكاة (فاتورة - المرحلة 2)
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    isOnboarded ? 'bg-[#006c35]/15 text-[#005126]' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {isOnboarded ? 'مربوط ومعتمد (Production Active)' : 'بانتظار التهيئة والربط'}
                </span>
              </div>
              <p className="text-xs text-[#505f76]">
                منظومة الربط المباشر مع منصة فاتورة (ZATCA Phase 2) وإصدار الختم والتوقيع الرقمي المعتمد
              </p>
            </div>
          </div>

          {/* Actions under the header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#eceef0] w-full">
            {onOpenSetupWizard && (
              <button
                id="btn-open-zatca-wizard"
                onClick={onOpenSetupWizard}
                className="w-full px-6 py-3.5 bg-[#005126] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#006c35] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{isOnboarded ? 'إعادة تشغيل معالج الربط' : 'بدء معالج الربط والتهيئة'}</span>
              </button>
            )}

            <button
              onClick={onTriggerZatcaSync}
              disabled={isSyncing}
              className="w-full px-6 py-3.5 bg-[#f7f9fb] border border-[#becabd] text-[#191c1e] rounded-xl text-xs sm:text-sm font-bold hover:bg-[#e0e3e5] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-[#005126] shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة الفواتير'}</span>
            </button>
          </div>
        </div>

        {/* Minimal Integration Summary Bar with Toggle for Detailed Technical Cards */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#becabd] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#005126] flex items-center justify-center border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#191c1e]">
                  {companyProfile.nameAr || 'المنشأة غير محددة بعد'}
                </span>
                <span className="text-[11px] text-[#505f76] font-currency font-medium">
                  الرقم الضريبي: {companyProfile.taxNumber || 'غير محدد'}
                </span>
                <span className="text-[10px] bg-[#d0e1fb] text-[#005126] font-bold px-2 py-0.5 rounded-full uppercase">
                  {companyProfile.environment || 'production'}
                </span>
              </div>
              <p className="text-[11px] text-[#505f76] mt-0.5">
                حالة الربط: <span className="font-bold text-[#005126]">{isOnboarded ? 'شهادة التشفير (CSID) نشطة وتعمل بكفاءة' : 'بانتظار تهيئة رمز OTP والربط مع الهيئة'}</span> • معدل اعتماد الفواتير: <span className="font-bold text-[#005126]">{acceptanceRate}%</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="px-4 py-2 bg-[#f0f3f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#005126]" />
            <span>{showTechnicalDetails ? 'إخفاء التفاصيل الفنية المتقدمة' : 'عرض التفاصيل الفنية المتقدمة'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Technical Data Cards (Hidden by default, expandable on demand) */}
        {showTechnicalDetails && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: CSID Certificate Status */}
              <div className="bg-white p-5 rounded-2xl border border-[#becabd] shadow-xs space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-[#505f76] font-semibold block">حالة الختم والشهادة</span>
                  <span
                    className={`w-full block text-center px-2.5 py-1 text-[11px] font-bold rounded-xl ${
                      isOnboarded ? 'bg-[#006c35]/15 text-[#005126]' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isOnboarded ? 'نشط ومعتمد (Active)' : 'غير مربوط (Unregistered)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#191c1e] font-bold text-sm pt-1 border-t border-[#eceef0]">
                  <Key className="w-4 h-4 text-[#005126]" />
                  <span>{isOnboarded ? 'Production CSID' : 'غير مهيأ (بانتظار OTP)'}</span>
                </div>
                <p className="text-[11px] text-[#505f76]">
                  {isOnboarded
                    ? zatcaConfig?.csidExpiryDate
                      ? `صالحة حتى: ${zatcaConfig.csidExpiryDate}`
                      : 'الشهادة معتمدة ونشطة'
                    : 'يتطلب تشغيل معالج الربط وإدخال رمز التحقق'}
                </p>
              </div>

              {/* Card 2: Environment */}
              <div className="bg-white p-5 rounded-2xl border border-[#becabd] shadow-xs space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-[#505f76] font-semibold block">بيئة الربط (Environment)</span>
                  <span className="w-full block text-center px-2.5 py-1 bg-[#d0e1fb] text-[#005126] text-[11px] font-bold rounded-xl uppercase font-mono tracking-wider">
                    {companyProfile.environment || 'production'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#191c1e] font-bold text-sm pt-1 border-t border-[#eceef0]">
                  <Server className="w-4 h-4 text-[#005126]" />
                  <span className="font-mono text-xs">gw-fatoora.zatca.gov.sa</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#505f76]">
                    {pingResult ? `زمن الاستجابة: ${pingResult.latencyMs} ms` : isOnboarded ? 'جاهز للفحص' : 'بانتظار الربط'}
                  </span>
                  <button
                    onClick={handleTestPing}
                    disabled={isPinging}
                    className="text-[#005126] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Activity className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? 'فحص...' : 'فحص الاتصال'}</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Cryptographic Specs */}
              <div className="bg-white p-5 rounded-2xl border border-[#becabd] shadow-xs space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-[#505f76] font-semibold block">معيار التشفير والتوقيع</span>
                  <span className="w-full block text-center px-2.5 py-1 bg-gray-100 text-[#191c1e] text-[11px] font-bold rounded-xl font-mono">
                    ECDSA / SHA-256
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#191c1e] font-bold text-sm pt-1 border-t border-[#eceef0]">
                  <Lock className="w-4 h-4 text-[#005126]" />
                  <span>secp256k1 Curve</span>
                </div>
                <p className="text-[11px] text-[#505f76]">تشفير متوافق 100% مع معايير ZATCA Phase 2</p>
              </div>

              {/* Card 4: Stats */}
              <div className="bg-white p-5 rounded-2xl border border-[#becabd] shadow-xs space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-[#505f76] font-semibold block">إحصائيات الفواتير</span>
                  <span
                    className={`w-full block text-center px-2.5 py-1 text-[11px] font-bold rounded-xl ${
                      totalInvoices === 0
                        ? 'bg-gray-100 text-gray-700'
                        : acceptanceRate === 100
                        ? 'bg-[#006c35]/10 text-[#005126]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {totalInvoices === 0 ? 'لا توجد فواتير' : `معدل القبول ${acceptanceRate}%`}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold pt-1 border-t border-[#eceef0]">
                  <div className="text-[#005126]">
                    <span className="font-currency font-black text-sm">{zatcaStats.cleared}</span> معتمدة
                  </div>
                  <div className="text-amber-700">
                    <span className="font-currency font-black text-sm">{zatcaStats.pending}</span> بالانتظار
                  </div>
                  <div className="text-red-700">
                    <span className="font-currency font-black text-sm">{zatcaStats.failed}</span> مرفوضة
                  </div>
                </div>
                <p className="text-[11px] text-[#505f76]">
                  {totalInvoices === 0
                    ? 'سجل الفواتير فارغ حالياً'
                    : zatcaStats.pending > 0
                    ? `${zatcaStats.pending} فواتير بانتظار الربط والاعتماد`
                    : 'جميع الفواتير معتمدة ومختومة رسمياً'}
                </p>
              </div>
            </div>

            {/* EGS Registered Device Specs */}
            {zatcaConfig?.isOnboarded && (
              <div className="bg-white p-5 rounded-2xl border border-[#becabd] shadow-xs space-y-4 text-xs">
                <h3 className="font-bold text-sm text-[#191c1e] flex items-center gap-2 border-b border-[#eceef0] pb-3">
                  <Terminal className="w-4 h-4 text-[#005126]" />
                  <span>معلومات وحدة الحل المعتمدة لدى هيئة الزكاة (EGS Device Specs):</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[#505f76] block mb-1">الرقم التسلسلي للجهاز (EGS Serial):</span>
                    <span className="font-mono text-[11px] font-bold text-[#191c1e] block truncate">
                      {zatcaConfig.egsSerialNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#505f76] block mb-1">معرف وحدة الحل (UUID):</span>
                    <span className="font-mono text-[11px] text-[#505f76] block truncate">
                      {zatcaConfig.egsUuid}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#505f76] block mb-1">تاريخ الاعتماد:</span>
                    <span className="font-bold text-[#005126]">
                      {zatcaConfig.onboardedAt ? new Date(zatcaConfig.onboardedAt).toLocaleDateString('ar-SA') : 'معتمد'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#505f76] block mb-1">صلاحية الشهادة:</span>
                    <span className="font-bold text-[#0062a1] font-mono">
                      {zatcaConfig.csidExpiryDate || 'سنة كاملة'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Logs Table */}
        <div className="bg-white border border-[#becabd] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 bg-[#f7f9fb] border-b border-[#becabd] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-sm text-[#191c1e] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#005126]" />
                <span>سجل العمليات والطلبات المتزامنة</span>
              </h3>
              <p className="text-xs text-[#505f76] mt-0.5">
                اضغط على أي عملية لاستعراض تفاصيل البيانات والبصمة الرقمية والتوقيع المشفر
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#505f76] font-semibold">
                إجمالي السجلات: {logs.length}
              </span>
              {onClearLogs && logs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="px-3 py-1 bg-[#fff8f6] border border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  مسح السجلات
                </button>
              )}
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#505f76] space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-gray-400" />
              <p className="font-bold text-gray-700">لا توجد سجلات بعد</p>
              <p>ستظهر هنا جميع عمليات الإرسال والاعتماد التلقائي للفواتير مع هيئة الزكاة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-[#f2f4f6] border-b border-[#becabd]">
                  <tr>
                    <th className="p-3.5 text-[#3f4940] font-semibold">رقم الفاتورة</th>
                    <th className="p-3.5 text-[#3f4940] font-semibold">وقت المعالجة</th>
                    <th className="p-3.5 text-[#3f4940] font-semibold">الحالة ورمز الاستجابة</th>
                    <th className="p-3.5 text-[#3f4940] font-semibold">تفاصيل الاستجابة (ZATCA Response)</th>
                    <th className="p-3.5 text-[#3f4940] font-semibold">بصمة الفاتورة (SHA-256)</th>
                    <th className="p-3.5 text-[#3f4940] font-semibold text-center">زمن المعالجة</th>
                    <th className="p-3.5 text-[#3f4940] font-semibold text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[#f7f9fb] transition-colors cursor-pointer"
                    >
                      <td className="p-3.5 font-bold font-currency text-[#005126]">{log.invoiceNumber}</td>
                      <td className="p-3.5 font-currency text-[#505f76]">{log.timestamp}</td>
                      <td className="p-3.5">
                        {log.status === 'cleared' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#006c35]/15 text-[#005126] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            HTTP {log.statusCode} (Cleared)
                          </span>
                        ) : log.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            HTTP {log.statusCode} (Queued)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            HTTP {log.statusCode} (Failed)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#191c1e] font-medium max-w-xs truncate">{log.message}</td>
                      <td className="p-3.5 font-mono text-gray-400 text-[10px] truncate max-w-[140px] dir-ltr text-left">
                        {log.hash}
                      </td>
                      <td className="p-3.5 font-currency text-center text-[#505f76]">
                        {log.durationMs > 0 ? `${log.durationMs} ms` : '-'}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 bg-[#f0f3f6] hover:bg-[#e0e3e5] text-[#191c1e] font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#becabd] flex flex-col overflow-hidden text-right">
            <div className="p-5 bg-[#005126] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  تفاصيل تدقيق اعتماد الفاتورة: {selectedLog.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#f7f9fb] p-3.5 rounded-xl border border-[#becabd]">
                <div>
                  <span className="text-[#505f76] block mb-1">حالة الرد من المنصة:</span>
                  <span
                    className={`font-bold ${
                      selectedLog.status === 'cleared'
                        ? 'text-[#005126]'
                        : selectedLog.status === 'pending'
                        ? 'text-amber-700'
                        : 'text-red-600'
                    }`}
                  >
                    HTTP {selectedLog.statusCode} ({selectedLog.status.toUpperCase()})
                  </span>
                </div>
                <div>
                  <span className="text-[#505f76] block mb-1">وقت وتاريخ الإرسال:</span>
                  <span className="font-currency font-semibold text-[#191c1e]">{selectedLog.timestamp}</span>
                </div>
              </div>

              <div>
                <span className="text-[#505f76] font-semibold block mb-1">رسالة الاستجابة الرسمية:</span>
                <div className="p-3 bg-[#f2f4f6] rounded-xl text-[#191c1e] leading-relaxed border border-[#eceef0]">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.hash && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#505f76] font-semibold">بصمة الفاتورة التشفيرية (Invoice Hash SHA-256):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedLog.hash || '', 'hash')}
                      className="text-[#005126] font-bold flex items-center gap-1 hover:underline text-[11px]"
                    >
                      {copiedField === 'hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'hash' ? 'تم النسخ' : 'نسخ البصمة'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-[#191c1e] text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto text-left dir-ltr">
                    {selectedLog.hash}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#f7f9fb] border-t border-[#becabd] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
