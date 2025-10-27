import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map, take } from 'rxjs';
import { Product } from '../../../shared/models';
import * as ProductsActions from '../../../store/products.actions';
import * as ProductsSelectors from '../../../store/products.selectors';
import * as CartActions from '../../../store/cart-state/cart.actions';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit {
  [x: string]: any;
  private store = inject(Store);
  private router = inject(Router);

  // Signals for UI state
  showAddProductModal = signal(false);
  selectedProduct = signal<Product | null>(null);
  operationInProgress = signal<number | null>(null);

  // New product form
  newProduct: Omit<Product, 'id'> = {
    title: '',
    price: 0,
    description: '',
    category: '',
    image: '',
  };

  // Observables from store
  products$ = this.store.select(ProductsSelectors.selectPaginatedProducts);
  allProducts$ = this.store.select(ProductsSelectors.selectAllProducts);
  sortedProducts$ = this.store.select(ProductsSelectors.selectSortedProducts);
  loading$ = this.store.select(ProductsSelectors.selectLoading);
  error$ = this.store.select(ProductsSelectors.selectError);
  categories$ = this.store.select(ProductsSelectors.selectCategories);
  searchQuery$ = this.store.select(ProductsSelectors.selectSearchQuery);
  selectedCategory$ = this.store.select(
    ProductsSelectors.selectSelectedCategory
  );
  currentPage$ = this.store.select(ProductsSelectors.selectCurrentPage);
  pageSize$ = this.store.select(ProductsSelectors.selectPageSize);
  totalPages$ = this.store.select(ProductsSelectors.selectTotalPages);
  favorites$ = this.store.select(ProductsSelectors.selectFavorites);
  selectedProducts$ = this.store.select(
    ProductsSelectors.selectSelectedProducts
  );
  productStats$ = this.store.select(ProductsSelectors.selectProductsStats);
  selectionStats$ = this.store.select(ProductsSelectors.selectSelectionStats);
  currentSortValue$ = this.store.select(
    ProductsSelectors.selectCurrentSortValue
  );

  // Derived UI observables
  displayRange$ = this.store.select(ProductsSelectors.selectDisplayRange);

  visiblePages$ = combineLatest([this.currentPage$, this.totalPages$]).pipe(
    map(([currentPage, totalPages]) => {
      if (totalPages <= 1) return [1];

      const delta = 2;
      const range: number[] = [];
      const rangeWithDots: (number | string)[] = [];

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    })
  );

  quickStats$ = combineLatest([this.productStats$, this.selectionStats$]).pipe(
    map(([stats, selectionStats]) => ({
      ...stats,
      selectedCount: selectionStats.count,
      hasSelection: selectionStats.count > 0,
    }))
  );

  shouldShowPagination$ = combineLatest([
    this.totalPages$,
    this.products$,
  ]).pipe(
    map(
      ([totalPages, products]) => totalPages > 1 && (products?.length ?? 0) > 0
    )
  );

  // ✅ أضف observable operationInProgress$ المفقود
  operationInProgress$ = this.store
    .select(ProductsSelectors.selectLoading)
    .pipe(map((loading) => (loading ? -1 : null)));
  ngOnInit() {
    this.store.dispatch(ProductsActions.loadProducts());
    this.store.dispatch(ProductsActions.loadCategories());
  }

  // === Event Handlers ===
  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.store.dispatch(ProductsActions.setSearchQuery({ query }));
  }

  onCategoryChange(event: Event): void {
    const category = (event.target as HTMLSelectElement).value;
    this.store.dispatch(
      ProductsActions.setSelectedCategory({ category: category || null })
    );
  }

  onSortChange(event: Event): void {
    const sortValue = (event.target as HTMLSelectElement).value;
    let sortBy: keyof Product | null = null;
    let ascending = true;

    switch (sortValue) {
      case 'title':
        sortBy = 'title';
        break;
      case 'price':
        sortBy = 'price';
        break;
      case 'price-desc':
        sortBy = 'price';
        ascending = false;
        break;
      case 'category':
        sortBy = 'category';
        break;
      default:
        sortBy = null;
    }

    this.store.dispatch(ProductsActions.setSortBy({ sortBy, ascending }));
  }

  onPageSizeChange(event: Event): void {
    const size = +(event.target as HTMLSelectElement).value;
    this.store.dispatch(
      ProductsActions.setPageSize({ size: Math.max(1, size) })
    );
  }

  refreshProducts(): void {
    this.store.dispatch(ProductsActions.refreshProducts());
  }

  clearAllFilters(): void {
    this.store.dispatch(ProductsActions.clearFilters());
  }

  viewProductDetails(product: Product): void {
    this.selectedProduct.set(product);
    this.store.dispatch(ProductsActions.loadProduct({ id: product.id }));
  }

  editProduct(product: Product): void {
    this.selectedProduct.set(product);
    alert('Edit feature is simulated only (FakeStoreAPI is read-only).');
  }

  deleteProduct(id: number): void {
    this.allProducts$.pipe(take(1)).subscribe((products) => {
      const product = products.find((p) => p.id === id);
      const name = product?.title || 'this product';

      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        this.operationInProgress.set(id);
        this.store.dispatch(ProductsActions.deleteProduct({ id }));
      }
    });
  }
  addToCart(product: Product): void {
    this.store.dispatch(
      CartActions.addToCart({
        userId: 1,
        productId: product.id,
        quantity: 1,
      })
    );

    // اختياري: عرض رسالة سريعة (أو تأجيل الانتقال)
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 300); // 300ms يسمح بعرض الرسالة وبدء الانتقال بسلاسة
  }
  // addToCart(product: Product): void {
  //   alert(`"${product.title}" added to cart (simulated).`);
  // }
  //  addToCart(product: Product): void {
  //     this.store.dispatch(
  //       CartActions.addToCart({
  //         userId: 1, // لاحقًا: من authService
  //         productId: product.id,
  //         quantity: 1,
  //       })
  //     );
  //   }
  toggleFavorite(productId: number): void {
    this.store.dispatch(ProductsActions.toggleFavorite({ productId }));
  }

  isFavorite(productId: number): Observable<boolean> {
    return this.store.select(ProductsSelectors.selectIsFavorite(productId));
  }

  toggleProductSelection(productId: number): void {
    this.store.dispatch(ProductsActions.toggleProductSelection({ productId }));
  }

  selectAllInPage(): void {
    this.store.dispatch(ProductsActions.selectAllProducts());
  }

  clearSelection(): void {
    this.store.dispatch(ProductsActions.clearSelection());
  }

  isProductSelected(productId: number): Observable<boolean> {
    return this.store.select(
      ProductsSelectors.selectIsProductSelected(productId)
    );
  }

  deleteSelectedProducts(): void {
    this.selectionStats$.pipe(take(1)).subscribe((stats) => {
      if (stats.count === 0) return;

      if (confirm(`Delete ${stats.count} selected products?`)) {
        alert('Bulk delete simulated (FakeStoreAPI is read-only).');
        this.store.dispatch(ProductsActions.clearSelection());
      }
    });
  }

  onAddProductSubmit(): void {
    if (this.isValidProduct()) {
      this.store.dispatch(
        ProductsActions.addProduct({ product: this.newProduct })
      );
      this.showAddProductModal.set(false);
      this.resetNewProductForm();
    } else {
      alert('Please fill all required fields with valid data.');
    }
  }

  resetNewProductForm(): void {
    this.newProduct = {
      title: '',
      price: 0,
      description: '',
      category: '',
      image: '',
    };
  }

  // === UI Helpers ===
  getStars(
    rating: number
  ): { type: 'full' | 'half' | 'empty'; index: number }[] {
    const stars: { type: 'full' | 'half' | 'empty'; index: number }[] = [];
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < full; i++) {
      stars.push({ type: 'full', index: i });
    }

    if (hasHalf) {
      stars.push({ type: 'half', index: full });
    }

    while (stars.length < 5) {
      stars.push({ type: 'empty', index: stars.length });
    }

    return stars.slice(0, 5);
  }

  getStarClass(type: 'full' | 'half' | 'empty'): string {
    return type === 'empty' ? 'text-gray-300' : 'text-yellow-400';
  }

  getStarIcon(type: 'full' | 'half' | 'empty'): string {
    return type === 'full' ? '★' : type === 'half' ? '½' : '☆';
  }

  closeProductDetails(): void {
    this.selectedProduct.set(null);
    this.store.dispatch(ProductsActions.clearSelectedProduct());
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      this.store.dispatch(ProductsActions.setCurrentPage({ page }));
    }
  }

  nextPage(): void {
    combineLatest([this.currentPage$, this.totalPages$])
      .pipe(take(1))
      .subscribe(([currentPage, totalPages]) => {
        if (currentPage < totalPages) {
          this.store.dispatch(
            ProductsActions.setCurrentPage({ page: currentPage + 1 })
          );
        }
      });
  }

  previousPage(): void {
    this.currentPage$.pipe(take(1)).subscribe((currentPage) => {
      if (currentPage > 1) {
        this.store.dispatch(
          ProductsActions.setCurrentPage({ page: currentPage - 1 })
        );
      }
    });
  }

  openAddProductModal(): void {
    this.showAddProductModal.set(true);
  }

  closeAddProductModal(): void {
    this.showAddProductModal.set(false);
    this.resetNewProductForm();
  }

  prefillForm(): void {
    this.newProduct = {
      title: 'Wireless Headphones',
      price: 89.99,
      description: 'High-quality wireless headphones with noise cancellation.',
      category: 'electronics',
      image: 'https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg',
    };
  }

  hasNextPage(): Observable<boolean> {
    return combineLatest([this.currentPage$, this.totalPages$]).pipe(
      map(([page, total]) => page < total)
    );
  }

  hasPreviousPage(): Observable<boolean> {
    return this.currentPage$.pipe(map((page) => page > 1));
  }

  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isValidProduct(): boolean {
    const p = this.newProduct;
    return !!(
      p.title?.trim() &&
      p.description?.trim() &&
      p.category?.trim() &&
      p.image?.trim() &&
      this.isValidImageUrl(p.image) &&
      p.price > 0
    );
  }

  // === TrackBy Functions ===
  trackByCategory(index: number, category: string): string {
    return category;
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // === Image Error Handling ===
  handleImageError(event: Event, product: Product): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'https://fakestoreapi.com/img/placeholder.jpg';
  }
}
