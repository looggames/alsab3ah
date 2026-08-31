import React from 'react';
import { NavTab, UserRole } from '../types';
import {
  LayoutDashboard,
  Store,
  Receipt,
  Package,
  FolderTree,
  Users,
  Landmark,
  BarChart2,
  ShieldCheck,
  Settings,
  X,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onNewSale: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  companyName?: string;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onNewSale,
  isMobileOpen = false,
  onCloseMobile,
  companyName,
  userRole,
}) => {
  const isSuperadmin = userRole === 'superadmin';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = isSuperadmin
    ? [
        {
          id: 'superadmin' as NavTab,
          label: 'لوحة المشرف العام',
          icon: <ShieldAlert className="w-5 h-5 text-purple-600" />,
        },
      ]
    : [
        {
          id: 'dashboard',
          label: 'الرئيسية',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          id: 'pos',
          label: 'نقاط البيع',
          icon: <Store className="w-5 h-5" />,
        },
        {
          id: 'invoices',
          label: 'الفواتير',
          icon: <Receipt className="w-5 h-5" />,
        },
        {
          id: 'inventory',
          label: 'المخزون',
          icon: <Package className="w-5 h-5" />,
        },
        {
          id: 'categories',
          label: 'التصنيفات',
          icon: <FolderTree className="w-5 h-5" />,
        },
        {
          id: 'customers',
          label: 'العملاء',
          icon: <Users className="w-5 h-5" />,
        },
        {
          id: 'accounting',
          label: 'المحاسبة',
          icon: <Landmark className="w-5 h-5" />,
        },
        {
          id: 'reports',
          label: 'التقارير',
          icon: <BarChart2 className="w-5 h-5" />,
        },
        {
          id: 'zatca',
          label: 'سجلات هيئة الزكاة',
          icon: <ShieldCheck className="w-5 h-5" />,
        },
        {
          id: 'settings',
          label: 'الإعدادات',
          icon: <Settings className="w-5 h-5" />,
        },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#f7f9fb] border-l border-[#becabd] select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#becabd] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#006c35] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-sm leading-none select-none">
            7
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#005126] tracking-tight leading-tight">نظام السابعة</h1>
            <p className="text-xs font-semibold text-[#3f4940] truncate max-w-[140px]">
              {companyName || 'المحاسبة ونقاط البيع'}
            </p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-right transition-all duration-150 text-[15px] ${
                isActive
                  ? 'bg-[#d0e1fb] text-[#191c1e] font-bold shadow-xs'
                  : 'text-[#3f4940] hover:bg-[#eceef0] hover:text-[#191c1e]'
              }`}
            >
              <span className={isActive ? 'text-[#005126]' : 'text-[#505f76]'}>{item.icon}</span>
              <span className="flex-1 font-medium">{item.label}</span>
              {item.id === 'zatca' && (
                <span className="w-2 h-2 rounded-full bg-[#006c35] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom CTA (Only for non-superadmin accounts) */}
      {!isSuperadmin && (
        <div className="p-4 border-t border-[#becabd] bg-[#f7f9fb]">
          <button
            id="btn-sidebar-new-sale"
            onClick={() => {
              onNewSale();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full bg-[#005126] text-white font-bold text-lg py-3 rounded-lg hover:bg-[#006c35] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store className="w-5 h-5" />
            <span>عملية بيع جديدة</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-full fixed right-0 top-0 z-40 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 h-full z-10 animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
