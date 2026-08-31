import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Building2,
  DollarSign,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Store,
  LogOut,
  Send,
  MessageCircle,
  HelpCircle,
  Settings,
  BadgeCheck,
  Zap,
} from 'lucide-react';
import { AppUser, SubscriptionPlan, SubscriptionStatus, UnlockRequest, UserRole } from '../types';
import {
  getAllUsers,
  saveAllUsers,
  lockUserAccount,
  unlockUserAccount,
  extendUserTrial,
  updateUserAccount,
  deleteUserAccount,
  createAccountBySuperadmin,
  getUnlockRequests,
  resolveUnlockRequest,
  getSupportConfig,
  saveSupportConfig,
  SupportContactConfig,
  isAccountLocked,
} from '../lib/subscriptions';

interface SuperAdminDashboardViewProps {
  currentUser: AppUser;
  onSignOut: () => void;
  onImpersonateUser?: (user: AppUser) => void;
  onSwitchToPosView?: () => void;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({
  currentUser,
  onSignOut,
  onImpersonateUser,
  onSwitchToPosView,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [unlockRequests, setUnlockRequests] = useState<UnlockRequest[]>([]);
  const [supportConfig, setSupportConfig] = useState<SupportContactConfig>(getSupportConfig());
  
  // Navigation & Sub-views in Superadmin
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'requests' | 'plans' | 'support_config'>('users');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'trial' | 'locked' | 'active' | 'superadmin'>('all');

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AppUser | null>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedUserForExtend, setSelectedUserForExtend] = useState<AppUser | null>(null);
  const [extendDaysCount, setExtendDaysCount] = useState(7);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    companyName: '',
    phone: '',
    role: 'user' as UserRole,
    subscriptionPlan: 'trial' as SubscriptionPlan,
    subscriptionStatus: 'trial' as SubscriptionStatus,
    trialDays: 7,
    notes: '',
  });

  // Support Config Form State
  const [configForm, setConfigForm] = useState<SupportContactConfig>(supportConfig);

  // Refresh data from storage
  const refreshData = () => {
    const loadedUsers = getAllUsers();
    setUsers(loadedUsers);
    setUnlockRequests(getUnlockRequests());
    setSupportConfig(getSupportConfig());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  // Metrics Calculations
  const totalUsersCount = users.length;
  const activeTrialCount = users.filter((u) => {
    if (u.role === 'superadmin') return false;
    const lock = isAccountLocked(u);
    return !lock.isLocked && (u.subscriptionStatus === 'trial' || u.subscriptionPlan === 'trial');
  }).length;

  const lockedUsersCount = users.filter((u) => {
    if (u.role === 'superadmin') return false;
    const lock = isAccountLocked(u);
    return lock.isLocked;
  }).length;

  const paidActiveCount = users.filter((u) => {
    if (u.role === 'superadmin') return false;
    const lock = isAccountLocked(u);
    return !lock.isLocked && u.subscriptionStatus === 'active' && u.subscriptionPlan !== 'trial';
  }).length;

  const pendingRequestsCount = unlockRequests.filter((r) => r.status === 'pending').length;

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.companyName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.taxNumber && u.taxNumber.includes(q));

    if (!matchesSearch) return false;

    // Status filter match
    if (statusFilter === 'all') return true;
    if (statusFilter === 'superadmin') return u.role === 'superadmin';

    const lock = isAccountLocked(u);
    if (statusFilter === 'locked') return lock.isLocked;
    if (statusFilter === 'trial') return !lock.isLocked && (u.subscriptionStatus === 'trial' || u.subscriptionPlan === 'trial');
    if (statusFilter === 'active') return !lock.isLocked && u.subscriptionStatus === 'active' && u.subscriptionPlan !== 'trial';

    return true;
  });

  // Action Handlers
  const handleLockToggle = (user: AppUser) => {
    if (user.role === 'superadmin') {
      showToast('لا يمكن قفل حساب المشرف العام (Superadmin)', 'error');
      return;
    }

    const lock = isAccountLocked(user);
    if (lock.isLocked) {
      // Unlock with default +30 days
      unlockUserAccount(user.id, {
        plan: user.subscriptionPlan === 'trial' ? 'pro' : user.subscriptionPlan,
        extendDays: 30,
        notes: 'تم إلغاء القفل يدوياً من قبل Superadmin',
      });
      showToast(`تم فتح قفل حساب (${user.companyName}) وتفعيل الاشتراك لمدة 30 يوماً بنجاح!`);
    } else {
      // Lock
      lockUserAccount(user.id, 'تم قفل الحساب يدوياً من لوحة Superadmin.');
      showToast(`تم قفل حساب (${user.companyName}) بنجاح!`, 'error');
    }
    refreshData();
  };

  const handleQuickExtend = (user: AppUser, days: number) => {
    extendUserTrial(user.id, days);
    showToast(`تم تمديد فترة التجربة/الاشتراك لحساب (${user.companyName}) بمقدار ${days} أيام بنجاح!`);
    refreshData();
  };

  const handleDeleteUser = (user: AppUser) => {
    if (user.role === 'superadmin') {
      showToast('لا يمكن حذف حساب المشرف العام', 'error');
      return;
    }
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف حساب المنشأة (${user.companyName}) بشكل نهائي؟`)) {
      deleteUserAccount(user.id);
      showToast(`تم حذف حساب (${user.companyName}) بنجاح`);
      refreshData();
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.companyName) {
      showToast('يرجى ملء البريد الإلكتروني واسم المنشأة', 'error');
      return;
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + newUserForm.trialDays * 86400000);

    createAccountBySuperadmin({
      email: newUserForm.email.trim().toLowerCase(),
      companyName: newUserForm.companyName.trim(),
      phone: newUserForm.phone.trim(),
      role: newUserForm.role,
      subscriptionPlan: newUserForm.subscriptionPlan,
      subscriptionStatus: newUserForm.subscriptionStatus,
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      isLocked: newUserForm.subscriptionStatus === 'locked',
      notes: newUserForm.notes || 'تم إنشاء الحساب يدوياً عبر Superadmin',
    });

    setIsAddUserModalOpen(false);
    setNewUserForm({
      email: '',
      companyName: '',
      phone: '',
      role: 'user',
      subscriptionPlan: 'trial',
      subscriptionStatus: 'trial',
      trialDays: 7,
      notes: '',
    });
    showToast('تم إنشاء حساب المنشأة الجديد بنجاح!');
    refreshData();
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    updateUserAccount(selectedUserForEdit.id, selectedUserForEdit);
    setIsEditUserModalOpen(false);
    setSelectedUserForEdit(null);
    showToast('تم تحديث بيانات الحساب والاشتراك بنجاح!');
    refreshData();
  };

  const handleApproveUnlockRequest = (req: UnlockRequest) => {
    resolveUnlockRequest(req.id, 'approved', 30);
    showToast(`تم اعتماد طلب (${req.companyName}) وفتح الحساب بنجاح!`);
    refreshData();
  };

  const handleRejectUnlockRequest = (req: UnlockRequest) => {
    resolveUnlockRequest(req.id, 'rejected');
    showToast(`تم رفض طلب فتح الحساب`, 'error');
    refreshData();
  };

  const handleSaveSupportConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupportConfig(configForm);
    setSupportConfig(configForm);
    showToast('تم حفظ وتحديث أرقام وقنوات التواصل للدعم الفني بنجاح!');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'lifetime':
        return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">مدى الحياة (Lifetime)</span>;
      case 'enterprise':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">الشركات (Enterprise)</span>;
      case 'pro':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">احترافي (Pro)</span>;
      case 'basic':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">أساسي (Basic)</span>;
      case 'trial':
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">تجربة 7 أيام (Trial)</span>;
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#f7f9fb] text-slate-900 font-['Tajawal'] text-right selection:bg-[#006c35] selection:text-[#90eaa5] flex flex-col"
      dir="rtl"
    >
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : 'bg-rose-800 text-white border-rose-600'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-300" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Users */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">إجمالي الحسابات المسجلة</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{totalUsersCount}</span>
              <span className="text-[11px] text-slate-400 block mt-1">منشأة ومستخدم</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Active 7-Day Trials */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">فترة تجريبية سارية (7 أيام)</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{activeTrialCount}</span>
              <span className="text-[11px] text-amber-700/80 block mt-1">حسابات نشطة مجاناً</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Expired / Locked Accounts */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">حسابات مقفلة / منتهية</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">{lockedUsersCount}</span>
              <span className="text-[11px] text-rose-700/80 block mt-1">بانتظار التواصل والتفعيل</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
          </div>

          {/* Paid / Active Subscriptions */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">اشتراكات مفعلة ومدفوعة</span>
              <span className="text-2xl sm:text-3xl font-black text-[#005126] font-mono">{paidActiveCount}</span>
              <span className="text-[11px] text-emerald-700 block mt-1">باقات (Pro / Enterprise)</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005126] flex items-center justify-center shrink-0">
              <BadgeCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs in Super Admin */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'users'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>إدارة الحسابات والاشتراكات ({totalUsersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'requests'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>طلبات فتح القفل الواردة</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('support_config')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'support_config'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>قنوات التواصل وبيانات شاشة القفل</span>
            </button>
          </div>

          {activeSubTab === 'users' && (
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#005126] hover:bg-[#003d1c] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء حساب منشأة جديد</span>
            </button>
          )}
        </div>

        {/* ================= VIEW 1: USERS & SUBSCRIPTIONS TABLE ================= */}
        {activeSubTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم المنشأة، البريد، الجوال..."
                  className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-800 text-slate-900 font-medium"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'trial', label: 'تجربة سارية' },
                  { id: 'locked', label: 'مقفل / منتهي' },
                  { id: 'active', label: 'مشترك مدفوع' },
                  { id: 'superadmin', label: 'مسؤولي النظام' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">المنشأة والبريد الإلكتروني</th>
                      <th className="p-3.5">الدور (Role)</th>
                      <th className="p-3.5">خطة الاشتراك</th>
                      <th className="p-3.5">حالة الحساب</th>
                      <th className="p-3.5">تاريخ التسجيل</th>
                      <th className="p-3.5">انتهاء التجربة / الاشتراك</th>
                      <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => {
                        const lockInfo = isAccountLocked(user);
                        const isSuper = user.role === 'superadmin';

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Company & Email */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {user.companyName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block leading-tight">
                                    {user.companyName}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                                    {user.email}
                                  </span>
                                  {user.phone && (
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      {user.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="p-3.5">
                              {isSuper ? (
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px] inline-flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-purple-600" />
                                  <span>Superadmin</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                                  {user.role === 'admin' ? 'Admin' : 'User (عميل)'}
                                </span>
                              )}
                            </td>

                            {/* Plan */}
                            <td className="p-3.5">{getPlanBadge(user.subscriptionPlan)}</td>

                            {/* Status */}
                            <td className="p-3.5">
                              {isSuper ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                  <span>حساب رئيسي مفتوح</span>
                                </span>
                              ) : lockInfo.isLocked ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    <Lock className="w-3 h-3 text-rose-600" />
                                    <span>مقفل (انتهت التجربة)</span>
                                  </span>
                                </div>
                              ) : user.subscriptionStatus === 'trial' ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>تجربة سارية ({lockInfo.daysLeft} أيام متبقية)</span>
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>نشط ومدفوع</span>
                                </span>
                              )}
                            </td>

                            {/* Registered Date */}
                            <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                              {formatDate(user.createdAt)}
                            </td>

                            {/* Trial / Subscription Expiry */}
                            <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                              {isSuper ? 'دائم' : formatDate(user.trialEndDate)}
                            </td>

                            {/* Actions */}
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* Lock / Unlock Button */}
                                {!isSuper && (
                                  <button
                                    type="button"
                                    onClick={() => handleLockToggle(user)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                      lockInfo.isLocked
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    }`}
                                    title={lockInfo.isLocked ? 'إلغاء قفل الحساب وتفعيله' : 'قفل الحساب'}
                                  >
                                    {lockInfo.isLocked ? (
                                      <>
                                        <Unlock className="w-3 h-3" />
                                        <span>إلغاء القفل</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-3 h-3" />
                                        <span>قفل</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* Quick Extend Trial (+7 Days) */}
                                {!isSuper && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserForExtend(user);
                                      setIsExtendModalOpen(true);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    title="تمديد فترة التجربة المجانية"
                                  >
                                    <Plus className="w-3 h-3 text-amber-600" />
                                    <span>تمديد</span>
                                  </button>
                                )}

                                {/* Edit User & Plan */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUserForEdit({ ...user });
                                    setIsEditUserModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="تعديل الخطة والبيانات"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Impersonate / View as Tenant */}
                                {onImpersonateUser && !isSuper && (
                                  <button
                                    type="button"
                                    onClick={() => onImpersonateUser(user)}
                                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                                    title="الدخول لواجهة نقاط البيع كـ هذه المنشأة"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete User */}
                                {!isSuper && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="حذف الحساب"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          لا توجد حسابات مطابقة لمعايير البحث أو الفلتر
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: UNLOCK REQUESTS INBOX ================= */}
        {activeSubTab === 'requests' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">طلبات فتح القفل وتفعيل الاشتراكات الواردة</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  الطلبات المرسلة من قبل أصحاب الحسابات المنتهية عبر شاشة القفل (Account Locked Screen)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                إجمالي الطلبات: {unlockRequests.length}
              </span>
            </div>

            {unlockRequests.length > 0 ? (
              <div className="space-y-3">
                {unlockRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      req.status === 'pending'
                        ? 'bg-amber-50/50 border-amber-200'
                        : req.status === 'approved'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.companyName}</span>
                        {req.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            بانتظار الاعتماد
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            تم الفتح والاعتماد
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            مرفوض
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                        <span className="font-mono">{req.userEmail}</span>
                        {req.phone && <span>جوال: <span className="font-mono font-bold">{req.phone}</span></span>}
                        <span>الباقة المطلوبة: <span className="font-bold text-emerald-800">{req.planRequested?.toUpperCase() || 'PRO'}</span></span>
                        <span className="text-slate-400 font-mono text-[11px]">{formatDate(req.requestedAt)}</span>
                      </div>

                      {req.message && (
                        <p className="text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/80 mt-1">
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveUnlockRequest(req)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>الموافقة وفتح الحساب (30 يوم)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectUnlockRequest(req)}
                          className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                لا توجد طلبات فتح قفل معلقة حالياً.
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: SUPPORT & CONTACT INFO CONFIG ================= */}
        {activeSubTab === 'support_config' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">بيانات وقنوات التواصل (شاشة القفل)</h3>
              <p className="text-xs text-slate-500 mt-1">
                الأرقام والروابط التي تظهر للعملاء عند انتهاء فترة التجربة الـ 7 أيام للتواصل معك لفتح الحساب.
              </p>
            </div>

            <form onSubmit={handleSaveSupportConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الواتساب (مع رمز الدولة بدون +)</label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={configForm.whatsapp}
                    onChange={(e) => setConfigForm({ ...configForm, whatsapp: e.target.value })}
                    placeholder="966501234567"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">مثال: 966501234567 (يفتح مباشرة في تطبيق WhatsApp)</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الهاتف للاتصال المباشر</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-blue-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={configForm.phone}
                    onChange={(e) => setConfigForm({ ...configForm, phone: e.target.value })}
                    placeholder="+966 50 123 4567"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني للدعم والمبيعات</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={configForm.email}
                    onChange={(e) => setConfigForm({ ...configForm, email: e.target.value })}
                    placeholder="sales@alsab3ah.com"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#005126] hover:bg-[#003d1c] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                حفظ وتحديث معلومات التواصل
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: ADD NEW USER ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">إنشاء حساب منشأة جديد</h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المنشأة أو الشركة *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.companyName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, companyName: e.target.value })}
                  placeholder="مثال: شركة النخبة التجارية"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني للعميل *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="client@company.sa"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الدور (Role)</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-bold"
                  >
                    <option value="user">User (عميل عادي)</option>
                    <option value="admin">Admin (مدير منشأة)</option>
                    <option value="superadmin">Superadmin (مشرف عام)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">خطة الاشتراك</label>
                  <select
                    value={newUserForm.subscriptionPlan}
                    onChange={(e) => setNewUserForm({ ...newUserForm, subscriptionPlan: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900"
                  >
                    <option value="trial">فترة تجريبية 7 أيام (Trial)</option>
                    <option value="basic">الأساسية (Basic)</option>
                    <option value="pro">الاحترافية (Pro)</option>
                    <option value="enterprise">الشركات (Enterprise)</option>
                    <option value="lifetime">مدى الحياة (Lifetime)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">مدة التجربة / الاشتراك (أيام)</label>
                  <input
                    type="number"
                    min={1}
                    value={newUserForm.trialDays}
                    onChange={(e) => setNewUserForm({ ...newUserForm, trialDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات إدارية</label>
                <input
                  type="text"
                  value={newUserForm.notes}
                  onChange={(e) => setNewUserForm({ ...newUserForm, notes: e.target.value })}
                  placeholder="ملاحظات حول العميل أو طريقة الدفع..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#005126] text-white font-bold hover:bg-[#003d1c] shadow-xs cursor-pointer"
                >
                  إنشاء الحساب فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT USER & SUBSCRIPTION ================= */}
      {isEditUserModalOpen && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">تعديل بيانات الحساب والاشتراك</h3>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المنشأة</label>
                <input
                  type="text"
                  required
                  value={selectedUserForEdit.companyName}
                  onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, companyName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الدور (Role)</label>
                  <select
                    value={selectedUserForEdit.role}
                    onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, role: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-bold"
                  >
                    <option value="user">User (عميل عادي)</option>
                    <option value="admin">Admin (مدير منشأة)</option>
                    <option value="superadmin">Superadmin (مشرف عام)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">خطة الاشتراك</label>
                  <select
                    value={selectedUserForEdit.subscriptionPlan}
                    onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, subscriptionPlan: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-bold"
                  >
                    <option value="trial">فترة تجريبية (Trial)</option>
                    <option value="basic">الأساسية (Basic)</option>
                    <option value="pro">الاحترافية (Pro)</option>
                    <option value="enterprise">الشركات (Enterprise)</option>
                    <option value="lifetime">مدى الحياة (Lifetime)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">حالة الاشتراك</label>
                  <select
                    value={selectedUserForEdit.subscriptionStatus}
                    onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, subscriptionStatus: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900"
                  >
                    <option value="active">نشط ومفعل (Active)</option>
                    <option value="trial">فترة تجريبية (Trial)</option>
                    <option value="locked">مقفل (Locked)</option>
                    <option value="expired">منتهي (Expired)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">قفل الحساب (Locked)</label>
                  <select
                    value={selectedUserForEdit.isLocked ? 'true' : 'false'}
                    onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, isLocked: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-bold"
                  >
                    <option value="false">مفتوح (مسموح بالدخول)</option>
                    <option value="true">مقفل (يظهر شاشة القفل)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ انتهاء التجربة / الاشتراك</label>
                <input
                  type="date"
                  value={selectedUserForEdit.trialEndDate ? selectedUserForEdit.trialEndDate.substring(0, 10) : ''}
                  onChange={(e) => {
                    const d = new Date(e.target.value);
                    setSelectedUserForEdit({ ...selectedUserForEdit, trialEndDate: d.toISOString() });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات إدارية</label>
                <input
                  type="text"
                  value={selectedUserForEdit.notes || ''}
                  onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: EXTEND TRIAL MODAL ================= */}
      {isExtendModalOpen && selectedUserForExtend && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">تمديد فترة التجربة المجانية</h3>
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600">
                تمديد التجربة لمنشأة: <strong className="text-slate-900">{selectedUserForExtend.companyName}</strong>
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDaysCount(d)}
                    className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                      extendDaysCount === d
                        ? 'bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    +{d} أيام
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">أو حدد عدد الأيام يدوياً:</label>
                <input
                  type="number"
                  min={1}
                  value={extendDaysCount}
                  onChange={(e) => setExtendDaysCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-slate-800 text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickExtend(selectedUserForExtend, extendDaysCount);
                    setIsExtendModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  تمديد التجربة الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
