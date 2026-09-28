export interface InventoryRow {
  id: string;
  code: string;
  name: string;
  category: string;
  warehouseCode: string;
  warehouseName: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastMovement: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
}

export interface Vendor {
  id: string;
  name: string;
}

export interface PurchaseOrderLine {
  id: string;
  description: string;
  qty: number;
  unitPrice: string;
}

export interface ApprovalStep {
  id: string;
  role: 'MANAGER' | 'FINANCE';
  approverName: string;
  sequence: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string | null;
  decidedAt?: string | null;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  vendor: Vendor;
  requester: { id: string; name: string; department: string };
  warehouse: Warehouse;
  costCenter: string;
  deliveryDate: string;
  priority: string;
  notes?: string | null;
  status: 'PENDING_MANAGER' | 'PENDING_FINANCE' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  lines: PurchaseOrderLine[];
  approvals: ApprovalStep[];
}

export interface DashboardSummary {
  kpis: { key: string; value: number; secondaryValue: number | null; tone: string }[];
  aging: { key: string; amount: number; pct: number }[];
  transactions: { date: string; type: string; reference: string; party: string; amount: number; status: string }[];
  pendingApprovals: { id: string; number: string; vendor: string; amount: number; requester: string; waiting: string }[];
}
