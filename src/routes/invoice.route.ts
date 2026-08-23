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

// 3. Get Invoice Details by ID
router.get('/:id', controller.getInvoiceById);

// 4. Update Draft Invoice
router.put('/:id', validateBody(updateInvoiceSchema), controller.updateDraft);

// 5. Delete Draft Invoice
router.delete('/:id', controller.deleteDraft);

// 6. Issue Invoice (DRAFT -> ISSUED)
router.post('/:id/issue', controller.issueInvoice);

// 7. Cancel Invoice (ISSUED -> CANCELED)
router.post('/:id/cancel', validateBody(cancelInvoiceSchema), controller.cancelInvoice);

// 8. Replace Invoice (ISSUED/CANCELED -> REPLACED)
router.post('/:id/replace', validateBody(replaceInvoiceSchema), controller.replaceInvoice);

// 9. Download PDF Invoice
router.get('/:id/pdf', controller.downloadPdf);

export default router;
