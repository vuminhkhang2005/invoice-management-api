import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { InvoiceStatus } from '../../src/constants/invoice.constant';
import { UserRole } from '../../src/constants/auth.constant';
import { AuthService } from '../../src/services/auth.service';

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
  let authService: AuthService;
  let adminToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    adminToken = authService.generateToken({
      userId: 'usr-admin-1',
      name: 'Admin Test',
      email: 'admin@invoicetech.vn',
      role: UserRole.ADMIN,
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 OK with health status and security headers', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('UP');
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Authentication Endpoints', () => {
    it('GET /api/auth/demo-accounts should return demo credentials for all roles', async () => {
      const response = await request(app).get('/api/auth/demo-accounts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
    });

    it('POST /api/auth/login should issue a JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@invoicetech.vn', role: 'ACCOUNTANT', name: 'Test Accountant' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('GET /api/auth/me should return authenticated user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('admin@invoicetech.vn');
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
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(InvoiceStatus.DRAFT);
      expect(response.body.data.totalAmount).toBe(35200000);
    });
  });

  describe('POST /api/invoices/batch/issue', () => {
    it('should batch issue multiple invoices', async () => {
      const draftInvoices = [
        { id: 'draft-1', status: InvoiceStatus.DRAFT, items: [{ id: '1' }] },
        { id: 'draft-2', status: InvoiceStatus.DRAFT, items: [{ id: '2' }] },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(draftInvoices);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(0);
      (prisma.invoice.update as jest.Mock).mockImplementation(({ where, data }: any) => ({
        id: where.id,
        ...data,
      }));

      const response = await request(app)
        .post('/api/invoices/batch/issue')
        .send({ invoiceIds: ['draft-1', 'draft-2'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalIssued).toBe(2);
    });
  });

  describe('POST /api/invoices/:id/send-email', () => {
    it('should dispatch email and return success message', async () => {
      const mockInvoice = {
        id: 'inv-101',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        customerName: 'Customer A',
        customerEmail: 'customer@a.com',
        subtotal: 500,
        taxRate: 10,
        taxAmount: 50,
        totalAmount: 550,
        issuedAt: new Date(),
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 500, amount: 500 }],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app)
        .post('/api/invoices/inv-101/send-email')
        .send({ recipientEmail: 'recipient@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recipient).toBe('recipient@test.com');
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
