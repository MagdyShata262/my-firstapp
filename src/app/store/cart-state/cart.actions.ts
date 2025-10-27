// store/cart.actions.ts
import { createAction, props } from '@ngrx/store';
import { Cart, CartItem } from '../../shared/models/index';

// تحميل السلة
export const loadCart = createAction(
  '[Cart] Load Cart',
  props<{ userId: number }>()
);
export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
  props<{ cart: Cart }>()
);
export const loadCartFailure = createAction(
  '[Cart] Load Cart Failure',
  props<{ error: string }>()
);

// إضافة منتج إلى السلة
// export const addToCart = createAction(
//   '[Cart] Add to Cart',
//   props<{ productId: number; quantity: number }>()
// );

export const addToCart = createAction(
  '[Cart] Add to Cart',
  props<{ userId: number; productId: number; quantity: number }>()
);

export const addToCartSuccess = createAction(
  '[Cart] Add to Cart Success',
  props<{ cart: Cart }>()
);
export const addToCartFailure = createAction(
  '[Cart] Add to Cart Failure',
  props<{ error: string }>()
);

// حذف منتج من السلة
export const removeFromCart = createAction(
  '[Cart] Remove from Cart',
  props<{ productId: number }>()
);

// تحديث الكمية
export const updateCartItemQuantity = createAction(
  '[Cart] Update Cart Item Quantity',
  props<{ productId: number; quantity: number }>()
);

// مسح السلة
export const clearCart = createAction('[Cart] Clear Cart');

// تحميل جميع السلات (اختياري)
export const loadAllCarts = createAction('[Cart] Load All Carts');
export const loadAllCartsSuccess = createAction(
  '[Cart] Load All Carts Success',
  props<{ carts: Cart[] }>()
);
export const loadAllCartsFailure = createAction(
  '[Cart] Load All Carts Failure',
  props<{ error: string }>()
);
