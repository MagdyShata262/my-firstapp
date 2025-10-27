import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import * as ProductsActions from './products.actions';
import { Product } from '../shared/models/index';
import { ProductService } from '../core/services/product.service';

@Injectable()
export class ProductsEffects {
  private actions$ = inject(Actions);
  private productService = inject(ProductService);

  // === تحميل جميع المنتجات ===
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadProducts),
      mergeMap(() =>
        this.productService.getAllProducts().pipe(
          map((products) => ProductsActions.loadProductsSuccess({ products })),
          catchError((error) =>
            of(ProductsActions.loadProductsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // === تحميل منتج واحد ===
  loadProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadProduct),
      mergeMap((action) =>
        this.productService.getProductById(action.id).pipe(
          map((product) => ProductsActions.loadProductSuccess({ product })),
          catchError((error) =>
            of(ProductsActions.loadProductFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // === تحميل التصنيفات ===
  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadCategories),
      mergeMap(() =>
        this.productService.getAllCategories().pipe(
          map((categories) =>
            ProductsActions.loadCategoriesSuccess({ categories })
          ),
          catchError((error) =>
            of(ProductsActions.loadCategoriesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // === إضافة منتج (محاكاة) ===
  addProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.addProduct),
      map((action) => {
        console.warn(
          'FakeStoreAPI does not support real product creation. Using mock.'
        );

        const mockProduct: Product = {
          ...action.product,
          id: Date.now(),
          rating: { rate: 0, count: 0 },
        };

        return ProductsActions.addProductSuccess({ product: mockProduct });
      }),
      catchError((error) =>
        of(
          ProductsActions.addProductFailure({
            error: error.message || 'Mock add failed',
          })
        )
      )
    )
  );

  // === تحديث منتج (محاكاة) ===
  updateProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.updateProduct),
      map((action) => {
        console.warn(
          'FakeStoreAPI does not support real product updates. Using mock.'
        );

        const mockUpdatedProduct: Product = {
          id: action.id,
          ...action.changes,
        } as Product;

        return ProductsActions.updateProductSuccess({
          product: mockUpdatedProduct,
        });
      }),
      catchError((error) =>
        of(
          ProductsActions.updateProductFailure({
            error: error.message || 'Mock update failed',
          })
        )
      )
    )
  );

  // === حذف منتج (محاكاة) ===
  deleteProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.deleteProduct),
      map((action) => {
        console.warn(
          'FakeStoreAPI does not support real product deletion. Using mock.'
        );
        return ProductsActions.deleteProductSuccess({ id: action.id });
      }),
      catchError((error) =>
        of(
          ProductsActions.deleteProductFailure({
            error: error.message || 'Mock delete failed',
          })
        )
      )
    )
  );

  // === آثار جانبية غير مرئية (Logging فقط - اختياري) ===
  logError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          ProductsActions.loadProductsFailure,
          ProductsActions.loadProductFailure,
          ProductsActions.loadCategoriesFailure,
          ProductsActions.addProductFailure,
          ProductsActions.updateProductFailure,
          ProductsActions.deleteProductFailure
        ),
        tap((action) => console.error('Effect Error Action:', action))
      ),
    { dispatch: false }
  );
}
