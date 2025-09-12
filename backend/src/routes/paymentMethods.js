import express from 'express';
import { getAllPaymentMethods } from '../controllers/paymentMethodController.js';

const router = express.Router();

router.get('/', getAllPaymentMethods);

export default router;