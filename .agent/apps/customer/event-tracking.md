# E-commerce Event Tracking Guide

This guide describes the analytics tracking events implemented across the client e-commerce applications in the monorepo: **`apps/customer`** and **`apps/new-app`**.

## Event Names and Implementation Details

Below is the list of events, their triggers, and the exact files/methods where they are implemented.

### 1. Add to Cart Flow
- **Event**: `add_to_cart`
- **When**: User adds an item to the basket
- **Data**: `{ productId, variantId, productName, quantity }`
- **Implementation**:
  - `apps/customer`: `src/app/core/services/cart.service.ts` -> `addToCart()`
  - `apps/new-app`: `src/app/core/services/cart.service.ts` -> `addToCart()`

### 2. Remove from Cart
- **Event**: `remove_from_cart`
- **When**: User removes an item from the basket
- **Data**: `{ productId, variantId }`
- **Implementation**:
  - `apps/customer`: `src/app/core/services/cart.service.ts` -> `removeFromCart()` / `deleteProduct()`
  - `apps/new-app`: `src/app/core/services/cart.service.ts` -> `removeFromCart()` / `deleteProduct()`

### 3. Cart View
- **Event**: `view_cart`
- **When**: User navigates to the cart page
- **Data**: `{ itemCount, totalAmount }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/cart/cart.component.ts` -> constructor / initialization

### 4. Proceed to Checkout
- **Event**: `proceed_to_checkout`
- **When**: User clicks the complete/checkout button in the cart
- **Data**: `{ itemCount, totalAmount }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/cart/cart.component.ts` -> `submit()` method

### 5. Login Required
- **Event**: `login_required`
- **When**: User is redirected to login during the checkout flow
- **Data**: `{ returnPath }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/cart/cart.component.ts` -> `submit()` method (conditional flow)

### 6. Checkout Started
- **Event**: `checkout_started`
- **When**: User begins the checkout process (while logged in)
- **Data**: `{ itemCount, totalAmount }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/cart/cart.component.ts` -> `submit()` method (conditional flow)

### 7. Login Attempt
- **Event**: `login_attempted`
- **When**: User attempts to request a login token/code
- **Data**: `{ phone, returnPath }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/auth/login/login.component.ts` -> `sendToken()` method

### 8. Login Successful
- **Event**: `login_successful`
- **When**: User successfully verifies OTP and logs in
- **Data**: `{ returnPath }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/auth/otp/otp.component.ts` -> `setToken()` method

### 9. Login Failed
- **Event**: `login_failed`
- **When**: User login OTP verification fails
- **Data**: `{ error }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/auth/otp/otp.component.ts` -> `setToken()` method (error callback)

### 10. Registration Required
- **Event**: `registration_required`
- **When**: User needs to register after verification
- **Data**: `{ returnPath }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/auth/otp/otp.component.ts` -> `setToken()` method

### 11. Address Selection
- **Event**: `address_selected`
- **When**: User selects an existing address in checkout
- **Data**: `{ addressId, region }`
- **Implementation**:
  - `apps/customer`: `src/app/pages/checkout/components/address-list/address-list.component.ts` -> `setAddresses()` and `address-selection-dialog.component.ts`
  - `apps/new-app`: `src/app/payment/address-list/address-list.component.ts` -> `selectAddress()`

### 12. Address Added
- **Event**: `address_added`
- **When**: User adds a new address
- **Data**: `{ region }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/address/address-edit/address-edit.component.ts` -> `submit()` method

### 13. Address Updated
- **Event**: `address_updated`
- **When**: User updates an existing address
- **Data**: `{ addressType, region }`
- **Implementation**:
  - `apps/customer`: *Not explicitly tracked*
  - `apps/new-app`: `src/app/address/address-edit/address-edit.component.ts` -> `submit()` method

### 14. Payment Method Selection
- **Event**: `payment_method_selected`
- **When**: User selects a payment method
- **Data**: `{ paymentMethod, paymentType }`
- **Implementation**:
  - `apps/customer`: `src/app/pages/checkout/components/payment-methods/payment-methods.component.ts` -> `typeSelectionChange()`
  - `apps/new-app`: `src/app/payment/payment-methods/payment-methods.component.ts` -> `typeSelectionChange()`

### 15. Wallet Used
- **Event**: `wallet_used`
- **When**: User opts to use their wallet balance for payment
- **Data**: `{ walletBalance }`
- **Implementation**:
  - `apps/customer`: `src/app/pages/checkout/components/payment-methods/payment-methods.component.ts` -> `useWalletSelectedChange()`
  - `apps/new-app`: `src/app/payment/payment-methods/payment-methods.component.ts` -> `useWalletSelectedChange()`

### 16. Discount Code Applied
- **Event**: `discount_code_applied`
- **When**: User successfully applies a discount code
- **Data**: `{ discountCode, discountAmount, discountType }`
- **Implementation**:
  - `apps/customer`: `src/app/shared/components/discount-coupon-modal/discount-coupon-modal.component.ts` -> `submit()`
  - `apps/new-app`: `src/app/common/components/discount-coupon-modal/discount-coupon-modal.component.ts` -> `submit()`

### 17. Discount Code Failed
- **Event**: `discount_code_failed`
- **When**: User attempts to apply an invalid or expired discount code
- **Data**: `{ discountCode }`
- **Implementation**:
  - `apps/customer`: `src/app/shared/components/discount-coupon-modal/discount-coupon-modal.component.ts` -> `submit()` (error callback)
  - `apps/new-app`: `src/app/common/components/discount-coupon-modal/discount-coupon-modal.component.ts` -> `submit()` (error callback)

### 18. Order Placement Attempt
- **Event**: `place_order_attempted`
- **When**: User triggers the final order placement action
- **Data**: `{ itemCount, totalAmount, paymentType }`
- **Implementation**:
  - `apps/customer`: `src/app/pages/checkout/checkout.component.ts` -> `submit()` method
  - `apps/new-app`: `src/app/payment/payment.component.ts` -> `submit()` method

### 19. Payment Gateway Redirect
- **Event**: `redirect_to_payment_gateway`
- **When**: User is redirected to the external payment gateway
- **Implementation**:
  - `apps/customer`: `src/app/core/services/pay.service.ts` -> `redirect()` method
  - `apps/new-app`: `src/app/core/services/pay.service.ts` -> `redirect()` method

### 20. Order Placed Successfully
- **Event**: `order_placed_successfully`
- **When**: Order is successfully created and verified
- **Data**: `{ orderId, itemCount, totalAmount, paymentType }`
- **Implementation**:
  - `apps/customer`: `src/app/pages/checkout/checkout.component.ts` -> `submit()` method (on success)
  - `apps/new-app`: `src/app/payment/payment.component.ts` -> `submit()` method (on success)

---

## Analytics Service Usage

Both applications expose an `AnalyticsService` (typically under `src/app/core/services/analytics.service.ts`) injected via dependency injection using the `inject()` pattern:

```typescript
import { inject } from '@angular/core';
import { AnalyticsService } from '../core/services/analytics.service';

export class MyComponent {
  private analytics = inject(AnalyticsService);

  trackCustomEvent() {
    this.analytics.trackEvent('event_name', {
      key: 'value',
      number: 123
    });
  }
}
```
