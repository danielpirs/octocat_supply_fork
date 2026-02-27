import { test, expect, Page } from '@playwright/test';

/**
 * Shopping cart functionality E2E tests
 * Implements: frontend/tests/features/shopping-cart.feature
 *
 * Covers:
 * - Adding products to cart from catalog
 * - Viewing cart contents in dropdown
 * - Updating quantities and removing items
 * - Cart persistence across navigation and refresh
 * - Checkout navigation
 * - Cart dropdown interactions (close on outside click, ESC key)
 */

test.describe('Shopping cart functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
  });

  test.describe('Empty cart state', () => {
    test('View empty cart shows empty message', async ({ page }) => {
      // Given I am on the product catalog page
      await page.goto('/products');

      // When I click the shopping cart icon
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();

      // Then I see the cart dropdown
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown).toBeVisible();

      // And I see the empty cart message
      await expect(page.locator('text=Your cart is empty')).toBeVisible();
    });
  });

  test.describe('Adding products to cart', () => {
    test('Add product to cart from catalog', async ({ page }) => {
      // Given I am viewing the product catalog
      await page.goto('/products');

      // And I see "SmartFeeder One" in the product list
      const productCard = page.locator('h3:has-text("SmartFeeder One")').first();
      await expect(productCard).toBeVisible();

      // When I click "Add to Cart" for "SmartFeeder One"
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      await addToCartButton.click();

      // Then I see the quantity selection modal
      const modal = page.locator('[data-testid="add-to-cart-modal"]');
      await expect(modal).toBeVisible();

      // When I set quantity to 2
      const quantityInput = modal.locator('input[type="number"]');
      await quantityInput.fill('2');

      // And I click "Add to Cart" in the modal
      const confirmButton = modal.locator('button:has-text("Add to Cart")');
      await confirmButton.click();

      // Then the modal closes
      await expect(modal).not.toBeVisible();

      // And the cart icon shows "2" items
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toHaveText('2');
    });

    test('Cancel add to cart closes modal without adding', async ({ page }) => {
      // Given I am viewing the product catalog
      await page.goto('/products');

      // When I click "Add to Cart"
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      await addToCartButton.click();

      // Then I see the modal
      const modal = page.locator('[data-testid="add-to-cart-modal"]');
      await expect(modal).toBeVisible();

      // When I click Cancel
      const cancelButton = modal.locator('button:has-text("Cancel")');
      await cancelButton.click();

      // Then the modal closes
      await expect(modal).not.toBeVisible();

      // And cart remains empty (no badge)
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).not.toBeVisible();
    });
  });

  test.describe('Cart dropdown interactions', () => {
    test('View cart with items shows product details', async ({ page }) => {
      // Given I have added a product to my cart
      await addProductToCart(page, 'SmartFeeder One', 2);

      // When I click the shopping cart icon
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();

      // Then I see the cart dropdown
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown).toBeVisible();

      // And I see the product name
      await expect(cartDropdown.locator('text=SmartFeeder One')).toBeVisible();

      // And I see the quantity
      await expect(cartDropdown.locator('input[type="number"]')).toHaveValue('2');

      // And I see the cart total
      await expect(cartDropdown.locator('text=Total:')).toBeVisible();
    });

    test('Update quantity in cart', async ({ page }) => {
      // Given I have a product in my cart with quantity 2
      await addProductToCart(page, 'SmartFeeder One', 2);

      // And the cart dropdown is open
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown).toBeVisible();

      // When I change the quantity to 3
      const quantityInput = cartDropdown.locator('input[type="number"]');
      await quantityInput.fill('3');

      // Then the cart icon shows "3" items
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toHaveText('3');
    });

    test('Remove item from cart', async ({ page }) => {
      // Given I have a product in my cart
      await addProductToCart(page, 'SmartFeeder One', 1);

      // And the cart dropdown is open
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown).toBeVisible();

      // When I click the remove button
      const removeButton = cartDropdown.locator('[aria-label*="Remove"]');
      await removeButton.click();

      // Then the item is removed
      await expect(cartDropdown.locator('text=SmartFeeder One')).not.toBeVisible();

      // And the empty message appears
      await expect(page.locator('text=Your cart is empty')).toBeVisible();
    });

    test('Close cart dropdown by clicking outside', async ({ page }) => {
      // Given the cart dropdown is open
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown).toBeVisible();

      // When I click outside the cart dropdown
      await page.locator('h1:has-text("Products")').click();

      // Then the cart dropdown closes
      await expect(cartDropdown).not.toBeVisible();
    });

    test('Close cart dropdown with Escape key', async ({ page }) => {
      // Given the cart dropdown is open
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown).toBeVisible();

      // When I press the Escape key
      await page.keyboard.press('Escape');

      // Then the cart dropdown closes
      await expect(cartDropdown).not.toBeVisible();
    });
  });

  test.describe('Cart persistence', () => {
    test('Cart persists across page navigation', async ({ page }) => {
      // Given I have added a product to my cart
      await addProductToCart(page, 'SmartFeeder One', 1);

      // Verify cart badge shows 1
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toHaveText('1');

      // When I navigate to the About page
      await page.click('nav a:has-text("About")');
      await expect(page).toHaveURL(/\/about/);

      // Then the cart icon still shows the item count
      await expect(cartBadge).toHaveText('1');

      // When I navigate back to Products
      await page.click('nav a:has-text("Products")');
      await expect(page).toHaveURL(/\/products/);

      // Then the cart still contains the item
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown.locator('text=SmartFeeder One')).toBeVisible();
    });

    test('Cart persists across page refresh', async ({ page }) => {
      // Given I have added a product to my cart
      await addProductToCart(page, 'SmartFeeder One', 2);

      // Verify cart badge shows 2
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toHaveText('2');

      // When I refresh the page
      await page.reload();
      await expect(page.locator('h1:has-text("Products")')).toBeVisible();

      // Then the cart icon still shows the item count
      await expect(cartBadge).toHaveText('2');

      // And the cart still contains the item
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown.locator('text=SmartFeeder One')).toBeVisible();
    });
  });

  test.describe('Checkout navigation', () => {
    test('Navigate to checkout from cart dropdown', async ({ page }) => {
      // Given I have items in my cart
      await addProductToCart(page, 'SmartFeeder One', 1);

      // And the cart dropdown is open
      const cartIcon = page.locator('[aria-label="Shopping cart"]');
      await cartIcon.click();
      const cartDropdown = page.locator('[data-testid="cart-dropdown"]');
      await expect(cartDropdown).toBeVisible();

      // When I click the "Checkout" button
      const checkoutButton = cartDropdown.locator('a:has-text("Checkout")');
      await checkoutButton.click();

      // Then I am navigated to the checkout page
      await expect(page).toHaveURL(/\/checkout/);
    });
  });
});

/**
 * Helper function to add a product to cart
 */
async function addProductToCart(page: Page, productName: string, quantity: number) {
  // Navigate to products page if not already there
  const url = page.url();
  if (!url.includes('/products')) {
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
  }

  // Wait for product grid to load
  await page.waitForSelector(`h3:has-text("${productName}")`);

  // Find the product card and click Add to Cart
  const productCard = page.locator(`h3:has-text("${productName}")`).first();
  const addToCartButton = productCard.locator('..').locator('button:has-text("Add to Cart")');
  await addToCartButton.click();

  // Fill in quantity in modal
  const modal = page.locator('[data-testid="add-to-cart-modal"]');
  await expect(modal).toBeVisible();

  const quantityInput = modal.locator('input[type="number"]');
  await quantityInput.fill(quantity.toString());

  // Confirm add to cart
  const confirmButton = modal.locator('button:has-text("Add to Cart")');
  await confirmButton.click();

  // Wait for modal to close
  await expect(modal).not.toBeVisible();
}
