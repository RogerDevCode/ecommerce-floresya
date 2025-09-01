const express = require('express');
const router = express.Router();
const { getAllPaymentMethods } = require('../controllers/paymentMethodController');

router.get('/', getAllPaymentMethods);

module.exports = router;