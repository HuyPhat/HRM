import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Topbar, PageScroll } from '../components/Shell';
import { useApprovals, useDecideApproval } from '../api/queries';
import { useAuth } from '../auth/AuthContext';
import type { PurchaseOrder } from '../api/types';

function money(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function waitingLabel(t: TFunction, createdAt: string) {
  const hours = Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 3600000));
  return hours < 24 ? t('time.hours', { count: hours }) : t('time.days', { count: Math.round(hours / 24) });
}

function roleLabel(t: TFunction, role: string) {
  return t(`approvals.role.${role}`, { defaultValue: role });
}

function poTotal(po: PurchaseOrder) {
  return po.lines.reduce((s, l) => s + l.qty * Number(l.unitPrice), 0);
}

export function ApprovalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: approvals, isLoading, isError } = useApprovals();
  const decide = useDecideApproval();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!selectedId && approvals && approvals.length > 0) setSelectedId(approvals[0].id);
  }, [approvals, selectedId]);

  const selected = approvals?.find((po) => po.id === selectedId) ?? null;
  const currentStep = selected?.approvals.find((s) => s.status === 'PENDING');
  const canAct = !!currentStep && currentStep.role === user?.role;

  const act = (decision: 'approved' | 'rejected') => {
    if (!selected) return;
    decide.mutate(
      { id: selected.id, decision, comment: comment || undefined },
      { onSuccess: () => setComment('') }
    );
  };

  return (
    <>
      <Topbar title={t('approvals.title')} />
      <PageScroll>
        {isLoading && <div className="text-sm text-text-secondary">{t('approvals.loading')}</div>}
        {isError && <div className="text-sm text-danger">{t('approvals.error')}</div>}
        {approvals && (
          <div className="flex gap-0 grow min-h-0 -m-7 mt-0">
            <div className="w-[400px] shrink-0 border-r border-border overflow-y-auto p-3.5 box-border flex flex-col gap-1">
              {approvals.map((po) => {
                const isSelected = po.id === selectedId;
                const step = po.approvals.find((s) => s.status === 'PENDING');
                return (
                  <button
                    key={po.id}
                    onClick={() => setSelectedId(po.id)}
                    className="flex items-center gap-3 w-full box-border p-3 rounded-lg text-left hover:bg-surface-alt"
                    style={{ background: isSelected ? 'var(--accent-soft)' : undefined }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                    <div className="grow min-w-0">
                      <div className="text-[13.5px] font-bold">{po.number}</div>
                      <div className="text-xs text-text-secondary">{po.vendor.name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-bold font-mono">{money(poTotal(po))}</div>
                      <div className="text-[10.5px] mt-0.5 font-semibold text-text-tertiary">
                        {step ? t('approvals.needs', { role: roleLabel(t, step.role) }) : t('approvals.decided')}
                      </div>
                    </div>
                  </button>
                );
              })}
              {approvals.length === 0 && <div className="text-sm text-text-tertiary p-3">{t('approvals.empty')}</div>}
            </div>

            <div className="grow overflow-y-auto p-7 box-border">
              {selected ? (
                <div className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-bold">{selected.number}</div>
                      <div className="text-[13.5px] text-text-secondary mt-0.5">
                        {t('approvals.requestedByWaiting', {
                          vendor: selected.vendor.name,
                          name: selected.requester.name,
                          department: selected.requester.department,
                          waiting: waitingLabel(t, selected.createdAt)
                        })}
                      </div>
                    </div>
                    <div className="text-2xl font-bold font-mono">{money(poTotal(selected))}</div>
                  </div>

                  <div className="my-6 py-5 px-2.5 bg-surface-alt rounded-lg flex items-center">
                    {selected.approvals.map((step, i) => {
                      const done = step.status === 'APPROVED';
                      const rejected = step.status === 'REJECTED';
                      const current = step.status === 'PENDING' && !selected.approvals.slice(0, i).some((s) => s.status === 'PENDING');
                      return (
                        <div key={step.id} className="flex items-center grow">
                          <div className="flex flex-col items-center gap-1.5 w-[104px] shrink-0">
                            <div
                              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-bold border-2"
                              style={{
                                background: rejected ? 'var(--danger)' : done ? 'var(--success)' : 'var(--surface)',
                                color: rejected || done ? '#fff' : current ? 'var(--accent)' : 'var(--text-tertiary)',
                                borderColor: rejected ? 'var(--danger)' : done ? 'var(--success)' : current ? 'var(--accent)' : 'var(--border)'
                              }}
                            >
                              {rejected ? '✕' : done ? '✓' : i + 1}
                            </div>
                            <div className="text-[11.5px] font-semibold text-center">{roleLabel(t, step.role)}</div>
                            <div className="text-[10.5px] text-text-tertiary text-center">{step.approverName}</div>
                          </div>
                          {i < selected.approvals.length - 1 && (
                            <div className="grow h-0.5 mx-1.5" style={{ background: done ? 'var(--success)' : 'var(--border)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <h2 className="m-0 mb-2.5 text-[13.5px] font-bold">{t('approvals.lineItems')}</h2>
                  <table className="w-full border-collapse mb-5">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">{t('poWizard.description')}</th>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">{t('poWizard.qty')}</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">{t('poWizard.unitPrice')}</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">{t('poWizard.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2.5 border-b border-border">{l.description}</td>
                          <td className="py-2.5 border-b border-border font-mono">{l.qty}</td>
                          <td className="py-2.5 border-b border-border text-right font-mono">{money(Number(l.unitPrice))}</td>
                          <td className="py-2.5 border-b border-border text-right font-mono font-semibold">{money(l.qty * Number(l.unitPrice))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {canAct ? (
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('approvals.comment')}</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        placeholder={t('approvals.commentPlaceholder') ?? ''}
                        className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm resize-none mb-3.5"
                      />
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => act('approved')}
                          disabled={decide.isPending}
                          className="bg-success hover:opacity-90 text-white font-semibold text-sm rounded-lg px-4.5 py-2.5 disabled:opacity-60"
                        >
                          {t('approvals.approve')}
                        </button>
                        <button
                          onClick={() => act('rejected')}
                          disabled={decide.isPending}
                          className="border border-danger text-danger hover:bg-danger-soft font-semibold text-sm rounded-lg px-4.5 py-2.5 disabled:opacity-60"
                        >
                          {t('approvals.reject')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-surface-alt text-text-secondary text-sm">
                      {currentStep
                        ? t('approvals.notActionable', {
                            role: roleLabel(t, currentStep.role),
                            who: user?.role === 'MANAGER' ? t('approvals.you') : t('approvals.nextStep')
                          })
                        : t('approvals.fullyDecided')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-text-tertiary">{t('approvals.selectPrompt')}</div>
              )}
            </div>
          </div>
        )}
      </PageScroll>
    </>
  );
}
