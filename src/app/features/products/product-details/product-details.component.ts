import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsStore } from '../../../store/products.store';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsStore = inject(ProductsStore);

  // إشارات للمكون
  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // معلمات الاستعلام
  viewMode = signal<'details' | 'gallery'>('details');
  activeImageIndex = signal(0);

  // تأثيرات واشتراكات
  private routeSub: any;
  private querySub: any;

  constructor() {
    // إنشاء effect في المُنشئ - هذا هو سياق الحقن الصحيح
    effect(() => {
      const selectedProduct = this.productsStore.selectedProduct();
      const currentLoading = this.productsStore.loading();
      const currentError = this.productsStore.error();

      untracked(() => {
        if (selectedProduct) {
          this.product.set(selectedProduct);
          this.loading.set(false);
          this.error.set(null);
        } else if (currentError) {
          this.error.set(currentError);
          this.loading.set(false);
        }
        // إذا كان loading قد تغير ولم يكن هناك منتج أو خطأ، نحدّث حالة التحميل
        else if (currentLoading !== this.loading()) {
          this.loading.set(currentLoading);
        }
      });
    });
  }

  ngOnInit() {
    // قراءة معلمات المسار
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const productId = params.get('id');
      if (productId) {
        this.loadProduct(parseInt(productId, 10));
      } else {
        this.error.set('Product ID not found');
        this.loading.set(false);
      }
    });

    // قراءة معلمات الاستعلام
    this.querySub = this.route.queryParamMap.subscribe((queryParams) => {
      const view = queryParams.get('view');
      this.viewMode.set(view === 'gallery' ? 'gallery' : 'details');
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    // مسح المنتج المحدد السابق
    this.productsStore.clearSelectedProduct();

    // تحميل المنتج الجديد
    this.productsStore.loadProduct(id);
  }

  // تغيير وضع العرض
  changeViewMode(mode: 'details' | 'gallery'): void {
    this.viewMode.set(mode);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: mode },
      queryParamsHandling: 'merge',
    });
  }

  // تغيير الصورة النشطة في المعرض
  changeImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  // إضافة إلى السلة
  addToCart(): void {
    const product = this.product();
    if (product) {
      console.log('Adding to cart:', product);
      // TODO: تنفيذ منطق إضافة إلى السلة
    }
  }

  // العودة إلى القائمة
  goBack(): void {
    this.router.navigate(['/products'], {
      queryParamsHandling: 'preserve',
    });
  }

  // التحرير
  editProduct(): void {
    const product = this.product();
    if (product) {
      this.router.navigate(['/products', product.id, 'edit']);
    }
  }

  // الحصول على النجوم للتقييم
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

  // إنشاء مجموعة صور افتراضية
  getProductImages(): string[] {
    const product = this.product();
    if (!product) return [];

    // إذا كان المنتج له صورة واحدة فقط، نعيدها عدة مرات
    // في تطبيق حقيقي، قد يكون لديك مجموعة صور فعلية
    return [
      product.image,
      this.getAlternativeImage(product.image, 1),
      this.getAlternativeImage(product.image, 2),
    ];
  }

  private getAlternativeImage(originalImage: string, index: number): string {
    // في تطبيق حقيقي، قد يكون لديك صور بديلة مخزنة
    // هنا نعيد نفس الصورة مع معلمة مختلفة للتمييز
    return `${originalImage}?alt=${index}`;
  }

  // مشاركة المنتج
  shareProduct(): void {
    const product = this.product();
    if (product) {
      if (navigator.share) {
        navigator
          .share({
            title: product.title,
            text: product.description,
            url: window.location.href,
          })
          .then(() => console.log('Successful share'))
          .catch((error) => console.log('Error sharing:', error));
      } else {
        // نسخ الرابط إلى الحافظة
        navigator.clipboard
          .writeText(window.location.href)
          .then(() => {
            console.log('Link copied to clipboard');
            // يمكن إضافة رسالة للمستخدم هنا
          })
          .catch((error) => {
            console.log('Failed to copy link:', error);
          });
      }
    }
  }

  // إعادة تحميل المنتج
  reloadProduct(): void {
    const product = this.product();
    if (product) {
      this.loadProduct(product.id);
    }
  }

  // التحقق مما إذا كان المنتج مفضلاً
  isFavorite(): boolean {
    const product = this.product();
    return product ? this.productsStore.isFavorite(product.id) : false;
  }

  // تبديل حالة المفضلة
  toggleFavorite(): void {
    const product = this.product();
    if (product) {
      this.productsStore.toggleFavorite(product.id);
    }
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
}
