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
      $transaction: jest.fn(async (cb) => cb(mockDb)),
    };

    invoiceService = new InvoiceService(mockDb as any);
  });

  describe('createDraft', () => {
    it('should create a draft invoice with calculated totals and items', async () => {
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

  describe('getInvoiceById', () => {
    it('should return invoice when found', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-202608-00001',
        status: InvoiceStatus.ISSUED,
        items: [],
      };

      mockDb.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await invoiceService.getInvoiceById('inv-1');
      expect(result).toEqual(mockInvoice);
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
    it('should delete draft invoice', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'draft-1',
        status: InvoiceStatus.DRAFT,
      });
      mockDb.invoice.delete.mockResolvedValue({ id: 'draft-1' });

      const result = await invoiceService.deleteDraft('draft-1');
      expect(result.id).toBe('draft-1');
    });

    it('should throw BadRequestError when attempting to delete an ISSUED invoice', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'issued-1',
        status: InvoiceStatus.ISSUED,
      });

      await expect(invoiceService.deleteDraft('issued-1')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('issueInvoice', () => {
    it('should transition DRAFT to ISSUED and assign an invoice number', async () => {
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

    it('should throw BadRequestError if invoice is already ISSUED', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'issued-1',
        status: InvoiceStatus.ISSUED,
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
      });

      await expect(invoiceService.issueInvoice('issued-1')).rejects.toThrow(
        BadRequestError
      );
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
        invoiceService.cancelInvoice('draft-1', { cancelReason: 'Some reason' })
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

      expect(mockDb.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            replacedInvoiceId: 'old-inv-1',
            status: InvoiceStatus.DRAFT,
            customerName: 'New Customer Corp',
          }),
        })
      );

      expect(result.id).toBe('new-inv-2');
    });

    it('should throw BadRequestError when attempting to replace an invoice that was already replaced', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'already-replaced',
        status: InvoiceStatus.REPLACED,
        items: [],
      });

      await expect(
        invoiceService.replaceInvoice('already-replaced', {})
      ).rejects.toThrow(BadRequestError);
    });
  });
});
