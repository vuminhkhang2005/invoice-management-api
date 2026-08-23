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
    it('should return invoice details when found', async () => {
      const mockInvoice = {
        id: 'inv-101',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        customerName: 'Customer A',
        items: [{ id: 'item-1', description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app).get('/api/invoices/inv-101');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('inv-101');
    });

    it('should return 404 Not Found when invoice does not exist', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/invoices/unknown-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/invoices/:id/issue (Issue Invoice)', () => {
    it('should issue a DRAFT invoice and assign invoice number', async () => {
      const draft = {
        id: 'draft-1',
        status: InvoiceStatus.DRAFT,
        items: [{ id: 'item-1', description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(draft);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(0);
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        ...draft,
        status: InvoiceStatus.ISSUED,
        invoiceNumber: 'INV-202608-00001',
        issuedAt: new Date().toISOString(),
      });

      const response = await request(app).post('/api/invoices/draft-1/issue');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(InvoiceStatus.ISSUED);
      expect(response.body.data.invoiceNumber).toBe('INV-202608-00001');
    });
  });

  describe('POST /api/invoices/:id/cancel (Cancel Invoice)', () => {
    it('should cancel an ISSUED invoice with valid reason', async () => {
      const issued = {
        id: 'issued-1',
        status: InvoiceStatus.ISSUED,
        invoiceNumber: 'INV-202608-00001',
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(issued);
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        ...issued,
        status: InvoiceStatus.CANCELED,
        cancelReason: 'Customer canceled order',
        canceledAt: new Date().toISOString(),
        items: [],
      });

      const response = await request(app)
        .post('/api/invoices/issued-1/cancel')
        .send({ cancelReason: 'Customer canceled order' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(InvoiceStatus.CANCELED);
    });

    it('should reject cancel when cancelReason is missing', async () => {
      const response = await request(app)
        .post('/api/invoices/issued-1/cancel')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/invoices/:id/replace (Replace Invoice)', () => {
    it('should replace an ISSUED invoice and return new replacement draft', async () => {
      const issued = {
        id: 'old-1',
        status: InvoiceStatus.ISSUED,
        invoiceNumber: 'INV-202608-00001',
        customerName: 'Old Customer',
        taxRate: 10,
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(issued);
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        ...issued,
        status: InvoiceStatus.REPLACED,
      });
      (prisma.invoice.create as jest.Mock).mockResolvedValue({
        id: 'new-2',
        status: InvoiceStatus.DRAFT,
        replacedInvoiceId: 'old-1',
        customerName: 'New Customer',
        subtotal: 100,
        taxRate: 10,
        taxAmount: 10,
        totalAmount: 110,
        items: [],
      });

      const response = await request(app)
        .post('/api/invoices/old-1/replace')
        .send({
          cancelReason: 'Change company name',
          customerName: 'New Customer',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('new-2');
      expect(response.body.data.replacedInvoiceId).toBe('old-1');
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
