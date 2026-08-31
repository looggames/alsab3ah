import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { supabase, seedUserStarterData } from '../lib/supabase';

interface AuthViewProps {
  onAuthSuccess: (authenticatedUser?: any) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // Client-side email format sanity check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('صيغة البريد الإلكتروني غير صالحة. يرجى إدخال بريد إلكتروني صحيح مثل (name@gmail.com أو info@company.com).');
      setIsLoading(false);
      return;
    }

    try {
      // Direct Superadmin & Demo credentials validation
      if (cleanEmail === 'seven@superadmin.com') {
        if (password === '0678793039-super123456' || password === 'super123456') {
          let superUser = {
            id: 'superadmin-root-01',
            email: 'seven@superadmin.com',
            user_metadata: { company_name: 'إدارة منظومة السابعة (المشرف العام)' },
          };

          // Try background sync with Supabase Auth database
          try {
            const { data: supaLogin, error: supaErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (supaLogin?.user) {
              superUser = supaLogin.user as any;
            } else if (supaErr && supaErr.message.includes('Invalid login credentials')) {
              const { data: supaSignUp } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                  data: { company_name: 'إدارة منظومة السابعة (المشرف العام)' },
                },
              });
              if (supaSignUp?.user) {
                superUser = supaSignUp.user as any;
              }
            }
          } catch (e) {
            console.warn('Superadmin Supabase background sync notice:', e);
          }

          localStorage.setItem('alsab3ah_custom_auth_session', JSON.stringify({ user: superUser }));
          setSuccessMessage('تم تسجيل الدخول بنجاح كـ المشرف العام (Super Admin)!');
          onAuthSuccess(superUser);
          return;
        } else if (mode === 'login') {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
      }

      // Demo User Quick Fallbacks for reliable instant login
      if (cleanEmail === 'riyadh.store@company.sa' && (password === 'store123456' || password === '123456')) {
        const demoUser = {
          id: 'demo-trial-active',
          email: 'riyadh.store@company.sa',
          user_metadata: { company_name: 'مؤسسة الرياض للتجارة والخدمات' },
        };
        localStorage.setItem('alsab3ah_custom_auth_session', JSON.stringify({ user: demoUser }));
        setSuccessMessage('تم تسجيل الدخول بنجاح!');
        onAuthSuccess(demoUser);
        return;
      }

      if (cleanEmail === 'jeddah.tech@business.sa' && (password === 'tech123456' || password === '123456')) {
        const demoUser = {
          id: 'demo-trial-expired-locked',
          email: 'jeddah.tech@business.sa',
          user_metadata: { company_name: 'شركة تقنية جدة للحلول الرقمية' },
        };
        localStorage.setItem('alsab3ah_custom_auth_session', JSON.stringify({ user: demoUser }));
        setSuccessMessage('تم تسجيل الدخول!');
        onAuthSuccess(demoUser);
        return;
      }

      if (mode === 'signup') {
        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              company_name: companyName || 'مؤسسة تجارية جديدة',
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Initialize starter tenant dataset in Supabase
          try {
            await seedUserStarterData(data.user.id, companyName);
          } catch (seedErr) {
            console.warn('Starter data seeding notice:', seedErr);
          }
          setSuccessMessage('تم إنشاء حساب المنشأة بنجاح! جاري الدخول للوحة التحكم...');
          onAuthSuccess(data.user);
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          setSuccessMessage('تم تسجيل الدخول بنجاح! جاري التوجيه للوحة التحكم...');
          onAuthSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error('Supabase Auth Error:', err);
      let msg = err?.message || 'حدث خطأ أثناء الاتصال بقاعدة البيانات.';
      const lower = msg.toLowerCase();
      if (lower.includes('is invalid') || (lower.includes('email') && lower.includes('invalid'))) {
        msg = 'عنوان البريد الإلكتروني غير صالح. يرجى استخدام بريد إلكتروني قياسي مثل (example@gmail.com أو info@company.com).';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (msg.includes('User already registered')) {
        msg = 'هذا البريد مسجل مسبقاً، يمكنك التبديل إلى "تسجيل الدخول" مباشرة.';
      } else if (msg.includes('Email not confirmed')) {
        msg =
          'يرجى تأكيد البريد الإلكتروني أو إلغاء تفعيل خيار "Confirm email" في لوحة تحكم Supabase لتسجيل الدخول الفوري.';
      } else if (lower.includes('password') && (lower.includes('least') || lower.includes('short'))) {
        msg = 'يجب أن تحتوي كلمة المرور على 6 أحرف أو أرقام على الأقل.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f7f9fb] flex flex-col justify-center items-center p-4 selection:bg-[#006c35] selection:text-[#90eaa5]" dir="rtl">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-[#006c35]/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#becabd] rounded-2xl shadow-xl p-6 sm:p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#005126] text-white flex items-center justify-center mx-auto shadow-md font-black text-3xl select-none leading-none">
            7
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">نظام السابعة للمحاسبة</h1>
            <p className="text-xs text-[#505f76] mt-1">
              منظومة متوافقة 100% مع هيئة الزكاة والضريبة والجمارك
            </p>
          </div>
        </div>

        {/* Security Compliance Badge */}
        <div className="flex items-center justify-center gap-2 bg-[#f2f4f6] px-3.5 py-2.5 rounded-xl border border-[#becabd] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#005126]" />
          <span className="font-semibold text-[#191c1e]">نظام آمن ومشفر ومعتمد وفق معايير هيئة الزكاة (ZATCA)</span>
        </div>

        {/* 7 Days Free Trial Banner for Signup */}
        <div className="bg-emerald-50 border border-emerald-300/80 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            7
          </div>
          <div>
            <span className="font-bold block text-emerald-950">فترة تجريبية مجانية لمدة 7 أيام</span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              تفعيل فوري لجميع ميزات النظام ونقاط البيع والفاتورة الإلكترونية فور التسجيل.
            </span>
          </div>
        </div>

        {/* Toggle Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#f2f4f6] rounded-xl border border-[#becabd] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#005126] shadow-xs'
                : 'text-[#505f76] hover:text-[#191c1e]'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-[#005126] shadow-xs'
                : 'text-[#505f76] hover:text-[#191c1e]'
            }`}
          >
            إنشاء حساب منشأة جديد
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-[#006c35]/15 border border-[#005126]/30 text-[#005126] rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[#3f4940] font-semibold mb-1">اسم المنشأة أو الشركة *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: شركة الأعمال التجارية المحدودة"
                  className="w-full pr-9 pl-3 py-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] text-[#191c1e]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#3f4940] font-semibold mb-1">البريد الإلكتروني *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@company.sa"
                className="w-full pr-9 pl-3 py-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] text-[#191c1e] font-currency"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#3f4940] font-semibold mb-1">كلمة المرور *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-9 pl-10 py-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-xl outline-none focus:border-[#005126] text-[#191c1e] font-currency"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#505f76] hover:text-[#191c1e]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#005126] text-white font-bold text-sm rounded-xl hover:bg-[#006c35] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : mode === 'signup' ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {isLoading
                ? 'جاري المعالجة والاتصال...'
                : mode === 'signup'
                ? 'إنشاء الحساب وتفعيل الـ 7 أيام تجربة مجاناً'
                : 'تسجيل الدخول إلى لوحة التحكم'}
            </span>
          </button>
        </form>
      </div>

      {/* Security & ZATCA Badge */}
      <div className="mt-6 flex items-center gap-2 text-xs text-[#505f76]">
        <ShieldCheck className="w-4 h-4 text-[#005126]" />
        <span>نظام معتمد متوافق مع لوائح الفوترة الإلكترونية بالمملكة العربية السعودية</span>
      </div>
    </div>
  );
};
