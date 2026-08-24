import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { validateBody, validateQuery } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  cancelInvoiceSchema,
  replaceInvoiceSchema,
  listInvoicesQuerySchema,
} from '../schemas/invoice.schema';

const router = Router();
const controller = new InvoiceController();

// Optional JWT authentication on all invoice routes (records actor name/role if provided)
router.use(authenticate(false));

// 1. Create Draft Invoice
router.post('/', validateBody(createInvoiceSchema), controller.createDraft);

// 2. List Invoices with search, filters, pagination
router.get('/', validateQuery(listInvoicesQuerySchema), controller.getInvoices);

// 3. Analytics & Financial Dashboard Summary (Defined before /:id)
router.get('/analytics/summary', controller.getAnalyticsSummary);

// 4. Export Invoices as CSV (Defined before /:id)
router.get('/export/csv', validateQuery(listInvoicesQuerySchema), controller.exportCsv);

// 5. Export Multiple Invoices as ZIP bundle (Defined before /:id)
router.post('/export/zip', controller.exportZip);

// 6. Batch Issue Invoices (Defined before /:id)
router.post('/batch/issue', controller.batchIssue);

// 7. Get Invoice Details by ID
router.get('/:id', controller.getInvoiceById);

// 8. Get Invoice Audit Activity History
router.get('/:id/history', controller.getInvoiceHistory);

// 9. Verify Invoice Authenticity & Digital Signature
router.get('/:id/verify', controller.verifyInvoice);

// 10. Send Invoice PDF via Email
router.post('/:id/send-email', controller.sendInvoiceEmail);

// 11. Update Draft Invoice
router.put('/:id', validateBody(updateInvoiceSchema), controller.updateDraft);

// 12. Delete Draft Invoice
router.delete('/:id', controller.deleteDraft);

// 13. Issue Invoice (DRAFT -> ISSUED)
router.post('/:id/issue', controller.issueInvoice);

// 14. Cancel Invoice (ISSUED -> CANCELED)
router.post('/:id/cancel', validateBody(cancelInvoiceSchema), controller.cancelInvoice);

// 15. Replace Invoice (ISSUED/CANCELED -> REPLACED)
router.post('/:id/replace', validateBody(replaceInvoiceSchema), controller.replaceInvoice);

// 16. Download PDF Invoice
router.get('/:id/pdf', controller.downloadPdf);

export default router;
