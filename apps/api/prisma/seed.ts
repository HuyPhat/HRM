import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);
const daysAgo = (d: number) => hoursAgo(d * 24);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 3600 * 1000);

async function main() {
  await prisma.approvalStep.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.item.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const [alvarez, osei, jordan, kim, tran] = await Promise.all([
    prisma.user.create({ data: { email: 'requester@meridian.dev', passwordHash, name: 'D. Alvarez', initials: 'DA', department: 'Procurement', role: 'REQUESTER' } }),
    prisma.user.create({ data: { email: 'manager@meridian.dev', passwordHash, name: 'R. Osei', initials: 'RO', department: 'Operations', role: 'MANAGER' } }),
    prisma.user.create({ data: { email: 'finance@meridian.dev', passwordHash, name: 'Jordan Lee', initials: 'JL', department: 'Finance', role: 'FINANCE' } }),
    prisma.user.create({ data: { email: 'warehouse@meridian.dev', passwordHash, name: 'S. Kim', initials: 'SK', department: 'Warehouse', role: 'REQUESTER' } }),
    prisma.user.create({ data: { email: 'logistics@meridian.dev', passwordHash, name: 'M. Tran', initials: 'MT', department: 'Logistics', role: 'ADMIN' } })
  ]);

  const vendorNames = ['Nordic Steel Co.', 'Orion Packaging', 'Vertex Components', 'Falcon Freight', 'BrightPack Ltd.'];
  const vendors = Object.fromEntries(
    await Promise.all(vendorNames.map(async (name) => [name, await prisma.vendor.create({ data: { name } })]))
  );

  const warehouseDefs = [
    { code: 'WH-01', name: 'Central' },
    { code: 'WH-02', name: 'North Yard' },
    { code: 'WH-03', name: 'Coastal' }
  ];
  const warehouses = Object.fromEntries(
    await Promise.all(warehouseDefs.map(async (w) => [w.code, await prisma.warehouse.create({ data: w })]))
  );

  const itemDefs = [
    { code: 'RM-2040', name: 'Cold-rolled steel sheet 2mm', category: 'Raw Materials', reorderPoint: 300, warehouse: 'WH-01', onHand: 640, reserved: 180, lastMovementDaysAgo: 1 },
    { code: 'RM-2041', name: 'Anti-corrosion coating 5L', category: 'Raw Materials', reorderPoint: 50, warehouse: 'WH-01', onHand: 42, reserved: 40, lastMovementDaysAgo: 2 },
    { code: 'PK-1032', name: 'Corrugated shipping carton L', category: 'Packaging', reorderPoint: 200, warehouse: 'WH-02', onHand: 0, reserved: 0, lastMovementDaysAgo: 8 },
    { code: 'CP-3390', name: 'Precision bearing assembly', category: 'Components', reorderPoint: 100, warehouse: 'WH-01', onHand: 218, reserved: 90, lastMovementDaysAgo: 1 },
    { code: 'PK-1033', name: 'Pallet wrap film roll', category: 'Packaging', reorderPoint: 80, warehouse: 'WH-02', onHand: 76, reserved: 10, lastMovementDaysAgo: 3 },
    { code: 'RM-2055', name: 'Grade-5 titanium rod', category: 'Raw Materials', reorderPoint: 150, warehouse: 'WH-03', onHand: 312, reserved: 60, lastMovementDaysAgo: 4 },
    { code: 'FN-4410', name: 'Retail display packaging kit', category: 'Packaging', reorderPoint: 40, warehouse: 'WH-02', onHand: 18, reserved: 12, lastMovementDaysAgo: 6 },
    { code: 'CP-3391', name: 'Hydraulic seal kit', category: 'Components', reorderPoint: 60, warehouse: 'WH-01', onHand: 154, reserved: 30, lastMovementDaysAgo: 5 },
    { code: 'RM-2060', name: 'Aluminum extrusion 6m', category: 'Raw Materials', reorderPoint: 40, warehouse: 'WH-03', onHand: 5, reserved: 0, lastMovementDaysAgo: 7 }
  ];

  for (const def of itemDefs) {
    const item = await prisma.item.create({
      data: { code: def.code, name: def.name, category: def.category, reorderPoint: def.reorderPoint }
    });
    await prisma.stockLevel.create({
      data: {
        itemId: item.id,
        warehouseId: warehouses[def.warehouse].id,
        onHand: def.onHand,
        reserved: def.reserved,
        lastMovement: daysAgo(def.lastMovementDaysAgo)
      }
    });
  }

  type POLine = { description: string; qty: number; unitPrice: number };
  type POStep = { role: 'MANAGER' | 'FINANCE'; approverName: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' };
  type PODef = {
    number: string; vendor: string; requester: string; warehouse: string; costCenter: string;
    status: 'PENDING_MANAGER' | 'PENDING_FINANCE' | 'APPROVED' | 'REJECTED';
    deliveryInDays: number; createdHoursAgo: number; priority?: string;
    lines: POLine[]; steps: POStep[];
  };

  const requesterByName: Record<string, string> = {
    'D. Alvarez': alvarez.id, 'S. Kim': kim.id, 'M. Tran': tran.id
  };

  const poDefs: PODef[] = [
    {
      number: 'PO-10480', vendor: 'Vertex Components', requester: 'D. Alvarez', warehouse: 'WH-01', costCenter: 'CC-118 · Production',
      status: 'APPROVED', deliveryInDays: 5, createdHoursAgo: 96,
      lines: [
        { description: 'Servo motor assembly', qty: 100, unitPrice: 299 },
        { description: 'Calibration & QA service', qty: 1, unitPrice: 5000 }
      ],
      steps: [
        { role: 'MANAGER', approverName: 'R. Osei', status: 'APPROVED' },
        { role: 'FINANCE', approverName: 'Jordan Lee', status: 'APPROVED' }
      ]
    },
    {
      number: 'PO-10482', vendor: 'Nordic Steel Co.', requester: 'D. Alvarez', warehouse: 'WH-01', costCenter: 'CC-204 · Procurement',
      status: 'PENDING_FINANCE', deliveryInDays: 17, createdHoursAgo: 48,
      lines: [
        { description: 'Cold-rolled steel sheet 2mm', qty: 40, unitPrice: 320 },
        { description: 'Anti-corrosion coating', qty: 40, unitPrice: 105 },
        { description: 'Freight & handling', qty: 1, unitPrice: 1240 }
      ],
      steps: [
        { role: 'MANAGER', approverName: 'R. Osei', status: 'APPROVED' },
        { role: 'FINANCE', approverName: 'Jordan Lee', status: 'PENDING' }
      ]
    },
    {
      number: 'PO-10486', vendor: 'Orion Packaging', requester: 'S. Kim', warehouse: 'WH-02', costCenter: 'CC-150 · Warehouse',
      status: 'PENDING_MANAGER', deliveryInDays: 10, createdHoursAgo: 24,
      lines: [
        { description: 'Corrugated shipping cartons', qty: 1200, unitPrice: 4.1 },
        { description: 'Pallet wrap film', qty: 30, unitPrice: 40 }
      ],
      steps: [
        { role: 'MANAGER', approverName: 'R. Osei', status: 'PENDING' },
        { role: 'FINANCE', approverName: 'Jordan Lee', status: 'PENDING' }
      ]
    },
    {
      number: 'PO-10488', vendor: 'Vertex Components', requester: 'D. Alvarez', warehouse: 'WH-01', costCenter: 'CC-118 · Production',
      status: 'PENDING_FINANCE', deliveryInDays: 7, createdHoursAgo: 5,
      lines: [
        { description: 'Precision bearing assembly', qty: 200, unitPrice: 142.5 },
        { description: 'Calibration & QA service', qty: 1, unitPrice: 6400 }
      ],
      steps: [
        { role: 'MANAGER', approverName: 'R. Osei', status: 'APPROVED' },
        { role: 'FINANCE', approverName: 'Jordan Lee', status: 'PENDING' }
      ]
    },
    {
      number: 'PO-10491', vendor: 'Falcon Freight', requester: 'M. Tran', warehouse: 'WH-03', costCenter: 'CC-310 · Logistics',
      status: 'PENDING_MANAGER', deliveryInDays: 6, createdHoursAgo: 3,
      lines: [{ description: 'Inbound freight — container 40ft', qty: 1, unitPrice: 2860 }],
      steps: [
        { role: 'MANAGER', approverName: 'R. Osei', status: 'PENDING' },
        { role: 'FINANCE', approverName: 'Jordan Lee', status: 'PENDING' }
      ]
    },
    {
      number: 'PO-10475', vendor: 'BrightPack Ltd.', requester: 'S. Kim', warehouse: 'WH-02', costCenter: 'CC-150 · Warehouse',
      status: 'PENDING_FINANCE', deliveryInDays: 3, createdHoursAgo: 144,
      lines: [
        { description: 'Retail display packaging kit', qty: 400, unitPrice: 21.65 },
        { description: 'Freight & handling', qty: 1, unitPrice: 1200 }
      ],
      steps: [
        { role: 'MANAGER', approverName: 'R. Osei', status: 'APPROVED' },
        { role: 'FINANCE', approverName: 'Jordan Lee', status: 'PENDING' }
      ]
    }
  ];

  for (const def of poDefs) {
    const createdAt = hoursAgo(def.createdHoursAgo);
    const po = await prisma.purchaseOrder.create({
      data: {
        number: def.number,
        vendorId: vendors[def.vendor].id,
        requesterId: requesterByName[def.requester],
        warehouseId: warehouses[def.warehouse].id,
        costCenter: def.costCenter,
        deliveryDate: daysFromNow(def.deliveryInDays),
        createdAt,
        status: def.status,
        priority: def.priority ?? 'Standard'
      }
    });
    await prisma.purchaseOrderLine.createMany({
      data: def.lines.map((l) => ({ purchaseOrderId: po.id, description: l.description, qty: l.qty, unitPrice: l.unitPrice }))
    });
    await prisma.approvalStep.createMany({
      data: def.steps.map((s, i) => ({
        purchaseOrderId: po.id,
        role: s.role,
        approverName: s.approverName,
        sequence: i + 1,
        status: s.status,
        decidedAt: s.status === 'PENDING' ? null : createdAt
      }))
    });
  }

  await prisma.transaction.createMany({
    data: [
      { date: hoursAgo(6), type: 'Invoice', reference: 'INV-30291', party: 'Nordic Steel Co.', amount: -18240, status: 'Pending' },
      { date: hoursAgo(10), type: 'Payment', reference: 'PAY-10032', party: 'BrightPack Ltd.', amount: -9120, status: 'Completed' },
      { date: daysAgo(1), type: 'Goods Receipt', reference: 'GRN-5512', party: 'Falcon Freight', amount: 0, status: 'Completed' },
      { date: daysAgo(1), type: 'PO Approved', reference: 'PO-10480', party: 'Vertex Components', amount: 34900, status: 'Approved' },
      { date: daysAgo(2), type: 'Invoice', reference: 'INV-30284', party: 'Orion Packaging', amount: -5410, status: 'Overdue' },
      { date: daysAgo(3), type: 'PO Submitted', reference: 'PO-10491', party: 'Falcon Freight', amount: 2860, status: 'Pending' }
    ]
  });

  console.log('Seed complete. Demo logins (password: demo1234):');
  console.log('  requester@meridian.dev  — D. Alvarez, Procurement (Requester)');
  console.log('  manager@meridian.dev    — R. Osei, Operations (Manager)');
  console.log('  finance@meridian.dev    — Jordan Lee, Finance (Finance)');
  console.log('  warehouse@meridian.dev  — S. Kim, Warehouse (Requester)');
  console.log('  logistics@meridian.dev  — M. Tran, Logistics (Admin)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
