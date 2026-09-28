import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Topbar, PageScroll } from '../components/Shell';
import { useDashboard } from '../api/queries';
import { AlertTriangleIcon } from '../components/icons';

const TONE_COLOR: Record<string, string> = {
  danger: 'text-danger',
  neutral: 'text-text-secondary'
};

const STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-warning-soft text-warning',
  Completed: 'bg-success-soft text-success',
  Approved: 'bg-success-soft text-success',
  Overdue: 'bg-danger-soft text-danger'
};

function money(n: number) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const KPI_CONFIG: Record<string, { isMoney: boolean; delta: (t: TFunction, secondary: number | null) => string }> = {
  totalPayables: { isMoney: true, delta: (t, s) => t('dashboard.kpi.totalPayables.delta', { count: s ?? 0 }) },
  pendingApprovals: { isMoney: false, delta: (t, s) => t('dashboard.kpi.pendingApprovals.delta', { amount: money(s ?? 0) }) },
  cashOutflow30d: { isMoney: true, delta: (t) => t('dashboard.kpi.cashOutflow30d.delta') },
  openPurchaseOrders: { isMoney: false, delta: (t, s) => t('dashboard.kpi.openPurchaseOrders.delta', { count: s ?? 0 }) }
};

function translateWaiting(t: TFunction, waiting: string) {
  const match = /^(\d+)([hd])$/.exec(waiting);
  if (!match) return waiting;
  const count = Number(match[1]);
  return t(match[2] === 'h' ? 'time.hours' : 'time.days', { count });
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDashboard();

  return (
    <>
      <Topbar title={t('dashboard.title')} />
      <PageScroll>
        {isLoading && <div className="text-sm text-text-secondary">{t('dashboard.loading')}</div>}
        {isError && <div className="text-sm text-danger">{t('dashboard.error')}</div>}
        {data && (
          <>
            <div className="grid grid-cols-4 gap-4">
              {data.kpis.map((kpi) => {
                const config = KPI_CONFIG[kpi.key];
                if (!config) return null;
                return (
                  <div key={kpi.key} className="bg-surface border border-border rounded-xl p-[18px_18px_16px_18px]">
                    <div className="text-[12.5px] text-text-secondary font-medium">{t(`dashboard.kpi.${kpi.key}.label`)}</div>
                    <div className="text-[26px] font-bold mt-1.5">{config.isMoney ? money(kpi.value) : kpi.value}</div>
                    <div className={`text-xs mt-1.5 font-medium ${TONE_COLOR[kpi.tone] ?? 'text-text-secondary'}`}>
                      {config.delta(t, kpi.secondaryValue)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="m-0 text-[14.5px] font-bold">{t('dashboard.apAging')}</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {data.aging.map((row) => (
                    <div key={row.key} className="flex items-center gap-3">
                      <div className="w-[76px] shrink-0 text-[12.5px] text-text-secondary">{t(`dashboard.aging.${row.key}`)}</div>
                      <div className="grow h-5 bg-surface-alt rounded-md overflow-hidden">
                        <div className="h-full bg-accent rounded-md" style={{ width: `${row.pct}%` }} />
                      </div>
                      <div className="w-[82px] shrink-0 text-right text-[12.5px] font-semibold font-mono">{money(row.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="m-0 text-[14.5px] font-bold">{t('dashboard.pendingApprovals')}</h2>
                  <Link to="/approvals" className="text-[12.5px] font-semibold text-accent hover:text-accent-hover">{t('dashboard.viewAll')}</Link>
                </div>
                <div className="flex flex-col gap-0.5">
                  {data.pendingApprovals.map((item) => (
                    <Link
                      key={item.id}
                      to="/approvals"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-surface-alt text-inherit no-underline"
                    >
                      <div className="w-[34px] h-[34px] rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
                        <AlertTriangleIcon />
                      </div>
                      <div className="grow min-w-0">
                        <div className="text-[13px] font-semibold">{item.number} · {item.vendor}</div>
                        <div className="text-[11.5px] text-text-tertiary">{t('dashboard.requestedByWaiting', { name: item.requester, waiting: translateWaiting(t, item.waiting) })}</div>
                      </div>
                      <div className="text-[13px] font-bold shrink-0 font-mono">{money(item.amount)}</div>
                    </Link>
                  ))}
                  {data.pendingApprovals.length === 0 && (
                    <div className="text-sm text-text-tertiary py-2">{t('dashboard.nothingWaiting')}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <h2 className="m-0 text-[14.5px] font-bold">{t('dashboard.recentTransactions')}</h2>
                <span className="live-dot" />
                <span className="text-[11.5px] text-text-tertiary font-semibold">{t('common.live')}</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {(['date', 'type', 'reference', 'party', 'amount', 'status'] as const).map((h, i) => (
                      <th key={h} className={`text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wide pb-2.5 border-b border-border ${i === 4 ? 'text-right' : ''}`}>
                        {t(`dashboard.table.${h}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((row) => (
                    <tr key={row.reference + row.date}>
                      <td className="py-3 border-b border-border text-text-secondary text-sm">{row.date}</td>
                      <td className="py-3 border-b border-border text-sm">{t(`dashboard.txType.${row.type}`, { defaultValue: row.type })}</td>
                      <td className="py-3 border-b border-border text-sm font-mono">{row.reference}</td>
                      <td className="py-3 border-b border-border text-sm">{row.party}</td>
                      <td className="py-3 border-b border-border text-sm text-right font-mono">{money(row.amount)}</td>
                      <td className="py-3 border-b border-border text-sm">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[row.status] ?? 'bg-surface-alt text-text-secondary'}`}>
                          {t(`dashboard.status.${row.status}`, { defaultValue: row.status })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PageScroll>
    </>
  );
}
