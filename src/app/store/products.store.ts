import {
  patchState,
  signalStore,
  withMethods,
  withState,
  withComputed,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject, computed, effect, untracked } from '@angular/core';
import {
  tap,
  switchMap,
  catchError,
  of,
  pipe,
  debounceTime,
  distinctUntilChanged,
  filter,
  EMPTY,
  forkJoin,
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
  lastUpdated: Date | null;
  favorites: number[];
  viewMode: 'grid' | 'list';
  bulkSelection: number[];
  categories: string[];
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
  lastUpdated: null,
  favorites: [],
  viewMode: 'grid',
  bulkSelection: [],
  categories: [],
};

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // الحسابات المشتقة
  withComputed((store) => {
    const filteredProducts = computed(() => {
      let filtered = store.products();
      const searchQuery = store.searchQuery();
      const selectedCategory = store.selectedCategory();

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (product) =>
            product.title.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query)
        );
      }

      if (selectedCategory) {
        filtered = filtered.filter(
          (product) => product.category === selectedCategory
        );
      }

      return filtered;
    });

    const sortedProducts = computed(() => {
      const products = filteredProducts();
      const sortBy = store.sortBy();
      const sortAscending = store.sortAscending();

      if (!sortBy) return products;

      return [...products].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (aValue == null || bValue == null) return 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortAscending
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortAscending ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    });

    const paginatedProducts = computed(() => {
      const allProducts = sortedProducts();
      const currentPage = store.currentPage();
      const pageSize = store.pageSize();
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return allProducts.slice(startIndex, endIndex);
    });

    const totalPages = computed(() => {
      const total = sortedProducts().length;
      const pageSize = store.pageSize();
      return Math.ceil(total / pageSize) || 1;
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
          totalValue: 0,
        };
      }

      const prices = products.map((p) => p.price);
      const totalValue = prices.reduce((sum, price) => sum + price, 0);

      return {
        total: products.length,
        categoriesCount: store.categories().length,
        averagePrice: Number((totalValue / products.length).toFixed(2)),
        highestPrice: Math.max(...prices),
        lowestPrice: Math.min(...prices),
        totalValue: Number(totalValue.toFixed(2)),
      };
    });

    const hasNextPage = computed(() => store.currentPage() < totalPages());
    const hasPreviousPage = computed(() => store.currentPage() > 1);

    const favoriteProducts = computed(() => {
      const favorites = store.favorites();
      return store
        .products()
        .filter((product) => favorites.includes(product.id));
    });

    const selectedProducts = computed(() => {
      const bulkSelection = store.bulkSelection();
      return store
        .products()
        .filter((product) => bulkSelection.includes(product.id));
    });

    const selectionStats = computed(() => {
      const selected = selectedProducts();
      const totalPrice = selected.reduce(
        (sum, product) => sum + product.price,
        0
      );

      return {
        count: selected.length,
        totalPrice: Number(totalPrice.toFixed(2)),
        categories: [...new Set(selected.map((p) => p.category))],
      };
    });

    const searchSuggestions = computed(() => {
      const query = store.searchQuery().toLowerCase();
      if (query.length < 2) return [];

      const products = store.products();
      const suggestions = new Set<string>();

      products.forEach((product) => {
        if (product.title.toLowerCase().includes(query)) {
          suggestions.add(product.title);
        }
        if (product.category.toLowerCase().includes(query)) {
          suggestions.add(product.category);
        }
      });

      return Array.from(suggestions).slice(0, 5);
    });

    return {
      filteredProducts,
      sortedProducts,
      paginatedProducts,
      totalPages,
      productStats,
      hasNextPage,
      hasPreviousPage,
      favoriteProducts,
      selectedProducts,
      selectionStats,
      searchSuggestions,
    };
  }),

  // تعريف الطرق
  withMethods((store, productService = inject(ProductService)) => {
    const updateLoadingState = (
      loading: boolean,
      error: string | null = null
    ) => {
      patchState(store, {
        loading,
        error: error || (loading ? null : store.error()),
      });
    };

    const handleError = (message: string, error: any) => {
      console.error('ProductsStore Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      patchState(store, {
        error: `${message}: ${errorMessage}`,
        loading: false,
      });
      return EMPTY;
    };

    const updateTimestamp = () => {
      patchState(store, { lastUpdated: new Date() });
    };

    // دالة مساعدة للتحقق من توفر localStorage
    const isLocalStorageAvailable = (): boolean => {
      try {
        return (
          typeof window !== 'undefined' &&
          typeof window.localStorage !== 'undefined'
        );
      } catch {
        return false;
      }
    };

    // إعادة كتابة loadProducts كـ rxMethod لتجنب مشاكل الاشتراك
    const loadProducts = rxMethod<void>(
      pipe(
        tap(() => updateLoadingState(true)),
        switchMap(() => {
          return productService.getAllProducts().pipe(
            tap((products) => {
              const categories = [
                ...new Set(products.map((p) => p.category)),
              ].sort();
              patchState(store, {
                products,
                categories,
                loading: false,
                error: null,
              });
              updateTimestamp();
            }),
            catchError((error) => {
              handleError('Failed to load products', error);
              return of([]);
            })
          );
        })
      )
    );

    return {
      // استخدام rxMethod بدلاً من الدالة العادية
      loadProducts,

      // تحميل منتج واحد
      loadProduct: rxMethod<number>(
        pipe(
          filter((id) => id > 0),
          tap(() => updateLoadingState(true)),
          switchMap((id) => {
            const cachedProduct = store.products().find((p) => p.id === id);
            if (cachedProduct) {
              patchState(store, {
                selectedProduct: cachedProduct,
                loading: false,
              });
              return of(cachedProduct);
            }

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

      // تحميل المنتجات حسب التصنيف
      loadProductsByCategory: rxMethod<string>(
        pipe(
          filter((category) => category.length > 0),
          tap(() => updateLoadingState(true)),
          switchMap((category) => {
            return productService.getProductsByCategory(category).pipe(
              tap((products) => {
                patchState(store, {
                  products,
                  loading: false,
                  error: null,
                  selectedCategory: category,
                });
                updateTimestamp();
              }),
              catchError((error) => {
                handleError('Failed to load products by category', error);
                return of([]);
              })
            );
          })
        )
      ),

      // إضافة منتج جديد
      addProduct: rxMethod<Omit<Product, 'id'>>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap((product) => {
            return productService.addProduct(product).pipe(
              tap((newProduct) => {
                const currentProducts = store.products();
                const categories = [
                  ...new Set([...store.categories(), newProduct.category]),
                ].sort();
                patchState(store, {
                  products: [...currentProducts, newProduct],
                  categories,
                  loading: false,
                  error: null,
                });
                updateTimestamp();
              }),
              catchError((error) => {
                handleError('Failed to add product', error);
                return of(null);
              })
            );
          })
        )
      ),

      // تحديث منتج
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
                const categories = [
                  ...new Set(updatedProducts.map((p) => p.category)),
                ].sort();
                patchState(store, {
                  products: updatedProducts,
                  categories,
                  selectedProduct:
                    store.selectedProduct()?.id === id
                      ? updatedProduct
                      : store.selectedProduct(),
                  loading: false,
                  error: null,
                });
                updateTimestamp();
              }),
              catchError((error) => {
                handleError('Failed to update product', error);
                return of(null);
              })
            );
          })
        )
      ),

      // حذف منتج
      deleteProduct: rxMethod<number>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap((id) => {
            return productService.deleteProduct(id).pipe(
              tap((success) => {
                if (success) {
                  const currentProducts = store.products();
                  const filteredProducts = currentProducts.filter(
                    (p) => p.id !== id
                  );
                  const categories = [
                    ...new Set(filteredProducts.map((p) => p.category)),
                  ].sort();
                  patchState(store, {
                    products: filteredProducts,
                    categories,
                    selectedProduct:
                      store.selectedProduct()?.id === id
                        ? null
                        : store.selectedProduct(),
                    bulkSelection: store
                      .bulkSelection()
                      .filter((selectedId) => selectedId !== id),
                    loading: false,
                    error: null,
                  });
                  updateTimestamp();
                }
              }),
              catchError((error) => {
                handleError('Failed to delete product', error);
                return of(null);
              })
            );
          })
        )
      ),

      // حذف مجموعة منتجات
      bulkDeleteProducts: rxMethod<void>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap(() => {
            const idsToDelete = store.bulkSelection();
            if (idsToDelete.length === 0) {
              updateLoadingState(false);
              return of(null);
            }

            const deleteRequests = idsToDelete.map((id) =>
              productService.deleteProduct(id)
            );

            return forkJoin(deleteRequests).pipe(
              tap((results) => {
                const successCount = results.filter(Boolean).length;
                const currentProducts = store.products();
                const filteredProducts = currentProducts.filter(
                  (p) => !idsToDelete.includes(p.id)
                );
                const categories = [
                  ...new Set(filteredProducts.map((p) => p.category)),
                ].sort();
                patchState(store, {
                  products: filteredProducts,
                  categories,
                  selectedProduct:
                    store.selectedProduct() &&
                    idsToDelete.includes(store.selectedProduct()!.id)
                      ? null
                      : store.selectedProduct(),
                  bulkSelection: [],
                  loading: false,
                  error: null,
                });
                updateTimestamp();
                console.log(
                  `Successfully deleted ${successCount} out of ${idsToDelete.length} products`
                );
              }),
              catchError((error) => {
                handleError('Failed to delete products', error);
                return of(null);
              })
            );
          })
        )
      ),

      // البحث
      searchProducts: rxMethod<string>(
        pipe(
          debounceTime(500),
          distinctUntilChanged(),
          tap((query) => {
            patchState(store, {
              searchQuery: query,
              currentPage: 1,
            });
          })
        )
      ),

      // إدارة المفضلة
      toggleFavorite: (productId: number) => {
        const currentFavorites = store.favorites();
        const newFavorites = currentFavorites.includes(productId)
          ? currentFavorites.filter((id) => id !== productId)
          : [...currentFavorites, productId];
        patchState(store, { favorites: newFavorites });
      },

      isFavorite: (productId: number): boolean => {
        return store.favorites().includes(productId);
      },

      // إدارة التحديد الجماعي
      toggleProductSelection: (productId: number) => {
        const currentSelection = store.bulkSelection();
        const newSelection = currentSelection.includes(productId)
          ? currentSelection.filter((id) => id !== productId)
          : [...currentSelection, productId];
        patchState(store, { bulkSelection: newSelection });
      },

      selectAllProducts: () => {
        const allProductIds = store.paginatedProducts().map((p) => p.id);
        patchState(store, { bulkSelection: allProductIds });
      },

      clearSelection: () => {
        patchState(store, { bulkSelection: [] });
      },

      isProductSelected: (productId: number): boolean => {
        return store.bulkSelection().includes(productId);
      },

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
        const totalPages = store.totalPages();
        if (page >= 1 && page <= totalPages) {
          patchState(store, { currentPage: page });
        }
      },

      setPageSize: (size: number) => {
        patchState(store, {
          pageSize: Math.max(1, size),
          currentPage: 1,
        });
      },

      setViewMode: (mode: 'grid' | 'list') => {
        patchState(store, { viewMode: mode });
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
          bulkSelection: [],
        });
      },

      // تحديث مباشر
      setProducts: (products: Product[]) => {
        const categories = [...new Set(products.map((p) => p.category))].sort();
        patchState(store, { products, categories });
        updateTimestamp();
      },

      // إدارة التخزين المحلي مع التحقق من التوفر
      loadFavoritesFromStorage: () => {
        try {
          if (isLocalStorageAvailable()) {
            const saved = localStorage.getItem('product-favorites');
            if (saved) {
              const favorites = JSON.parse(saved);
              patchState(store, { favorites });
            }
          }
        } catch (error) {
          console.warn('Failed to load favorites from storage:', error);
        }
      },

      saveFavoritesToStorage: () => {
        try {
          if (isLocalStorageAvailable()) {
            localStorage.setItem(
              'product-favorites',
              JSON.stringify(store.favorites())
            );
          }
        } catch (error) {
          console.warn('Failed to save favorites to storage:', error);
        }
      },

      // إعادة تعيين
      reset: () => {
        patchState(store, {
          ...initialState,
          favorites: store.favorites(),
          categories: store.categories(),
        });
      },

      // تجديد البيانات - استخدام rxMethod
      refresh: rxMethod<void>(
        pipe(
          tap(() => updateLoadingState(true)),
          switchMap(() => {
            return productService.getAllProducts().pipe(
              tap((products) => {
                const categories = [
                  ...new Set(products.map((p) => p.category)),
                ].sort();
                patchState(store, {
                  products,
                  categories,
                  loading: false,
                  error: null,
                  lastUpdated: new Date(),
                });
              }),
              catchError((error) => {
                handleError('Failed to refresh products', error);
                return of([]);
              })
            );
          })
        )
      ),
    };
  }),

  // Hooks
  withHooks({
    onInit(store) {
      store.loadProducts();

      // تحميل المفضلة فقط إذا كان localStorage متاحاً
      if (typeof window !== 'undefined') {
        store.loadFavoritesFromStorage();
      }

      // تأثير لحفظ المفضلة مع التحقق من البيئة
      effect(() => {
        const favorites = store.favorites();
        untracked(() => {
          if (typeof window !== 'undefined') {
            store.saveFavoritesToStorage();
          }
        });
      });

      // تأثير لإعادة تعيين الصفحة
      effect(() => {
        const searchQuery = store.searchQuery();
        const selectedCategory = store.selectedCategory();
        const currentPage = store.currentPage();

        if (currentPage !== 1) {
          untracked(() => {
            patchState(store, { currentPage: 1 });
          });
        }
      });
    },
    onDestroy(store) {
      console.log('ProductsStore destroyed');
    },
  })
);
