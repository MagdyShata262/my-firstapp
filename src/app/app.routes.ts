import { Routes } from '@angular/router';
import { ProductsListComponent } from './features/products/products-list/products-list.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    component: ProductsListComponent,
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import(
        './features/products/product-details/product-details.component'
      ).then((c) => c.ProductDetailsComponent),
  },
];
