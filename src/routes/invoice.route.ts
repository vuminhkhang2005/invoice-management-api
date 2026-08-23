import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { validateBody, validateQuery } from '../middlewares/validateRequest';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  cancelInvoiceSchema,
  replaceInvoiceSchema,
  listInvoicesQuerySchema,
} from '../schemas/invoice.schema';

const router = Router();
const controller = new InvoiceController();

// 1. Create Draft Invoice
router.post('/', validateBody(createInvoiceSchema), controller.createDraft);

// 2. List Invoices with search, filters, pagination
router.get('/', validateQuery(listInvoicesQuerySchema), controller.getInvoices);

// 3. Analytics & Financial Dashboard Summary (Defined before /:id)
router.get('/analytics/summary', controller.getAnalyticsSummary);

// 4. Export Invoices as CSV (Defined before /:id)
router.get('/export/csv', validateQuery(listInvoicesQuerySchema), controller.exportCsv);

// 5. Get Invoice Details by ID
router.get('/:id', controller.getInvoiceById);

// 6. Get Invoice Audit Activity History
router.get('/:id/history', controller.getInvoiceHistory);

// 7. Verify Invoice Authenticity & Digital Signature
router.get('/:id/verify', controller.verifyInvoice);

// 8. Update Draft Invoice
router.put('/:id', validateBody(updateInvoiceSchema), controller.updateDraft);

// 9. Delete Draft Invoice
router.delete('/:id', controller.deleteDraft);

// 10. Issue Invoice (DRAFT -> ISSUED)
router.post('/:id/issue', controller.issueInvoice);

// 11. Cancel Invoice (ISSUED -> CANCELED)
router.post('/:id/cancel', validateBody(cancelInvoiceSchema), controller.cancelInvoice);

// 12. Replace Invoice (ISSUED/CANCELED -> REPLACED)
router.post('/:id/replace', validateBody(replaceInvoiceSchema), controller.replaceInvoice);

// 13. Download PDF Invoice
router.get('/:id/pdf', controller.downloadPdf);

export default router;
