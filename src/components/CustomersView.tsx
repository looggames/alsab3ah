import React, { useState } from 'react';
import { Customer } from '../types';
import { formatCurrency } from '../utils/zatca';
import { Search, Plus, User, Building, Phone, Mail, MapPin, X, CheckCircle2, FileText, ShoppingBag } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onNewInvoiceForCustomer?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onNewInvoiceForCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.taxNumber && c.taxNumber.includes(searchQuery)) ||
      c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = (e: React.FormEvent, createInvoiceAfter: boolean = false) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      taxNumber: taxNumber.trim() || undefined,
      crNumber: crNumber.trim() || undefined,
      phone: phone.trim() || '-',
      email: email.trim() || '-',
      city: city.trim() || '',
      address: address.trim() || '',
      totalPurchases: 0,
      balance: 0,
      invoicesCount: 0,
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    
    // Reset fields
    setName('');
    setCompanyName('');
    setTaxNumber('');
    setCrNumber('');
    setPhone('');
    setEmail('');
    setCity('');
    setAddress('');

    if (createInvoiceAfter && onNewInvoiceForCustomer) {
      onNewInvoiceForCustomer(newCust);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#becabd] shadow-xs">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#191c1e]">دليل العملاء والشركات</h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              إدارة بيانات المشترين الخاضعين للفواتير الضريبية القياسية (B2B) والتجزئة (B2C)
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-[#005126] text-white rounded-xl text-xs font-bold hover:bg-[#006c35] flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-[#becabd] shadow-xs flex justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#505f76] absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الرقم الضريبي (15 رقم)، أو رقم الهاتف..."
              className="w-full pl-4 pr-9 py-2 bg-[#f7f9fb] border border-[#becabd] rounded-lg text-xs outline-none focus:border-[#005126] text-[#191c1e]"
            />
          </div>

          <span className="text-xs text-[#505f76] font-semibold">
            عدد العملاء: {filteredCustomers.length}
          </span>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const isCorporate = Boolean(cust.taxNumber);
            return (
              <div
                key={cust.id}
                className="bg-white border border-[#becabd] rounded-xl p-5 shadow-xs hover:border-[#005126] transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCorporate ? 'bg-[#006c35]/15 text-[#005126]' : 'bg-[#e0e3e5] text-[#191c1e]'
                        }`}
                      >
                        {isCorporate ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#191c1e]">{cust.name}</h4>
                        <span className="text-[11px] text-[#505f76]">
                          {isCorporate ? 'منشأة تجارية (B2B)' : 'عميل أفراد (B2C)'}
                        </span>
                      </div>
                    </div>

                    {isCorporate && (
                      <span className="text-[10px] bg-[#d0e1fb] text-[#005126] font-bold px-2 py-0.5 rounded-full">
                        ضريبي معتمد
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-[#3f4940] pt-2 border-t border-[#eceef0]">
                    {cust.taxNumber && (
                      <div className="flex justify-between">
                        <span className="text-[#505f76]">الرقم الضريبي:</span>
                        <span className="font-currency font-bold text-[#005126]">{cust.taxNumber}</span>
                      </div>
                    )}
                    {cust.phone && cust.phone !== '-' && (
                      <div className="flex justify-between">
                        <span className="text-[#505f76]">الهاتف:</span>
                        <span className="font-currency text-[#191c1e]">{cust.phone}</span>
                      </div>
                    )}
                    {cust.address && (
                      <div className="flex justify-between">
                        <span className="text-[#505f76]">العنوان:</span>
                        <span className="text-[#191c1e] truncate max-w-[180px]">{cust.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#eceef0] flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#505f76] block text-[10px]">إجمالي المشتريات</span>
                      <span className="font-currency font-bold text-[#191c1e]">
                        {formatCurrency(cust.totalPurchases)} ر.س
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-[#505f76] block text-[10px]">عدد الفواتير</span>
                      <span className="font-currency font-bold text-[#005126]">
                        {cust.invoicesCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action to create invoice for customer */}
                {onNewInvoiceForCustomer && (
                  <button
                    onClick={() => onNewInvoiceForCustomer(cust)}
                    className="w-full mt-4 py-2 bg-[#005126]/10 text-[#005126] hover:bg-[#005126] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#005126]/20 shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>إنشاء فاتورة لهذا العميل</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-xl border border-[#becabd]">
            <User className="w-12 h-12 text-[#505f76]/40 mb-3" />
            <h3 className="text-base font-bold text-[#191c1e]">لا يوجد عملاء مسجلين</h3>
            <p className="text-xs text-[#505f76] mt-1 max-w-sm">
              أضف بيانات عملائك التجاريين (B2B مع الرقم الضريبي) أو الأفراد (B2C) لتسهيل إصدار الفواتير وتحديد الأسعار المخصصة.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-[#005126] text-white rounded-lg text-xs font-bold hover:bg-[#006c35] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#becabd] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <h3 className="text-lg font-bold text-[#191c1e]">تسجيل عميل جديد</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCreateCustomer(e, false)} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">اسم العميل / الشركة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: شركة التطوير الحديث"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">الرقم الضريبي (15 خانة)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="300000000000003"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">رقم السجل التجاري (CR)</label>
                  <input
                    type="text"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    placeholder="1010000000"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">رقم الهاتف / الجوال</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126] font-currency"
                  />
                </div>

                <div>
                  <label className="block text-[#3f4940] font-semibold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="finance@company.sa"
                    className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3f4940] font-semibold mb-1">العنوان الوطني / المدينة</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="الرياض، طريق الملك فهد"
                  className="w-full p-2.5 bg-[#f7f9fb] border border-[#becabd] rounded-lg outline-none focus:border-[#005126]"
                />
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={(e) => handleCreateCustomer(e, true)}
                  className="flex-1 py-2.5 bg-[#005126] text-white font-bold rounded-xl hover:bg-[#006c35] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>حفظ وإنشاء فاتورة فوراً</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#f7f9fb] border border-[#becabd] text-[#191c1e] font-bold rounded-xl hover:bg-[#eceef0] transition-colors cursor-pointer"
                >
                  حفظ فقط
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

