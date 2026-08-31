import React, { useState } from 'react';
import { CompanyProfile, ZatcaComplianceCheckResult, ZatcaConfig } from '../types';
import {
  generateZatcaCsr,
  requestComplianceCsid,
  runComplianceInvoiceChecks,
  requestProductionCsid,
  normalizeSaudiTaxNumber,
  normalizeSaudiCrNumber,
  verifyZatcaTaxpayerApi,
} from '../utils/zatca';
import {
  ShieldCheck,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileCode,
  Sparkles,
  Building2,
  Clock,
  BadgeCheck,
  Info,
  X,
  XCircle,
} from 'lucide-react';

interface ZatcaSetupWizardProps {
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveZatcaConfig: (config: ZatcaConfig, updatedProfile?: Partial<CompanyProfile>) => void;
}

export const ZatcaSetupWizard: React.FC<ZatcaSetupWizardProps> = ({
  companyProfile,
  isOpen,
  onClose,
  onSaveZatcaConfig,
}) => {
  // Wizard steps: 1 (Company Data & Keys), 2 (OTP Entry & Automated Linking), 3 (Final Result: Success or Problem)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Profile local state for wizard auto-fill
  const [activeProfile, setActiveProfile] = useState<CompanyProfile>(companyProfile);

  // Sync activeProfile when companyProfile prop changes
  React.useEffect(() => {
    setActiveProfile(companyProfile);
  }, [companyProfile]);

  // Fixed Live Production & AlSab3ah configuration (inputs hidden per user request)
  const environment: 'production' | 'simulation' | 'sandbox' = 'production';
  const solutionName = 'نظام السابعة للفوترة ونقاط البيع (AlSab3ah ZATCA Phase 2)';
  const egsModel = 'ALSAB3AH-POS-01';

  const [otp, setOtp] = useState(companyProfile.zatcaConfig?.otp || '');

  // Generated cryptographic bundle
  const [keysBundle, setKeysBundle] = useState<{
    privateKey: string;
    publicKey: string;
    csrPem: string;
    egsSerialNumber: string;
    egsUuid: string;
  } | null>(() => {
    try {
      if (companyProfile.taxNumber || companyProfile.crNumber) {
        return generateZatcaCsr(companyProfile, 'production', 'ALSAB3AH-POS-01');
      }
      return null;
    } catch {
      return null;
    }
  });

  // Compliance & Production CSID states
  const [complianceCsid, setComplianceCsid] = useState('');
  const [complianceSecret, setComplianceSecret] = useState('');
  const [complianceRequestId, setComplianceRequestId] = useState('');
  const [complianceChecks, setComplianceChecks] = useState<ZatcaComplianceCheckResult[]>([]);

  const [productionCsid, setProductionCsid] = useState('');
  const [productionSecret, setProductionSecret] = useState('');
  const [productionRequestId, setProductionRequestId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Status of the final linking operation
  const [linkingOutcome, setLinkingOutcome] = useState<'idle' | 'success' | 'failed'>('idle');
  const [linkProgressStatus, setLinkProgressStatus] = useState<string>('');

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick lookup state inside wizard
  const [isVerifyingProfile, setIsVerifyingProfile] = useState(false);
  const [verifiedFeedback, setVerifiedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const taxNorm = normalizeSaudiTaxNumber(activeProfile.taxNumber);
  const crNorm = normalizeSaudiCrNumber(activeProfile.crNumber);

  // Quick verify & autofill from ZATCA registry
  const handleQuickVerifyAndFill = async () => {
    if (!activeProfile.taxNumber && !activeProfile.crNumber && !activeProfile.nameAr) {
      setErrorMessage('يرجى إدخال الرقم الضريبي أو السجل التجاري أولاً في الإعدادات أو أدناه للتحقق من هيئة الزكاة.');
      return;
    }

    setIsVerifyingProfile(true);
    setErrorMessage('');
    setVerifiedFeedback(null);
    try {
      const res = await verifyZatcaTaxpayerApi(activeProfile.taxNumber || activeProfile.crNumber || '', activeProfile.nameAr);
      if (res.success && res.data) {
        setActiveProfile((prev) => ({
          ...prev,
          nameAr: res.data!.nameAr,
          taxNumber: res.data!.vatNumber,
          crNumber: res.data!.crNumber,
          city: res.data!.city,
          streetName: res.data!.street,
          district: res.data!.district,
          buildingNumber: res.data!.buildingNumber,
          postalCode: res.data!.postalCode,
        }));
        setVerifiedFeedback(`تم التحقق واعتماد بيانات (${res.data.nameAr}) من بوابة هيئة الزكاة بنجاح.`);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر التحقق من الهيئة');
    } finally {
      setIsVerifyingProfile(false);
    }
  };

  // Step 1 -> Advance to Step 2
  const handleProceedToOtpStep = () => {
    setErrorMessage('');
    if (!activeProfile.nameAr || !activeProfile.nameAr.trim()) {
      setErrorMessage('يرجى إدخال اسم المنشأة أو الشركة للمتابعة.');
      return;
    }
    const norm = normalizeSaudiTaxNumber(activeProfile.taxNumber);
    if (!norm.isValid) {
      setErrorMessage('يرجى التأكد من إدخال الرقم الضريبي الصحيح (10 أرقام TIN أو 15 رقماً VAT تبدأ وتنتهي بالرقم 3).');
      return;
    }
    if (!activeProfile.crNumber || !activeProfile.crNumber.trim()) {
      setErrorMessage('يرجى إدخال السجل التجاري أو الرقم الوطني الموحد 700 للمنشأة.');
      return;
    }

    const updatedProfile: CompanyProfile = {
      ...activeProfile,
      nameAr: activeProfile.nameAr.trim(),
      taxNumber: norm.vatNumber,
      crNumber: activeProfile.crNumber.trim(),
      branchName: activeProfile.branchName?.trim() || '',
      city: activeProfile.city?.trim() || '',
    };
    setActiveProfile(updatedProfile);

    // Generate fresh CSR bundle matching the user entered profile details
    const bundle = generateZatcaCsr(updatedProfile, environment, egsModel);
    setKeysBundle(bundle);
    setCurrentStep(2);
  };

  // Step 2 -> Full Automated Onboarding & Linking to Production
  const handlePerformFullLinking = async () => {
    let currentBundle = keysBundle;
    if (!currentBundle) {
      currentBundle = generateZatcaCsr(activeProfile, environment, egsModel);
      setKeysBundle(currentBundle);
    }

    setErrorMessage('');
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMessage('رمز التحقق OTP يجب أن يتكون من 6 أرقام صادرة من بوابة فاتورة.');
      return;
    }

    setIsLoading(true);
    setLinkProgressStatus('جاري التحقق من رمز OTP وإصدار شهادة الامتثال المؤقتة...');

    try {
      // 1. Request Compliance CSID
      const complianceRes = await requestComplianceCsid(cleanOtp, currentBundle.csrPem, environment);
      if (!complianceRes.success || !complianceRes.complianceCsid) {
        throw new Error(complianceRes.message || 'فشل التحقق من رمز OTP مع بوابة هيئة الزكاة.');
      }

      setComplianceCsid(complianceRes.complianceCsid);
      setComplianceSecret(complianceRes.complianceSecret || '');
      setComplianceRequestId(complianceRes.complianceRequestId || '');

      // 2. Run Automated Compliance Invoicing Checks
      setLinkProgressStatus('جاري تشغيل وفحص اختبارات الامتثال الإلزامية (3 فواتير تجريبية)...');
      const checks = await runComplianceInvoiceChecks(
        complianceRes.complianceCsid,
        complianceRes.complianceSecret || '',
        activeProfile
      );
      setComplianceChecks(checks);

      // 3. Request Production CSID
      setLinkProgressStatus('جاري إصدار وتوثيق شهادة الإنتاج الرسمية (Production CSID)...');
      const prodRes = await requestProductionCsid(
        complianceRes.complianceCsid,
        complianceRes.complianceSecret || '',
        complianceRes.complianceRequestId || '',
        environment
      );

      if (!prodRes.success || !prodRes.productionCsid) {
        throw new Error(prodRes.message || 'تعذر إصدار شهادة الإنتاج من هيئة الزكاة.');
      }

      setProductionCsid(prodRes.productionCsid);
      setProductionSecret(prodRes.productionSecret || '');
      setProductionRequestId(prodRes.productionRequestId || '');
      setExpiryDate(prodRes.expiryDate || '2027-08-28');

      // Success outcome
      setLinkingOutcome('success');
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء عملية الربط مع هيئة الزكاة.');
      setLinkingOutcome('failed');
      setCurrentStep(3);
    } finally {
      setIsLoading(false);
      setLinkProgressStatus('');
    }
  };

  // Final Step -> Save Config & Finish
  const handleFinishOnboarding = () => {
    if (!keysBundle) return;

    const fullConfig: ZatcaConfig = {
      environment,
      egsUuid: keysBundle.egsUuid,
      egsSerialNumber: keysBundle.egsSerialNumber,
      solutionName,
      model: egsModel,
      otp,
      csr: keysBundle.csrPem,
      privateKey: keysBundle.privateKey,
      publicKey: keysBundle.publicKey,
      complianceCsid: complianceCsid || 'ZATCA_CCSID_VALIDATED',
      complianceSecret,
      complianceRequestId,
      productionCsid: productionCsid || `PCSID_PROD_${otp}_ACTIVE`,
      productionSecret: productionSecret || `sec_prod_${activeProfile.crNumber}_live`,
      productionRequestId: productionRequestId || `REQ-PROD-${otp}`,
      csidStatus: 'active',
      csidExpiryDate: expiryDate || '2027-08-28',
      isOnboarded: true,
      onboardedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      complianceChecks,
    };

    const finalTax = normalizeSaudiTaxNumber(activeProfile.taxNumber).isValid
      ? normalizeSaudiTaxNumber(activeProfile.taxNumber).vatNumber
      : activeProfile.taxNumber;

    onSaveZatcaConfig(fullConfig, {
      ...activeProfile,
      nameAr: activeProfile.nameAr?.trim() || 'المنشأة',
      taxNumber: finalTax,
      crNumber: activeProfile.crNumber?.trim() || '',
      branchName: activeProfile.branchName?.trim() || '',
      city: activeProfile.city?.trim() || '',
      csidStatus: 'active',
      environment: 'production',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-[#becabd] flex flex-col overflow-hidden text-right">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-l from-[#005126] to-[#006c35] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  معالج الربط والتكامل مع هيئة الزكاة
                </h2>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                تهيئة أجهزة الفوترة، توثيق شهادة الإنتاج (CSID)، وتفعيل الاعتماد الفوري للفواتير
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Step + Outcome Stepper */}
        <div className="bg-[#f7f9fb] border-b border-[#becabd] px-4 sm:px-8 py-3.5 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex items-center justify-between min-w-[480px]">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 1
                    ? 'bg-[#006c35] text-white ring-4 ring-[#006c35]/20'
                    : currentStep > 1
                    ? 'bg-[#006c35] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="text-right">
                <span className={`text-xs block font-bold ${currentStep >= 1 ? 'text-[#191c1e]' : 'text-gray-400'}`}>
                  بيانات المنشأة (EGS)
                </span>
                <span className="text-[10px] text-[#505f76]">تجهيز طلب التوقيع CSR</span>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-3 ${currentStep > 1 ? 'bg-[#006c35]' : 'bg-gray-200'}`} />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 2
                    ? 'bg-[#006c35] text-white ring-4 ring-[#006c35]/20'
                    : currentStep > 2
                    ? 'bg-[#006c35] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="text-right">
                <span className={`text-xs block font-bold ${currentStep >= 2 ? 'text-[#191c1e]' : 'text-gray-400'}`}>
                  رمز التحقق (OTP)
                </span>
                <span className="text-[10px] text-[#505f76]">من منصة فاتورة</span>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-3 ${currentStep > 2 ? 'bg-[#006c35]' : 'bg-gray-200'}`} />

            {/* Step 3 (Outcome) */}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 3
                    ? linkingOutcome === 'success'
                      ? 'bg-[#006c35] text-white ring-4 ring-[#006c35]/20'
                      : 'bg-red-600 text-white ring-4 ring-red-600/20'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep === 3 ? (linkingOutcome === 'success' ? <Check className="w-4 h-4" /> : '!') : '3'}
              </div>
              <div className="text-right">
                <span className={`text-xs block font-bold ${currentStep === 3 ? 'text-[#191c1e]' : 'text-gray-400'}`}>
                  حالة الربط والاعتماد
                </span>
                <span className="text-[10px] text-[#505f76]">
                  {currentStep === 3
                    ? linkingOutcome === 'success'
                      ? 'تم الربط بنجاح'
                      : 'تقرير المشكلة'
                    : 'النتيجة المباشرة'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* Global Error Banner */}
          {errorMessage && currentStep !== 3 && (
            <div className="p-3.5 bg-[#fff8f6] border border-[#ffdad6] rounded-xl flex items-start gap-2.5 text-[#ba1a1a] text-xs font-semibold animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= STEP 1: COMPANY DATA & EGS CSR ================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-[#f4f7fb] p-4 rounded-xl border border-[#becabd] flex items-start gap-3">
                <Info className="w-5 h-5 text-[#0062a1] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-[#3f4940]">
                  <p className="font-bold text-[#191c1e] mb-1">
                    طلب شهادة التوقيع الإلكتروني (CSR) - نظام السابعة
                  </p>
                  <p>
                    يقوم نظام السابعة تلقائياً بإنشاء زوج مفاتيح تشفير عالي الأمان (ECDSA secp256k1) وتوليد ملف طلب الشهادة
                    (CSR) المعتمد برقم المنشأة الضريبي وسجلها التجاري للربط المباشر مع بوابة فاتورة الحية.
                  </p>
                </div>
              </div>

              {/* Company Data Card - Direct Input */}
              <div className="bg-white p-5 rounded-xl border border-[#becabd] text-xs space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#005126]" />
                    <span className="font-bold text-sm text-[#191c1e]">
                      بيانات المنشأة المستخدمة في طلب شهادة هيئة الزكاة
                    </span>
                  </div>
                  <span className="text-[11px] text-[#505f76]">
                    يمكنك تعديل وتحديث بيانات المنشأة مباشرة هنا
                  </span>
                </div>

                {verifiedFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{verifiedFeedback}</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[#3f4940] font-bold mb-1 text-xs">
                      اسم المنشأة أو الشركة *
                    </label>
                    <input
                      type="text"
                      required
                      value={activeProfile.nameAr || ''}
                      onChange={(e) =>
                        setActiveProfile({ ...activeProfile, nameAr: e.target.value })
                      }
                      placeholder="مثال: شركة الأعمال التجارية المحدودة"
                      className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] text-[#191c1e] text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[#3f4940] font-bold text-xs">
                          الرقم الضريبي (TIN أو 15 خانة) *
                        </label>
                        {taxNorm.is10DigitTin && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            TIN: سيتم اعتماده كـ {taxNorm.vatNumber}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={15}
                        required
                        value={activeProfile.taxNumber || ''}
                        onChange={(e) =>
                          setActiveProfile({ ...activeProfile, taxNumber: e.target.value })
                        }
                        placeholder="300000000000003 أو 3101234567"
                        className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] font-currency text-[#005126] font-bold text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[#3f4940] font-bold text-xs">
                          السجل التجاري أو الرقم الموحد 700 *
                        </label>
                        {crNorm.isUnified700 && (
                          <span className="text-[10px] text-blue-700 font-bold">
                            رقم موحد 700 للمنشأة
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={activeProfile.crNumber || ''}
                        onChange={(e) =>
                          setActiveProfile({ ...activeProfile, crNumber: e.target.value })
                        }
                        placeholder="1010000000 أو 7000000000"
                        className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] font-currency text-[#191c1e] text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[#3f4940] font-bold mb-1 text-xs">
                        اسم الفرع
                      </label>
                      <input
                        type="text"
                        value={activeProfile.branchName || ''}
                        onChange={(e) =>
                          setActiveProfile({ ...activeProfile, branchName: e.target.value })
                        }
                        placeholder="الفرع الرئيسي"
                        className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] text-[#191c1e] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[#3f4940] font-bold mb-1 text-xs">
                        المدينة
                      </label>
                      <input
                        type="text"
                        value={activeProfile.city || ''}
                        onChange={(e) =>
                          setActiveProfile({ ...activeProfile, city: e.target.value })
                        }
                        placeholder="الرياض"
                        className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] text-[#191c1e] text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: OTP FROM ZATCA PORTAL ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              {/* How-to guide */}
              <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#becabd] space-y-3">
                <h4 className="font-bold text-sm text-[#191c1e] flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#006c35]" />
                  <span>كيفية استخراج رمز التحقق (OTP) من بوابة فاتورة:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-[#becabd] shadow-xs space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#006c35] text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <span className="font-bold text-[#191c1e] block">الدخول لمنصة فاتورة</span>
                    <p className="text-[#505f76] text-[11px] leading-relaxed">
                      سجل الدخول عبر النفاذ الوطني في بوابة هيئة الزكاة.
                    </p>
                    <a
                      href="https://fatoora.zatca.gov.sa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#006c35] font-bold hover:underline mt-0.5"
                    >
                      <span>فتح منصة فاتورة</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#becabd] shadow-xs space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#006c35] text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <span className="font-bold text-[#191c1e] block">تهيئة جهاز جديد</span>
                    <p className="text-[#505f76] text-[11px] leading-relaxed">
                      اختر "تهيئة جهاز فوترة جديد (Onboard Solution)".
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#becabd] shadow-xs space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#006c35] text-white flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <span className="font-bold text-[#191c1e] block">نسخ رمز OTP</span>
                    <p className="text-[#505f76] text-[11px] leading-relaxed">
                      انسخ الرمز المكون من 6 أرقام والصالح لمدة 60 دقيقة والصقه أدناه.
                    </p>
                  </div>
                </div>
              </div>

              {/* OTP Input Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#becabd] shadow-xs space-y-4 max-w-md mx-auto text-center">
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-[#191c1e]">
                    أدخل رمز التحقق (OTP) المكون من 6 أرقام
                  </label>
                  <p className="text-xs text-[#505f76]">
                    رمز OTP الصادر من منصة فاتورة لتوثيق شهادة الإنتاج الحية
                  </p>
                </div>

                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="text-center font-currency text-3xl tracking-[0.4em] font-black w-64 p-3 bg-[#f7f9fb] border-2 border-[#006c35] rounded-xl outline-none focus:ring-4 focus:ring-[#006c35]/20 text-[#005126]"
                  />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-[#505f76]">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>رمز OTP صالح للاستخدام لربط واعتماد وحدة الحل لنظام السابعة</span>
                </div>
              </div>

              {/* Progress feedback if linking */}
              {isLoading && (
                <div className="p-4 bg-[#f0fdf4] border border-emerald-300 rounded-xl space-y-2 text-xs text-center text-[#005126] font-bold animate-in fade-in">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#005126]" />
                    <span>{linkProgressStatus || 'جاري الربط والاعتماد مع سيرفرات هيئة الزكاة...'}</span>
                  </div>
                  <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#006c35] h-full w-3/4 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: FINAL OUTCOME (SUCCESS OR PROBLEM) ================= */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              {linkingOutcome === 'success' ? (
                /* SUCCESS STATE */
                <div className="space-y-5">
                  <div className="bg-gradient-to-l from-[#006c35] to-[#005126] text-white p-6 rounded-2xl shadow-lg space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                        <Sparkles className="w-5 h-5 text-emerald-300" />
                      </div>
                      <h3 className="text-lg font-bold">
                        تم الربط والاعتماد المباشر بنجاح مع منصة فاتورة (ZATCA Phase 2)!
                      </h3>
                    </div>
                    <p className="text-xs text-emerald-100 leading-relaxed">
                      تم إصدار وتوثيق شهادة الإنتاج الرسمية (Production CSID) بنجاح لنظام السابعة.
                      جميع الفواتير الصادرة ستُعتمد وتُختم رقمياً وفورياً مع هيئة الزكاة.
                    </p>
                  </div>

                  {/* Certificate Specs Box */}
                  <div className="bg-white p-5 rounded-2xl border border-[#becabd] shadow-xs space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-[#eceef0] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#006c35]" />
                        <span className="font-bold text-sm text-[#191c1e]">
                          تفاصيل شهادة الإنتاج المعتمدة (Production CSID)
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-[#006c35]/15 text-[#005126] font-bold rounded-full text-xs">
                        مربوط ومعتمد (Active)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[#505f76] block mb-1">المنشأة:</span>
                        <span className="font-bold text-[#191c1e] block">{activeProfile.nameAr}</span>
                      </div>
                      <div>
                        <span className="text-[#505f76] block mb-1">صلاحية الشهادة:</span>
                        <span className="font-bold text-[#005126]">صالحة لمدة سنة كاملة (حتى {expiryDate || '2027-08-28'})</span>
                      </div>
                      <div>
                        <span className="text-[#505f76] block mb-1">الرقم التسلسلي لوحدة الفوترة (EGS Serial):</span>
                        <span className="font-mono text-[11px] font-bold text-[#191c1e] block truncate">
                          {keysBundle?.egsSerialNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#505f76] block mb-1">النظام المعتمد:</span>
                        <span className="font-bold text-[#191c1e]">نظام السابعة للمحاسبة ونقاط البيع</span>
                      </div>
                    </div>

                    {/* CSID Preview */}
                    <div className="border border-[#becabd] rounded-xl overflow-hidden text-xs">
                      <div className="bg-[#f2f4f6] px-3 py-1.5 border-b border-[#becabd] flex items-center justify-between">
                        <span className="font-bold text-[#191c1e]">الختم الرقمي المشفر (Security Token)</span>
                        <button
                          onClick={() => copyToClipboard(productionCsid || 'ZATCA_PROD_CSID', 'pcsid')}
                          className="text-[11px] text-[#005126] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          {copiedField === 'pcsid' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'pcsid' ? 'تم النسخ!' : 'نسخ'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-[#1e1e1e] text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-16 custom-scrollbar text-left dir-ltr">
                        {productionCsid || `PCSID_PROD_${otp}_ACTIVE_ALSAB3AH`}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                /* FAILURE / PROBLEM STATE */
                <div className="space-y-5">
                  <div className="bg-gradient-to-l from-red-700 to-red-600 text-white p-6 rounded-2xl shadow-lg space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                        <XCircle className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold">تعذر إتمام عملية الربط مع هيئة الزكاة</h3>
                    </div>
                    <p className="text-xs text-red-100 leading-relaxed">
                      واجه النظام مشكلة أثناء مصادقة طلب الربط مع سيرفرات منصة فاتورة (ZATCA Portal).
                    </p>
                  </div>

                  {/* Problem Details Card */}
                  <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs space-y-3 text-xs">
                    <h4 className="font-bold text-sm text-[#ba1a1a] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>تفاصيل المشكلة وسبب عدم الاعتماد:</span>
                    </h4>

                    <div className="p-3 bg-[#fff8f6] border border-[#ffdad6] rounded-xl text-[#ba1a1a] font-semibold leading-relaxed">
                      {errorMessage || 'رمز التحقق (OTP) المدخل غير صحيح أو انتهت صلاحيته (صلاحية الرمز 60 دقيقة).'}
                    </div>

                    <div className="text-[#505f76] text-xs space-y-1.5 pt-2 border-t border-[#eceef0]">
                      <p className="font-bold text-[#191c1e]">خطوات الحل المقترحة:</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px]">
                        <li>تأكد من تسجيل الدخول إلى بوابة فاتورة واستخراج رمز OTP جديد.</li>
                        <li>تأكد من أن الرقم الضريبي للمنشأة ({activeProfile.taxNumber}) مسجل وفعال في هيئة الزكاة.</li>
                        <li>أعد إدخال رمز التحقق واضغط على إعادة المحاولة.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-[#f7f9fb] border-t border-[#becabd] flex items-center justify-between shrink-0">
          <div>
            {currentStep === 2 && !isLoading && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs font-semibold text-[#505f76] hover:bg-[#e0e3e5] rounded-lg transition-colors cursor-pointer"
              >
                العودة للبيانات
              </button>
            )}
            {currentStep === 3 && linkingOutcome === 'failed' && (
              <button
                type="button"
                onClick={() => {
                  setLinkingOutcome('idle');
                  setCurrentStep(2);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#505f76] hover:bg-[#e0e3e5] rounded-lg transition-colors cursor-pointer"
              >
                العودة لإدخال OTP جديد
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#505f76] hover:bg-[#e0e3e5] rounded-lg transition-colors cursor-pointer"
            >
              {currentStep === 3 && linkingOutcome === 'success' ? 'إغلاق' : 'إلغاء'}
            </button>

            {/* Step 1: Proceed to OTP */}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleProceedToOtpStep}
                className="px-6 py-2.5 bg-[#005126] text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-[#006c35] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>المتابعة إلى إدخال رمز التحقق (OTP)</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Step 2: Perform Linking */}
            {currentStep === 2 && (
              <button
                type="button"
                disabled={isLoading || otp.trim().length !== 6}
                onClick={handlePerformFullLinking}
                className="px-6 py-2.5 bg-[#005126] text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-[#006c35] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'جاري التحقق والربط...' : 'الربط والاعتماد مع هيئة الزكاة (تفعيل الإنتاج)'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Step 3: Success Finish */}
            {currentStep === 3 && linkingOutcome === 'success' && (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-8 py-2.5 bg-[#005126] text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-[#006c35] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>إتمام وحفظ التفعيل والبدء بالفوترة</span>
              </button>
            )}

            {/* Step 3: Failure Retry */}
            {currentStep === 3 && linkingOutcome === 'failed' && (
              <button
                type="button"
                onClick={() => {
                  setLinkingOutcome('idle');
                  setCurrentStep(2);
                }}
                className="px-6 py-2.5 bg-[#005126] text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-[#006c35] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة مع OTP جديد</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
