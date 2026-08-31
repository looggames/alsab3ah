import React, { useState } from 'react';
import { NavTab, UserRole } from '../types';
import {
  Search,
  ChevronDown,
  CloudUpload,
  Bell,
  HelpCircle,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  LogOut,
  User,
  ShieldAlert,
  Crown,
} from 'lucide-react';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onTriggerZatcaSync: () => void;
  isSyncing: boolean;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  pendingCount: number;
  stockAlertsCount?: number;
  userEmail?: string;
  companyName?: string;
  userRole?: UserRole;
  trialDaysLeft?: number;
  isTrialActive?: boolean;
  onOpenSuperadmin?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onTriggerZatcaSync,
  isSyncing,
  selectedBranch,
  onSelectBranch,
  pendingCount,
  stockAlertsCount = 0,
  userEmail,
  companyName,
  userRole,
  trialDaysLeft,
  isTrialActive,
  onOpenSuperadmin,
  onSignOut,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const isSuperadmin = userRole === 'superadmin';

  const getTitle = () => {
    if (isSuperadmin && currentTab === 'superadmin') {
      return 'لوحة المشرف العام (Super Admin)';
    }
    switch (currentTab) {
      case 'dashboard':
      case 'superadmin':
        return 'لوحة التحكم الضريبية';
      case 'pos':
        return 'نقطة البيع السريعة (POS)';
      case 'invoices':
        return 'سجل الفواتير الإلكترونية';
      case 'inventory':
        return 'إدارة المخزون والمنتجات';
      case 'categories':
        return 'إدارة تصنيفات المنتجات والخدمات';
      case 'customers':
        return 'دليل العملاء والشركات';
      case 'accounting':
        return 'المحاسبة والإقرار الضريبي';
      case 'reports':
        return 'التقارير المالية والتحليلات';
      case 'zatca':
        return 'سجلات الربط مع هيئة الزكاة (فاتورة)';
      case 'settings':
        return 'إعدادات النظام والمنشأة';
      default:
        return 'لوحة التحكم الضريبية';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex justify-between items-center h-16 px-4 md:px-8 bg-[#f7f9fb]/95 backdrop-blur-md border-b border-[#becabd] shadow-xs w-full">
      {/* Right Side: Title & Mobile menu button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#191c1e] hover:bg-[#e0e3e5] rounded-lg"
          aria-label="القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#191c1e] leading-tight">{getTitle()}</h2>
        </div>
      </div>

      {/* Left Side: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Trial Days Indicator (if on trial) */}
        {isTrialActive && trialDaysLeft !== undefined && !isSuperadmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
            <span>تجربة مجانية: متبقي {trialDaysLeft} أيام</span>
          </div>
        )}

        {/* Superadmin Quick Access Badge */}
        {isSuperadmin && onOpenSuperadmin && currentTab !== 'superadmin' && (
          <button
            type="button"
            onClick={onOpenSuperadmin}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-purple-700" />
            <span>لوحة المشرف العام</span>
          </button>
        )}

        {/* Search */}
        <div className="relative">
          {isSearchExpanded ? (
            <div className="flex items-center bg-white border border-[#becabd] rounded-full px-3 py-1.5 shadow-xs animate-in fade-in duration-150">
              <Search className="w-4 h-4 text-[#505f76] ml-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث عن فاتورة، عميل، صنف..."
                className="w-44 md:w-60 text-sm bg-transparent outline-none text-[#191c1e] placeholder:text-[#3f4940]"
                autoFocus
                onBlur={() => !searchQuery && setIsSearchExpanded(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#3f4940] hover:bg-[#e0e3e5] transition-colors active:opacity-80 cursor-pointer"
              title="بحث سريع"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Upload to ZATCA Button (Non-superadmin only) */}
        {!isSuperadmin && (
          <button
            onClick={onTriggerZatcaSync}
            disabled={isSyncing}
            className={`hidden lg:flex items-center gap-2 px-4 py-2 bg-[#d0e1fb] text-[#191c1e] rounded-full text-xs font-semibold hover:bg-[#d3e4fe] transition-all cursor-pointer ${
              isSyncing ? 'opacity-80 animate-pulse' : ''
            }`}
            title="مزامنة وتدقيق الفواتير مع منصة فاتورة التابعة لهيئة الزكاة والضريبة والجمارك"
          >
            <span>{isSyncing ? 'جاري الرفع للهيئة...' : 'رفع للهيئة'}</span>
            <CloudUpload className={`w-4 h-4 text-[#005126] ${isSyncing ? 'animate-bounce' : ''}`} />
            {pendingCount > 0 && (
              <span className="bg-[#005126] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Icon Actions Divider */}
        <div className="flex items-center gap-1 border-r border-[#becabd] pr-3 mr-1">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#3f4940] hover:bg-[#e0e3e5] transition-colors active:opacity-80 relative cursor-pointer"
              title="التنبيهات والإشعارات"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full animate-ping" />
              )}
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white border border-[#becabd] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#eceef0] flex justify-between items-center">
                  <span className="font-bold text-sm text-[#191c1e]">مركز التنبيهات الضريبية</span>
                  <span className="text-[11px] bg-[#d0e1fb] text-[#005126] font-semibold px-2 py-0.5 rounded-full">
                    مباشر
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#eceef0] custom-scrollbar">
                  {stockAlertsCount > 0 ? (
                    <div className="p-3 hover:bg-[#f7f9fb] transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-[#191c1e]">تنبيه انخفاض المخزون</p>
                          <p className="text-[11px] text-[#505f76] mt-0.5">
                            يوجد {stockAlertsCount} صنف في المخزون وصل إلى الحد الأدنى
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">تنبيه آلي</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="p-3 hover:bg-[#f7f9fb] transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#d0e1fb] text-[#005126] flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#191c1e]">مزامنة الفواتير (ZATCA)</p>
                        <p className="text-[11px] text-[#505f76] mt-0.5">
                          {pendingCount > 0
                            ? `يوجد ${pendingCount} فواتير بانتظار الإبلاغ للهيئة`
                            : 'جميع الفواتير المصدرة معتمدة ومتزامنة'}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">تلقائي</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t border-[#eceef0] text-center">
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-bold text-[#005126] hover:underline"
                  >
                    عرض كل الإشعارات
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help / Guide */}
          <div className="relative">
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#3f4940] hover:bg-[#e0e3e5] transition-colors active:opacity-80 cursor-pointer"
              title="دليل النظام وهيئة الزكاة"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {isHelpOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-[#becabd] rounded-xl shadow-xl p-4 z-50 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 mb-2 text-[#005126] font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>دليل متطلبات الفاتورة الإلكترونية</span>
                </div>
                <p className="text-xs text-[#505f76] leading-relaxed">
                  نظام السابعة متوافق 100% مع لوائح هيئة الزكاة والضريبة والجمارك (المرحلة الثانية - الربط والتكامل).
                  يدعم الفواتير الضريبية القياسية (B2B) والفواتير المبسطة (B2C) مع الختم الرقمي ورمز QR.
                </p>
                <div className="mt-3 pt-3 border-t border-[#eceef0] flex justify-between items-center text-xs">
                  <span className="text-[#505f76]">الإصدار: 2.4 (Phase 2 Ready)</span>
                  <span className="text-[#005126] font-bold">ZATCA Compliant</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Avatar & Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#005126]/30 transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#becabd] bg-[#005126] text-white flex items-center justify-center font-bold text-xs">
              {userEmail ? userEmail.charAt(0).toUpperCase() : '7'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#505f76]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white border border-[#becabd] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-150 text-xs">
              <div className="px-4 py-3 border-b border-[#eceef0]">
                <p className="font-bold text-[#191c1e] truncate">{companyName || 'مؤسسة التذكرة السابعة'}</p>
                <p className="text-[#505f76] font-currency text-[11px] truncate mt-0.5">{userEmail || 'مستخدم النظام'}</p>
              </div>

              {onSignOut && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-[#ffdad6] text-[#ba1a1a] font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
