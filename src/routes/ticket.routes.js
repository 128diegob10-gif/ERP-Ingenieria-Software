const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticket.controller');

router.post('/', controller.createTicket);
router.get('/', controller.getTicketsByClient);
router.get('/:id', controller.getTicketDetail);
router.put('/:id', controller.updateTicket);
router.delete('/:id', controller.deleteTicket);

module.exports = router;
