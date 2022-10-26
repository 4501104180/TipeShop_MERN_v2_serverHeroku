const express = require('express');
const router = express.Router();

// controllers
const ordersAPI = require('../app/controllers/OrdersAPI');
// middlewares
const verifyToken = require('../app/middlewares/verifyToken');

router.get('/all', verifyToken, ordersAPI.findAllOrders);
router.get('/all/:_id', verifyToken, ordersAPI.findOrderById);
router.patch('/status', verifyToken, ordersAPI.editStatus);
router.put('/:_id', verifyToken, ordersAPI.update);
router.post('/', verifyToken, ordersAPI.create);
router.get('/:_id', verifyToken, ordersAPI.findById);
router.get('/', verifyToken, ordersAPI.findByStatus);

module.exports = router;
