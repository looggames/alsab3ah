import React from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, X } from 'lucide-react';

interface ZatcaSyncNotificationProps {
  isSyncing: boolean;
  syncSuccess: boolean;
  onClose: () => void;
  syncedCount: number;
}

export const ZatcaSyncNotification: React.FC<ZatcaSyncNotificationProps> = ({
  isSyncing,
  syncSuccess,
  onClose,
  syncedCount,
}) => {
  if (!isSyncing && !syncSuccess) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#191c1e] text-white border border-[#becabd]/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3.5 max-w-md">
        {isSyncing ? (
          <div className="w-10 h-10 rounded-full bg-[#006c35]/40 text-[#90eaa5] flex items-center justify-center shrink-0 animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#006c35] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#90eaa5]" />
            <span>
              {isSyncing
                ? 'جاري تدقيق ورفع الفواتير إلى هيئة الزكاة...'
                : 'تمت المزامنة والاعتماد بنجاح!'}
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-0.5">
            {isSyncing
              ? 'يتم التحقق من الختم الرقمي CSID وبصمة الفواتير مع بوابة فاتورة'
              : `تم اعتماد وتوثيق ${syncedCount} فواتير ضريبية وحفظ الأختام الرقمية.`}
          </p>
        </div>

        {syncSuccess && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
