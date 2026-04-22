const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticket.controller');

router.post('/', controller.createTicket);
router.get('/', controller.getTicketsByClient);
router.get('/:id', controller.getTicketDetail);

module.exports = router;
