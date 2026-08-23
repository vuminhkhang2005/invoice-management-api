import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { PdfService } from '../services/pdf.service';
import { sendPaginated, sendSuccess } from '../utils/response.util';

export class InvoiceController {
  private invoiceService: InvoiceService;
  private pdfService: PdfService;

  constructor(
    invoiceService = new InvoiceService(),
    pdfService = new PdfService()
  ) {
    this.invoiceService = invoiceService;
    this.pdfService = pdfService;
  }

  /**
   * POST /api/invoices - Create draft invoice
   */
  createDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.invoiceService.createDraft(req.body);
      sendSuccess(res, invoice, 'Draft invoice created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/invoices - Get list of invoices (filtered, searched, paginated)
   */
  getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { total, page, limit, invoices } = await this.invoiceService.getInvoices(
        req.query as any
      );
      sendPaginated(res, invoices, total, page, limit, 'Invoices retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/invoices/:id - Get invoice by ID
   */
  getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.invoiceService.getInvoiceById(req.params.id);
      sendSuccess(res, invoice, 'Invoice details retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/invoices/:id - Update draft invoice
   */
  updateDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.invoiceService.updateDraft(req.params.id, req.body);
      sendSuccess(res, invoice, 'Draft invoice updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/invoices/:id - Delete draft invoice
   */
  deleteDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.invoiceService.deleteDraft(req.params.id);
      sendSuccess(res, result, 'Draft invoice deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/invoices/:id/issue - Issue invoice
   */
  issueInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.invoiceService.issueInvoice(req.params.id);
      sendSuccess(res, invoice, 'Invoice issued successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/invoices/:id/cancel - Cancel invoice
   */
  cancelInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.invoiceService.cancelInvoice(req.params.id, req.body);
      sendSuccess(res, invoice, 'Invoice canceled successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/invoices/:id/replace - Replace invoice
   */
  replaceInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newInvoice = await this.invoiceService.replaceInvoice(req.params.id, req.body);
      sendSuccess(res, newInvoice, 'Replacement invoice created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/invoices/:id/pdf - Export and download PDF
   */
  downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.invoiceService.getInvoiceById(req.params.id);
      const filename = `${invoice.invoiceNumber || 'DRAFT-INVOICE'}_${invoice.id.slice(0, 8)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      this.pdfService.generateInvoicePdfStream(invoice, res);
    } catch (error) {
      next(error);
    }
  };
}
