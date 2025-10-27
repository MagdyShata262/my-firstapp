// store/cart.effects.ts
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import * as CartActions from './cart.actions';
import { CartService } from '../../core/services/cart-service/cart.service';
import { Cart } from '../../shared/models/index';

@Injectable()
export class CartEffects {
  private actions$ = inject(Actions);
  private cartService = inject(CartService);

  // تحميل السلة بناءً على userId
  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      mergeMap((action) =>
        this.cartService.getCartByUserId(action.userId).pipe(
          map((cart) => CartActions.loadCartSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.loadCartFailure({
                error: error.message || 'Failed to load cart',
              })
            )
          )
        )
      )
    )
  );

  // إضافة منتج إلى السلة (محاكاة)
  addToCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addToCart),
      mergeMap((action) => {
        console.warn(
          'FakeStoreAPI does not support real cart updates. Using mock.'
        );

        // محاكاة: إذا كانت السلة غير موجودة، أنشئ واحدة جديدة
        let currentCart = this.getCurrentCart(); // يمكنك استخدام selector أو localStorage

        if (!currentCart) {
          currentCart = {
            id: 1,
            userId: action.userId || 1,
            date: new Date().toISOString(),
            products: [],
          };
        }

        // إذا كان المنتج موجودًا، قم بتحديث الكمية، وإلا أضفه
        const existingItem = currentCart.products.find(
          (p) => p.productId === action.productId
        );
        if (existingItem) {
          existingItem.quantity += action.quantity;
        } else {
          currentCart.products.push({
            productId: action.productId,
            quantity: action.quantity,
          });
        }

        return of(CartActions.addToCartSuccess({ cart: currentCart }));
      })
    )
  );

  // حذف منتج من السلة
  removeFromCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeFromCart),
      map((action) => {
        // محاكاة: قم بحذف المنتج من السلة الحالية
        let currentCart = this.getCurrentCart();
        if (!currentCart)
          return CartActions.loadCartFailure({ error: 'Cart not found' });

        currentCart.products = currentCart.products.filter(
          (p) => p.productId !== action.productId
        );
        return CartActions.addToCartSuccess({ cart: currentCart });
      })
    )
  );

  // تحديث الكمية
  updateCartItemQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateCartItemQuantity),
      map((action) => {
        let currentCart = this.getCurrentCart();
        if (!currentCart)
          return CartActions.loadCartFailure({ error: 'Cart not found' });

        const item = currentCart.products.find(
          (p) => p.productId === action.productId
        );
        if (item) {
          item.quantity = action.quantity;
        }

        return CartActions.addToCartSuccess({ cart: currentCart });
      })
    )
  );

  // مسح السلة
  clearCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.clearCart),
      map(() => {
        let currentCart = this.getCurrentCart();
        if (!currentCart)
          return CartActions.loadCartFailure({ error: 'Cart not found' });

        currentCart.products = [];
        return CartActions.addToCartSuccess({ cart: currentCart });
      })
    )
  );

  // دالة مساعدة لجلب السلة الحالية (يمكن استبدالها بـ selector أو localStorage)
  private getCurrentCart(): Cart | null {
    // في التطوير، يمكنك استخدام localStorage أو الاحتفاظ بالحالة في المكون
    // هنا نستخدم سلة افتراضية
    return {
      id: 1,
      userId: 1,
      date: new Date().toISOString(),
      products: [],
    };
  }
}
