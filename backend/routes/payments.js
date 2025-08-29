const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByOwnerId
} = require('../controllers/paymentsController');
const { protect, admin } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

router.route('/')
  .get(protect, getAllPayments)
  .post(protect, admin, validatePayment, createPayment);

router.route('/:id')
  .get(protect, getPaymentById)
  .put(protect, admin, validatePayment, updatePayment)
  .delete(protect, admin, deletePayment);

router.route('/owner/:ownerId')
  .get(protect, getPaymentsByOwnerId);

module.exports = router;