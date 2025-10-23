import {
  patchState,
  signalStore,
  withMethods,
  withState,
  withComputed,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject, computed } from '@angular/core';
import {
  tap,
  switchMap,
  catchError,
  of,
  pipe,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { Product } from '../shared/models';
import { ProductService } from '../core/services/product.service';

// تعريف حالة المتجر
interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: keyof Product | null;
  sortAscending: boolean;
  selectedCategory: string | null;
  currentPage: number;
  pageSize: number;
}

// الحالة الابتدائية
const initialState: ProductsState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  searchQuery: '',
  sortBy: null,
  sortAscending: true,
  selectedCategory: null,
  currentPage: 1,
  pageSize: 12,
};

export const ProductsStore = signalStore(
  { providedIn: 'root' },

  // تهيئة الحالة
  withState(initialState),

  // الحسابات المشتقة (Computed Values)
  withComputed((store) => {
    const filteredProducts = computed(() => {
      let filtered = store.products();

      // التصفية حسب البحث
      if (store.searchQuery()) {
        const query = store.searchQuery().toLowerCase();
        filtered = filtered.filter(
          (product) =>
            product.title.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query)
        );
      }

      // التصفية حسب التصنيف
      if (store.selectedCategory()) {
        filtered = filtered.filter(
          (product) => product.category === store.selectedCategory()
        );
      }

      return filtered;
    });

    const sortedProducts = computed(() => {
      const products = filteredProducts();

      if (store.sortBy()) {
        const sortBy = store.sortBy()!;
        return [...products].sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return store.sortAscending()
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return store.sortAscending() ? aValue - bValue : bValue - aValue;
          }

          return 0;
        });
      }

      return products;
    });

    const paginatedProducts = computed(() => {
      const allProducts = sortedProducts();
      const startIndex = (store.currentPage() - 1) * store.pageSize();
      const endIndex = startIndex + store.pageSize();
      return allProducts.slice(startIndex, endIndex);
    });

    const totalPages = computed(() => {
      const total = sortedProducts().length;
      return Math.ceil(total / store.pageSize());
    });

    const categories = computed(() => {
      const categoriesSet = new Set(store.products().map((p) => p.category));
      return Array.from(categoriesSet).sort();
    });

    const productStats = computed(() => {
      const products = store.products();
      if (products.length === 0) {
        return {
          total: 0,
          categoriesCount: 0,
          averagePrice: 0,
          highestPrice: 0,
          lowestPrice: 0,
        };
      }

      const prices = products.map((p) => p.price);
      return {
        total: products.length,
        categoriesCount: categories().length,
        averagePrice:
          prices.reduce((sum, price) => sum + price, 0) / products.length,
        highestPrice: Math.max(...prices),
        lowestPrice: Math.min(...prices),
      };
    });

    const hasNextPage = computed(() => store.currentPage() < totalPages());
    const hasPreviousPage = computed(() => store.currentPage() > 1);

    return {
      filteredProducts,
      sortedProducts,
      paginatedProducts,
      totalPages,
      categories,
      productStats,
      hasNextPage,
      hasPreviousPage,
    };
  }),

  // تعريف الطرق (Methods)
  withMethods((store, productService = inject(ProductService)) => {
    // دوال مساعدة
    const updateLoadingState = (loading: boolean) => {
      patchState(store, { loading, error: loading ? null : store.error() });
    };

    const handleError = (message: string, error: any) => {
      console.error('ProductsStore Error:', error);
      patchState(store, {
        error: `${message}: ${error.message || 'Unknown error'}`,
        loading: false,
      });
    };

    return {
      // GET: Get all products
      loadProducts: rxMethod<void>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap(() => {
            return productService.getAllProducts().pipe(
              tap((products) => {
                patchState(store, {
                  products,
                  loading: false,
                  error: null,
                });
              }),
              catchError((error) => {
                handleError('Failed to load products', error);
                return of([]);
              })
            );
          })
        )
      ),

      // GET: Get single product
      loadProduct: rxMethod<number>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap((id) => {
            return productService.getProductById(id).pipe(
              tap((product) => {
                patchState(store, {
                  selectedProduct: product,
                  loading: false,
                  error: null,
                });
              }),
              catchError((error) => {
                handleError('Failed to load product', error);
                return of(null);
              })
            );
          })
        )
      ),

      // GET: Get products by category
      loadProductsByCategory: rxMethod<string>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap((category) => {
            return productService.getProductsByCategory(category).pipe(
              tap((products) => {
                patchState(store, {
                  products,
                  loading: false,
                  error: null,
                });
              }),
              catchError((error) => {
                handleError('Failed to load products by category', error);
                return of([]);
              })
            );
          })
        )
      ),

      // POST: Add new product
      addProduct: rxMethod<Omit<Product, 'id'>>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap((product) => {
            return productService.addProduct(product).pipe(
              tap((newProduct) => {
                const currentProducts = store.products();
                patchState(store, {
                  products: [...currentProducts, newProduct],
                  loading: false,
                  error: null,
                });
              }),
              catchError((error) => {
                handleError('Failed to add product', error);
                return of(null);
              })
            );
          })
        )
      ),

      // PUT: Update product
      updateProduct: rxMethod<{ id: number; product: Partial<Product> }>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap(({ id, product }) => {
            return productService.updateProduct(id, product).pipe(
              tap((updatedProduct) => {
                const currentProducts = store.products();
                const updatedProducts = currentProducts.map((p) =>
                  p.id === id ? { ...p, ...updatedProduct } : p
                );
                patchState(store, {
                  products: updatedProducts,
                  selectedProduct:
                    store.selectedProduct()?.id === id
                      ? updatedProduct
                      : store.selectedProduct(),
                  loading: false,
                  error: null,
                });
              }),
              catchError((error) => {
                handleError('Failed to update product', error);
                return of(null);
              })
            );
          })
        )
      ),

      // DELETE: Delete product
      deleteProduct: rxMethod<number>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap((id) => {
            return productService.deleteProduct(id).pipe(
              tap(() => {
                const currentProducts = store.products();
                const filteredProducts = currentProducts.filter(
                  (p) => p.id !== id
                );
                patchState(store, {
                  products: filteredProducts,
                  selectedProduct:
                    store.selectedProduct()?.id === id
                      ? null
                      : store.selectedProduct(),
                  loading: false,
                  error: null,
                });
              }),
              catchError((error) => {
                handleError('Failed to delete product', error);
                return of(null);
              })
            );
          })
        )
      ),

      // البحث مع debounce
      searchProducts: rxMethod<string>(
        pipe(
          debounceTime(300),
          distinctUntilChanged(),
          tap((query) => {
            patchState(store, {
              searchQuery: query,
              currentPage: 1,
            });
          })
        )
      ),

      // دوال التحكم في الواجهة
      setSearchQuery: (query: string) => {
        patchState(store, { searchQuery: query, currentPage: 1 });
      },

      setSort: (sortBy: keyof Product | null, ascending: boolean = true) => {
        patchState(store, { sortBy, sortAscending: ascending });
      },

      setCategory: (category: string | null) => {
        patchState(store, {
          selectedCategory: category,
          currentPage: 1,
        });
      },

      setPage: (page: number) => {
        const totalPages = Math.ceil(
          store.sortedProducts().length / store.pageSize()
        );
        if (page >= 1 && page <= totalPages) {
          patchState(store, { currentPage: page });
        }
      },

      setPageSize: (size: number) => {
        patchState(store, {
          pageSize: size,
          currentPage: 1,
        });
      },

      nextPage: () => {
        const nextPage = store.currentPage() + 1;
        if (nextPage <= store.totalPages()) {
          patchState(store, { currentPage: nextPage });
        }
      },

      previousPage: () => {
        const prevPage = store.currentPage() - 1;
        if (prevPage >= 1) {
          patchState(store, { currentPage: prevPage });
        }
      },

      // إعادة التعيين والإدارة
      clearSelectedProduct: () => {
        patchState(store, { selectedProduct: null });
      },

      clearError: () => {
        patchState(store, { error: null });
      },

      clearFilters: () => {
        patchState(store, {
          searchQuery: '',
          sortBy: null,
          sortAscending: true,
          selectedCategory: null,
          currentPage: 1,
        });
      },

      // تحديث مباشر (للاستخدام في الاختبارات)
      setProducts: (products: Product[]) => {
        patchState(store, { products });
      },

      // إعادة تعيين كاملة
      reset: () => {
        patchState(store, initialState);
      },
    };
  }),

  // hooks (لتهيئة المتجر)
  withHooks({
    onInit(store) {
      // تحميل المنتجات تلقائياً عند بدء التشغيل
      store.loadProducts();
    },
    onDestroy(store) {
      // تنظيف أي موارد إذا لزم الأمر
      console.log('ProductsStore destroyed');
    },
  })
);
