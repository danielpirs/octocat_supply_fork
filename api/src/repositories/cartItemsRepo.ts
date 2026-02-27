/**
 * Repository for cart items data access
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { CartItem, CartItemWithProduct } from '../models/cartItem';
import { handleDatabaseError, NotFoundError, ValidationError } from '../utils/errors';
import { buildInsertSQL, buildUpdateSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';

export class CartItemsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Get all items in a cart with product details
   */
  async findByCartId(cartId: number): Promise<CartItemWithProduct[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        `SELECT 
          ci.cart_item_id,
          ci.cart_id,
          ci.product_id,
          ci.quantity,
          ci.unit_price,
          p.name as product_name,
          p.img_name
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = ?
        ORDER BY ci.cart_item_id`,
        [cartId]
      );
      return mapDatabaseRows<CartItemWithProduct>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get cart item by ID
   */
  async findById(id: number): Promise<CartItem | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM cart_items WHERE cart_item_id = ?', [id]);
      return row ? objectToCamelCase<CartItem>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find existing cart item by cart ID and product ID
   */
  async findByCartAndProduct(cartId: number, productId: number): Promise<CartItem | null> {
    try {
      const row = await this.db.get<DatabaseRow>(
        'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cartId, productId]
      );
      return row ? objectToCamelCase<CartItem>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Add item to cart (or update quantity if already exists)
   */
  async addItem(item: Omit<CartItem, 'cartItemId'>): Promise<CartItem> {
    try {
      if (item.quantity <= 0) {
        throw new ValidationError('Quantity must be greater than 0');
      }

      // Check if item already exists in cart
      const existing = await this.findByCartAndProduct(item.cartId, item.productId);
      
      if (existing) {
        // Update quantity instead of adding duplicate
        return this.updateQuantity(existing.cartItemId, existing.quantity + item.quantity);
      }

      const { sql, values } = buildInsertSQL('cart_items', item);
      const result = await this.db.run(sql, values);

      const createdItem = await this.findById(result.lastID || 0);
      if (!createdItem) {
        throw new Error('Failed to retrieve created cart item');
      }

      return createdItem;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Update item quantity
   */
  async updateQuantity(id: number, quantity: number): Promise<CartItem> {
    try {
      if (quantity <= 0) {
        throw new ValidationError('Quantity must be greater than 0');
      }

      const { sql, values } = buildUpdateSQL('cart_items', { quantity }, 'cart_item_id = ?');
      const result = await this.db.run(sql, [...values, id]);

      if (result.changes === 0) {
        throw new NotFoundError('CartItem', id);
      }

      const updatedItem = await this.findById(id);
      if (!updatedItem) {
        throw new Error('Failed to retrieve updated cart item');
      }

      return updatedItem;
    } catch (error) {
      handleDatabaseError(error, 'CartItem', id);
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM cart_items WHERE cart_item_id = ?', [id]);

      if (result.changes === 0) {
        throw new NotFoundError('CartItem', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'CartItem', id);
    }
  }

  /**
   * Clear all items from a cart
   */
  async clearCart(cartId: number): Promise<void> {
    try {
      await this.db.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get cart total (sum of quantity * unit_price)
   */
  async getCartTotal(cartId: number): Promise<number> {
    try {
      const row = await this.db.get<{ total: number }>(
        'SELECT COALESCE(SUM(quantity * unit_price), 0) as total FROM cart_items WHERE cart_id = ?',
        [cartId]
      );
      return row?.total ?? 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get total item count in cart
   */
  async getCartItemCount(cartId: number): Promise<number> {
    try {
      const row = await this.db.get<{ count: number }>(
        'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE cart_id = ?',
        [cartId]
      );
      return row?.count ?? 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

/**
 * Factory function to get a CartItemsRepository instance
 */
export async function getCartItemsRepository(isTest: boolean = false): Promise<CartItemsRepository> {
  const db = await getDatabase(isTest);
  return new CartItemsRepository(db);
}
