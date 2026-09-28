import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Topbar, PageScroll } from '../components/Shell';
import { useCreatePurchaseOrder, useVendors, useWarehouses } from '../api/queries';
import { useAuth } from '../auth/AuthContext';
import { PlusIcon, TrashIcon } from '../components/icons';

interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
}

const STEP_KEYS = ['vendorDetails', 'lineItems', 'reviewSubmit'] as const;

function money(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function POWizardPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const { user } = useAuth();
  const { data: vendors } = useVendors();
  const { data: warehouses } = useWarehouses();
  const createPO = useCreatePurchaseOrder();

  const [step, setStep] = useState(1);
  const [vendorId, setVendorId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [costCenter, setCostCenter] = useState('CC-204 · Procurement');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [priority, setPriority] = useState('Standard');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { description: 'Cold-rolled steel sheet 2mm', qty: 40, unitPrice: 320 },
    { description: 'Anti-corrosion coating', qty: 40, unitPrice: 105 },
    { description: 'Freight & handling', qty: 1, unitPrice: 1240 }
  ]);
  const [submittedPo, setSubmittedPo] = useState<string | null>(null);

  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const updateItem = (i: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const addItem = () => setItems((prev) => [...prev, { description: 'New line item', qty: 1, unitPrice: 0 }]);

  const selectedVendor = vendors?.find((v) => v.id === vendorId);
  const selectedWarehouse = warehouses?.find((w) => w.id === warehouseId);

  const reset = () => {
    setStep(1);
    setSubmittedPo(null);
  };

  const submit = async () => {
    const po = await createPO.mutateAsync({
      vendorId,
      warehouseId,
      costCenter,
      deliveryDate: new Date(deliveryDate).toISOString(),
      priority,
      notes: notes || undefined,
      lines: items.map((it) => ({ description: it.description, qty: it.qty, unitPrice: it.unitPrice }))
    });
    setSubmittedPo(po.number);
  };

  return (
    <>
      <Topbar title={t('poWizard.title')} />
      <PageScroll>
        <div className="w-full max-w-[820px] mx-auto">
          {submittedPo ? (
            <div className="bg-surface border border-border rounded-xl p-14 flex flex-col items-center text-center gap-3.5 mt-10">
              <div className="w-16 h-16 rounded-full bg-success-soft text-success flex items-center justify-center">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" />
                </svg>
              </div>
              <div className="text-[19px] font-bold">{t('poWizard.submittedTitle', { number: submittedPo })}</div>
              <div className="text-[13.5px] text-text-secondary max-w-[420px]">
                {t('poWizard.submittedBody')}
              </div>
              <div className="flex gap-2.5 mt-2.5">
                <button
                  onClick={() => {
                    reset();
                    setItems([{ description: 'New line item', qty: 1, unitPrice: 0 }]);
                  }}
                  className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg px-4.5 py-2.5"
                >
                  {t('poWizard.createAnother')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start mb-7">
                {STEP_KEYS.map((key, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const current = step === n;
                  return (
                    <div key={key} className="flex items-start" style={{ flexGrow: i < STEP_KEYS.length - 1 ? 1 : 0 }}>
                      <button
                        type="button"
                        onClick={() => n < step && setStep(n)}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-bold border-2"
                          style={{
                            background: done ? 'var(--success)' : 'var(--surface)',
                            color: done ? '#fff' : current ? 'var(--accent)' : 'var(--text-tertiary)',
                            borderColor: done ? 'var(--success)' : current ? 'var(--accent)' : 'var(--border)'
                          }}
                        >
                          {done ? '✓' : n}
                        </div>
                        <div className={`text-xs font-semibold whitespace-nowrap ${current ? 'text-text-primary' : 'text-text-tertiary'}`}>{t(`poWizard.steps.${key}`)}</div>
                      </button>
                      {i < STEP_KEYS.length - 1 && <div className="grow h-0.5 mt-[15px]" style={{ background: done ? 'var(--success)' : 'var(--border)' }} />}
                    </div>
                  );
                })}
              </div>

              {step === 1 && (
                <div className="bg-surface border border-border rounded-xl p-7">
                  <h2 className="m-0 mb-5 text-[15px] font-bold">{t('poWizard.vendorDetailsHeading')}</h2>
                  <div className="grid grid-cols-2 gap-4.5">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('poWizard.vendor')}</label>
                      <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm">
                        <option value="">{t('poWizard.selectVendor')}</option>
                        {vendors?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('poWizard.requestedBy')}</label>
                      <input disabled value={user?.name ?? ''} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm bg-surface-alt text-text-secondary" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('poWizard.costCenter')}</label>
                      <input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('poWizard.neededBy')}</label>
                      <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('poWizard.deliveryWarehouse')}</label>
                      <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm">
                        <option value="">{t('poWizard.selectWarehouse')}</option>
                        {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('poWizard.priority')}</label>
                      <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm">
                        <option value="Standard">{t('poWizard.priorityStandard')}</option>
                        <option value="Urgent">{t('poWizard.priorityUrgent')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4.5">
                    <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('poWizard.notesForApprover')}</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={t('poWizard.notesPlaceholder') ?? ''} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm resize-none" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-surface border border-border rounded-xl p-7">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="m-0 text-[15px] font-bold">{t('poWizard.lineItemsHeading')}</h2>
                    <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm font-semibold border border-border rounded-lg px-4 py-2 hover:bg-surface-alt">
                      <PlusIcon /> {t('poWizard.addLineItem')}
                    </button>
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">{t('poWizard.description')}</th>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[90px]">{t('poWizard.qty')}</th>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[120px]">{t('poWizard.unitPrice')}</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[110px]">{t('poWizard.total')}</th>
                        <th className="w-10 border-b border-border" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-2 border-b border-border">
                            <input value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} className="w-full box-border border border-border rounded-lg px-2.5 py-2 text-sm" />
                          </td>
                          <td className="py-2.5 pr-2 border-b border-border">
                            <input type="number" value={it.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} className="w-full box-border border border-border rounded-lg px-2.5 py-2 text-sm" />
                          </td>
                          <td className="py-2.5 pr-2 border-b border-border">
                            <input type="number" value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} className="w-full box-border border border-border rounded-lg px-2.5 py-2 text-sm" />
                          </td>
                          <td className="py-2.5 border-b border-border text-right font-mono font-semibold">{money(it.qty * it.unitPrice)}</td>
                          <td className="py-2.5 border-b border-border text-center">
                            <button onClick={() => removeItem(i)} aria-label={t('poWizard.removeLineItem') ?? ''} className="text-text-tertiary hover:text-danger hover:bg-danger-soft rounded-lg p-1.5">
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mt-4">
                    <div className="w-60">
                      <div className="flex justify-between text-sm text-text-secondary py-1"><span>{t('poWizard.subtotal')}</span><span className="font-mono">{money(subtotal)}</span></div>
                      <div className="flex justify-between text-sm text-text-secondary py-1"><span>{t('poWizard.tax')}</span><span className="font-mono">{money(tax)}</span></div>
                      <div className="flex justify-between text-[14.5px] font-bold pt-2 mt-1 border-t border-border"><span>{t('poWizard.total')}</span><span className="font-mono">{money(total)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="bg-surface border border-border rounded-xl p-7">
                  <h2 className="m-0 mb-4.5 text-[15px] font-bold">{t('poWizard.reviewSubmitHeading')}</h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-5 text-[13.5px]">
                    <div><span className="text-text-tertiary">{t('poWizard.vendor')}</span><div className="font-semibold">{selectedVendor?.name ?? '—'}</div></div>
                    <div><span className="text-text-tertiary">{t('poWizard.costCenter')}</span><div className="font-semibold">{costCenter}</div></div>
                    <div><span className="text-text-tertiary">{t('poWizard.neededBy')}</span><div className="font-semibold">{new Date(deliveryDate).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
                    <div><span className="text-text-tertiary">{t('poWizard.deliveryWarehouse')}</span><div className="font-semibold">{selectedWarehouse ? `${selectedWarehouse.code} · ${selectedWarehouse.name}` : '—'}</div></div>
                  </div>
                  <table className="w-full border-collapse mb-4">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">{t('poWizard.description')}</th>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[90px]">{t('poWizard.qty')}</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[120px]">{t('poWizard.unitPrice')}</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[110px]">{t('poWizard.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2.5 border-b border-border">{it.description}</td>
                          <td className="py-2.5 border-b border-border font-mono">{it.qty}</td>
                          <td className="py-2.5 border-b border-border text-right font-mono">{money(it.unitPrice)}</td>
                          <td className="py-2.5 border-b border-border text-right font-mono font-semibold">{money(it.qty * it.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mb-5">
                    <div className="text-base font-bold">{t('poWizard.totalLabel')} <span className="font-mono">{money(total)}</span></div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3.5 bg-accent-soft rounded-lg text-sm">
                    <Trans i18nKey="poWizard.routeNotice" components={{ b1: <strong />, b2: <strong /> }} />
                  </div>
                  {createPO.isError && (
                    <div className="mt-3 text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
                      {t('poWizard.submitError')}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-5">
                {step > 1 ? (
                  <button onClick={() => setStep((s) => s - 1)} className="border border-border rounded-lg px-4.5 py-2.5 text-sm font-semibold hover:bg-surface-alt">{t('poWizard.back')}</button>
                ) : <span />}
                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={step === 1 && (!vendorId || !warehouseId)}
                    className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg px-4.5 py-2.5 disabled:opacity-50"
                  >
                    {t('poWizard.continue')}
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={createPO.isPending}
                    className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg px-4.5 py-2.5 disabled:opacity-60"
                  >
                    {createPO.isPending ? t('poWizard.submitting') : t('poWizard.submit')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </PageScroll>
    </>
  );
}
