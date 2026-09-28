import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch, gqlFetch } from './client';
import type { DashboardSummary, InventoryRow, PurchaseOrder, Vendor, Warehouse } from './types';

const DASHBOARD_QUERY = /* GraphQL */ `
  query DashboardSummary($locale: String) {
    dashboardSummary(locale: $locale) {
      kpis { key value secondaryValue tone }
      aging { key amount pct }
      transactions { date type reference party amount status }
      pendingApprovals { id number vendor amount requester waiting }
    }
  }
`;

export function useDashboard() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  return useQuery({
    queryKey: ['dashboard', locale],
    queryFn: () =>
      gqlFetch<{ dashboardSummary: DashboardSummary }>(DASHBOARD_QUERY, { locale }).then((d) => d.dashboardSummary),
    refetchInterval: 15000
  });
}

export interface InventoryFilters {
  warehouseId?: string;
  category?: string;
  lowStockOnly?: boolean;
  search?: string;
}

export function useInventory(filters: InventoryFilters) {
  const params = new URLSearchParams();
  if (filters.warehouseId) params.set('warehouseId', filters.warehouseId);
  if (filters.category) params.set('category', filters.category);
  if (filters.lowStockOnly) params.set('lowStockOnly', 'true');
  if (filters.search) params.set('search', filters.search);

  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => apiFetch<InventoryRow[]>(`/inventory?${params.toString()}`)
  });
}

export function useWarehouses() {
  return useQuery({ queryKey: ['warehouses'], queryFn: () => apiFetch<Warehouse[]>('/inventory/warehouses') });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => apiFetch<string[]>('/inventory/categories') });
}

export function useVendors() {
  return useQuery({ queryKey: ['vendors'], queryFn: () => apiFetch<Vendor[]>('/vendors') });
}

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiFetch<PurchaseOrder[]>('/approvals'),
    refetchInterval: 15000
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, comment }: { id: string; decision: 'approved' | 'rejected'; comment?: string }) =>
      apiFetch<PurchaseOrder>(`/approvals/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision, comment }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  warehouseId: string;
  costCenter: string;
  deliveryDate: string;
  priority?: string;
  notes?: string;
  lines: { description: string; qty: number; unitPrice: number }[];
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePurchaseOrderInput) =>
      apiFetch<PurchaseOrder>('/purchase-orders', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}
