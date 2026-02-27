Feature: Shopping cart functionality
  As a customer
  I want to add products to a shopping cart and manage my selections
  So that I can purchase multiple items in a single transaction

  Scenario: View empty cart
    Given I am on the product catalog page
    When I click the shopping cart icon
    Then I see the cart dropdown
    And I see the empty cart message "Your cart is empty"

  Scenario: Add product to cart from catalog
    Given I am viewing the product catalog
    And I see "SmartFeeder One" in the product list
    When I click "Add to Cart" for "SmartFeeder One"
    Then I see the quantity selection modal
    When I set quantity to 2
    And I click "Add to Cart" in the modal
    Then the cart icon shows "2" items
    And a confirmation appears "Added to cart"

  Scenario: View cart with items
    Given I have added "SmartFeeder One" with quantity 2 to my cart
    When I click the shopping cart icon
    Then I see the cart dropdown
    And I see "SmartFeeder One" in the cart
    And I see quantity "2" for that item
    And I see the item price and subtotal
    And I see the cart total

  Scenario: Update quantity in cart
    Given I have "SmartFeeder One" in my cart with quantity 2
    And the cart dropdown is open
    When I increase the quantity to 3
    Then the cart total updates automatically
    And the cart icon shows "3" items

  Scenario: Remove item from cart
    Given I have "SmartFeeder One" in my cart
    And the cart dropdown is open
    When I click the remove button for "SmartFeeder One"
    Then "SmartFeeder One" is removed from the cart
    And the cart total updates

  Scenario: Cart persists across page navigation
    Given I have added "SmartFeeder One" to my cart
    When I navigate to the About page
    And I navigate back to the Products page
    Then the cart icon still shows the item count
    And the cart still contains "SmartFeeder One"

  Scenario: Cart persists across page refresh
    Given I have added "SmartFeeder One" to my cart
    When I refresh the page
    Then the cart icon still shows the item count
    And the cart still contains "SmartFeeder One"

  Scenario: Navigate to checkout
    Given I have items in my cart
    And the cart dropdown is open
    When I click the "Checkout" button
    Then I am navigated to the checkout page

  Scenario: Close cart dropdown by clicking outside
    Given the cart dropdown is open
    When I click outside the cart dropdown
    Then the cart dropdown closes

  Scenario: Close cart dropdown with Escape key
    Given the cart dropdown is open
    When I press the Escape key
    Then the cart dropdown closes
