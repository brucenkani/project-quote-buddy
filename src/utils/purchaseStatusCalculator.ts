import { Purchase } from '@/types/purchase';
import { getTotalPaid } from './purchasePaymentStorage';

export interface PurchaseStatusInfo {
  isPaid: boolean;
  isPartiallyPaid: boolean;
  remainingBalance: number;
  totalPaid: number;
  paymentProgress: number;
}

export const calculatePurchaseStatus = async (purchase: Purchase): Promise<PurchaseStatusInfo> => {
  const totalPaid = await getTotalPaid(purchase.id);
  const remainingBalance = purchase.total - totalPaid;
  const isPaid = remainingBalance <= 0.01; // Account for floating point precision
  const isPartiallyPaid = totalPaid > 0 && !isPaid;
  const paymentProgress = (totalPaid / purchase.total) * 100;

  return {
    isPaid,
    isPartiallyPaid,
    remainingBalance: Math.max(0, remainingBalance),
    totalPaid,
    paymentProgress: Math.min(100, paymentProgress),
  };
};

export const getPurchaseStatusBadge = async (purchase: Purchase): Promise<{ label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> => {
  const statusInfo = await calculatePurchaseStatus(purchase);

  if (statusInfo.isPaid && purchase.status === 'received') {
    return { label: 'PAID & RECEIVED', variant: 'default' };
  }

  if (statusInfo.isPaid) {
    return { label: 'PAID', variant: 'default' };
  }

  if (statusInfo.isPartiallyPaid) {
    return { label: 'PARTIALLY PAID', variant: 'outline' };
  }

  if (purchase.status === 'cancelled') {
    return { label: 'CANCELLED', variant: 'destructive' };
  }

  return { label: purchase.status.replace('-', ' ').toUpperCase(), variant: 'secondary' };
};
