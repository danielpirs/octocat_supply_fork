import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartItemsRepository } from './cartItemsRepo';
import { NotFoundError, ValidationError } from '../utils/errors';

// Mock the getDatabase function first
vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn()
}));

describe('CartItemsRepository', () => {
  let repository: CartItemsRepository;
  let mockDb: any;

  beforeEach(() => {
    // Create mock database connection
    mockDb = {
      db: {} as any,
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn()
    };

    repository = new CartItemsRepository(mockDb);
    vi.clearAllMocks();
  });

  describe('findByCartId', () => {
    it('should return all items in a cart with product details', async () => {
      const mockResults = [
        {
          cart_item_id: 1,
          cart_id: 1,
          product_id: 1,
          quantity: 2,
          unit_price: 29.99,
          product_name: 'Test Product',
          img_name: 'test.png'
        }
      ];
      mockDb.all.mockResolvedValue(mockResults);

      const result = await repository.findByCartId(1);

      expect(mockDb.all).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].cartItemId).toBe(1);
      expect(result[0].productName).toBe('Test Product');
      expect(result[0].quantity).toBe(2);
    });

    it('should return empty array when cart is empty', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findByCartId(1);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return cart item when found', async () => {
      const mockResult = {
        cart_item_id: 1,
        cart_id: 1,
        product_id: 1,
        quantity: 2,
        unit_price: 29.99
      };
      mockDb.get.mockResolvedValue(mockResult);

      const result = await repository.findById(1);

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM cart_items WHERE cart_item_id = ?', [1]);
      expect(result?.cartItemId).toBe(1);
      expect(result?.quantity).toBe(2);
    });

    it('should return null when cart item not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const newItem = {
        cartId: 1,
        productId: 2,
        quantity: 3,
        unitPrice: 49.99
      };

      // First call checks for existing item
      mockDb.get.mockResolvedValueOnce(undefined);
      mockDb.run.mockResolvedValue({ lastID: 2, changes: 1 });
      // Second call retrieves created item
      mockDb.get.mockResolvedValueOnce({
        cart_item_id: 2,
        cart_id: 1,
        product_id: 2,
        quantity: 3,
        unit_price: 49.99
      });

      const result = await repository.addItem(newItem);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result.cartItemId).toBe(2);
      expect(result.quantity).toBe(3);
    });

    it('should update quantity when item already exists', async () => {
      const existingItem = {
        cart_item_id: 1,
        cart_id: 1,
        product_id: 2,
        quantity: 2,
        unit_price: 49.99
      };

      // First call finds existing item
      mockDb.get.mockResolvedValueOnce(existingItem);
      // Update call
      mockDb.run.mockResolvedValue({ changes: 1 });
      // Get updated item
      mockDb.get.mockResolvedValueOnce({
        ...existingItem,
        quantity: 5 // 2 + 3
      });

      const result = await repository.addItem({
        cartId: 1,
        productId: 2,
        quantity: 3,
        unitPrice: 49.99
      });

      expect(result.quantity).toBe(5);
    });

    it('should throw ValidationError for zero or negative quantity', async () => {
      await expect(repository.addItem({
        cartId: 1,
        productId: 1,
        quantity: 0,
        unitPrice: 29.99
      })).rejects.toThrow(ValidationError);

      await expect(repository.addItem({
        cartId: 1,
        productId: 1,
        quantity: -1,
        unitPrice: 29.99
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.get.mockResolvedValue({
        cart_item_id: 1,
        cart_id: 1,
        product_id: 1,
        quantity: 5,
        unit_price: 29.99
      });

      const result = await repository.updateQuantity(1, 5);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result.quantity).toBe(5);
    });

    it('should throw NotFoundError when item does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.updateQuantity(999, 5)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid quantity', async () => {
      await expect(repository.updateQuantity(1, 0)).rejects.toThrow(ValidationError);
      await expect(repository.updateQuantity(1, -1)).rejects.toThrow(ValidationError);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await repository.removeItem(1);

      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM cart_items WHERE cart_item_id = ?', [1]);
    });

    it('should throw NotFoundError when item does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.removeItem(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      mockDb.run.mockResolvedValue({ changes: 3 });

      await repository.clearCart(1);

      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM cart_items WHERE cart_id = ?', [1]);
    });
  });

  describe('getCartTotal', () => {
    it('should return total price of cart', async () => {
      mockDb.get.mockResolvedValue({ total: 149.97 });

      const result = await repository.getCartTotal(1);

      expect(result).toBe(149.97);
    });

    it('should return 0 for empty cart', async () => {
      mockDb.get.mockResolvedValue({ total: 0 });

      const result = await repository.getCartTotal(1);

      expect(result).toBe(0);
    });
  });

  describe('getCartItemCount', () => {
    it('should return total item count', async () => {
      mockDb.get.mockResolvedValue({ count: 5 });

      const result = await repository.getCartItemCount(1);

      expect(result).toBe(5);
    });

    it('should return 0 for empty cart', async () => {
      mockDb.get.mockResolvedValue({ count: 0 });

      const result = await repository.getCartItemCount(1);

      expect(result).toBe(0);
    });
  });
});
