// store/cart.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as CartActions from './cart.actions';
import { Cart, CartItem } from '../../shared/models/index';

export interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  userId: number | null;
}

export const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
  userId: null,
};

export const cartReducer = createReducer(
  initialState,

  // تحميل السلة
  on(CartActions.loadCart, (state, { userId }) => ({
    ...state,
    loading: true,
    error: null,
    userId,
  })),

  on(CartActions.loadCartSuccess, (state, { cart }) => ({
    ...state,
    cart,
    loading: false,
    error: null,
  })),

  on(CartActions.loadCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // إضافة منتج إلى السلة
  on(CartActions.addToCart, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CartActions.addToCartSuccess, (state, { cart }) => ({
    ...state,
    cart,
    loading: false,
    error: null,
  })),

  on(CartActions.addToCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // حذف منتج
  on(CartActions.removeFromCart, (state, { productId }) => {
    if (!state.cart) return state;

    const updatedProducts = state.cart.products.filter(
      (p) => p.productId !== productId
    );
    return {
      ...state,
      cart: { ...state.cart, products: updatedProducts },
    };
  }),

  // تحديث الكمية
  on(CartActions.updateCartItemQuantity, (state, { productId, quantity }) => {
    if (!state.cart) return state;

    const updatedProducts = state.cart.products.map((p) =>
      p.productId === productId ? { ...p, quantity } : p
    );
    return {
      ...state,
      cart: { ...state.cart, products: updatedProducts },
    };
  }),

  // مسح السلة
  on(CartActions.clearCart, (state) => ({
    ...state,
    cart: state.cart ? { ...state.cart, products: [] } : null,
  }))
);
