import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummary } from './dto/dashboard.types';

const humanizeWaiting = (since: Date) => {
  const diffMs = Date.now() - since.getTime();
  const hours = Math.max(1, Math.round(diffMs / (3600 * 1000)));
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
};

const AGING_BUCKETS = [
  { key: 'current', min: 0, max: 0 },
  { key: 'd1_30', min: 1, max: 30 },
  { key: 'd31_60', min: 31, max: 60 },
  { key: 'd61_90', min: 61, max: 90 },
  { key: 'd90_plus', min: 91, max: Infinity }
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(locale = 'en-US'): Promise<DashboardSummary> {
    const pos = await this.prisma.purchaseOrder.findMany({
      include: { lines: true, vendor: true, requester: true }
    });

    const totalOf = (po: (typeof pos)[number]) => po.lines.reduce((sum, l) => sum + l.qty * Number(l.unitPrice), 0);

    const openPOs = pos.filter((po) => po.status !== 'REJECTED');
    const pendingPOs = pos.filter((po) => po.status === 'PENDING_MANAGER' || po.status === 'PENDING_FINANCE');
    const approvedPOs = pos.filter((po) => po.status === 'APPROVED');

    const totalPayables = [...pendingPOs, ...approvedPOs].reduce((s, po) => s + totalOf(po), 0);
    const pendingAmount = pendingPOs.reduce((s, po) => s + totalOf(po), 0);

    const now = Date.now();
    const cashOutflow30 = openPOs
      .filter((po) => po.deliveryDate.getTime() >= now && po.deliveryDate.getTime() - now <= 30 * 86400000)
      .reduce((s, po) => s + totalOf(po), 0);
    const overdueReceipt = pos.filter((po) => po.status === 'APPROVED' && po.deliveryDate.getTime() < now).length;

    const kpis = [
      { key: 'totalPayables', value: totalPayables, secondaryValue: pendingPOs.length + approvedPOs.length, tone: 'neutral' },
      { key: 'pendingApprovals', value: pendingPOs.length, secondaryValue: pendingAmount, tone: 'neutral' },
      { key: 'cashOutflow30d', value: cashOutflow30, secondaryValue: null, tone: 'neutral' },
      { key: 'openPurchaseOrders', value: openPOs.length, secondaryValue: overdueReceipt, tone: overdueReceipt > 0 ? 'danger' : 'neutral' }
    ];

    const openInvoices = await this.prisma.transaction.findMany({
      where: { type: 'Invoice', status: { not: 'Completed' } }
    });
    const bucketAmounts = AGING_BUCKETS.map((bucket) => {
      const amount = openInvoices
        .filter((t) => {
          const ageDays = Math.floor((now - t.date.getTime()) / 86400000);
          return ageDays >= bucket.min && ageDays <= bucket.max;
        })
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      return { key: bucket.key, amount };
    });
    const maxBucket = Math.max(1, ...bucketAmounts.map((b) => b.amount));
    const aging = bucketAmounts.map((b) => ({ ...b, pct: Math.round((b.amount / maxBucket) * 100) }));

    const recentTransactions = await this.prisma.transaction.findMany({ orderBy: { date: 'desc' }, take: 8 });
    const transactions = recentTransactions.map((t) => ({
      date: t.date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      type: t.type,
      reference: t.reference,
      party: t.party,
      amount: Number(t.amount),
      status: t.status
    }));

    const pendingApprovals = pendingPOs
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, 4)
      .map((po) => ({
        id: po.id,
        number: po.number,
        vendor: po.vendor.name,
        amount: totalOf(po),
        requester: po.requester.name,
        waiting: humanizeWaiting(po.createdAt)
      }));

    return { kpis, aging, transactions, pendingApprovals };
  }
}
