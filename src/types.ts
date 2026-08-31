export type NavTab = 
  | 'dashboard'
  | 'pos'
  | 'invoices'
  | 'inventory'
  | 'categories'
  | 'customers'
  | 'accounting'
  | 'reports'
  | 'zatca'
  | 'settings'
  | 'superadmin';

export type UserRole = 'superadmin' | 'admin' | 'user';

export type SubscriptionPlan = 'trial' | 'basic' | 'pro' | 'enterprise' | 'lifetime';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'locked';

export interface AppUser {
  id: string;
  email: string;
  companyName: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialStartDate: string;
  trialEndDate: string;
  isLocked: boolean;
  lockReason?: string;
  taxNumber?: string;
  crNumber?: string;
  phone?: string;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface UnlockRequest {
  id: string;
  userId: string;
  userEmail: string;
  companyName: string;
  requestedAt: string;
  phone?: string;
  message?: string;
  planRequested?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type ZatcaStatus = 'cleared' | 'pending' | 'failed' | 'rejected' | 'warning';

export type PaymentMethod = 'card' | 'cash' | 'transfer' | 'split';

export interface ProductCategory {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  icon?: string;
  color?: string;
  itemCount?: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  nameEn?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number; // e.g., 0.15
  vatAmount: number;
  subtotal: number;
  total: number;
}

export interface InvoiceEditLog {
  id: string;
  timestamp: string;
  editedBy: string;
  reason?: string;
  changesSummary: string[];
  oldGrandTotal: number;
  newGrandTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  uuid: string;
  date: string;
  time: string;
  customerName: string;
  customerTaxNumber?: string;
  customerType: 'individual' | 'business';
  customerAddress?: string;
  type: 'simplified' | 'standard' | 'credit_note' | 'debit_note'; // مبسطة B2C or قياسية B2B or إشعار دائن/مدين
  originalInvoiceNumber?: string;
  originalInvoiceUuid?: string;
  returnReason?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalVat: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  zatcaStatus: ZatcaStatus;
  zatcaSubmissionDate?: string;
  cryptographicStamp?: string;
  qrCodeData: string;
  branch: string;
  cashierName: string;
  notes?: string;
  invoiceHash?: string;
  previousInvoiceHash?: string;
  zatcaWarnings?: string[];
  zatcaErrors?: string[];
  editHistory?: InvoiceEditLog[];
  lastEditedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  vatRate: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  taxNumber?: string;
  crNumber?: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  totalPurchases: number;
  balance: number;
  invoicesCount: number;
}

export interface StockAlert {
  id: string;
  productName: string;
  category: string;
  remaining: number;
  minAlert: number;
}

export interface ZatcaLog {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  status: ZatcaStatus;
  message: string;
  statusCode: number;
  hash: string;
  durationMs: number;
  requestType?: 'compliance_csid' | 'production_csid' | 'clearance' | 'reporting' | 'check';
  responsePayload?: string;
  warnings?: string[];
}

export interface ZatcaComplianceCheckResult {
  checkName: string;
  checkType: 'standard' | 'simplified' | 'credit_note' | 'debit_note';
  status: 'passed' | 'failed' | 'pending';
  httpStatus: number;
  invoiceHash: string;
  qrCode: string;
  warnings: string[];
  details: string;
}

export interface ZatcaConfig {
  environment: 'production' | 'simulation' | 'sandbox';
  egsUuid: string;
  egsSerialNumber: string;
  solutionName: string;
  model: string;
  otp: string;
  csr?: string;
  privateKey?: string;
  publicKey?: string;
  complianceCsid?: string;
  complianceSecret?: string;
  complianceRequestId?: string;
  productionCsid?: string;
  productionSecret?: string;
  productionRequestId?: string;
  csidStatus: 'unregistered' | 'pending' | 'compliance_passed' | 'active' | 'expiring' | 'revoked';
  csidExpiryDate?: string;
  isOnboarded: boolean;
  onboardedAt?: string;
  lastSyncAt?: string;
  complianceChecks?: ZatcaComplianceCheckResult[];
}

export interface CompanyProfile {
  nameAr: string;
  nameEn: string;
  taxNumber: string;
  crNumber: string;
  branchName: string;
  cashierName?: string;
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  defaultVatRate: number;
  csidStatus: 'unregistered' | 'pending' | 'active' | 'expiring' | 'revoked';
  environment: 'production' | 'simulation' | 'sandbox';
  zatcaConfig?: ZatcaConfig;
}

export type ProposalStatus = 
  | 'draft'      // مسودة
  | 'sent'       // تم الإرسال للعميل
  | 'pending'    // بانتظار رد العميل
  | 'accepted'   // معتمد ومقبول
  | 'declined'   // مرفوض
  | 'converted'; // تم تحويله لفاتورة مبيعات

export type TemplateTheme = 
  | 'corporate'       // تجاري عصري (Modern Corporate)
  | 'modern_minimal'  // بسيط أنيق (Elegant Minimal)
  | 'tech_slate'      // تقني وعصري (Tech Slate)
  | 'classic_blue'    // أزرق كلاسيكي (Classic Navy/Blue)
  | 'emerald_luxury'  // زمردي فاخر (Luxury Emerald)
  | 'creative_warm';  // إبداعي دافئ (Warm Creative)

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  rate?: number;
}

export interface ProposalItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string; // قطعة, ساعة, خدمة, شهر, مشروع, متر, كجم, إلخ
  unitPrice: number;
  discount: number; // خصم البند
  discountType: 'percentage' | 'fixed';
  taxRate: number; // e.g. 0.15 for 15%
  vatAmount: number;
  subtotal: number;
  total: number;
}

export interface SenderParty {
  companyName: string;
  legalName?: string;
  taxNumber?: string;
  crNumber?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country?: string;
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  logoUrl?: string;
}

export interface ClientParty {
  name: string;
  companyName?: string;
  taxNumber?: string;
  crNumber?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country?: string;
  attentionPerson?: string;
}

export interface ClientDecisionLog {
  status: 'accepted' | 'declined';
  actorName: string;
  actorEmail?: string;
  decidedAt: string;
  signatureImage?: string;
  notes?: string;
  declineReason?: string;
}

export interface CustomProposal {
  id: string;
  proposalNumber: string; // e.g. PROP-2026-001 or INV-CUST-001
  title: string;          // e.g. "عرض سعر خدمات استشارية وتقنية"
  documentType: 'proposal' | 'custom_invoice'; // عرض سعر أو نموذج فاتورة مخصص
  status: ProposalStatus;
  templateTheme: TemplateTheme;
  primaryColor: string;
  currency: CurrencyConfig;
  
  sender: SenderParty;
  client: ClientParty;
  
  issueDate: string;
  validUntil: string;
  deliveryDate?: string;
  
  items: ProposalItem[];
  
  discountGlobal: number;
  discountGlobalType: 'percentage' | 'fixed';
  taxRateGlobal: number; // default 0.15
  
  subtotal: number;
  totalDiscount: number;
  totalVat: number;
  grandTotal: number;
  
  paymentMethod: string;
  paymentTerms: string; // e.g. "50% مقدم و 50% عند الاستلام"
  notes?: string;
  termsAndConditions?: string;
  
  clientDecision?: ClientDecisionLog;
  sentAt?: string;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

