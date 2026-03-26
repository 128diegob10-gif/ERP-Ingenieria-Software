const express = require('express');
const router = express.Router();
const controller = require('../controllers/opportunity.controller');

router.post('/', controller.createOpportunity);
router.get('/', controller.getOpportunities);
router.patch('/:id/state', controller.updateOpportunityState);

module.exports = router;
