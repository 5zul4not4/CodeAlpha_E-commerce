const express = require('express');
const Product = require('./Product');
const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

module.exports = router;