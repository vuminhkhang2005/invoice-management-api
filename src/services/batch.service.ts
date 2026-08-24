import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import { prisma as defaultPrisma } from '../config/database';
import { InvoiceStatus } from '../constants/invoice.constant';
import { BadRequestError, NotFoundError } from '../errors/appError';
import { generateInvoiceNumber } from '../utils/invoiceNumber.util';
import { PdfService } from './pdf.service';

export interface BatchIssueResult {
  totalRequested: number;
  totalIssued: number;
  invoices: any[];
}

export class BatchService {
  private db: PrismaClient;
  private pdfService: PdfService;

  constructor(db: PrismaClient = defaultPrisma, pdfService = new PdfService()) {
    this.db = db;
    this.pdfService = pdfService;
  }

  /**
   * Batch issue multiple draft invoices in an atomic operation
   */
  async batchIssueInvoices(invoiceIds: string[], actor = 'System / Batch'): Promise<BatchIssueResult> {
    if (!invoiceIds || invoiceIds.length === 0) {
      throw new BadRequestError('List of invoice IDs cannot be empty');
    }

    const invoices = await this.db.invoice.findMany({
      where: { id: { in: invoiceIds } },
      include: { items: true },
    });

    if (invoices.length !== invoiceIds.length) {
      throw new NotFoundError('One or more requested invoices could not be found');
    }

    // Verify all are in DRAFT status
    const nonDrafts = invoices.filter((inv) => inv.status !== InvoiceStatus.DRAFT);
    if (nonDrafts.length > 0) {
      throw new BadRequestError(
        `Cannot issue invoices that are not in DRAFT status: [${nonDrafts.map((i) => i.id).join(', ')}]`
      );
    }

    const currentIssuedCount = await this.db.invoice.count({
      where: {
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.CANCELED, InvoiceStatus.REPLACED] },
      },
    });

    const now = new Date();

    const issuedInvoices = await this.db.$transaction(async (tx) => {
      const results = [];
      let sequence = currentIssuedCount + 1;

      for (const inv of invoices) {
        const invoiceNumber = generateInvoiceNumber(sequence, now);
        sequence++;

        await tx.invoiceActivity.create({
          data: {
            invoiceId: inv.id,
            action: 'ISSUED',
            actor,
            description: `Invoice batch issued with number '${invoiceNumber}'`,
          },
        });

        const updated = await tx.invoice.update({
          where: { id: inv.id },
          data: {
            status: InvoiceStatus.ISSUED,
            invoiceNumber,
            issuedAt: now,
          },
          include: { items: true },
        });

        results.push(updated);
      }

      return results;
    });

    return {
      totalRequested: invoiceIds.length,
      totalIssued: issuedInvoices.length,
      invoices: issuedInvoices,
    };
  }

  /**
   * Generates a .ZIP buffer containing PDF files for specified invoice IDs
   */
  async exportInvoicesZipBuffer(invoiceIds?: string[]): Promise<Buffer> {
    const whereClause: any = {};
    if (invoiceIds && invoiceIds.length > 0) {
      whereClause.id = { in: invoiceIds };
    }

    const invoices = await this.db.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
        replacedInvoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
      },
      take: 100, // safety limit per batch zip
    });

    if (invoices.length === 0) {
      throw new NotFoundError('No matching invoices found to export into ZIP');
    }

    const zip = new AdmZip();

    for (const inv of invoices) {
      const pdfBuffer = await this.pdfService.generateInvoicePdfBuffer(inv as any);
      const safeCustomer = (inv.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${inv.invoiceNumber || 'DRAFT'}_${safeCustomer}_${inv.id.slice(0, 6)}.pdf`;
      zip.addFile(filename, pdfBuffer);
    }

    return zip.toBuffer();
  }
}
