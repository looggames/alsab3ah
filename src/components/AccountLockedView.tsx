import React, { useState } from 'react';
import {
  Lock,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  Send,
  CheckCircle2,
  LogOut,
  Sparkles,
  Check,
  Headphones,
} from 'lucide-react';
import { AppUser } from '../types';
import { getSupportConfig, submitUnlockRequest } from '../lib/subscriptions';

interface AccountLockedViewProps {
  user: AppUser;
  onSignOut: () => void;
}

export const AccountLockedView: React.FC<AccountLockedViewProps> = ({ user, onSignOut }) => {
  const supportConfig = getSupportConfig();
  const [requestSent, setRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');
  const [phoneInput, setPhoneInput] = useState(user.phone || '');
  const [messageInput, setMessageInput] = useState('');

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleSendUnlockRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      submitUnlockRequest({
        userId: user.id,
        userEmail: user.email,
        companyName: user.companyName,
        phone: phoneInput,
        planRequested: selectedPlan,
        message: messageInput || 'طلب تفعيل الاشتراك وفتح قفل الحساب',
      });

      setTimeout(() => {
        setIsSubmitting(false);
        setRequestSent(true);
      }, 500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `السلام عليكم، أود تفعيل اشتراكي وفتح قفل الحساب في نظام السابعة للمحاسبة والفاتورة الإلكترونية.\n\nاسم المنشأة: ${user.companyName}\nالبريد الإلكتروني: ${user.email}\nرقم الهاتف: ${user.phone || '-'}\nالباقة المطلوبة: ${selectedPlan === 'pro' ? 'الاحترافية (Pro)' : selectedPlan === 'enterprise' ? 'الشركات (Enterprise)' : 'الأساسية (Basic)'}`
  );

  const whatsappUrl = `https://wa.me/${supportConfig.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  return (
    <div
      className="min-h-screen w-full bg-[#f7f9fb] flex flex-col justify-between items-center p-4 sm:p-6 font-['Tajawal'] text-right selection:bg-[#006c35] selection:text-[#90eaa5] relative overflow-x-hidden"
      dir="rtl"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-rose-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#005126] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            7
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">نظام السابعة للمحاسبة</h1>
            <p className="text-[11px] text-slate-500 font-medium">منظومة الفوترة الإلكترونية المعتمدة من هيئة الزكاة</p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          type="button"
          className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج</span>
        </button>
      </header>

      {/* Main Locked Card Container */}
      <main className="w-full max-w-3xl my-8 space-y-6 relative z-10">
        {/* Main Alert Card */}
        <div className="bg-white border-2 border-rose-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Top Banner Accent */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

          {/* Locked Icon & Headline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                <span>انتهت فترة التجربة المجانية (7 أيام)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                تم قفل الحساب مؤقتاً — لإلغاء القفل يُرجى التواصل معنا
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                شكراً لتجربتك لنظام السابعة. لقد انتهت الأيام السبعة المجانية الممنوحة لحسابك. للاستمرار في إصدار الفواتير
                والربط مع هيئة الزكاة (ZATCA)، يُرجى التواصل مع إدارة النظام لفتح القفل وتفعيل اشتراكك.
              </p>
            </div>
          </div>

          {/* Account & Trial Period Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px]">اسم المنشأة</span>
                <span className="font-bold text-slate-800 truncate block max-w-[170px]">{user.companyName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px]">تاريخ بدء التجربة</span>
                <span className="font-bold text-slate-800 font-mono">{formatDate(user.trialStartDate)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px]">تاريخ انتهاء التجربة</span>
                <span className="font-bold text-rose-600 font-mono">{formatDate(user.trialEndDate)}</span>
              </div>
            </div>
          </div>

          {/* Contact Methods (WhatsApp / Call / Email) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-700" />
              <span>تواصل فوري معنا لفتح الحساب فوراً:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 hover:border-emerald-500 text-emerald-950 transition-all flex flex-col items-center justify-center text-center gap-2 group shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-emerald-900">محادثة واتساب سريعة</span>
                  <span className="text-[11px] text-emerald-700 font-mono mt-0.5 block">{supportConfig.whatsapp}</span>
                </div>
              </a>

              {/* Phone Call Button */}
              <a
                href={`tel:${supportConfig.phone.replace(/[^0-9+]/g, '')}`}
                className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 text-blue-950 transition-all flex flex-col items-center justify-center text-center gap-2 group shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-blue-900">اتصال هاتفي مباشر</span>
                  <span className="text-[11px] text-blue-700 font-mono mt-0.5 block">{supportConfig.phone}</span>
                </div>
              </a>

              {/* Email Button */}
              <a
                href={`mailto:${supportConfig.email}?subject=${encodeURIComponent(
                  `طلب تفعيل اشتراك - ${user.companyName}`
                )}`}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-800 transition-all flex flex-col items-center justify-center text-center gap-2 group shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-slate-900">البريد الإلكتروني</span>
                  <span className="text-[11px] text-slate-600 font-mono mt-0.5 block truncate max-w-[180px]">
                    {supportConfig.email}
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Instant Unlock Request Form */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            {requestSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">تم إرسال طلب فتح الحساب إلى الإدارة بنجاح!</h4>
                  <p className="text-emerald-700 mt-0.5">
                    سيقوم فريق خدمة العملاء بالتواصل معك خلال دقائق لاعتماد حسابك وتفعيل الخطة المطلوبة.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendUnlockRequest} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#005126]" />
                    <span>أو أرسل طلب فتح القفل والتفعيل مباشرة من هنا:</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">يصل فورا لإدارة النظام</span>
                </div>

                {/* Plan Selection Radios */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  {[
                    { id: 'basic', label: 'الباقة الأساسية', sub: 'نقطة بيع + فاتورة إلكترونية' },
                    { id: 'pro', label: 'الباقة الاحترافية (Pro)', sub: 'ربط ZATCA + عروض أسعار ومخزون' },
                    { id: 'enterprise', label: 'باقة الشركات', sub: 'فروع متعددة + ميزات مخصصة' },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id as any)}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        selectedPlan === plan.id
                          ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{plan.label}</span>
                        {selectedPlan === plan.id && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight font-normal">{plan.sub}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">رقم الجوال للتواصل</label>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-700 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ملاحظة أو استفسار إضافي (اختياري)</label>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="أرغب في تفعيل الاشتراك السنوي"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-700 text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#005126] hover:bg-[#003d1c] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال طلب فتح الحساب وتفعيل الاشتراك الآن'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Feature Highlights Reminder */}
        <div className="bg-white/80 backdrop-blur-xs border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#005126] flex items-center justify-center shrink-0 font-bold">
              ✓
            </div>
            <div>
              <p className="font-bold text-slate-900">بياناتك وفواتيرك محفوظة بالكامل وبأمان تام</p>
              <p className="text-[11px] text-slate-500">بمجرد تفعيل اشتراكك، ستستعيد الوصول الفوري لكافة الفواتير والتقارير والعملاء والمخزون دون أي فقدان للبيانات.</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 underline shrink-0 cursor-pointer"
          >
            العودة لصفحة الدخول
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-3 border-t border-slate-200 text-center text-xs text-slate-500">
        نظام السابعة للمحاسبة ونقاط البيع والفاتورة الإلكترونية &copy; 2026 — جميع الحقوق محفوظة
      </footer>
    </div>
  );
};
