/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: API endpoints for managing shopping carts
 */

/**
 * @swagger
 * /api/carts:
 *   post:
 *     summary: Create a new cart
 *     tags: [Carts]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Optional user ID for the cart
 *     responses:
 *       201:
 *         description: Cart created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *
 * /api/carts/{id}:
 *   get:
 *     summary: Get a cart by ID with all items
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     responses:
 *       200:
 *         description: Cart found with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItemWithProduct'
 *                 total:
 *                   type: number
 *                 itemCount:
 *                   type: integer
 *       404:
 *         description: Cart not found
 *   delete:
 *     summary: Delete a cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     responses:
 *       204:
 *         description: Cart deleted successfully
 *       404:
 *         description: Cart not found
 *
 * /api/carts/{cartId}/items:
 *   get:
 *     summary: Get all items in a cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     responses:
 *       200:
 *         description: List of cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CartItemWithProduct'
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - unitPrice
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *   delete:
 *     summary: Clear all items from the cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     responses:
 *       204:
 *         description: Cart cleared successfully
 *
 * /api/carts/{cartId}/items/{itemId}:
 *   put:
 *     summary: Update item quantity
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item quantity updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *       404:
 *         description: Cart item not found
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart Item ID
 *     responses:
 *       204:
 *         description: Item removed from cart
 *       404:
 *         description: Cart item not found
 */

import express from 'express';
import { Cart } from '../models/cart';
import { CartItem } from '../models/cartItem';
import { getCartsRepository } from '../repositories/cartsRepo';
import { getCartItemsRepository } from '../repositories/cartItemsRepo';
import { NotFoundError } from '../utils/errors';

const router = express.Router();

// Create a new cart
router.post('/', async (req, res, next) => {
  try {
    const repo = await getCartsRepository();
    const newCart = await repo.create(req.body as Omit<Cart, 'cartId' | 'createdAt' | 'updatedAt'>);
    res.status(201).json(newCart);
  } catch (error) {
    next(error);
  }
});

// Get a cart by ID with items, total, and item count
router.get('/:id', async (req, res, next) => {
  try {
    const cartsRepo = await getCartsRepository();
    const itemsRepo = await getCartItemsRepository();
    
    const cart = await cartsRepo.findById(parseInt(req.params.id));
    if (!cart) {
      throw new NotFoundError('Cart', parseInt(req.params.id));
    }

    const items = await itemsRepo.findByCartId(cart.cartId);
    const total = await itemsRepo.getCartTotal(cart.cartId);
    const itemCount = await itemsRepo.getCartItemCount(cart.cartId);

    res.json({ cart, items, total, itemCount });
  } catch (error) {
    next(error);
  }
});

// Delete a cart
router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getCartsRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get all items in a cart
router.get('/:cartId/items', async (req, res, next) => {
  try {
    const repo = await getCartItemsRepository();
    const items = await repo.findByCartId(parseInt(req.params.cartId));
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Add item to cart
router.post('/:cartId/items', async (req, res, next) => {
  try {
    const repo = await getCartItemsRepository();
    const cartsRepo = await getCartsRepository();
    
    const cartId = parseInt(req.params.cartId);
    const itemData = {
      cartId,
      productId: req.body.productId,
      quantity: req.body.quantity,
      unitPrice: req.body.unitPrice,
    } as Omit<CartItem, 'cartItemId'>;

    const newItem = await repo.addItem(itemData);
    
    // Touch the cart to update its timestamp
    await cartsRepo.touch(cartId);

    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

// Update item quantity
router.put('/:cartId/items/:itemId', async (req, res, next) => {
  try {
    const repo = await getCartItemsRepository();
    const cartsRepo = await getCartsRepository();
    
    const updatedItem = await repo.updateQuantity(
      parseInt(req.params.itemId),
      req.body.quantity
    );

    // Touch the cart to update its timestamp
    await cartsRepo.touch(parseInt(req.params.cartId));

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// Remove item from cart
router.delete('/:cartId/items/:itemId', async (req, res, next) => {
  try {
    const repo = await getCartItemsRepository();
    const cartsRepo = await getCartsRepository();
    
    await repo.removeItem(parseInt(req.params.itemId));

    // Touch the cart to update its timestamp
    await cartsRepo.touch(parseInt(req.params.cartId));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Clear all items from cart
router.delete('/:cartId/items', async (req, res, next) => {
  try {
    const repo = await getCartItemsRepository();
    const cartsRepo = await getCartsRepository();
    
    const cartId = parseInt(req.params.cartId);
    await repo.clearCart(cartId);

    // Touch the cart to update its timestamp
    await cartsRepo.touch(cartId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
