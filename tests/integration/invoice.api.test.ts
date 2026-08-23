import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { InvoiceStatus } from '../../src/constants/invoice.constant';

jest.mock('../../src/config/database', () => {
  const mockPrisma: any = {
    invoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invoiceItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    invoiceActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

describe('Invoice Management API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK with health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('UP');
    });
  });

  describe('GET /api-docs', () => {
    it('should return 200 OK or 301/302 redirect to Swagger UI', async () => {
      const response = await request(app).get('/api-docs/');
      expect([200, 301, 302]).toContain(response.status);
    });
  });

  describe('GET /api/invoices/analytics/summary', () => {
    it('should return analytics summary with total revenue and customer breakdown', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        {
          id: '1',
          status: InvoiceStatus.ISSUED,
          customerName: 'Customer A',
          subtotal: 1000,
          taxAmount: 100,
          totalAmount: 1100,
        },
      ]);

      const response = await request(app).get('/api/invoices/analytics/summary');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalInvoices).toBe(1);
      expect(response.body.data.summary.totalIssuedRevenue).toBe(1100);
    });
  });

  describe('GET /api/invoices/export/csv', () => {
    it('should return CSV data with UTF-8 attachment header', async () => {
      (prisma.invoice.count as jest.Mock).mockResolvedValue(1);
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        {
          id: '1',
          invoiceNumber: 'INV-202608-00001',
          status: InvoiceStatus.ISSUED,
          customerName: 'Customer A',
          customerTaxCode: '0101234567',
          subtotal: 1000,
          taxRate: 10,
          taxAmount: 100,
          totalAmount: 1100,
          notes: 'Test note',
          issuedAt: new Date(),
          items: [],
        },
      ]);

      const response = await request(app).get('/api/invoices/export/csv');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/csv/);
      expect(response.text).toContain('Ma Hoa Don');
      expect(response.text).toContain('INV-202608-00001');
    });
  });

  describe('POST /api/invoices (Create Draft)', () => {
    it('should create draft invoice with 201 Created', async () => {
      const payload = {
        customerName: 'Cong ty Co phan FPT',
        customerEmail: 'billing@fpt.vn',
        customerAddress: 'Duy Tan, Cau Giay, Hanoi',
        customerTaxCode: '0101234567',
        taxRate: 10,
        notes: 'Hop dong dich vu Cloud 2026',
        items: [
          { description: 'Dedicated Server E5', quantity: 2, unitPrice: 15000000 },
          { description: 'Bang thong 1Gbps', quantity: 1, unitPrice: 2000000 },
        ],
      };

      const mockCreated = {
        id: 'inv-uuid-101',
        invoiceNumber: null,
        status: InvoiceStatus.DRAFT,
        ...payload,
        subtotal: 32000000,
        taxAmount: 3200000,
        totalAmount: 35200000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          { id: 'item-1', invoiceId: 'inv-uuid-101', description: 'Dedicated Server E5', quantity: 2, unitPrice: 15000000, amount: 30000000 },
          { id: 'item-2', invoiceId: 'inv-uuid-101', description: 'Bang thong 1Gbps', quantity: 1, unitPrice: 2000000, amount: 2000000 },
        ],
      };

      (prisma.invoice.create as jest.Mock).mockResolvedValue(mockCreated);

      const response = await request(app)
        .post('/api/invoices')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(InvoiceStatus.DRAFT);
      expect(response.body.data.totalAmount).toBe(35200000);
    });

    it('should return 400 Bad Request when customerName is missing or items are empty', async () => {
      const invalidPayload = {
        customerName: '',
        items: [],
      };

      const response = await request(app)
        .post('/api/invoices')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('GET /api/invoices (List Invoices)', () => {
    it('should return paginated list of invoices', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-202608-00001',
          customerName: 'Customer A',
          status: InvoiceStatus.ISSUED,
          totalAmount: 1000,
          items: [],
        },
      ];

      (prisma.invoice.count as jest.Mock).mockResolvedValue(1);
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const response = await request(app).get('/api/invoices?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(1);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/invoices/:id (Get Details)', () => {
    it('should return invoice details with totalAmountInWords when found', async () => {
      const mockInvoice = {
        id: 'inv-101',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        customerName: 'Customer A',
        totalAmount: 1000000,
        items: [{ id: 'item-1', description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app).get('/api/invoices/inv-101');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('inv-101');
      expect(response.body.data.totalAmountInWords).toBe('Một triệu đồng chẵn');
    });
  });

  describe('GET /api/invoices/:id/verify', () => {
    it('should return verification certificate for an invoice', async () => {
      const mockInvoice = {
        id: 'inv-101',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        customerName: 'Customer A',
        totalAmount: 1000000,
        subtotal: 900000,
        taxAmount: 100000,
        items: [],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app).get('/api/invoices/inv-101/verify');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.digitalSignature).toBeDefined();
    });
  });

  describe('GET /api/invoices/:id/history', () => {
    it('should return activity log history for an invoice', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-101',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
      });
      (prisma.invoiceActivity.findMany as jest.Mock).mockResolvedValue([
        { id: 'act-1', action: 'ISSUED', description: 'Issued', createdAt: new Date() },
      ]);

      const response = await request(app).get('/api/invoices/inv-101/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toHaveLength(1);
    });
  });

  describe('GET /api/invoices/:id/pdf (Download PDF)', () => {
    it('should return PDF stream with application/pdf Content-Type', async () => {
      const mockInvoice = {
        id: 'inv-101',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        customerName: 'Cong ty Test',
        subtotal: 500,
        taxRate: 10,
        taxAmount: 50,
        totalAmount: 550,
        issuedAt: new Date(),
        items: [
          { description: 'Test Item', quantity: 1, unitPrice: 500, amount: 500 },
        ],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app).get('/api/invoices/inv-101/pdf');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });
});
