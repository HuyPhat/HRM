import { useState } from 'react';
import { Topbar, PageScroll } from '../components/Shell';
import { useCreatePurchaseOrder, useVendors, useWarehouses } from '../api/queries';
import { useAuth } from '../auth/AuthContext';
import { PlusIcon, TrashIcon } from '../components/icons';

interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
}

const STEPS = ['Vendor & Details', 'Line Items', 'Review & Submit'];

function money(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function POWizardPage() {
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
      <Topbar title="New Purchase Order" />
      <PageScroll>
        <div className="w-full max-w-[820px] mx-auto">
          {submittedPo ? (
            <div className="bg-surface border border-border rounded-xl p-14 flex flex-col items-center text-center gap-3.5 mt-10">
              <div className="w-16 h-16 rounded-full bg-success-soft text-success flex items-center justify-center">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" />
                </svg>
              </div>
              <div className="text-[19px] font-bold">Purchase order {submittedPo} submitted</div>
              <div className="text-[13.5px] text-text-secondary max-w-[420px]">
                Routed to R. Osei (Manager) for the first approval step. It will show up in the Approvals inbox once Finance's turn comes.
              </div>
              <div className="flex gap-2.5 mt-2.5">
                <button
                  onClick={() => {
                    reset();
                    setItems([{ description: 'New line item', qty: 1, unitPrice: 0 }]);
                  }}
                  className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg px-4.5 py-2.5"
                >
                  Create another PO
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start mb-7">
                {STEPS.map((label, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const current = step === n;
                  return (
                    <div key={label} className="flex items-start" style={{ flexGrow: i < STEPS.length - 1 ? 1 : 0 }}>
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
                        <div className={`text-xs font-semibold whitespace-nowrap ${current ? 'text-text-primary' : 'text-text-tertiary'}`}>{label}</div>
                      </button>
                      {i < STEPS.length - 1 && <div className="grow h-0.5 mt-[15px]" style={{ background: done ? 'var(--success)' : 'var(--border)' }} />}
                    </div>
                  );
                })}
              </div>

              {step === 1 && (
                <div className="bg-surface border border-border rounded-xl p-7">
                  <h2 className="m-0 mb-5 text-[15px] font-bold">Vendor &amp; details</h2>
                  <div className="grid grid-cols-2 gap-4.5">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">Vendor</label>
                      <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm">
                        <option value="">Select a vendor…</option>
                        {vendors?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">Requested by</label>
                      <input disabled value={user?.name ?? ''} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm bg-surface-alt text-text-secondary" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">Cost center</label>
                      <input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">Needed by</label>
                      <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">Delivery warehouse</label>
                      <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm">
                        <option value="">Select a warehouse…</option>
                        {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">Priority</label>
                      <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm">
                        <option>Standard</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4.5">
                    <label className="text-xs font-semibold text-text-secondary block mb-1.5">Notes for approver</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional context for the approval chain…" className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm resize-none" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-surface border border-border rounded-xl p-7">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="m-0 text-[15px] font-bold">Line items</h2>
                    <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm font-semibold border border-border rounded-lg px-4 py-2 hover:bg-surface-alt">
                      <PlusIcon /> Add line item
                    </button>
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">Description</th>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[90px]">Qty</th>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[120px]">Unit price</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[110px]">Total</th>
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
                            <button onClick={() => removeItem(i)} aria-label="Remove line item" className="text-text-tertiary hover:text-danger hover:bg-danger-soft rounded-lg p-1.5">
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mt-4">
                    <div className="w-60">
                      <div className="flex justify-between text-sm text-text-secondary py-1"><span>Subtotal</span><span className="font-mono">{money(subtotal)}</span></div>
                      <div className="flex justify-between text-sm text-text-secondary py-1"><span>Tax (8%)</span><span className="font-mono">{money(tax)}</span></div>
                      <div className="flex justify-between text-[14.5px] font-bold pt-2 mt-1 border-t border-border"><span>Total</span><span className="font-mono">{money(total)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="bg-surface border border-border rounded-xl p-7">
                  <h2 className="m-0 mb-4.5 text-[15px] font-bold">Review &amp; submit</h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-5 text-[13.5px]">
                    <div><span className="text-text-tertiary">Vendor</span><div className="font-semibold">{selectedVendor?.name ?? '—'}</div></div>
                    <div><span className="text-text-tertiary">Cost center</span><div className="font-semibold">{costCenter}</div></div>
                    <div><span className="text-text-tertiary">Needed by</span><div className="font-semibold">{new Date(deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
                    <div><span className="text-text-tertiary">Delivery warehouse</span><div className="font-semibold">{selectedWarehouse ? `${selectedWarehouse.code} · ${selectedWarehouse.name}` : '—'}</div></div>
                  </div>
                  <table className="w-full border-collapse mb-4">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border">Description</th>
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[90px]">Qty</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[120px]">Unit price</th>
                        <th className="text-right text-[11px] font-semibold text-text-tertiary uppercase pb-2.5 border-b border-border w-[110px]">Total</th>
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
                    <div className="text-base font-bold">Total: <span className="font-mono">{money(total)}</span></div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3.5 bg-accent-soft rounded-lg text-sm">
                    This PO will route to <strong>&nbsp;R. Osei (Manager)&nbsp;</strong>, then <strong>&nbsp;Jordan Lee (Finance)&nbsp;</strong> for approval.
                  </div>
                  {createPO.isError && (
                    <div className="mt-3 text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
                      Could not submit this PO. Check that a vendor and warehouse are selected.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-5">
                {step > 1 ? (
                  <button onClick={() => setStep((s) => s - 1)} className="border border-border rounded-lg px-4.5 py-2.5 text-sm font-semibold hover:bg-surface-alt">Back</button>
                ) : <span />}
                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={step === 1 && (!vendorId || !warehouseId)}
                    className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg px-4.5 py-2.5 disabled:opacity-50"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={createPO.isPending}
                    className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg px-4.5 py-2.5 disabled:opacity-60"
                  >
                    {createPO.isPending ? 'Submitting…' : 'Submit for approval'}
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
