import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummary } from './dto/dashboard.types';

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const humanizeWaiting = (since: Date) => {
  const diffMs = Date.now() - since.getTime();
  const hours = Math.max(1, Math.round(diffMs / (3600 * 1000)));
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
};

const AGING_BUCKETS = [
  { label: 'Current', min: 0, max: 0 },
  { label: '1–30 days', min: 1, max: 30 },
  { label: '31–60 days', min: 31, max: 60 },
  { label: '61–90 days', min: 61, max: 90 },
  { label: '90+ days', min: 91, max: Infinity }
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummary> {
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
      { label: 'Total Payables', value: fmt(totalPayables), delta: `${pendingPOs.length + approvedPOs.length} POs outstanding`, tone: 'neutral' },
      { label: 'Pending Approvals', value: String(pendingPOs.length), delta: `${fmt(pendingAmount)} awaiting sign-off`, tone: 'neutral' },
      { label: 'Cash Outflow (30d)', value: fmt(cashOutflow30), delta: 'Forecasted from open POs', tone: 'neutral' },
      { label: 'Open Purchase Orders', value: String(openPOs.length), delta: `${overdueReceipt} overdue receipt`, tone: overdueReceipt > 0 ? 'danger' : 'neutral' }
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
      return { label: bucket.label, amount };
    });
    const maxBucket = Math.max(1, ...bucketAmounts.map((b) => b.amount));
    const aging = bucketAmounts.map((b) => ({ ...b, pct: Math.round((b.amount / maxBucket) * 100) }));

    const recentTransactions = await this.prisma.transaction.findMany({ orderBy: { date: 'desc' }, take: 8 });
    const transactions = recentTransactions.map((t) => ({
      date: t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
