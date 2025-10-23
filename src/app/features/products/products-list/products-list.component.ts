import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductsStore } from '../../../store/products.store';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit {
  // حقن متجر المنتجات
  productsStore = inject(ProductsStore);

  // إشارات للمكون
  showAddProductModal = signal(false);
  selectedProduct = signal<Product | null>(null);

  // منتج جديد للنموذج
  newProduct: Omit<Product, 'id'> = {
    title: '',
    price: 0,
    description: '',
    category: '',
    image: '',
  };

  // حسابات مشتقة
  displayRange = computed(() => {
    const currentPage = this.productsStore.currentPage();
    const pageSize = this.productsStore.pageSize();
    const totalItems = this.productsStore.sortedProducts().length;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return { start, end };
  });

  visiblePages = computed(() => {
    const currentPage = this.productsStore.currentPage();
    const totalPages = this.productsStore.totalPages();
    const delta = 2;
    const range = [];
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

    return rangeWithDots.filter((page) => page !== '...') as number[];
  });

  ngOnInit() {
    // تم تحميل المنتجات تلقائياً في onInit hook الخاص بالمتجر
    console.log('ProductsListComponent initialized');
  }

  // البحث
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
    this.productsStore.setPageSize(size);
  }

  // تحديث المنتجات
  refreshProducts(): void {
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
    // يمكنك فتح نموذج التعديل هنا
    console.log('Edit product:', product);
  }

  // حذف المنتج
  deleteProduct(id: number): void {
    if (
      confirm(
        'Are you sure you want to delete this product? This action cannot be undone.'
      )
    ) {
      this.productsStore.deleteProduct(id);
    }
  }

  // إضافة إلى السلة
  addToCart(product: Product): void {
    // تنفيذ منطق إضافة إلى السلة
    console.log('Add to cart:', product);
    // يمكنك إضافة خدمة السلة هنا
  }

  // إرسال نموذج إضافة منتج
  onAddProductSubmit(): void {
    if (this.isValidProduct()) {
      this.productsStore.addProduct(this.newProduct);
      this.showAddProductModal.set(false);
      this.resetNewProductForm();
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

  // الحصول على النجوم للتقييم
  getStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars.slice(0, 5);
  }

  // إغلاق تفاصيل المنتج
  closeProductDetails(): void {
    this.selectedProduct.set(null);
    this.productsStore.clearSelectedProduct();
  }
}
