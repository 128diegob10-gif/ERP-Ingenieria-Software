const express = require('express');
const router = express.Router();
const controller = require('../controllers/interaction.controller');

router.post('/', controller.createInteraction);
router.get('/:codigoCliente', controller.getByClient);
router.get('/', controller.getAll);


module.exports = router;
