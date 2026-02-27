-- Seed data for carts
-- Sample cart for testing

INSERT INTO carts (cart_id, user_id, created_at, updated_at)
VALUES 
    (1, 'demo-user', datetime('now'), datetime('now'));

-- Sample cart items (referencing existing products from seed 004_products.sql)
INSERT INTO cart_items (cart_item_id, cart_id, product_id, quantity, unit_price)
VALUES 
    (1, 1, 1, 2, 149.99),
    (2, 1, 3, 1, 29.99);
