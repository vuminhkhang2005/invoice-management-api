import { z } from 'zod';
import { InvoiceStatus } from '../constants/invoice.constant';

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

export const createInvoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  customerAddress: z.string().max(500).optional(),
  customerTaxCode: z.string().max(50).optional(),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100').optional().default(10),
  notes: z.string().max(1000).optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must contain at least one item'),
});

export const updateInvoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name cannot be empty').max(255).optional(),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  customerAddress: z.string().max(500).optional(),
  customerTaxCode: z.string().max(50).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must contain at least one item').optional(),
});

export const cancelInvoiceSchema = z.object({
  cancelReason: z.string().min(3, 'Cancellation reason must be at least 3 characters long').max(500),
});

export const replaceInvoiceSchema = z.object({
  cancelReason: z.string().min(3, 'Reason for replacement must be at least 3 characters long').optional(),
  customerName: z.string().min(1, 'Customer name is required').max(255).optional(),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  customerAddress: z.string().max(500).optional(),
  customerTaxCode: z.string().max(50).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must contain at least one item').optional(),
});

export const listInvoicesQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  status: z.nativeEnum(InvoiceStatus).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type ReplaceInvoiceInput = z.infer<typeof replaceInvoiceSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
