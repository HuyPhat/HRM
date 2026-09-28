import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Topbar, PageScroll } from '../components/Shell';
import { useCategories, useInventory, useWarehouses } from '../api/queries';
import { SearchIcon } from '../components/icons';

const STATUS_BADGE: Record<string, string> = {
  'In Stock': 'bg-success-soft text-success',
  'Low Stock': 'bg-warning-soft text-warning',
  'Out of Stock': 'bg-danger-soft text-danger'
};

export function InventoryPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [warehouseId, setWarehouseId] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data: warehouses } = useWarehouses();
  const { data: categories } = useCategories();
  const { data: rows, isLoading, isError } = useInventory({ warehouseId, category, search, lowStockOnly });

  return (
    <>
      <Topbar title={t('inventory.title')} live />
      <PageScroll>
        <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt border border-border rounded-lg px-3 py-1.5 w-[260px] box-border">
            <SearchIcon className="text-text-tertiary shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder={t('inventory.searchPlaceholder') ?? ''}
              className="border-none bg-transparent outline-none grow text-sm"
            />
          </div>
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-surface">
            <option value="">{t('inventory.allWarehouses')}</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>{w.code} · {w.name}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-surface">
            <option value="">{t('inventory.allCategories')}</option>
            {categories?.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="grow" />
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setLowStockOnly((v) => !v)}
              className="w-[38px] h-[21px] rounded-full relative shrink-0 transition-colors"
              style={{ background: lowStockOnly ? 'var(--accent)' : 'var(--border)' }}
              aria-pressed={lowStockOnly}
            >
              <span
                className="w-[17px] h-[17px] rounded-full bg-white absolute top-[2px] shadow transition-all"
                style={{ left: lowStockOnly ? '19px' : '2px' }}
              />
            </button>
            <span className="text-sm font-medium text-text-secondary">{t('inventory.lowStockOnly')}</span>
          </label>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {isLoading && <div className="p-5 text-sm text-text-secondary">{t('inventory.loading')}</div>}
          {isError && <div className="p-5 text-sm text-danger">{t('inventory.error')}</div>}
          {rows && (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {(['item', 'warehouse', 'onHand', 'reserved', 'available', 'reorderPoint', 'status', 'lastMovement'] as const).map((h, i) => (
                    <th key={h} className={`text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wide px-3 pb-2.5 pt-3 border-b border-border ${i >= 2 && i <= 5 ? 'text-right' : ''}`}>
                      {t(`inventory.table.${h}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-3 border-b border-border">
                      <div className="text-xs text-text-tertiary font-mono">{r.code}</div>
                      <div className="font-medium">{r.name}</div>
                    </td>
                    <td className="px-3 py-3 border-b border-border text-text-secondary">{r.warehouseCode} · {r.warehouseName}</td>
                    <td className="px-3 py-3 border-b border-border text-right font-mono">{r.onHand}</td>
                    <td className="px-3 py-3 border-b border-border text-right font-mono text-text-secondary">{r.reserved}</td>
                    <td className="px-3 py-3 border-b border-border text-right font-mono font-semibold">{r.available}</td>
                    <td className="px-3 py-3 border-b border-border text-right font-mono text-text-secondary">{r.reorderPoint}</td>
                    <td className="px-3 py-3 border-b border-border">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[r.status]}`}>
                        {t(`inventory.status.${r.status}`, { defaultValue: r.status })}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-border text-text-secondary">
                      {new Date(r.lastMovement).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-text-tertiary text-sm">{t('inventory.noMatches')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {rows && <div className="text-xs text-text-tertiary">{t('inventory.showingCount', { count: rows.length })}</div>}
      </PageScroll>
    </>
  );
}
