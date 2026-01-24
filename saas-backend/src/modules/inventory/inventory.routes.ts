import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/inventory/products
 * @desc    Create new product
 * @access  Private
 */
router.post('/products', InventoryController.createProduct);

/**
 * @route   GET /api/inventory/products
 * @desc    Get all products (with filters)
 * @access  Private
 */
router.get('/products', InventoryController.getProducts);

/**
 * @route   GET /api/inventory/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get('/products/:id', InventoryController.getProductById);

/**
 * @route   PUT /api/inventory/products/:id
 * @desc    Update product
 * @access  Private
 */
router.put('/products/:id', InventoryController.updateProduct);

/**
 * @route   DELETE /api/inventory/products/:id
 * @desc    Delete product
 * @access  Private
 */
router.delete('/products/:id', InventoryController.deleteProduct);

/**
 * @route   POST /api/inventory/products/:id/stock
 * @desc    Adjust product stock
 * @access  Private
 */
router.post('/products/:id/stock', InventoryController.adjustStock);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get low stock products
 * @access  Private
 */
router.get('/low-stock', InventoryController.getLowStockProducts);

/**
 * @route   GET /api/inventory/stats
 * @desc    Get inventory statistics
 * @access  Private
 */
router.get('/stats', InventoryController.getStats);

/**
 * @route   GET /api/inventory/stock-history
 * @desc    Get stock movement history
 * @access  Private
 */
router.get('/stock-history', InventoryController.getStockHistory);

export default router;
