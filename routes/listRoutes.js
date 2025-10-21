import express from 'express';
import { getLists, createList, getList, deleteList, updateList, addItemToList, removeItemFromList, showLists, renderEditList } from '../controllers/listController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Middleware di autenticazione per tutte le rotte
router.use(isAuthenticated);

// Rotte per la visualizzazione e gestione delle liste
router.get('/', showLists);
router.post('/', createList);
router.get('/edit/:id', renderEditList);
router.get('/:id', getList);
router.post('/:id/update', updateList);
router.post('/:id/delete', deleteList);
router.post('/:id/add-item', addItemToList);
router.post('/:id/remove-item/:itemId', removeItemFromList);

export default router;