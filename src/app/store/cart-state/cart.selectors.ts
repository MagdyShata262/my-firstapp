// store/cart.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { CartState } from './cart.reducer';
import { Cart, CartItem } from '../../shared/models/index';

export const selectCartState = createFeatureSelector<CartState>('cart');

export const selectCart = createSelector(
  selectCartState,
  (state) => state.cart
);

export const selectCartLoading = createSelector(
  selectCartState,
  (state) => state.loading
);

export const selectCartError = createSelector(
  selectCartState,
  (state) => state.error
);

export const selectCartItems = createSelector(
  selectCart,
  (cart) => cart?.products || []
);

export const selectCartTotalItems = createSelector(selectCartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

export const selectCartTotalPrice = createSelector(
  selectCartItems,
  selectCartState,
  (items, state) => {
    // هذا يتطلب الوصول إلى حالة المنتجات (للحصول على السعر)
    // يمكنك إنشاء selector مشترك مع products.state
    return 0; // مؤقتًا
  }
);

export const selectIsCartEmpty = createSelector(
  selectCartItems,
  (items) => items.length === 0
);
