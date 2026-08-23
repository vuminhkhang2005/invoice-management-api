import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';
import { COMPANY_INFO, InvoiceStatus } from '../constants/invoice.constant';
import { BadRequestError, NotFoundError } from '../errors/appError';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CancelInvoiceInput,
  ReplaceInvoiceInput,
  ListInvoicesQuery,
} from '../schemas/invoice.schema';
import { calculateInvoiceTotals, formatCurrencyVND } from '../utils/calculation.util';
import { generateInvoiceNumber } from '../utils/invoiceNumber.util';
import { numberToWordsVN } from '../utils/numberToWordsVN.util';

export class InvoiceService {
  private db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  /**
   * 1. Create a draft invoice
   */
  async createDraft(input: CreateInvoiceInput, actor = 'System / User') {
    const { items, taxRate = 10, ...customerData } = input;

    const calculation = calculateInvoiceTotals(items, taxRate);

    const invoice = await this.db.invoice.create({
      data: {
        customerName: customerData.customerName,
        customerEmail: customerData.customerEmail || null,
        customerAddress: customerData.customerAddress || null,
        customerTaxCode: customerData.customerTaxCode || null,
        notes: customerData.notes || null,
        status: InvoiceStatus.DRAFT,
        taxRate: calculation.taxRate,
        subtotal: calculation.subtotal,
        taxAmount: calculation.taxAmount,
        totalAmount: calculation.totalAmount,
        items: {
          create: calculation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
        activities: {
          create: {
            action: 'CREATED',
            actor,
            description: `Draft invoice created with ${calculation.items.length} item(s) for customer '${customerData.customerName}'`,
          },
        },
      },
      include: {
        items: true,
      },
    });

    return invoice;
  }

  /**
   * 2. Get list of invoices with search, filtering, and pagination
   */
  async getInvoices(query: ListInvoicesQuery) {
    const { page = 1, limit = 10, status, search, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerTaxCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, invoices] = await Promise.all([
      this.db.invoice.count({ where }),
      this.db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          replacedInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              totalAmount: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, invoices };
  }

  /**
   * 3. Get invoice detail by ID
   */
  async getInvoiceById(id: string) {
    const invoice = await this.db.invoice.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        replacedInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            issuedAt: true,
            totalAmount: true,
          },
        },
        replacementInvoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            issuedAt: true,
            totalAmount: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice with ID '${id}'`);
    }

    const totalAmountInWords = numberToWordsVN(Number(invoice.totalAmount));

    return {
      ...invoice,
      totalAmountInWords,
    };
  }

  /**
   * 4. Update draft invoice
   * Immutable rule: Only DRAFT invoices can be modified.
   */
  async updateDraft(id: string, input: UpdateInvoiceInput, actor = 'System / User') {
    const existing = await this.db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundError(`Invoice with ID '${id}'`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestError(
        `Cannot update invoice in '${existing.status}' status. Only DRAFT invoices can be edited.`
      );
    }

    const effectiveTaxRate =
      input.taxRate !== undefined ? input.taxRate : Number(existing.taxRate);

    let calculatedItems = existing.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
    }));

    if (input.items && input.items.length > 0) {
      calculatedItems = input.items;
    }

    const calculation = calculateInvoiceTotals(calculatedItems, effectiveTaxRate);

    const updated = await this.db.$transaction(async (tx) => {
      // If items updated, delete existing and re-insert
      if (input.items && input.items.length > 0) {
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        await tx.invoiceItem.createMany({
          data: calculation.items.map((item) => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        });
      }

      await tx.invoiceActivity.create({
        data: {
          invoiceId: id,
          action: 'UPDATED',
          actor,
          description: 'Draft invoice details and line items updated',
        },
      });

      return tx.invoice.update({
        where: { id },
        data: {
          customerName: input.customerName ?? existing.customerName,
          customerEmail: input.customerEmail !== undefined ? (input.customerEmail || null) : existing.customerEmail,
          customerAddress: input.customerAddress !== undefined ? input.customerAddress : existing.customerAddress,
          customerTaxCode: input.customerTaxCode !== undefined ? input.customerTaxCode : existing.customerTaxCode,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          taxRate: calculation.taxRate,
          subtotal: calculation.subtotal,
          taxAmount: calculation.taxAmount,
          totalAmount: calculation.totalAmount,
        },
        include: {
          items: true,
        },
      });
    });

    return updated;
  }

  /**
   * 5. Delete draft invoice
   * Immutable rule: Only DRAFT invoices can be deleted.
   */
  async deleteDraft(id: string) {
    const existing = await this.db.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`Invoice with ID '${id}'`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestError(
        `Cannot delete invoice in '${existing.status}' status. Only DRAFT invoices can be deleted.`
      );
    }

    await this.db.invoice.delete({
      where: { id },
    });

    return { id, message: 'Invoice deleted successfully' };
  }

  /**
   * 6. Issue invoice (DRAFT -> ISSUED)
   * Assigns unique invoice number and issue date. Locks future edits.
   */
  async issueInvoice(id: string, actor = 'System / User') {
    const existing = await this.db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundError(`Invoice with ID '${id}'`);
    }

    if (existing.status === InvoiceStatus.ISSUED) {
      throw new BadRequestError('Invoice is already issued.');
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestError(`Cannot issue an invoice with status '${existing.status}'.`);
    }

    if (existing.items.length === 0) {
      throw new BadRequestError('Cannot issue an invoice without line items.');
    }

    // Determine sequential invoice number
    const issuedCount = await this.db.invoice.count({
      where: {
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.CANCELED, InvoiceStatus.REPLACED] },
      },
    });

    const now = new Date();
    const invoiceNumber = generateInvoiceNumber(issuedCount + 1, now);

    const issued = await this.db.$transaction(async (tx) => {
      await tx.invoiceActivity.create({
        data: {
          invoiceId: id,
          action: 'ISSUED',
          actor,
          description: `Invoice officially issued with number '${invoiceNumber}'`,
        },
      });

      return tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.ISSUED,
          invoiceNumber,
          issuedAt: now,
        },
        include: {
          items: true,
        },
      });
    });

    return issued;
  }

  /**
   * 7. Cancel invoice (ISSUED -> CANCELED)
   * Requires cancellation reason and records cancellation timestamp.
   */
  async cancelInvoice(id: string, input: CancelInvoiceInput, actor = 'System / User') {
    const existing = await this.db.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`Invoice with ID '${id}'`);
    }

    if (existing.status === InvoiceStatus.CANCELED) {
      throw new BadRequestError('Invoice is already canceled.');
    }

    if (existing.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestError(
        `Cannot cancel invoice with status '${existing.status}'. Only ISSUED invoices can be canceled.`
      );
    }

    const canceled = await this.db.$transaction(async (tx) => {
      await tx.invoiceActivity.create({
        data: {
          invoiceId: id,
          action: 'CANCELED',
          actor,
          description: `Invoice canceled. Reason: ${input.cancelReason}`,
        },
      });

      return tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.CANCELED,
          cancelReason: input.cancelReason,
          canceledAt: new Date(),
        },
        include: {
          items: true,
        },
      });
    });

    return canceled;
  }

  /**
   * 8. Replace invoice (ISSUED/CANCELED -> REPLACED + Create new Invoice)
   * Old invoice is marked as REPLACED, new invoice is created with reference to old invoice.
   */
  async replaceInvoice(id: string, input: ReplaceInvoiceInput, actor = 'System / User') {
    const oldInvoice = await this.db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!oldInvoice) {
      throw new NotFoundError(`Original invoice with ID '${id}'`);
    }

    if (oldInvoice.status === InvoiceStatus.DRAFT) {
      throw new BadRequestError(
        'DRAFT invoices cannot be replaced. You can edit or delete them directly.'
      );
    }

    if (oldInvoice.status === InvoiceStatus.REPLACED) {
      throw new BadRequestError('This invoice has already been replaced previously.');
    }

    // Determine items and taxRate for the replacement invoice
    const newItems = input.items && input.items.length > 0
      ? input.items
      : oldInvoice.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
        }));

    const newTaxRate = input.taxRate !== undefined ? input.taxRate : Number(oldInvoice.taxRate);
    const calculation = calculateInvoiceTotals(newItems, newTaxRate);

    const replacementReason =
      input.cancelReason || `Replaced invoice ${oldInvoice.invoiceNumber || oldInvoice.id}`;

    // Execute atomic replacement in database transaction
    const newInvoice = await this.db.$transaction(async (tx) => {
      // Mark old invoice as REPLACED
      await tx.invoice.update({
        where: { id: oldInvoice.id },
        data: {
          status: InvoiceStatus.REPLACED,
          cancelReason: oldInvoice.cancelReason || replacementReason,
          canceledAt: oldInvoice.canceledAt || new Date(),
        },
      });

      await tx.invoiceActivity.create({
        data: {
          invoiceId: oldInvoice.id,
          action: 'REPLACED',
          actor,
          description: `Invoice replaced by new draft invoice. Reason: ${replacementReason}`,
        },
      });

      // Create new draft replacement invoice referencing old invoice
      const created = await tx.invoice.create({
        data: {
          status: InvoiceStatus.DRAFT,
          replacedInvoiceId: oldInvoice.id,
          customerName: input.customerName ?? oldInvoice.customerName,
          customerEmail: input.customerEmail !== undefined ? (input.customerEmail || null) : oldInvoice.customerEmail,
          customerAddress: input.customerAddress !== undefined ? input.customerAddress : oldInvoice.customerAddress,
          customerTaxCode: input.customerTaxCode !== undefined ? input.customerTaxCode : oldInvoice.customerTaxCode,
          notes: input.notes !== undefined ? input.notes : `Replacement for invoice ${oldInvoice.invoiceNumber || oldInvoice.id}`,
          taxRate: calculation.taxRate,
          subtotal: calculation.subtotal,
          taxAmount: calculation.taxAmount,
          totalAmount: calculation.totalAmount,
          items: {
            create: calculation.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          },
          activities: {
            create: {
              action: 'CREATED',
              actor,
              description: `Replacement invoice created referencing old invoice '${oldInvoice.invoiceNumber || oldInvoice.id}'`,
            },
          },
        },
        include: {
          items: true,
          replacedInvoice: true,
        },
      });

      return created;
    });

    return newInvoice;
  }

  /**
   * 9. Get Audit Trail / Activity History for an invoice
   */
  async getInvoiceHistory(id: string) {
    const invoice = await this.db.invoice.findUnique({
      where: { id },
      select: { id: true, invoiceNumber: true, status: true },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice with ID '${id}'`);
    }

    const activities = await this.db.invoiceActivity.findMany({
      where: { invoiceId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalEvents: activities.length,
      history: activities,
    };
  }

  /**
   * 10. Financial Analytics & Dashboard Summary
   */
  async getAnalyticsSummary() {
    const invoices = await this.db.invoice.findMany({
      select: {
        id: true,
        status: true,
        customerName: true,
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
        createdAt: true,
        issuedAt: true,
      },
    });

    let totalIssuedRevenue = 0;
    let totalDraftPending = 0;
    let totalCanceledRevenue = 0;
    let totalTaxCollected = 0;

    const statusCounts: Record<string, number> = {
      [InvoiceStatus.DRAFT]: 0,
      [InvoiceStatus.ISSUED]: 0,
      [InvoiceStatus.CANCELED]: 0,
      [InvoiceStatus.REPLACED]: 0,
    };

    const customerRevenueMap: Record<string, number> = {};

    invoices.forEach((inv) => {
      const amount = Number(inv.totalAmount);
      const tax = Number(inv.taxAmount);

      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;

      if (inv.status === InvoiceStatus.ISSUED) {
        totalIssuedRevenue += amount;
        totalTaxCollected += tax;

        customerRevenueMap[inv.customerName] =
          (customerRevenueMap[inv.customerName] || 0) + amount;
      } else if (inv.status === InvoiceStatus.DRAFT) {
        totalDraftPending += amount;
      } else if (inv.status === InvoiceStatus.CANCELED) {
        totalCanceledRevenue += amount;
      }
    });

    const topCustomers = Object.entries(customerRevenueMap)
      .map(([customerName, revenue]) => ({ customerName, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      summary: {
        totalInvoices: invoices.length,
        totalIssuedRevenue: Number(totalIssuedRevenue.toFixed(2)),
        totalIssuedRevenueFormatted: formatCurrencyVND(totalIssuedRevenue),
        totalDraftPendingRevenue: Number(totalDraftPending.toFixed(2)),
        totalDraftPendingFormatted: formatCurrencyVND(totalDraftPending),
        totalCanceledRevenue: Number(totalCanceledRevenue.toFixed(2)),
        totalTaxCollected: Number(totalTaxCollected.toFixed(2)),
        totalTaxCollectedFormatted: formatCurrencyVND(totalTaxCollected),
      },
      statusBreakdown: statusCounts,
      topCustomers,
    };
  }

  /**
   * 11. Verify Invoice Authenticity
   */
  async verifyInvoice(id: string) {
    const invoice = await this.db.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        replacedInvoice: {
          select: { id: true, invoiceNumber: true, status: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice with ID '${id}'`);
    }

    const isValid = invoice.status === InvoiceStatus.ISSUED;
    const digitalSignature = `SIG-${Buffer.from(`${invoice.id}-${invoice.invoiceNumber}-${invoice.totalAmount}`).toString('base64').slice(0, 24)}`;

    return {
      isValid,
      status: invoice.status,
      verificationResult: isValid ? 'VALID & AUTHENTIC' : 'NON-ISSUED OR CANCELED',
      invoiceNumber: invoice.invoiceNumber || 'N/A (DRAFT)',
      issuer: COMPANY_INFO.name,
      issuerTaxCode: COMPANY_INFO.taxCode,
      customerName: invoice.customerName,
      customerTaxCode: invoice.customerTaxCode || 'N/A',
      issuedAt: invoice.issuedAt,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      totalAmountInWords: numberToWordsVN(Number(invoice.totalAmount)),
      digitalSignature,
      verificationTimestamp: new Date().toISOString(),
    };
  }

  /**
   * 12. Export Invoices as CSV format (UTF-8 with BOM for Excel compatibility)
   */
  async exportInvoicesCsv(query: ListInvoicesQuery): Promise<string> {
    const { invoices } = await this.getInvoices({ ...query, limit: 10000 });

    const headers = [
      'STT',
      'Ma Hoa Don',
      'Trang Thai',
      'Ten Khach Hang',
      'Ma So Thue',
      'Ngay Phat Hanh',
      'Tien Truoc Thue (VND)',
      'Thue Suat (%)',
      'Tien Thue (VND)',
      'Tong Thanh Toan (VND)',
      'Ghi Chu',
    ];

    const rows = invoices.map((inv, index) => {
      const issuedDate = inv.issuedAt ? new Date(inv.issuedAt).toISOString().split('T')[0] : '';
      return [
        index + 1,
        `"${inv.invoiceNumber || 'DRAFT'}"`,
        `"${inv.status}"`,
        `"${(inv.customerName || '').replace(/"/g, '""')}"`,
        `"${inv.customerTaxCode || ''}"`,
        `"${issuedDate}"`,
        inv.subtotal,
        inv.taxRate,
        inv.taxAmount,
        inv.totalAmount,
        `"${(inv.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    // Add UTF-8 BOM so Excel opens Vietnamese characters without garbled text
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    return csvContent;
  }
}
