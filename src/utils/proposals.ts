import { CurrencyConfig, CustomProposal, ProposalItem, TemplateTheme } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const AVAILABLE_CURRENCIES: CurrencyConfig[] = [
  { code: 'SAR', symbol: 'ر.س', label: 'ريال سعودي (SAR)' },
  { code: 'USD', symbol: '$', label: 'دولار أمريكي (USD)' },
  { code: 'EUR', symbol: '€', label: 'يورو (EUR)' },
  { code: 'AED', symbol: 'د.إ', label: 'درهم إماراتي (AED)' },
  { code: 'KWD', symbol: 'د.ك', label: 'دينار كويتي (KWD)' },
  { code: 'BHD', symbol: 'د.ب', label: 'دينار بحريني (BHD)' },
  { code: 'QAR', symbol: 'ر.ق', label: 'ريال قطري (QAR)' },
  { code: 'OMR', symbol: 'ر.ع', label: 'ريال عماني (OMR)' },
  { code: 'EGP', symbol: 'ج.م', label: 'جنيه مصري (EGP)' },
  { code: 'GBP', symbol: '£', label: 'جنيه إسترليني (GBP)' },
];

export interface TemplateDefinition {
  id: TemplateTheme;
  nameAr: string;
  nameEn: string;
  description: string;
  defaultColor: string;
  colorPalette: string[];
  badgeColor: string;
  idealFor: string;
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'corporate',
    nameAr: 'النموذج التجاري العصري',
    nameEn: 'Modern Corporate',
    description: 'تصميم منظم واحترافي للشركات والمؤسسات التجارية مع بطاقات بيانات واضحة وجداول مفصلة.',
    defaultColor: '#005126',
    colorPalette: ['#005126', '#006c35', '#0f766e', '#1e293b'],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    idealFor: 'الشركات التجارية والتوريدات والخدمات العامة',
  },
];

export function calculateProposalItemTotals(
  quantity: number,
  unitPrice: number,
  discount: number,
  discountType: 'percentage' | 'fixed',
  taxRate: number
): { subtotal: number; vatAmount: number; total: number } {
  const rawSubtotal = Math.max(0, quantity * unitPrice);
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (rawSubtotal * Math.min(100, Math.max(0, discount))) / 100;
  } else {
    discountAmount = Math.min(rawSubtotal, Math.max(0, discount));
  }

  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const vatAmount = subtotalAfterDiscount * Math.max(0, taxRate);
  const total = subtotalAfterDiscount + vatAmount;

  return {
    subtotal: Number(subtotalAfterDiscount.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

export function calculateProposalGrandTotals(
  items: ProposalItem[],
  discountGlobal: number,
  discountGlobalType: 'percentage' | 'fixed',
  taxRateGlobal: number
): {
  subtotal: number;
  totalDiscount: number;
  totalVat: number;
  grandTotal: number;
} {
  const rawItemsSum = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const itemsDiscountSum = items.reduce((acc, it) => {
    if (it.discountType === 'percentage') {
      return acc + (it.quantity * it.unitPrice * (it.discount || 0)) / 100;
    }
    return acc + (it.discount || 0);
  }, 0);

  const subtotalBeforeGlobalDiscount = Math.max(0, rawItemsSum - itemsDiscountSum);

  let globalDiscountAmount = 0;
  if (discountGlobalType === 'percentage') {
    globalDiscountAmount = (subtotalBeforeGlobalDiscount * Math.min(100, Math.max(0, discountGlobal))) / 100;
  } else {
    globalDiscountAmount = Math.min(subtotalBeforeGlobalDiscount, Math.max(0, discountGlobal));
  }

  const finalSubtotal = Math.max(0, subtotalBeforeGlobalDiscount - globalDiscountAmount);

  // Calculate VAT based on items or global tax
  const totalVat = items.reduce((acc, it) => {
    // If item has specific tax rate
    const itemSub = it.subtotal;
    const proportion = subtotalBeforeGlobalDiscount > 0 ? (itemSub / subtotalBeforeGlobalDiscount) : 1;
    const adjustedItemSub = itemSub - (globalDiscountAmount * proportion);
    return acc + Math.max(0, adjustedItemSub * it.taxRate);
  }, 0);

  const totalDiscount = itemsDiscountSum + globalDiscountAmount;
  const grandTotal = finalSubtotal + totalVat;

  return {
    subtotal: Number(finalSubtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalVat: Number(totalVat.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

export function formatCustomCurrency(amount: number, currency: CurrencyConfig): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency.symbol}`;
}

export async function exportProposalToPdf(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: browser window.print()
    window.print();
    return true;
  }
}

export function generateProposalEmailContent(proposal: CustomProposal): {
  subject: string;
  body: string;
  mailtoUrl: string;
} {
  const isProposal = proposal.documentType === 'proposal';
  const typeText = isProposal ? 'عرض سعر' : 'فاتورة مخصصة';
  const subject = `${typeText} رقم ${proposal.proposalNumber} - ${proposal.sender.companyName || 'مؤسستنا'}`;
  
  const body = `السلام عليكم ورحمة الله وبركاته،

السادة الكرام / ${proposal.client.name || proposal.client.companyName || 'العميل العزيز'}،

تحية طيبة وبعد،

يسرنا أن نرسل لكم تفاصيل (${typeText}) رقم: ${proposal.proposalNumber}
المسمى: ${proposal.title}

- تاريخ الإصدار: ${proposal.issueDate}
- صالح حتى: ${proposal.validUntil}
- إجمالي المبلغ المطلوب: ${formatCustomCurrency(proposal.grandTotal, proposal.currency)}
- طريقة وشروط الدفع: ${proposal.paymentTerms || proposal.paymentMethod || 'حسب الاتفاق'}

ملاحظات:
${proposal.notes || 'نتطلع للعمل معكم وتقديم أفضل الخدمات.'}

يمكنكم مراجعة النموذج والرد بالاعتماد والموافقة أو طلب أي تعديلات.

شاكرين ومقدرين لكم حسن التعاون،
${proposal.sender.companyName || 'إدارة المبيعات'}
هاتف: ${proposal.sender.phone || ''}
البريد الإلكتروني: ${proposal.sender.email || ''}
`;

  const mailtoUrl = `mailto:${encodeURIComponent(proposal.client.email || '')}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}

export function generateProposalWhatsAppContent(proposal: CustomProposal): string {
  const isProposal = proposal.documentType === 'proposal';
  const typeText = isProposal ? 'عرض سعر' : 'فاتورة مخصصة';
  
  const text = `مرحباً ${proposal.client.name || 'عزيزنا العميل'}،
نرفق لكم ${typeText} رقم *${proposal.proposalNumber}*:
📌 *${proposal.title}*
📅 تاريخ الإصدار: ${proposal.issueDate}
⏳ صالح حتى: ${proposal.validUntil}
💰 الإجمالي: *${formatCustomCurrency(proposal.grandTotal, proposal.currency)}*

📄 يرجى الاطلاع والاعتماد.
شكراً لتعاملكم معنا، *${proposal.sender.companyName || ''}*`;

  return `https://wa.me/${(proposal.client.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

// Initial Sample Custom Proposals (Empty by default for tenant isolation)
export const INITIAL_SAMPLE_PROPOSALS: CustomProposal[] = [];

