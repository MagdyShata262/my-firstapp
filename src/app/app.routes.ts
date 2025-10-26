import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/products-list/products-list.component').then(
        (c) => c.ProductsListComponent
      ),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import(
        './features/products/product-details/product-details.component'
      ).then((c) => c.ProductDetailsComponent),
  },
];
