# E-commerce Event Tracking Guide

## Event Names and Implementation

### 1. Add to Cart Flow
- **Event**: `add_to_cart`
- **When**: User adds item to basket
- **Data**: `{ productId, variantId, productName, quantity }`
- **Implementation**: ✅ Implemented in `cart.service.ts`

### 2. Remove from Cart
- **Event**: `remove_from_cart`
- **When**: User removes item from basket
- **Data**: `{ productId, variantId }`
- **Implementation**: ✅ Implemented in `cart.service.ts`

### 3. Cart View
- **Event**: `view_cart`
- **When**: User navigates to cart page
- **Data**: `{ itemCount, totalAmount }`
- **Implementation**: ✅ Added to `cart.component.ts` constructor

### 4. Proceed to Checkout
- **Event**: `proceed_to_checkout`
- **When**: User clicks complete button in cart
- **Data**: `{ itemCount, totalAmount }`
- **Implementation**: ✅ Added to `cart.component.ts` submit() method

### 5. Login Required
- **Event**: `login_required`
- **When**: User is redirected to login during checkout
- **Data**: `{ returnPath }`
- **Implementation**: ✅ Added to `cart.component.ts` submit() method

### 6. Checkout Started
- **Event**: `checkout_started`
- **When**: User begins checkout process (logged in)
- **Data**: `{ itemCount, totalAmount }`
- **Implementation**: ✅ Added to `cart.component.ts` submit() method

### 7. Login Attempt
- **Event**: `login_attempted`
- **When**: User attempts to login
- **Data**: `{ phone, returnPath }`
- **Implementation**: ✅ Added to `login.component.ts` sendToken() method

### 8. Login Successful
- **Event**: `login_successful`
- **When**: User successfully logs in
- **Data**: `{ returnPath }`
- **Implementation**: ✅ Added to `otp.component.ts` setToken() method

### 9. Login Failed
- **Event**: `login_failed`
- **When**: User login fails
- **Data**: `{ error }`
- **Implementation**: ✅ Added to `otp.component.ts` setToken() method

### 10. Registration Required
- **Event**: `registration_required`
- **When**: User needs to register after login
- **Data**: `{ returnPath }`
- **Implementation**: ✅ Added to `otp.component.ts` setToken() method

### 11. Address Selection
- **Event**: `address_selected`
- **When**: User selects existing address
- **Data**: `{ addressId, region }`
- **Implementation**: ✅ Added to `address-list.component.ts` setAddresses() method

### 12. Address Added
- **Event**: `address_added`
- **When**: User adds new address
- **Data**: `{ region }`
- **Implementation**: ✅ Added to `address-edit.component.ts` submit() method

### 13. Address Updated
- **Event**: `address_updated`
- **When**: User updates existing address
- **Data**: `{ addressType, region }`
- **Implementation**: ✅ Added to `address-edit.component.ts` submit() method

### 14. Payment Method Selection
- **Event**: `payment_method_selected`
- **When**: User selects payment method
- **Data**: `{ paymentMethod, paymentType }`
- **Implementation**: ✅ Added to `payment-methods.component.ts` typeSelectionChange() method

### 15. Wallet Used
- **Event**: `wallet_used`
- **When**: User opts to use wallet for payment
- **Data**: `{ walletBalance }`
- **Implementation**: ✅ Added to `payment-methods.component.ts` useWalletSelectedChange() method

### 16. Discount Code Applied
- **Event**: `discount_code_applied`
- **When**: User successfully applies discount code
- **Data**: `{ discountCode, discountAmount, discountType }`
- **Implementation**: ✅ Added to `discount-coupon-modal.component.ts` submit() method

### 17. Discount Code Failed
- **Event**: `discount_code_failed`
- **When**: User fails to apply discount code
- **Data**: `{ discountCode }`
- **Implementation**: ✅ Added to `discount-coupon-modal.component.ts` submit() method

### 18. Order Placement Attempt
- **Event**: `place_order_attempted`
- **When**: User clicks final order button
- **Data**: `{ itemCount, totalAmount, paymentType }`
- **Implementation**: ✅ Added to `payment.component.ts` submit() method

### 19. Payment Gateway Redirect
- **Event**: `redirect_to_payment_gateway`
- **When**: User is redirected to bank/payment gateway
- **Implementation**: ✅ Added to `pay.service.ts` redirect() method

### 20. Order Placed Successfully
- **Event**: `order_placed_successfully`
- **When**: Order is successfully created
- **Data**: `{ orderId, itemCount, totalAmount, paymentType }`
- **Implementation**: ✅ Added to `payment.component.ts` submit() method

## Implementation Examples

### Basic Event Tracking
```typescript
// In component constructor or ngOnInit
this.analytics.trackEvent('view_cart', {
  itemCount: this.cart.length(),
  totalAmount: this.cart.total()
});
```

### Event with Conditional Logic
```typescript
// In method with conditional flow
if (this.auth.isGuestUser && this.cart.isLoginRequired) {
  this.analytics.trackEvent('login_required', {
    returnPath: '/payment'
  });
  this.router.navigate(['/login'], { queryParams: { returnPath: '/payment' } });
} else {
  this.analytics.trackEvent('checkout_started', {
    itemCount: this.cart.length(),
    totalAmount: this.cart.total()
  });
  this.router.navigateByUrl('/payment');
}
```

### Event with Async Operations
```typescript
// In async method
async submit() {
  this.analytics.trackEvent('place_order_attempted', {
    itemCount: this.cart.length(),
    totalAmount: this.total(),
    paymentType: this.cart.paymentType()
  });
  
  const order = await this.cart.complete();
  if (order) {
    this.analytics.trackEvent('order_placed_successfully', {
      orderId: order.id,
      itemCount: this.cart.length(),
      totalAmount: this.total(),
      paymentType: this.cart.paymentType()
    });
  }
}
```

## Best Practices

1. **Consistent Naming**: Use snake_case for event names
2. **Descriptive Names**: Make event names self-explanatory
3. **Relevant Data**: Include only necessary data with events
4. **Error Handling**: Don't let analytics errors break user flow
5. **Performance**: Keep analytics calls lightweight
6. **Privacy**: Don't track sensitive user information

## Analytics Service Usage

```typescript
// Import the service
import { AnalyticsService } from '../core/services/analytics.service';

// Inject in constructor
constructor(private analytics: AnalyticsService) {}

// Track events
this.analytics.trackEvent('event_name', { 
  key: 'value',
  number: 123 
});
```

## Next Steps

1. ✅ **All events implemented** - All 20 events have been successfully implemented across the e-commerce flow
2. **Payment Success/Failure Tracking** - Consider adding payment success/failure events in the backend payment callback handlers
3. **Error Tracking** - Consider adding comprehensive error tracking for failed operations
4. **Analytics Dashboard** - Set up analytics dashboard to monitor these events and track conversion funnels
5. **A/B Testing** - Use these events to set up A/B tests for checkout optimization
6. **Performance Monitoring** - Monitor event tracking performance to ensure it doesn't impact user experience

## Summary

All major e-commerce events have been successfully implemented across the application:

- **Cart Management**: Add/remove items, view cart, proceed to checkout
- **Authentication**: Login attempts, success/failure, registration requirements
- **Checkout Flow**: Address selection/addition, payment method selection, discount codes
- **Order Processing**: Order placement attempts, payment gateway redirects, successful orders
- **User Experience**: Wallet usage, address management

The implementation follows best practices with consistent naming, relevant data tracking, and proper error handling that won't break the user flow. 