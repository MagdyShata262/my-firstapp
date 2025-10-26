import { createReducer, on } from '@ngrx/store';
import { Product } from '../shared/models';
import * as ProductsActions from './products.actions';

export interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  categories: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  sortBy: keyof Product | null;
  sortAscending: boolean;
  currentPage: number;
  pageSize: number;
  favorites: number[];
  selectedProducts: number[];
}

export const initialState: ProductsState = {
  products: [],
  selectedProduct: null,
  categories: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
  sortBy: null,
  sortAscending: true,
  currentPage: 1,
  pageSize: 12,
  favorites: [],
  selectedProducts: [],
};

export const productsReducer = createReducer(
  initialState,

  // === تحميل المنتجات ===
  on(ProductsActions.loadProducts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProductsActions.loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null,
  })),
  on(ProductsActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // === تحميل منتج واحد ===
  on(ProductsActions.loadProduct, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProductsActions.loadProductSuccess, (state, { product }) => ({
    ...state,
    selectedProduct: product,
    loading: false,
    error: null,
  })),
  on(ProductsActions.loadProductFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // === تحميل التصنيفات ===
  on(ProductsActions.loadCategories, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProductsActions.loadCategoriesSuccess, (state, { categories }) => ({
    ...state,
    categories,
    loading: false,
    error: null,
  })),
  on(ProductsActions.loadCategoriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    categories: [],
  })),

  // === الفلترة والبحث ===
  on(ProductsActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query,
    currentPage: 1,
  })),
  on(ProductsActions.setSelectedCategory, (state, { category }) => ({
    ...state,
    selectedCategory: category,
    currentPage: 1,
  })),
  on(ProductsActions.setSortBy, (state, { sortBy, ascending }) => ({
    ...state,
    sortBy,
    sortAscending: ascending,
  })),
  on(ProductsActions.clearFilters, (state) => ({
    ...state,
    searchQuery: '',
    selectedCategory: null,
    sortBy: null,
    sortAscending: true,
    currentPage: 1,
  })),

  // === المنتج المحدد ===
  on(ProductsActions.clearSelectedProduct, (state) => ({
    ...state,
    selectedProduct: null,
  })),

  // === المفضلة ===
  on(ProductsActions.toggleFavorite, (state, { productId }) => ({
    ...state,
    favorites: state.favorites.includes(productId)
      ? state.favorites.filter((id) => id !== productId)
      : [...state.favorites, productId],
  })),

  // === التحديد الجماعي ===
  on(ProductsActions.toggleProductSelection, (state, { productId }) => ({
    ...state,
    selectedProducts: state.selectedProducts.includes(productId)
      ? state.selectedProducts.filter((id) => id !== productId)
      : [...state.selectedProducts, productId],
  })),
  on(ProductsActions.selectAllProducts, (state) => ({
    ...state,
    selectedProducts: state.products.map((p) => p.id),
  })),
  on(ProductsActions.clearSelection, (state) => ({
    ...state,
    selectedProducts: [],
  })),

  // === Pagination ===
  on(ProductsActions.setCurrentPage, (state, { page }) => ({
    ...state,
    currentPage: page,
  })),
  on(ProductsActions.setPageSize, (state, { size }) => ({
    ...state,
    pageSize: Math.max(1, size), // ✅ ضمان أن الحجم ≥ 1
    currentPage: 1,
  })),

  // === Refresh ===
  on(ProductsActions.refreshProducts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  // === CRUD (للمستقبل أو المحاكاة) ===
  on(ProductsActions.addProductSuccess, (state, { product }) => ({
    ...state,
    products: [...state.products, product],
  })),

  on(ProductsActions.updateProductSuccess, (state, { product }) => ({
    ...state,
    products: state.products.map((p) => (p.id === product.id ? product : p)),
    selectedProduct:
      state.selectedProduct?.id === product.id
        ? product
        : state.selectedProduct,
  })),

  on(ProductsActions.deleteProductSuccess, (state, { id }) => ({
    ...state,
    products: state.products.filter((p) => p.id !== id),
    favorites: state.favorites.filter((favId) => favId !== id),
    selectedProducts: state.selectedProducts.filter((selId) => selId !== id),
    selectedProduct:
      state.selectedProduct?.id === id ? null : state.selectedProduct,
  }))
);
