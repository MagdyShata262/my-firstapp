import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart/cart.component').then(
        (c) => c.CartComponent
      ),
    data: { animation: 'cart' },
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/products-list/products-list.component').then(
        (c) => c.ProductsListComponent
      ),
    data: { animation: 'products' },
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import(
        './features/products/product-details/product-details.component'
      ).then((c) => c.ProductDetailsComponent),
    data: { animation: 'productDetails' },
  },
];
