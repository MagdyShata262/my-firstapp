import { createSelector, createFeatureSelector } from '@ngrx/store';
import { ProductsState, initialState } from './products.reducer';
import { Product } from '../shared/models';

// === Feature Selector ===
export const selectProductsState =
  createFeatureSelector<ProductsState>('products');

// === Basic Selectors ===
export const selectAllProducts = createSelector(
  selectProductsState,
  (state) => state.products
);

export const selectSelectedProduct = createSelector(
  selectProductsState,
  (state) => state.selectedProduct
);

export const selectCategories = createSelector(
  selectProductsState,
  (state) => state.categories
);

export const selectLoading = createSelector(
  selectProductsState,
  (state) => state.loading
);

export const selectError = createSelector(
  selectProductsState,
  (state) => state.error
);

export const selectSearchQuery = createSelector(
  selectProductsState,
  (state) => state.searchQuery
);

export const selectSelectedCategory = createSelector(
  selectProductsState,
  (state) => state.selectedCategory
);

export const selectSortBy = createSelector(
  selectProductsState,
  (state) => state.sortBy
);

export const selectSortAscending = createSelector(
  selectProductsState,
  (state) => state.sortAscending
);

export const selectCurrentPage = createSelector(
  selectProductsState,
  (state) => state.currentPage
);

export const selectPageSize = createSelector(
  selectProductsState,
  (state) => state.pageSize
);

export const selectFavorites = createSelector(
  selectProductsState,
  (state) => state.favorites
);

export const selectSelectedProducts = createSelector(
  selectProductsState,
  (state) => state.selectedProducts
);

// === Derived Selectors ===

// المنتجات المفلترة (بحث + تصنيف)
export const selectFilteredProducts = createSelector(
  selectAllProducts,
  selectSearchQuery,
  selectSelectedCategory,
  (products, query, category) => {
    let result = products;

    // تطبيق البحث
    if (query) {
      const term = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    // تطبيق التصنيف
    if (category) {
      result = result.filter((p) => p.category === category);
    }

    return result;
  }
);

// المنتجات المرتبة
export const selectSortedProducts = createSelector(
  selectFilteredProducts,
  selectSortBy,
  selectSortAscending,
  (products, sortBy, ascending) => {
    if (!sortBy) return products;

    return [...products].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal == null || bVal == null) return 0;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return ascending ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }
);

// عدد الصفحات الإجمالي
export const selectTotalPages = createSelector(
  selectSortedProducts,
  selectPageSize,
  (products, pageSize) => Math.max(1, Math.ceil(products.length / pageSize))
);

// المنتجات المعروضة في الصفحة الحالية
export const selectPaginatedProducts = createSelector(
  selectSortedProducts,
  selectCurrentPage,
  selectPageSize,
  (products, currentPage, pageSize) => {
    const start = (currentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }
);

// === الإحصائيات ===

// إحصائيات المنتجات (الكل)
export const selectProductsStats = createSelector(
  selectAllProducts,
  (products) => {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        totalCategories: 0,
        avgPrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
      };
    }

    const categories = new Set(products.map((p) => p.category));
    const prices = products.map((p) => p.price);
    const total = prices.reduce((sum, p) => sum + p, 0);

    return {
      totalProducts: products.length,
      totalCategories: categories.size,
      avgPrice: Number((total / products.length).toFixed(2)),
      highestPrice: Math.max(...prices),
      lowestPrice: Math.min(...prices),
    };
  }
);

// إحصائيات التحديد
export const selectSelectionStats = createSelector(
  selectSelectedProducts,
  selectAllProducts,
  (selectedIds, allProducts) => {
    const selected = allProducts.filter((p) => selectedIds.includes(p.id));
    const totalPrice = selected.reduce((sum, p) => sum + p.price, 0);

    return {
      count: selectedIds.length,
      totalPrice: Number(totalPrice.toFixed(2)),
      categories: new Set(selected.map((p) => p.category)).size,
    };
  }
);

// === Selectors شرطية (للاستخدام في الـ template) ===

export const selectIsFavorite = (productId: number) =>
  createSelector(selectFavorites, (favorites) => favorites.includes(productId));

export const selectIsProductSelected = (productId: number) =>
  createSelector(selectSelectedProducts, (selected) =>
    selected.includes(productId)
  );

// === Selectors للواجهة ===

export const selectDisplayRange = createSelector(
  selectCurrentPage,
  selectPageSize,
  selectSortedProducts,
  (currentPage, pageSize, sortedProducts) => {
    const total = sortedProducts.length;
    if (total === 0) return { start: 0, end: 0, total };
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    return { start, end, total };
  }
);
export const selectCurrentSortValue = createSelector(
  selectSortBy,
  selectSortAscending,
  (sortBy, asc) => {
    if (!sortBy) return '';
    if (sortBy === 'price' && !asc) return 'price-desc';
    return sortBy;
  }
);
// في store/products.selectors.ts
