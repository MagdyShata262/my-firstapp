import { createAction, props } from '@ngrx/store';
import { Product } from '../shared/models';

// === تحميل المنتجات ===
export const loadProducts = createAction('[Products] Load Products');
export const loadProductsSuccess = createAction(
  '[Products] Load Products Success',
  props<{ products: Product[] }>()
);
export const loadProductsFailure = createAction(
  '[Products] Load Products Failure',
  props<{ error: string }>()
);

// === تحميل منتج واحد ===
export const loadProduct = createAction(
  '[Products] Load Product',
  props<{ id: number }>()
);
export const loadProductSuccess = createAction(
  '[Products] Load Product Success',
  props<{ product: Product }>()
);
export const loadProductFailure = createAction(
  '[Products] Load Product Failure',
  props<{ error: string }>()
);

// === تحميل التصنيفات ===
export const loadCategories = createAction('[Products] Load Categories');
export const loadCategoriesSuccess = createAction(
  '[Products] Load Categories Success',
  props<{ categories: string[] }>()
);
export const loadCategoriesFailure = createAction(
  '[Products] Load Categories Failure',
  props<{ error: string }>()
);

// === الفلترة والبحث ===
export const setSearchQuery = createAction(
  '[Products] Set Search Query',
  props<{ query: string }>()
);

export const setSelectedCategory = createAction(
  '[Products] Set Selected Category',
  props<{ category: string | null }>()
);

export const setSortBy = createAction(
  '[Products] Set Sort By',
  props<{ sortBy: keyof Product | null; ascending: boolean }>()
);

export const clearFilters = createAction('[Products] Clear Filters');

// === المنتج المحدد ===
export const clearSelectedProduct = createAction(
  '[Products] Clear Selected Product'
);

// === المفضلة ===
export const toggleFavorite = createAction(
  '[Products] Toggle Favorite',
  props<{ productId: number }>()
);

// === التحديد الجماعي ===
export const toggleProductSelection = createAction(
  '[Products] Toggle Product Selection',
  props<{ productId: number }>()
);

export const selectAllProducts = createAction('[Products] Select All Products');
export const clearSelection = createAction('[Products] Clear Selection');

// === Pagination ===
export const setCurrentPage = createAction(
  '[Products] Set Current Page',
  props<{ page: number }>()
);

export const setPageSize = createAction(
  '[Products] Set Page Size',
  props<{ size: number }>()
);

// === إعادة التحميل ===
export const refreshProducts = createAction('[Products] Refresh Products');

// === إدارة المنتجات (CRUD - للمستقبل أو المحاكاة) ===
export const addProduct = createAction(
  '[Products] Add Product',
  props<{ product: Omit<Product, 'id'> }>()
);
export const addProductSuccess = createAction(
  '[Products] Add Product Success',
  props<{ product: Product }>()
);
export const addProductFailure = createAction(
  '[Products] Add Product Failure',
  props<{ error: string }>()
);

export const updateProduct = createAction(
  '[Products] Update Product',
  props<{ id: number; changes: Partial<Product> }>()
);
export const updateProductSuccess = createAction(
  '[Products] Update Product Success',
  props<{ product: Product }>()
);
export const updateProductFailure = createAction(
  '[Products] Update Product Failure',
  props<{ error: string }>()
);

export const deleteProduct = createAction(
  '[Products] Delete Product',
  props<{ id: number }>()
);
export const deleteProductSuccess = createAction(
  '[Products] Delete Product Success',
  props<{ id: number }>()
);
export const deleteProductFailure = createAction(
  '[Products] Delete Product Failure',
  props<{ error: string }>()
);
