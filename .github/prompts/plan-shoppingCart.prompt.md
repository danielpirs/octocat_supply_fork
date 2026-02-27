## Plan: Shopping Cart Feature with Backend API

This plan implements a full shopping cart feature including: React context with localStorage fallback, backend REST API with SQLite persistence, cart dropdown UI in blue theme, quantity selection on add, and comprehensive E2E + API tests.

**Key Decisions:**
- Backend cart API (per user choice) enables cross-device sync for authenticated users
- Dual-persistence strategy: localStorage for guests, API sync for logged-in users
- Quantity input modal before adding to cart (per user choice)

**Steps**

### Phase 1: Database Layer

1. Create migration file [api/database/migrations/003_create_carts.sql](api/database/migrations/003_create_carts.sql) with:
   - `carts` table: `cart_id` (PK), `user_id` (nullable for future auth), `created_at`, `updated_at`
   - `cart_items` table: `cart_item_id` (PK), `cart_id` (FK), `product_id` (FK), `quantity`, `unit_price`
   - Indexes on all foreign key columns per [database.instructions.md](api/database/migrations/) conventions

2. Create seed file [api/database/seed/005_carts.sql](api/database/seed/005_carts.sql) with sample cart data for testing

### Phase 2: API Models & Repositories

3. Create model [api/src/models/cart.ts](api/src/models/cart.ts) with `Cart` interface plus Swagger schema JSDoc annotation

4. Create model [api/src/models/cartItem.ts](api/src/models/cartItem.ts) with `CartItem` interface following `OrderDetail` pattern

5. Create repository [api/src/repositories/cartsRepo.ts](api/src/repositories/cartsRepo.ts) with:
   - `findById()`, `create()`, `delete()`, `findByUserId()`
   - Use [sql.ts](api/src/utils/sql.ts) utilities for case mapping

6. Create repository [api/src/repositories/cartItemsRepo.ts](api/src/repositories/cartItemsRepo.ts) with:
   - `findByCartId()`, `addItem()`, `updateQuantity()`, `removeItem()`, `clearCart()`
   - Include `getCartTotal()` method with JOIN to products table

### Phase 3: API Routes

7. Create routes [api/src/routes/cart.ts](api/src/routes/cart.ts) following [order.ts](api/src/routes/order.ts) pattern:
   - `GET /api/carts/:id` - Get cart with items
   - `POST /api/carts` - Create new cart
   - `DELETE /api/carts/:id` - Delete cart

8. Create routes [api/src/routes/cartItem.ts](api/src/routes/cartItem.ts):
   - `GET /api/carts/:cartId/items` - List items
   - `POST /api/carts/:cartId/items` - Add item (with quantity)
   - `PUT /api/carts/:cartId/items/:itemId` - Update quantity
   - `DELETE /api/carts/:cartId/items/:itemId` - Remove item

9. Register routes in [api/src/index.ts](api/src/index.ts) after existing routes:
   - `app.use('/api/carts', cartRoutes)`

### Phase 4: Frontend Context

10. Create [frontend/src/context/CartContext.tsx](frontend/src/context/CartContext.tsx):
    - `CartItem` interface: `productId`, `name`, `price`, `quantity`, `imgName`
    - `CartProvider` with localStorage persistence (following [ThemeContext.tsx](frontend/src/context/ThemeContext.tsx#L17-L22) pattern)
    - Methods: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`
    - Computed: `totalPrice`, `totalItems`
    - API sync for authenticated users via `useAuth()` check

11. Wire `CartProvider` into [App.tsx](frontend/src/App.tsx) after `ThemeProvider`

### Phase 5: UI Components

12. Add blue cart colors to [tailwind.config.js](frontend/tailwind.config.js):
    - `'cart': '#3B82F6'`, `'cart-hover': '#2563EB'`, `'cart-light': '#DBEAFE'`

13. Create [frontend/src/components/cart/CartIcon.tsx](frontend/src/components/cart/CartIcon.tsx):
    - Shopping cart SVG icon (use Heroicons pattern)
    - Badge showing `totalItems` count
    - Blue background (`bg-cart`) when items present

14. Create [frontend/src/components/cart/CartDropdown.tsx](frontend/src/components/cart/CartDropdown.tsx):
    - Item list with name, price, quantity
    - Remove button per item (X icon, `onClick={() => removeItem(productId)}`)
    - Total price display at bottom
    - "Checkout" button linking to `/checkout` (route not implemented yet)
    - Blue theme styling with dark mode support

15. Create [frontend/src/components/cart/AddToCartModal.tsx](frontend/src/components/cart/AddToCartModal.tsx):
    - Modal overlay with quantity input field
    - Product preview (name, price, image)
    - "Add to Cart" and "Cancel" buttons
    - Accessible: focus trap, ESC to close

16. Integrate cart icon in [Navigation.tsx](frontend/src/components/Navigation.tsx#L83-L146):
    - Insert `<CartIcon />` before theme toggle button in the right flex container
    - Pass dropdown open state and toggle handler

### Phase 6: Product Integration

17. Update [Products.tsx](frontend/src/components/entity/product/Products.tsx#L52-L60):
    - Replace `handleAddToCart()` TODO with modal trigger
    - Add state for selected product and modal visibility
    - Import and render `AddToCartModal`

### Phase 7: Placeholder Route

18. Add placeholder route in [App.tsx](frontend/src/App.tsx) for `/checkout` displaying "Coming Soon" message

### Phase 8: API Tests

19. Create [api/src/repositories/cartsRepo.test.ts](api/src/repositories/cartsRepo.test.ts) following [suppliersRepo.test.ts](api/src/repositories/suppliersRepo.test.ts) pattern:
    - Mock `getDatabase()` with in-memory DB
    - Test `create()`, `findById()`, `delete()`

20. Create [api/src/repositories/cartItemsRepo.test.ts](api/src/repositories/cartItemsRepo.test.ts):
    - Test `addItem()`, `updateQuantity()`, `removeItem()`, `findByCartId()`, `getCartTotal()`

### Phase 9: E2E Tests

21. Create [frontend/tests/features/shopping-cart.feature](frontend/tests/features/shopping-cart.feature):
    ```gherkin
    Feature: Shopping cart management
      Scenario: Add item to cart with quantity selection
      Scenario: View cart dropdown with items
      Scenario: Remove item from cart
      Scenario: Cart persists after page reload
      Scenario: Checkout button navigates to checkout page
    ```

22. Create [frontend/tests/e2e/shopping-cart.spec.ts](frontend/tests/e2e/shopping-cart.spec.ts):
    - Test adding product with quantity modal
    - Test cart icon badge updates
    - Test dropdown opens and shows items
    - Test remove button functionality
    - Test localStorage persistence (reload page)
    - Test checkout button navigation

**Verification**

- Run `make db-seed` to apply new migration
- Run `cd api && npm test` — all cart repo tests pass
- Run `cd frontend && npm run test:e2e` — all shopping cart E2E tests pass
- Manual verification:
  - Navigate to `/products`, click "Add to Cart" → modal appears
  - Select quantity, confirm → cart icon badge shows count
  - Click cart icon → dropdown shows item with correct price × quantity
  - Remove item → badge and total update
  - Refresh page → cart persists
  - Click Checkout → navigates to `/checkout` placeholder

**Decisions**
- **Backend cart API**: Chose to implement backend persistence (user requested) over client-only localStorage
- **Quantity input**: Using modal before add (user requested) rather than default quantity=1
- **Dual persistence**: localStorage for guests, API sync for logged-in users (future auth integration ready)
- **Blue colors**: Adding custom `cart`, `cart-hover`, `cart-light` to Tailwind config for consistent theming
