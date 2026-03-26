const express = require('express');
const router = express.Router();
const controller = require('../controllers/sales.controller');

router.get('/clients', controller.getSalesClients);
router.get('/clients/search', controller.searchClients);
router.get('/clients/:clientRef', controller.getClientDetail);
router.post('/clients', controller.createClient);
router.put('/clients/:clientRef', controller.updateClient);
router.delete('/clients/:clientRef', controller.deleteClient);
router.get('/vendedores', controller.getSalesVendedores);
router.get('/vendedores/rendimiento', controller.getVendedoresRendimiento);
router.get('/report', controller.getSalesReport);
router.post('/', controller.createSale);

module.exports = router;