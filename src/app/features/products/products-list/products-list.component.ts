import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { ProductsStore } from '../../../store/products.store';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit, OnDestroy {
  // حقن متجر المنتجات
  productsStore = inject(ProductsStore);

  // إشارات للمكون
  showAddProductModal = signal(false);
  selectedProduct = signal<Product | null>(null);
  isLoading = signal(false);
  operationInProgress = signal<number | null>(null);

  // منتج جديد للنموذج
  newProduct: Omit<Product, 'id'> = {
    title: '',
    price: 0,
    description: '',
    category: '',
    image: '',
  };

  // حسابات مشتقة محسنة
  displayRange = computed(() => {
    const currentPage = this.productsStore.currentPage();
    const pageSize = this.productsStore.pageSize();
    const totalItems = this.productsStore.sortedProducts().length;

    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return { start, end, total: totalItems };
  });

  visiblePages = computed(() => {
    const currentPage = this.productsStore.currentPage();
    const totalPages = this.productsStore.totalPages();

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
  });

  // إحصائيات سريعة
  quickStats = computed(() => {
    const stats = this.productsStore.productStats();
    const selectedCount = this.productsStore.selectionStats().count;

    return {
      ...stats,
      selectedCount,
      hasSelection: selectedCount > 0,
    };
  });

  ngOnInit() {
    console.log('ProductsListComponent initialized');
  }

  ngOnDestroy() {
    // تنظيف أي اشتراكات أو مهلة زمنية
  }

  // البحث مع تحسين الأداء
  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.productsStore.searchProducts(query);
  }

  // تغيير التصنيف
  onCategoryChange(event: Event): void {
    const category = (event.target as HTMLSelectElement).value;
    this.productsStore.setCategory(category || null);
  }

  // تغيير الترتيب
  onSortChange(event: Event): void {
    const sortValue = (event.target as HTMLSelectElement).value;
    let sortBy: keyof Product | null = null;
    let ascending = true;

    switch (sortValue) {
      case 'title':
        sortBy = 'title';
        ascending = true;
        break;
      case 'price':
        sortBy = 'price';
        ascending = true;
        break;
      case 'price-desc':
        sortBy = 'price';
        ascending = false;
        break;
      case 'category':
        sortBy = 'category';
        ascending = true;
        break;
      default:
        sortBy = null;
    }

    this.productsStore.setSort(sortBy, ascending);
  }

  // تغيير حجم الصفحة
  onPageSizeChange(event: Event): void {
    const size = +(event.target as HTMLSelectElement).value;
    this.productsStore.setPageSize(Math.max(1, size));
  }

  // تحديث المنتجات مع حالة تحميل
  refreshProducts(): void {
    this.isLoading.set(true);
    this.productsStore.loadProducts();
  }

  // مسح جميع الفلاتر
  clearAllFilters(): void {
    this.productsStore.clearFilters();
  }

  // عرض تفاصيل المنتج
  viewProductDetails(product: Product): void {
    this.selectedProduct.set(product);
    this.productsStore.loadProduct(product.id);
  }

  // تعديل المنتج
  editProduct(product: Product): void {
    this.selectedProduct.set(product);
    console.log('Edit product:', product);
  }

  // حذف المنتج مع تأكيد
  deleteProduct(id: number): void {
    const product = this.productsStore.products().find((p) => p.id === id);
    const productName = product?.title || 'this product';

    if (
      confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      this.operationInProgress.set(id);
      this.productsStore.deleteProduct(id);
    }
  }

  // إضافة إلى السلة
  addToCart(product: Product): void {
    console.log('Add to cart:', product);
  }

  // إدارة المفضلة
  toggleFavorite(productId: number): void {
    this.productsStore.toggleFavorite(productId);
  }

  isFavorite(productId: number): boolean {
    return this.productsStore.isFavorite(productId);
  }

  // إدارة التحديد الجماعي
  toggleProductSelection(productId: number): void {
    this.productsStore.toggleProductSelection(productId);
  }

  selectAllInPage(): void {
    this.productsStore.selectAllProducts();
  }

  clearSelection(): void {
    this.productsStore.clearSelection();
  }

  isProductSelected(productId: number): boolean {
    return this.productsStore.isProductSelected(productId);
  }

  // حذف المنتجات المحددة
  deleteSelectedProducts(): void {
    const selectedCount = this.productsStore.selectionStats().count;
    if (selectedCount === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedCount} selected products? This action cannot be undone.`
      )
    ) {
      this.productsStore.bulkDeleteProducts();
    }
  }

  // إرسال نموذج إضافة منتج
  onAddProductSubmit(): void {
    if (this.isValidProduct()) {
      this.productsStore.addProduct(this.newProduct);
      this.showAddProductModal.set(false);
      this.resetNewProductForm();
    } else {
      alert('Please fill all required fields with valid data.');
    }
  }

  // التحقق من صحة المنتج
  isValidProduct(): boolean {
    const product = this.newProduct;
    return (
      !!product.title?.trim() &&
      !!product.description?.trim() &&
      !!product.category?.trim() &&
      !!product.image?.trim() &&
      product.price > 0
    );
  }

  // إعادة تعيين نموذج المنتج الجديد
  resetNewProductForm(): void {
    this.newProduct = {
      title: '',
      price: 0,
      description: '',
      category: '',
      image: '',
    };
  }

  // الحصول على النجوم للتقييم مع تحسينات
  getStars(
    rating: number
  ): { type: 'full' | 'half' | 'empty'; index: number }[] {
    const stars: { type: 'full' | 'half' | 'empty'; index: number }[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push({ type: 'full', index: i });
    }

    if (hasHalfStar) {
      stars.push({ type: 'half', index: fullStars });
    }

    while (stars.length < 5) {
      stars.push({ type: 'empty', index: stars.length });
    }

    return stars.slice(0, 5);
  }

  // الحصول على فئة CSS للنجمة
  getStarClass(starType: 'full' | 'half' | 'empty'): string {
    switch (starType) {
      case 'full':
        return 'text-yellow-400';
      case 'half':
        return 'text-yellow-400';
      case 'empty':
        return 'text-gray-300';
      default:
        return 'text-gray-300';
    }
  }

  // الحصول على أيقونة النجمة
  getStarIcon(starType: 'full' | 'half' | 'empty'): string {
    switch (starType) {
      case 'full':
        return '★';
      case 'half':
        return '½';
      case 'empty':
        return '☆';
      default:
        return '☆';
    }
  }

  // إغلاق تفاصيل المنتج
  closeProductDetails(): void {
    this.selectedProduct.set(null);
    this.productsStore.clearSelectedProduct();
  }

  // التنقل بين الصفحات
  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      this.productsStore.setPage(page);
    }
  }

  // الصفحة التالية
  nextPage(): void {
    this.productsStore.nextPage();
  }

  // الصفحة السابقة
  previousPage(): void {
    this.productsStore.previousPage();
  }

  // فتح/إغلاق modal
  openAddProductModal(): void {
    this.showAddProductModal.set(true);
  }

  closeAddProductModal(): void {
    this.showAddProductModal.set(false);
    this.resetNewProductForm();
  }

  // تعبئة نموذج سريعة للاختبار
  prefillForm(): void {
    this.newProduct = {
      title: 'New Product',
      price: 99.99,
      description: 'This is a new product description',
      category: 'electronics',
      image: 'https://via.placeholder.com/150',
    };
  }
}
