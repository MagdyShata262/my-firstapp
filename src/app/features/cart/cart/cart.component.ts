// features/cart/cart.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../../shared/models/index';
import * as CartActions from '../../../store/cart-state/cart.actions';
import * as CartSelectors from '../../../store/cart-state/cart.selectors';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  private store = inject(Store);

  cart$ = this.store.select(CartSelectors.selectCart);
  loading$ = this.store.select(CartSelectors.selectCartLoading);
  error$ = this.store.select(CartSelectors.selectCartError);
  items$ = this.store.select(CartSelectors.selectCartItems);
  totalItems$ = this.store.select(CartSelectors.selectCartTotalItems);
  isEmpty$ = this.store.select(CartSelectors.selectIsCartEmpty);

  ngOnInit() {
    // تحميل السلة للمستخدم (يمكنك تمرير userId من auth أو localStorage)
    this.store.dispatch(CartActions.loadCart({ userId: 1 }));
  }

  removeFromCart(productId: number) {
    this.store.dispatch(CartActions.removeFromCart({ productId }));
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity > 0) {
      this.store.dispatch(
        CartActions.updateCartItemQuantity({ productId, quantity })
      );
    }
  }

  clearCart() {
    this.store.dispatch(CartActions.clearCart());
  }

  checkout() {
    alert('Checkout feature is simulated.');
  }

  // ✅ الدالة المطلوبة
  loadCart() {
    this.store.dispatch(CartActions.loadCart({ userId: 1 }));
  }
}
