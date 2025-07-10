const express = require('express');
const Order = require('./Order');
const Product = require('./Product');
const { authMiddleware } = require('./auth');
const router = express.Router();

// POST /api/orders
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const items = req.body.items; // [{ productId, quantity }]
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });
  let total = 0;
  let orderItems = [];
  for (let item of items) {
    const product = await Product.findById(item.productId);
    if (!product) return res.status(400).json({ error: 'Invalid product' });
    total += product.price * item.quantity;
    orderItems.push({ product: product._id, quantity: item.quantity });
  }
  const order = new Order({
    user: userId,
    items: orderItems,
    total
  });
  await order.save();
  res.json({ success: true, orderId: order._id });
});

module.exports = router;