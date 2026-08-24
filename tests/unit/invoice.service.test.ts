import { InvoiceService } from '../../src/services/invoice.service';
import { InvoiceStatus } from '../../src/constants/invoice.constant';
import { BadRequestError, NotFoundError } from '../../src/errors/appError';

describe('InvoiceService Unit Tests', () => {
  let invoiceService: InvoiceService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
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
      $transaction: jest.fn(async (cb) => cb(mockDb)),
    };

    invoiceService = new InvoiceService(mockDb as any);
  });

  describe('createDraft', () => {
    it('should create a draft invoice with calculated totals, items, and activity log', async () => {
      const input = {
        customerName: 'Tech Corp Vietnam',
        customerEmail: 'tech@corp.vn',
        customerAddress: 'District 1, HCMC',
        taxRate: 10,
        items: [
          { description: 'Cloud Server 16GB', quantity: 2, unitPrice: 100 },
          { description: 'Domain Registration', quantity: 1, unitPrice: 20 },
        ],
      };

      const mockCreated = {
        id: 'inv-uuid-1',
        status: InvoiceStatus.DRAFT,
        ...input,
        subtotal: 220,
        taxAmount: 22,
        totalAmount: 242,
      };

      mockDb.invoice.create.mockResolvedValue(mockCreated);

      const result = await invoiceService.createDraft(input);

      expect(mockDb.invoice.create).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(InvoiceStatus.DRAFT);
      expect(result.totalAmount).toBe(242);
    });
  });

  describe('getInvoices', () => {
    it('should query and return paginated list of invoices with filters', async () => {
      mockDb.invoice.count.mockResolvedValue(1);
      mockDb.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          status: InvoiceStatus.ISSUED,
          customerName: 'Tech Corp',
          items: [],
        },
      ]);

      const result = await invoiceService.getInvoices({
        page: 1,
        limit: 10,
        status: InvoiceStatus.ISSUED,
        search: 'Tech',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.invoices).toHaveLength(1);
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice with totalAmountInWords when found', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        totalAmount: 1500000,
        items: [],
      };

      mockDb.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await invoiceService.getInvoiceById('inv-1');
      expect(result.id).toBe('inv-1');
      expect(result.totalAmountInWords).toBe('Một triệu năm trăm nghìn đồng chẵn');
    });

    it('should throw NotFoundError when invoice does not exist', async () => {
      mockDb.invoice.findUnique.mockResolvedValue(null);

      await expect(invoiceService.getInvoiceById('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateDraft', () => {
    it('should update draft invoice successfully', async () => {
      const existingDraft = {
        id: 'draft-1',
        status: InvoiceStatus.DRAFT,
        customerName: 'Old Customer',
        taxRate: 10,
        items: [{ id: 'item-1', description: 'Item 1', quantity: 1, unitPrice: 50 }],
      };

      mockDb.invoice.findUnique.mockResolvedValue(existingDraft);
      mockDb.invoice.update.mockResolvedValue({
        ...existingDraft,
        customerName: 'Updated Customer',
      });

      const result = await invoiceService.updateDraft('draft-1', {
        customerName: 'Updated Customer',
      });

      expect(result.customerName).toBe('Updated Customer');
    });

    it('should throw BadRequestError when attempting to update an ISSUED invoice', async () => {
      const existingIssued = {
        id: 'issued-1',
        status: InvoiceStatus.ISSUED,
        customerName: 'Immutable Customer',
      };

      mockDb.invoice.findUnique.mockResolvedValue(existingIssued);

      await expect(
        invoiceService.updateDraft('issued-1', { customerName: 'New Name' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteDraft', () => {
    it('should delete a DRAFT invoice successfully', async () => {
      const existingDraft = {
        id: 'draft-1',
        status: InvoiceStatus.DRAFT,
      };

      mockDb.invoice.findUnique.mockResolvedValue(existingDraft);
      mockDb.invoice.delete.mockResolvedValue(existingDraft);

      const result = await invoiceService.deleteDraft('draft-1');
      expect(result.id).toBe('draft-1');
    });

    it('should throw BadRequestError when attempting to delete an ISSUED invoice', async () => {
      const existingIssued = {
        id: 'issued-1',
        status: InvoiceStatus.ISSUED,
      };

      mockDb.invoice.findUnique.mockResolvedValue(existingIssued);

      await expect(invoiceService.deleteDraft('issued-1')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('issueInvoice', () => {
    it('should transition DRAFT to ISSUED, log activity, and assign an invoice number', async () => {
      const draftInvoice = {
        id: 'draft-1',
        status: InvoiceStatus.DRAFT,
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
      };

      mockDb.invoice.findUnique.mockResolvedValue(draftInvoice);
      mockDb.invoice.count.mockResolvedValue(0);
      mockDb.invoice.update.mockImplementation(({ data }: any) => ({
        ...draftInvoice,
        ...data,
      }));

      const result = await invoiceService.issueInvoice('draft-1');

      expect(result.status).toBe(InvoiceStatus.ISSUED);
      expect(result.invoiceNumber).toMatch(/^INV-\d{6}-00001$/);
      expect(result.issuedAt).toBeDefined();
    });

    it('should throw BadRequestError if invoice is not in DRAFT status', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: InvoiceStatus.ISSUED,
      });

      await expect(invoiceService.issueInvoice('inv-1')).rejects.toThrow(BadRequestError);
    });
  });

  describe('cancelInvoice', () => {
    it('should transition ISSUED to CANCELED with cancellation reason', async () => {
      const issuedInvoice = {
        id: 'issued-1',
        status: InvoiceStatus.ISSUED,
        invoiceNumber: 'INV-202608-00001',
      };

      mockDb.invoice.findUnique.mockResolvedValue(issuedInvoice);
      mockDb.invoice.update.mockImplementation(({ data }: any) => ({
        ...issuedInvoice,
        ...data,
      }));

      const result = await invoiceService.cancelInvoice('issued-1', {
        cancelReason: 'Customer requested cancellation due to incorrect tax code',
      });

      expect(result.status).toBe(InvoiceStatus.CANCELED);
      expect(result.cancelReason).toBe(
        'Customer requested cancellation due to incorrect tax code'
      );
      expect(result.canceledAt).toBeDefined();
    });

    it('should throw BadRequestError when attempting to cancel a DRAFT invoice', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'draft-1',
        status: InvoiceStatus.DRAFT,
      });

      await expect(
        invoiceService.cancelInvoice('draft-1', { cancelReason: 'Test reason' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('replaceInvoice', () => {
    it('should mark old invoice as REPLACED and create a new replacement draft invoice', async () => {
      const oldInvoice = {
        id: 'old-inv-1',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        customerName: 'Old Customer Corp',
        customerEmail: 'old@corp.vn',
        taxRate: 10,
        items: [{ description: 'Service A', quantity: 1, unitPrice: 100 }],
      };

      mockDb.invoice.findUnique.mockResolvedValue(oldInvoice);
      mockDb.invoice.update.mockResolvedValue({
        ...oldInvoice,
        status: InvoiceStatus.REPLACED,
      });
      mockDb.invoice.create.mockImplementation(({ data }: any) => ({
        id: 'new-inv-2',
        ...data,
      }));

      const result = await invoiceService.replaceInvoice('old-inv-1', {
        cancelReason: 'Customer updated company legal name',
        customerName: 'New Customer Corp',
      });

      expect(mockDb.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'old-inv-1' },
          data: expect.objectContaining({ status: InvoiceStatus.REPLACED }),
        })
      );

      expect(result.id).toBe('new-inv-2');
    });

    it('should throw BadRequestError when attempting to replace a DRAFT invoice', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'draft-1',
        status: InvoiceStatus.DRAFT,
      });

      await expect(
        invoiceService.replaceInvoice('draft-1', { customerName: 'New Corp' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should compute financial totals, status breakdown, and top customers', async () => {
      mockDb.invoice.findMany.mockResolvedValue([
        {
          id: '1',
          status: InvoiceStatus.ISSUED,
          customerName: 'Customer A',
          subtotal: 1000,
          taxAmount: 100,
          totalAmount: 1100,
        },
        {
          id: '2',
          status: InvoiceStatus.DRAFT,
          customerName: 'Customer B',
          subtotal: 500,
          taxAmount: 50,
          totalAmount: 550,
        },
      ]);

      const analytics = await invoiceService.getAnalyticsSummary();

      expect(analytics.summary.totalInvoices).toBe(2);
      expect(analytics.summary.totalIssuedRevenue).toBe(1100);
      expect(analytics.summary.totalDraftPendingRevenue).toBe(550);
      expect(analytics.statusBreakdown[InvoiceStatus.ISSUED]).toBe(1);
      expect(analytics.statusBreakdown[InvoiceStatus.DRAFT]).toBe(1);
      expect(analytics.topCustomers[0].customerName).toBe('Customer A');
    });
  });

  describe('exportInvoicesCsv', () => {
    it('should format invoice records into Excel-compatible CSV string', async () => {
      mockDb.invoice.count.mockResolvedValue(1);
      mockDb.invoice.findMany.mockResolvedValue([
        {
          id: '1',
          invoiceNumber: 'INV-202608-00001',
          status: InvoiceStatus.ISSUED,
          customerName: 'Company ABC',
          customerTaxCode: '0101234567',
          subtotal: 1000,
          taxRate: 10,
          taxAmount: 100,
          totalAmount: 1100,
          notes: 'Test note',
          issuedAt: new Date('2026-08-24'),
          items: [],
        },
      ]);

      const csv = await invoiceService.exportInvoicesCsv({ page: 1, limit: 10 });

      expect(csv).toContain('Ma Hoa Don');
      expect(csv).toContain('INV-202608-00001');
      expect(csv).toContain('Company ABC');
    });
  });

  describe('verifyInvoice', () => {
    it('should verify an ISSUED invoice and return verification details', async () => {
      const mockInvoice = {
        id: 'uuid-1',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        customerName: 'Buyer A',
        customerTaxCode: '0101234567',
        subtotal: 1000000,
        taxAmount: 100000,
        totalAmount: 1100000,
        issuedAt: new Date(),
        items: [],
      };

      mockDb.invoice.findUnique.mockResolvedValue(mockInvoice);

      const verification = await invoiceService.verifyInvoice('uuid-1');

      expect(verification.isValid).toBe(true);
      expect(verification.verificationResult).toBe('VALID & AUTHENTIC');
      expect(verification.digitalSignature).toBeDefined();
      expect(verification.totalAmountInWords).toBe('Một triệu một trăm nghìn đồng chẵn');
    });
  });

  describe('getInvoiceHistory', () => {
    it('should return invoice activity log history', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
      });

      mockDb.invoiceActivity.findMany.mockResolvedValue([
        { id: 'act-1', action: 'ISSUED', description: 'Invoice issued' },
        { id: 'act-2', action: 'CREATED', description: 'Invoice draft created' },
      ]);

      const history = await invoiceService.getInvoiceHistory('inv-1');

      expect(history.invoiceId).toBe('inv-1');
      expect(history.totalEvents).toBe(2);
      expect(history.history).toHaveLength(2);
    });
  });
});
