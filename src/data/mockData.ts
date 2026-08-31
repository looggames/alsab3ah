import { CompanyProfile, Customer, Invoice, Product, ProductCategory, StockAlert, ZatcaLog } from '../types';

export const initialCategories: ProductCategory[] = [
  { id: 'cat-1', name: 'مستلزمات مكتبية', description: 'أدوات وقرطاسية ومطبوعات', color: '#006c35', icon: 'FileText' },
  { id: 'cat-2', name: 'ضيافة', description: 'مشروبات ومأكولات ومستلزمات تقديم', color: '#854f00', icon: 'Coffee' },
  { id: 'cat-3', name: 'إلكترونيات', description: 'أجهزة ومعدات وطابعات وملحقات', color: '#0062a1', icon: 'Laptop' },
  { id: 'cat-4', name: 'خدمات', description: 'اشتراكات وصيانة ودعم فني', color: '#5555a9', icon: 'Wrench' },
];

export const initialCompanyProfile: CompanyProfile = {
  nameAr: '',
  nameEn: '',
  taxNumber: '',
  crNumber: '',
  branchName: '',
  cashierName: '',
  buildingNumber: '',
  streetName: '',
  district: '',
  city: '',
  postalCode: '',
  phone: '',
  email: '',
  defaultVatRate: 0.15,
  csidStatus: 'pending',
  environment: 'production',
  zatcaConfig: {
    environment: 'production',
    egsUuid: '',
    egsSerialNumber: '',
    solutionName: 'نظام الفوترة ونقاط البيع الإلكترونية',
    model: 'POS-01',
    otp: '',
    csidStatus: 'pending',
    isOnboarded: false,
  },
};

export const initialStockAlerts: StockAlert[] = [];

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialInvoices: Invoice[] = [];

export const weeklySalesData: Array<{ day: string; sales: number; vat: number; transactions: number; heightPercent: number }> = [];

export const initialZatcaLogs: ZatcaLog[] = [];
