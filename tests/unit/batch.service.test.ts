import { BatchService } from '../../src/services/batch.service';
import { InvoiceStatus } from '../../src/constants/invoice.constant';
import { BadRequestError, NotFoundError } from '../../src/errors/appError';

describe('BatchService Unit Tests', () => {
  let batchService: BatchService;
  let mockDb: any;
  let mockPdfService: any;

  beforeEach(() => {
    mockDb = {
      invoice: {
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      invoiceActivity: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockDb)),
    };

    mockPdfService = {
      generateInvoicePdfBuffer: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 Mock')),
    };

    batchService = new BatchService(mockDb, mockPdfService);
  });

  describe('batchIssueInvoices', () => {
    it('should batch issue all valid draft invoices in an atomic transaction', async () => {
      const draftInvoices = [
        { id: 'draft-1', status: InvoiceStatus.DRAFT, items: [] },
        { id: 'draft-2', status: InvoiceStatus.DRAFT, items: [] },
      ];

      mockDb.invoice.findMany.mockResolvedValue(draftInvoices);
      mockDb.invoice.count.mockResolvedValue(0);
      mockDb.invoice.update.mockImplementation(({ where, data }: any) => ({
        id: where.id,
        ...data,
      }));

      const result = await batchService.batchIssueInvoices(['draft-1', 'draft-2']);

      expect(result.totalRequested).toBe(2);
      expect(result.totalIssued).toBe(2);
      expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestError if invoice IDs list is empty', async () => {
      await expect(batchService.batchIssueInvoices([])).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if some invoices do not exist', async () => {
      mockDb.invoice.findMany.mockResolvedValue([{ id: 'draft-1' }]);

      await expect(
        batchService.batchIssueInvoices(['draft-1', 'missing-id'])
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if any invoice is not in DRAFT status', async () => {
      mockDb.invoice.findMany.mockResolvedValue([
        { id: 'inv-1', status: InvoiceStatus.ISSUED },
      ]);

      await expect(batchService.batchIssueInvoices(['inv-1'])).rejects.toThrow(
        BadRequestError
      );
    });
  });
});
