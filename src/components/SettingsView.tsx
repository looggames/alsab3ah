import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import {
  Building2,
  Save,
  Key,
  ShieldCheck,
  CheckCircle2,
  Globe,
  FileText,
  Sparkles,
  Server,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  BadgeCheck,
} from 'lucide-react';
import {
  normalizeSaudiTaxNumber,
  normalizeSaudiCrNumber,
  verifyZatcaTaxpayerApi,
  ZatcaTaxpayerLookupResult,
} from '../utils/zatca';

interface SettingsViewProps {
  profile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
  onClearAllData?: () => Promise<void>;
  onOpenZatcaWizard?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onSaveProfile, onOpenZatcaWizard }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ZATCA / Wathq API Verification States
  const [lookupQuery, setLookupQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ZatcaTaxpayerLookupResult | null>(null);
  const [showLookupBox, setShowLookupBox] = useState(false);

  const taxNorm = normalizeSaudiTaxNumber(formData.taxNumber);
  const crNorm = normalizeSaudiCrNumber(formData.crNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure 15-digit VAT number is saved if 10-digit TIN was entered
    const finalProfile: CompanyProfile = {
      ...formData,
      taxNumber: taxNorm.isValid ? taxNorm.vatNumber : formData.taxNumber,
    };
    onSaveProfile(finalProfile);
    setFormData(finalProfile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunLookup = async (overrideQuery?: string) => {
    const query = (overrideQuery || lookupQuery || formData.taxNumber || formData.crNumber || formData.nameAr).trim();
    if (!query) return;

    setIsVerifying(true);
    try {
      const res = await verifyZatcaTaxpayerApi(query, formData.nameAr);
      setVerificationResult(res);
    } catch (err) {
      setVerificationResult({
        success: false,
        message: 'حدث خطأ أثناء فحص السجل مع خوادم الهيئة.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const applyVerifiedDataToForm = (data: NonNullable<ZatcaTaxpayerLookupResult['data']>) => {
    setFormData((prev) => ({
      ...prev,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      taxNumber: data.vatNumber,
      crNumber: data.crNumber,
      city: data.city,
      streetName: data.street,
      district: data.district,
      buildingNumber: data.buildingNumber,
      postalCode: data.postalCode,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const isOnboarded = profile.zatcaConfig?.isOnboarded || profile.csidStatus === 'active';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Live ZATCA Verification Box */}
        {showLookupBox && (
          <div className="bg-white p-6 rounded-2xl border-2 border-[#005126]/30 shadow-md space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-start justify-between gap-4 border-b border-[#eceef0] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-[#005126]" />
                  <h3 className="font-bold text-sm md:text-base text-[#191c1e]">
                    الاستعلام المباشر والتحقق من المكلفين (ZATCA & Wathq API)
                  </h3>
                </div>
                <p className="text-xs text-[#505f76] mt-1">
                  يمكنك الاستعلام عبر الرقم الضريبي المميز (10 خانات)، الرقم الضريبي (15 خانة)، أو السجل التجاري / 700.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLookupBox(false)}
                className="text-xs text-[#505f76] hover:text-black font-bold px-2 py-1 bg-gray-100 rounded-lg cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {/* Quick Demo Pre-fills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[#505f76] font-semibold">أمثلة سريعة للفحص:</span>
              <button
                type="button"
                onClick={() => {
                  setLookupQuery('300000000000003');
                  handleRunLookup('300000000000003');
                }}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#005126] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                رقم ضريبي قياسي (15 خانة)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLookupQuery('3109876543');
                  handleRunLookup('3109876543');
                }}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                رقم مميز (10 خانات)
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="أدخل الرقم المميز (TIN: 10 أرقام)، الرقم الضريبي (15 رقماً)، أو رقم السجل/700..."
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunLookup()}
                  className="w-full pr-10 pl-4 py-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl text-xs font-semibold outline-none focus:border-[#005126]"
                />
                <Search className="w-4 h-4 text-[#505f76] absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleRunLookup()}
                className="px-6 py-2.5 bg-[#005126] hover:bg-[#006c35] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الاستعلام...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    <span>فحص واعتماد</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Card */}
            {verificationResult && (
              <div className={`p-4 rounded-xl border ${verificationResult.success ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                {verificationResult.success && verificationResult.data ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{verificationResult.message}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                        {verificationResult.data.vatStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-emerald-100 text-xs">
                      <div>
                        <span className="text-gray-500 block text-[10px]">اسم المنشأة المعتمد:</span>
                        <span className="font-bold text-gray-900">{verificationResult.data.nameAr}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">الرقم الضريبي الرسمي (15 خانة):</span>
                        <span className="font-bold text-[#005126] font-currency">{verificationResult.data.vatNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">الرقم المميز (TIN 10 أرقام):</span>
                        <span className="font-bold text-gray-800 font-currency">{verificationResult.data.tin}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">السجل / الرقم الموحد (700):</span>
                        <span className="font-bold text-gray-800 font-currency">{verificationResult.data.crNumber}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => applyVerifiedDataToForm(verificationResult.data!)}
                        className="px-4 py-2 bg-[#005126] text-white hover:bg-[#006c35] text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>تطبيق هذه البيانات الرسمية على إعدادات المنشأة الآن</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{verificationResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ZATCA Onboarding Callout Banner */}
        <div className="bg-gradient-to-l from-[#005126] to-[#006c35] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <h3 className="text-base font-bold">الربط المباشر مع هيئة الزكاة والضريبة والجمارك (فاتورة)</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOnboarded ? 'bg-white/20 text-white' : 'bg-amber-400 text-amber-950'}`}>
                {isOnboarded ? 'شهادة الإنتاج CSID مفعلة' : 'بانتظار التهيئة والربط'}
              </span>
            </div>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              قم بتهيئة وحدة الفوترة (EGS)، وتوليد المفاتيح المشفرة (ECDSA secp256k1) وإدخال رمز التحقق OTP من منصة فاتورة لاعتماد الفواتير إلكترونياً.
            </p>
          </div>

          {onOpenZatcaWizard && (
            <button
              type="button"
              onClick={onOpenZatcaWizard}
              className="px-6 py-3 bg-white text-[#005126] hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2 shrink-0 cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-[#006c35]" />
              <span>{isOnboarded ? 'إعادة ضبط معالج الربط (ZATCA Wizard)' : 'بدء معالج الربط الآن'}</span>
            </button>
          )}
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Legal Company Identity */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#005126]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    بيانات المنشأة القانونية
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    المعلومات الرسمية المعتمدة لدى وزارة التجارة وهيئة الزكاة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowLookupBox(true);
                  if (formData.taxNumber || formData.crNumber) {
                    setLookupQuery(formData.taxNumber || formData.crNumber);
                    handleRunLookup(formData.taxNumber || formData.crNumber);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#005126] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-200/60"
              >
                <Search className="w-3.5 h-3.5" />
                <span>التحقق من الهيئة</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">اسم المنشأة باللغة العربية *</label>
                <input
                  type="text"
                  required
                  value={formData.nameAr}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData({
                      ...formData,
                      nameAr: newName,
                      branchName: formData.branchName || newName,
                      cashierName: formData.cashierName || newName,
                    });
                  }}
                  placeholder="مثال: شركة الأعمال التجارية المحدودة"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-semibold text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">اسم المنشأة باللغة الإنجليزية</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="e.g. Commercial Business Co."
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-currency text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  اسم الفرع (الافتراضي: اسم المنشأة) *
                </label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder={formData.nameAr || 'الفرع الرئيسي'}
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-semibold text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  اسم الكاشير / المسؤول (الافتراضي: اسم المنشأة) *
                </label>
                <input
                  type="text"
                  value={formData.cashierName || ''}
                  onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                  placeholder={formData.nameAr || 'الكاشير'}
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-semibold text-slate-900 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-bold">
                    الرقم الضريبي للمنشأة (TIN 10 أرقام أو VAT 15 رقماً) *
                  </label>
                  {taxNorm.is10DigitTin && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      رقم مميز (10 خانات)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={18}
                  placeholder="300000000000003 أو 3101234567"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-currency font-bold text-[#005126] transition-all"
                />
                {taxNorm.isValid ? (
                  <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {taxNorm.is10DigitTin
                        ? `تم توليد الرقم الضريبي 15 خانة لـ ZATCA: (${taxNorm.vatNumber})`
                        : `رقم ضريبي رسمي معتمد: ${taxNorm.vatNumber}`}
                    </span>
                  </p>
                ) : formData.taxNumber ? (
                  <p className="text-[11px] text-amber-700 mt-1">{taxNorm.message}</p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-bold">رقم السجل التجاري (CR) أو الرقم الوطني الموحد (700) *</label>
                  {crNorm.isUnified700 && (
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-md">
                      الرقم الوطني الموحد 700
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="مثال: 1010000000 أو 7000000000"
                  value={formData.crNumber}
                  onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-currency font-semibold text-slate-900 transition-all"
                />
                {crNorm.isValid && (
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    {crNorm.typeLabel}: <span className="font-bold font-currency text-slate-900">{crNorm.crNumber}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. National Address (Saudi Post / SPL) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#005126]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    العنوان الوطني ومعلومات التواصل
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    مطلوب لاكتمال متطلبات الفوترة الإلكترونية الرسمية
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">المدينة *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="الرياض"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">الحي</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="حي العليا"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">اسم الشارع</label>
                <input
                  type="text"
                  value={formData.streetName}
                  onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                  placeholder="طريق الملك فهد"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">رقم المبنى</label>
                <input
                  type="text"
                  value={formData.buildingNumber}
                  onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
                  placeholder="1234"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-currency text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">الرمز البريدي</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="12211"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-currency text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">رقم الهاتف للتواصل</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0500000000"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-slate-300 rounded-xl outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-currency text-slate-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. ZATCA Compliance & Rates */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#005126]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    إعدادات ضريبة القيمة المضافة والربط الفعلي
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تخصيص نسبة الضريبة المطبقة وحالة الاعتماد مع منصة فاتورة
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#005126] border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#005126] animate-pulse"></span>
                ZATCA Phase 2
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* VAT Rate Selection */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    نسبة ضريبة القيمة المضافة الافتراضية
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[#005126] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {Math.round((formData.defaultVatRate ?? 0.15) * 1000) / 10}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultVatRate: 0.15 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      Math.round((formData.defaultVatRate ?? 0.15) * 100) === 15
                        ? 'border-[#005126] bg-[#005126] text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>15%</span>
                    <span className={`text-[10px] font-normal ${Math.round((formData.defaultVatRate ?? 0.15) * 100) === 15 ? 'text-emerald-100' : 'text-slate-500'}`}>الأساسية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultVatRate: 0.05 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      Math.round((formData.defaultVatRate ?? 0.15) * 100) === 5
                        ? 'border-[#005126] bg-[#005126] text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>5%</span>
                    <span className={`text-[10px] font-normal ${Math.round((formData.defaultVatRate ?? 0.15) * 100) === 5 ? 'text-emerald-100' : 'text-slate-500'}`}>المخفضة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultVatRate: 0 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      (formData.defaultVatRate ?? 0.15) === 0
                        ? 'border-[#005126] bg-[#005126] text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>0%</span>
                    <span className={`text-[10px] font-normal ${(formData.defaultVatRate ?? 0.15) === 0 ? 'text-emerald-100' : 'text-slate-500'}`}>معفى / تصدير</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2.5">
                  <span className="text-[11px] text-slate-600 font-medium shrink-0">أو حدد نسبة مخصصة:</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={Math.round((formData.defaultVatRate ?? 0.15) * 1000) / 10}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const rate = isNaN(val) ? 0 : Math.max(0, Math.min(100, val)) / 100;
                        setFormData({ ...formData, defaultVatRate: rate });
                      }}
                      className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#005126] focus:ring-1 focus:ring-[#005126] font-currency text-xs font-bold text-slate-900 pl-7"
                      placeholder="15"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Production Live Connection Status */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800 text-xs">
                      وضع الربط مع منصة فاتورة
                    </label>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isOnboarded 
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnboarded ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                      {isOnboarded ? 'شهادة الإنتاج CSID نشطة' : 'بانتظار رمز OTP'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#005126]"></div>
                      <span className="font-extrabold text-xs text-[#005126]">
                        Production Live (الربط الفعلي المعتمد)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      يتم إرسال واعتماد الفواتير مباشرة عبر خوادم الإنتاج الرسمية لهيئة الزكاة والضريبة والجمارك.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {isOnboarded ? 'الربط مفعّل ومكتمل بنجاح' : 'يلزم إدخال رمز التحقق OTP لإكمال الربط'}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenZatcaWizard}
                    className="text-xs font-bold text-[#005126] hover:text-[#00602d] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{isOnboarded ? 'إدارة شهادة CSID' : 'بدء معالج الربط الآن'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between gap-4">
            {savedSuccess ? (
              <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#006c35]/15 text-[#005126] rounded-xl text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ الإعدادات بنجاح</span>
              </div>
            ) : <div />}

            <button
              type="submit"
              className="px-8 py-3 bg-[#005126] text-white font-bold text-sm rounded-xl hover:bg-[#006c35] active:scale-[0.98] transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ جميع التغييرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

